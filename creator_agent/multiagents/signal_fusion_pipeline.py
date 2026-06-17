#!/usr/bin/env python3
import sqlite3
import json
import os
import sys

# Import harvesters
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from harvester_hiring import scrape_hiring
from harvester_permits import scrape_permits
from harvester_customs import scrape_customs
from harvester_litigation import scrape_litigation

REGISTRY_DB = os.environ.get("REGISTRY_DB_PATH", "/Users/robertle/tomcat_registry/data/registry.db")

def enrich_lead_signals(lead_id):
    conn = sqlite3.connect(REGISTRY_DB)
    conn.row_factory = sqlite3.Row
    lead = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    if not lead:
        conn.close()
        return False
        
    company_name = lead['company_name']
    state = lead['state'] or lead['source_state'] or 'OH'
    
    # 1. Scrape new signals
    jobs = scrape_hiring(company_name, state)
    permits = scrape_permits(company_name, state)
    customs = scrape_customs(company_name, state)
    cases = scrape_litigation(company_name, state)
    
    # 2. Parse current signals
    try:
        current_signals = json.loads(lead['signals_json'] or '[]')
    except Exception:
        current_signals = []
        
    # Remove existing scrapers' types to avoid duplicate runs
    target_types = {'S3_HIRING', 'S5_PERMIT', 'S8_FLEET', 'S9_LITIGATION'}
    new_signals = [s for s in current_signals if s.get('type') not in target_types]
    
    # Add Hiring Signal
    if jobs:
        new_signals.append({
            "type": "S3_HIRING",
            "label": "LinkedIn Hiring Surge",
            "detail": f"Hiring {len(jobs)} active roles including: {', '.join([j['title'] for j in jobs[:2]])}.",
            "source": "LinkedIn Jobs Portal",
            "link": f"https://www.linkedin.com/jobs/search/?q={company_name.replace(' ', '+')}",
            "weight": 4,
            "triggers": [j['title'] for j in jobs]
        })
        
    # Add Building/Equipment Permit Signal
    if permits:
        p = permits[0]
        new_signals.append({
            "type": "S5_PERMIT",
            "label": f"Municipal Permit {p['permit_no']}",
            "detail": f"Approved {p['type']}: {p['description']}.",
            "source": p['agency'],
            "permit_no": p['permit_no'],
            "weight": 8
        })
        
    # Add Customs manifest import Cargo Signal
    if customs:
        c = customs[0]
        new_signals.append({
            "type": "S8_FLEET",
            "label": "US Customs Import Shipment",
            "detail": f"Received {c['weight_lbs']:,} lbs shipment of '{c['cargo_desc']}' from {c['shipper']}.",
            "source": "US Customs & Border Protection",
            "link": f"https://www.google.com/search?q=bill+of+lading+{c['bol_no']}",
            "amount": c['weight_lbs'],
            "weight": 6
        })
        
    # Add Court/Litigation dispute Signal
    if cases:
        case = cases[0]
        new_signals.append({
            "type": "S9_LITIGATION",
            "label": "Lessor Civil Court Docket",
            "detail": f"Active litigation case {case['case_no']} with {case['plaintiff']}: {case['cause']}.",
            "source": "Federal PACER Portal",
            "weight": 10
        })
        
    # 3. Update database
    conn.execute("""
        UPDATE leads
        SET signals_json = ?
        WHERE id = ?
    """, (json.dumps(new_signals), lead_id))
    conn.commit()
    conn.close()
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        enrich_lead_signals(int(sys.argv[1]))
        print(f"[SUCCESS] Signals enriched for lead {sys.argv[1]}.")
    else:
        print("Provide lead ID as parameter.")
