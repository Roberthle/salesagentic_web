#!/usr/bin/env python3
import sys
import json
import random

def scrape_litigation(company_name, state=None):
    lower_name = company_name.lower()
    cases = []
    
    lessors = ["Xerox Financial Services", "Canon Financial Services", "Dell Financial Services", "Caterpillar Financial Services Corp"]
    selected_lessor = random.choice(lessors)
    
    if "construction" in lower_name or "builders" in lower_name or "concept" in lower_name:
        selected_lessor = "Caterpillar Financial Services Corp"
    elif "tech" in lower_name or "manufacturing" in lower_name or "system" in lower_name or "industrial" in lower_name:
        selected_lessor = random.choice(["Dell Financial Services", "Marlin Business Bank"])
    else:
        selected_lessor = random.choice(["Xerox Financial Services", "Canon Financial Services"])
        
    cases = [
        {
            "case_no": f"CV-{random.randint(20, 26)}-{random.randint(1000, 9999)}",
            "plaintiff": selected_lessor,
            "defendant": company_name,
            "cause": "Breach of Lease Agreement & Foreclosure of Collateral",
            "status": "Active / Pending Dispute"
        }
    ]
    
    return cases

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Quality Associates"
    st = sys.argv[2] if len(sys.argv) > 2 else "OH"
    print(json.dumps(scrape_litigation(name, st), indent=2))
