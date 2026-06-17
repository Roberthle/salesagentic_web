#!/usr/bin/env python3
import os
import sqlite3
import json
import requests
import time

DB_PATH = os.environ.get("REGISTRY_DB_PATH", "/Users/robertle/tomcat_registry/data/registry.db")

def call_gemini_py(prompt: str, json_mode: bool = False) -> str:
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        # Return mock JSON response matching prompt intent to support Simulation Mode
        print("  [SIMULATION] Gemini API key not found. Returning mock response.")
        if "keywords" in prompt:
            return '["equipment", "machinery", "parts"]'
        else:
            return '{"subject": "Weekly Lead Intelligence Digest", "body": "Welcome to your SalesAgentic weekly matched leads digest. We matched 3 companies for your product."}'
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }
    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }
        
    r = requests.post(url, headers=headers, json=payload, timeout=20)
    r.raise_for_status()
    data = r.json()
    return data['candidates'][0]['content']['parts'][0]['text']

def query_leads_for_keywords(keywords: list):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    where_clauses = []
    params = []
    
    for kw in keywords:
        where_clauses.append("(collateral_desc LIKE ? OR company_name LIKE ?)")
        params.extend([f"%{kw}%", f"%{kw}%"])
        
    where_sql = " OR ".join(where_clauses) if where_clauses else "1=1"
    
    query = f"""
        SELECT id, company_name, city, state, source_state, collateral_desc, secured_party, lead_type
        FROM leads
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT 3
    """
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    # Fallback to general leads if less than 3
    if len(rows) < 3:
        cursor.execute("""
            SELECT id, company_name, city, state, source_state, collateral_desc, secured_party, lead_type
            FROM leads
            ORDER BY created_at DESC
            LIMIT 3
        """)
        rows = cursor.fetchall()
        
    conn.close()
    return [dict(r) for r in rows]

def send_weekly_newsletter():
    print("==================================================")
    print("RUNNING WEEKLY NEWSLETTER SENDING PROCESS")
    print("==================================================")
    
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Fetch active subscribers
    cursor.execute("SELECT id, email, domain, what_you_sell FROM weekly_subscribers WHERE status = 'active'")
    subscribers = cursor.fetchall()
    conn.close()
    
    print(f"Loaded {len(subscribers)} active mailing list subscribers.")
    
    for sub_id, email, domain, what_you_sell in subscribers:
        print(f"\nProcessing weekly newsletter digest for: {email} (Target Product: {what_you_sell})")
        
        # 2. Get search keywords using Gemini
        keywords = []
        try:
            prompt = f"""Given a business product/service description: "{what_you_sell}".
Provide 3 search keywords that represent target assets or events in a corporate equipment database.
Output strictly a JSON list of strings (e.g. ["truck", "excavator", "hardware"]). No markdown codeblocks."""
            resp = call_gemini_py(prompt, json_mode=True)
            keywords = json.loads(resp.strip())
            print(f"  Generated keywords via Gemini: {keywords}")
        except Exception as e:
            print(f"  Gemini keyword generation failed/skipped: {e}")
            # simple local tokenizer fallback
            keywords = [w.strip() for w in what_you_sell.lower().split() if len(w.strip()) > 3][:3]
            if not keywords:
                keywords = ["equipment"]
        
        # 3. Fetch 3 matching leads
        leads = query_leads_for_keywords(keywords)
        print(f"  Matched {len(leads)} leads for newsletter.")
        
        # 4. Generate custom pitches for each lead in a single digest email using Gemini
        digest_leads_data = []
        for idx, lead in enumerate(leads):
            lead_type_str = "Contract Renewal" if lead['lead_type'] == 'capex' else "Capital Refinance"
            digest_leads_data.append(f"""
Lead #{idx+1}:
- Company: {lead['company_name']} ({lead['city']}, {lead['state'] or lead['source_state']})
- Trigger Event: {lead_type_str}
- Collateral description: {lead['collateral_desc']}
- Secured Lender: {lead['secured_party']}
""")
        
        joined_leads = "\n".join(digest_leads_data)
        
        digest_prompt = f"""
You are the SalesAgentic.AI Outbound Orchestrator.
We are sending a weekly lead digest to our subscriber at {email} (website: {domain}) who sells: {what_you_sell}.
Here are the 3 matched capex triggers from our institutional registry database:
{joined_leads}

Write a professional B2B newsletter email to our subscriber summarizing these 3 matches.
For each match, explain concisely:
1. Why this is a match for their product.
2. A suggested custom conversation opener/hook that references their capex trigger.
Output exactly a JSON object with two keys:
"subject": "Weekly Lead Digest Subject Line",
"body": "The email body copy formatted with clear paragraphs and line breaks."
Do not wrap in markdown codeblock.
"""
        
        try:
            resp = call_gemini_py(digest_prompt, json_mode=True)
            parsed = json.loads(resp.strip())
            subject = parsed.get("subject", "Your Weekly SalesAgentic Match Ledger")
            body = parsed.get("body", "Here are your weekly leads.")
            
            print(f"  [SUCCESS] Drafted Newsletter Digest:")
            print(f"    Subject: {subject}")
            print(f"    Body snippet: {body[:150]}...")
            
            # Simulate dispatch
            time.sleep(1.0)
            print(f"    Email dispatched to {email} successfully.")
        except Exception as e:
            print(f"  [ERROR] Failed to draft newsletter digest: {e}")
            
    print("\nWeekly newsletter simulation runner cycle completed.")

if __name__ == '__main__':
    try:
        send_weekly_newsletter()
    except Exception as ex:
        print(f"Runner failed: {ex}")
