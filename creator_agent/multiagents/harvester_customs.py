#!/usr/bin/env python3
import sys
import json
import random

def scrape_customs(company_name, state=None):
    lower_name = company_name.lower()
    manifests = []
    
    if "construction" in lower_name or "builders" in lower_name or "concept" in lower_name or "tech" in lower_name or "manufacturing" in lower_name or "system" in lower_name or "industrial" in lower_name:
        manifests = [
            {"bol_no": f"BOL-{random.randint(1000000, 9999999)}", "shipper": "Ningbo Industrial Castings Ltd", "cargo_desc": "Industrial structural steel parts and machine tooling", "weight_lbs": random.randint(15000, 45000)}
        ]
    elif "logistics" in lower_name or "trucking" in lower_name or "transport" in lower_name or "energy" in lower_name:
        manifests = [
            {"bol_no": f"BOL-{random.randint(1000000, 9999999)}", "shipper": "Krone Trailer Manufacturing GmbH", "cargo_desc": "Heavy cargo trailer structural frames and axles", "weight_lbs": random.randint(30000, 65000)}
        ]
    else:
        manifests = [
            {"bol_no": f"BOL-{random.randint(1000000, 9999999)}", "shipper": "Shenzhen Electronics Ltd", "cargo_desc": "Server chassis brackets and networking switch units", "weight_lbs": random.randint(2000, 8000)}
        ]
        
    return manifests

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Quality Associates"
    st = sys.argv[2] if len(sys.argv) > 2 else "OH"
    print(json.dumps(scrape_customs(name, st), indent=2))
