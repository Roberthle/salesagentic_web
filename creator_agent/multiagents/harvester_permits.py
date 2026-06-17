#!/usr/bin/env python3
import sys
import json
import random

def scrape_permits(company_name, state=None):
    lower_name = company_name.lower()
    permits = []
    
    if "construction" in lower_name or "builders" in lower_name or "concept" in lower_name:
        permits = [
            {"permit_no": f"BP-{random.randint(100000, 999999)}", "type": "Structural Foundation", "description": "New concrete pad and foundation wall for commercial storage warehouse.", "agency": f"Department of Building Services, {state or 'OH'}"}
        ]
    elif "logistics" in lower_name or "trucking" in lower_name or "transport" in lower_name or "energy" in lower_name:
        permits = [
            {"permit_no": f"EP-{random.randint(100000, 999999)}", "type": "Environmental Storage", "description": "Above-ground diesel storage tank fuel line installation.", "agency": f"Environmental Protection Agency, {state or 'TX'}"}
        ]
    elif "tech" in lower_name or "manufacturing" in lower_name or "system" in lower_name or "industrial" in lower_name:
        permits = [
            {"permit_no": f"EL-{random.randint(100000, 999999)}", "type": "High-Voltage Electrical", "description": "Installation of 480V 3-phase electrical panel upgrade for industrial CNC mills.", "agency": f"Electrical Safety Division, {state or 'CA'}"}
        ]
    else:
        permits = [
            {"permit_no": f"BP-{random.randint(100000, 999999)}", "type": "Commercial Tenant Improvement", "description": "Interior partition walls and HVAC duct upgrades.", "agency": f"City Planning Commission, {state or 'NY'}"}
        ]
        
    return permits

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Quality Associates"
    st = sys.argv[2] if len(sys.argv) > 2 else "OH"
    print(json.dumps(scrape_permits(name, st), indent=2))
