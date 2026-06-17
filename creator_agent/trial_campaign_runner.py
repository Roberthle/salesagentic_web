#!/usr/bin/env python3
import os
import sys
import json
import sqlite3
import logging
import time
import re
from datetime import datetime
import requests

# Import multiagent fusion pipeline
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "multiagents"))
from signal_fusion_pipeline import enrich_lead_signals

REGISTRY_DB = os.environ.get("REGISTRY_DB_PATH", "/Users/robertle/tomcat_registry/data/registry.db")
LOG_DIR = os.environ.get("LOG_DIR_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "../logs"))
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [TrialCampaignRunner] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "trial_campaign_runner.log")),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger("TrialRunner")

# State map for parsing target geography
STATES_MAP = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH",
    "new jersey": "NJ", "new mexico": "NM", "new york": "NY", "north carolina": "NC",
    "north dakota": "ND", "ohio": "OH", "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA",
    "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", "tennessee": "TN",
    "texas": "TX", "utah": "UT", "vermont": "VT", "virginia": "VA", "washington": "WA",
    "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY"
}

def slugify(text):
    if not text:
        return "unknown"
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def parse_target_parameters(audience: str):
    """Extract state code and industry keywords from target audience description."""
    text = audience.lower()
    
    # 1. Detect State
    target_state = None
    # Check for abbreviations as standalone words (e.g. "in OH", "of TX", or ending in "PA")
    for abbr in STATES_MAP.values():
        pattern = r'\b(in|of)\s+' + re.escape(abbr.lower()) + r'\b|\b' + re.escape(abbr.lower()) + r'$'
        if re.search(pattern, text):
            target_state = abbr
            break
            
    # Check for full names
    if not target_state:
        for name, abbr in STATES_MAP.items():
            if name in text:
                target_state = abbr
                break
                
    # 2. Detect Keywords
    keywords = []
    for word in ["construction", "logistics", "manufacturing", "trucking", "transport", "builders", "machining", "distributors"]:
        if word in text:
            keywords.append(word)
            
    return target_state, keywords

def match_product_to_lead_keywords(what_you_sell: str):
    """Extract collateral, lender, and industry keywords based on what the client sells."""
    if not what_you_sell:
        return []
    text = what_you_sell.lower()
    keywords = []
    
    # 1. Computer Hardware / IT Equipment
    if any(w in text for w in ["comp", "hardware", "computer", "it ", "server", "network", "laptop", "pc", "device"]):
        keywords.extend([
            "computer", "server", "network", "hardware", "laptop", "workstation",
            "dell financial", "lenovo financial", "hp financial", "hewlett-packard", "cisco systems"
        ])
    
    # 2. Logistics & Trucking / Commercial Vehicles
    if any(w in text for w in ["truck", "fleet", "logistics", "transport", "vehicle", "auto", "car", "trailer", "insurance"]):
        keywords.extend([
            "truck", "trailer", "fleet", "vehicle", "semi", "dump truck",
            "caterpillar financial", "paccar", "volvo financial", "daimler", "ryder"
        ])
        
    # 3. Heavy Equipment / Construction Machinery
    if any(w in text for w in ["machinery", "cnc", "tooling", "factory", "manufacturing", "industrial", "press", "equipment", "construction", "tractor", "excavat"]):
        keywords.extend([
            "cnc", "milling", "lathe", "machinery", "press", "welder", "excavator", "loader", "caterpillar", "deere",
            "john deere financial", "caterpillar financial", "komatsu", "tractor"
        ])
        
    # 4. Warehouse & Material Handling
    if any(w in text for w in ["forklift", "warehouse", "lift", "pallet", "material"]):
        keywords.extend(["forklift", "lift", "pallet", "racking", "toyota material"])

    # 5. Capital Loans / MCA / Debt Refinancing
    if any(w in text for w in ["loan", "finance", "debt", "refinance", "mca", "receivables", "proceeds", "advance"]):
        keywords.extend(["receivables", "proceeds", "advance", "loan", "debt", "finance", "refinance"])

    # 6. Equipment Leasing / Leases
    if any(w in text for w in ["lease", "equipment lease", "lien", "leaseback"]):
        keywords.extend(["lease", "equipment", "lien", "leaseback"])
        
    return keywords

def query_matching_leads(state: str, keywords: list, limit: int = 5):
    """Query leads from the registry database matching the state and industry keywords."""
    conn = sqlite3.connect(REGISTRY_DB)
    conn.row_factory = sqlite3.Row
    
    # 1. Identify high-priority lender keywords (competitors)
    lender_kws = ["dell financial", "lenovo financial", "hp financial", "hewlett-packard", "cisco systems", "financing"]
    matched_lender_kws = [kw for kw in keywords if any(l in kw for l in lender_kws)]
    
    # 2. Try querying by competitor lender matches first
    if matched_lender_kws:
        query = "SELECT * FROM leads WHERE company_name IS NOT NULL"
        params = []
        if state:
            query += " AND (state = ? OR source_state = ?)"
            params.extend([state, state])
            
        kw_queries = []
        for kw in matched_lender_kws:
            kw_queries.append("(secured_party LIKE ? OR collateral_desc LIKE ?)")
            params.extend([f"%{kw}%", f"%{kw}%"])
        query += f" AND ({' OR '.join(kw_queries)})"
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        rows = conn.execute(query, params).fetchall()
        if len(rows) >= limit:
            conn.close()
            return [dict(r) for r in rows]
            
        accumulated = [dict(r) for r in rows]
        remaining_limit = limit - len(accumulated)
    else:
        accumulated = []
        remaining_limit = limit

    # 3. Query using remaining general keywords
    query = "SELECT * FROM leads WHERE company_name IS NOT NULL"
    params = []
    if state:
        query += " AND (state = ? OR source_state = ?)"
        params.extend([state, state])
        
    if accumulated:
        excluded_ids = ",".join(str(r['id']) for r in accumulated)
        query += f" AND id NOT IN ({excluded_ids})"
        
    if keywords:
        kw_queries = []
        for kw in keywords:
            kw_queries.append("(collateral_desc LIKE ? OR company_name LIKE ? OR secured_party LIKE ?)")
            params.extend([f"%{kw}%", f"%{kw}%", f"%{kw}%"])
        query += f" AND ({' OR '.join(kw_queries)})"
        
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(remaining_limit)
    
    rows = conn.execute(query, params).fetchall()
    conn.close()
    
    return accumulated + [dict(r) for r in rows]

def generate_personalized_copy(client_domain: str, client_value_prop: str, lead: dict):
    """Use Gemini API to draft a hyper-personalized outbound pitch."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return mock_email_copy(client_domain, client_value_prop, lead)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}

    # Interpret triggers for the LLM context
    lead_type = "Contract Renewal opportunity" if lead.get("lead_type") == "capex" else "Capital Refinance demand"
    asset_context = lead.get("collateral_desc") or "Commercial Operations"

    # Format enriched triggers for LLM
    enriched_context = ""
    try:
        signals = json.loads(lead.get('signals_json') or '[]')
        for s in signals:
            enriched_context += f"- Enriched Trigger [{s.get('label')}]: {s.get('detail')} (Source: {s.get('source')})\n"
    except Exception:
        pass

    prompt = f"""
You are an Elite B2B Sales Representative working for a client with website {client_domain}.
The client sells / offers the following product/service: {client_value_prop}

You have intercepted a highly actionable operational trigger for a prospect:
- Company Name: {lead.get('company_name')}
- Geography: {lead.get('city')}, {lead.get('state')}
- Event Type: {lead_type}
- Asset Focus: {asset_context}
{enriched_context}

Write a concise, 3-paragraph cold outbound email to this prospect pitching the client's product/service in the context of the prospect's event/expansion.
Rules:
1. Do NOT mention 'UCC filing', 'SEC database', or 'public records'. Frame the trigger naturally as 'noticing their operational scale', 'active hiring lists', or 'upcoming asset cycles'.
2. If there are enriched triggers (like hiring, building permits, import manifests, or litigation/lender disputes), make sure to leverage them as the core conversation anchor. Do not make up fake details.
3. Be direct, professional, and conversational. Do not use generic corporate jargon.
4. Call to Action: Ask for a quick chat to explore how the client's product/service can support their active operational and equipment needs.

Output the email strictly in JSON format with two keys:
"subject": "Email Subject Line",
"body": "Email body content with paragraphs separated by newlines."
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    try:
        r = requests.post(url, headers=headers, json=payload, timeout=20)
        r.raise_for_status()
        data = r.json()
        content_str = data['candidates'][0]['content']['parts'][0]['text']
        content = json.loads(content_str)
        return content.get("subject"), content.get("body")
    except Exception as e:
        log.error(f"Gemini API error: {e}")
        return mock_email_copy(client_domain, client_value_prop, lead)

def mock_email_copy(client_domain: str, client_value_prop: str, lead: dict):
    subject = f"Optimizing operational capital for {lead.get('company_name')}"
    body = f"Hi,\n\nI noticed your recent operational expansion in {lead.get('city')} and wanted to reach out. At {client_domain}, we specialize in: {client_value_prop}.\n\nGiven the active contract cycles in your industry, I believe we can help you streamline capital deployment and reduce financing costs.\n\nAre you available for a brief 5-minute call next Tuesday?\n\nBest regards,\nOutbound Agent"
    return subject, body

def run_trial_campaigns():
    log.info("Starting automated trial campaign runner...")
    if not os.path.exists(REGISTRY_DB):
        log.error("Registry database does not exist. Skipping runner.")
        return

    conn = sqlite3.connect(REGISTRY_DB)
    conn.row_factory = sqlite3.Row
    
    # 1. Fetch active running trial campaigns
    campaigns = conn.execute("""
        SELECT tc.id as campaign_id, tc.emails_sent, tc.max_emails,
               u.id as user_id, u.domain, u.audience, u.email as client_email, u.what_you_sell
        FROM trial_campaigns tc
        JOIN trial_users u ON tc.trial_user_id = u.id
        WHERE tc.status = 'running' AND tc.emails_sent < tc.max_emails
    """).fetchall()
    conn.close()

    log.info(f"Loaded {len(campaigns)} active trial campaigns to process.")

    for camp in campaigns:
        cid = camp['campaign_id']
        domain = camp['domain']
        audience = camp['audience']
        emails_sent = camp['emails_sent']
        max_emails = camp['max_emails']
        what_you_sell = camp['what_you_sell'] or f"Outbound sales development targeting {audience}"
        
        log.info(f"Processing Campaign {cid} for {domain} (Target: {audience})")
        
        # 2. Parse audience parameters
        state, keywords = parse_target_parameters(audience)
        log.info(f"  Parsed targets - State: {state}, Keywords: {keywords}")
        
        # 2b. Match product parameters to trigger keywords
        product_keywords = match_product_to_lead_keywords(what_you_sell)
        log.info(f"  Parsed product keywords - {product_keywords}")
        
        # Combine keywords
        combined_keywords = list(set(keywords + product_keywords))
        
        # 3. Pull matching leads (limit to remaining quota or batch size of 3)
        quota_left = max_emails - emails_sent
        batch_size = min(3, quota_left)
        
        leads = query_matching_leads(state, combined_keywords, limit=batch_size)
        log.info(f"  Found {len(leads)} matching prospects to target in this batch.")
        
        sent_in_batch = 0
        for lead in leads:
            # 4. Auto-enrichment simulation fallback
            email = lead.get('email')
            contact_name = lead.get('contact_name')
            
            if not email or not contact_name:
                company_slug = slugify(lead.get('company_name'))
                email = f"contact@{company_slug}.com"
                
                # Dynamic title selection based on targeted buyer profile
                target_lower = audience.lower()
                if "ceo" in target_lower or "chief executive" in target_lower or "executive" in target_lower:
                    contact_name = "Chief Executive Officer"
                elif "logistics" in target_lower or "transport" in target_lower or "fleet" in target_lower:
                    contact_name = "Director of Logistics"
                elif "construction" in target_lower or "operations" in target_lower:
                    contact_name = "Director of Operations"
                else:
                    contact_name = "Managing Director"
                
                # Update back to registry database
                log.info(f"  Enriching contact details for: {lead.get('company_name')} -> {email} ({contact_name})")
                conn2 = sqlite3.connect(REGISTRY_DB)
                conn2.execute("""
                    UPDATE leads
                    SET email = ?, contact_name = ?
                    WHERE id = ?
                """, [email, contact_name, lead['id']])
                conn2.commit()
                conn2.close()
                
                lead['email'] = email
                lead['contact_name'] = contact_name

            # Run multiagent signal fusion trigger enrichment
            try:
                log.info(f"  Running multiagent signal enrichment for lead {lead['id']}")
                enrich_lead_signals(lead['id'])
                # Reload updated lead signals from database to include them in the prompt
                conn_tmp = sqlite3.connect(REGISTRY_DB)
                conn_tmp.row_factory = sqlite3.Row
                updated_row = conn_tmp.execute("SELECT * FROM leads WHERE id = ?", (lead['id'],)).fetchone()
                if updated_row:
                    lead['signals_json'] = updated_row['signals_json']
                conn_tmp.close()
            except Exception as ex:
                log.error(f"  Failed multiagent signal enrichment: {ex}")

            # 5. Generate personalized outreach copy
            subject, body = generate_personalized_copy(domain, what_you_sell, lead)
            
            # 6. Dispatch email simulation
            log.info(f"  Sending pitch to: {email} ({lead.get('company_name')})")
            log.debug(f"    Subject: {subject}")
            
            time.sleep(1.5)
            sent_in_batch += 1

        # 7. Update database counters
        if sent_in_batch > 0:
            new_sent_count = emails_sent + sent_in_batch
            new_status = 'capped' if new_sent_count >= max_emails else 'running'
            
            conn2 = sqlite3.connect(REGISTRY_DB)
            conn2.execute("""
                UPDATE trial_campaigns
                SET emails_sent = ?, status = ?
                WHERE id = ?
            """, [new_sent_count, new_status, cid])
            conn2.commit()
            conn2.close()
            
            log.info(f"  Campaign {cid} updated: {new_sent_count}/{max_emails} emails sent. Status: {new_status}")

    log.info("Trial campaign runner session complete.")

if __name__ == '__main__':
    run_trial_campaigns()
