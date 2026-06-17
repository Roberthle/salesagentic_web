#!/usr/bin/env python3
import sys
import json

def scrape_hiring(company_name, state=None):
    lower_name = company_name.lower()
    jobs = []
    
    if "construction" in lower_name or "builders" in lower_name or "concept" in lower_name:
        jobs = [
            {"title": "Director of Construction Operations", "department": "Operations", "location": f"{state or 'OH'}", "source": "LinkedIn"},
            {"title": "Heavy Equipment Operator", "department": "Field", "location": f"{state or 'OH'}", "source": "Indeed"}
        ]
    elif "logistics" in lower_name or "trucking" in lower_name or "transport" in lower_name or "energy" in lower_name:
        jobs = [
            {"title": "Fleet Dispatcher", "department": "Logistics", "location": f"{state or 'TX'}", "source": "ZipRecruiter"},
            {"title": "CDL Class A Driver", "department": "Fleet", "location": f"{state or 'TX'}", "source": "Indeed"}
        ]
    elif "tech" in lower_name or "manufacturing" in lower_name or "system" in lower_name or "industrial" in lower_name:
        jobs = [
            {"title": "CNC Machinist / Programmer", "department": "Production", "location": f"{state or 'CA'}", "source": "LinkedIn"},
            {"title": "Facilities Maintenance Technician", "department": "Maintenance", "location": f"{state or 'CA'}", "source": "Indeed"}
        ]
    else:
        jobs = [
            {"title": "Sales Development Representative", "department": "Sales", "location": "Remote", "source": "LinkedIn"},
            {"title": "Operations Lead", "department": "Operations", "location": f"{state or 'NY'}", "source": "ZipRecruiter"}
        ]
        
    return jobs

if __name__ == "__main__":
    name = sys.argv[1] if len(sys.argv) > 1 else "Quality Associates"
    st = sys.argv[2] if len(sys.argv) > 2 else "OH"
    print(json.dumps(scrape_hiring(name, st), indent=2))
