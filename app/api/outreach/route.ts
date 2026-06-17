import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { callGemini } from '../utils/gemini';

const dbPath = process.env.REGISTRY_DB_PATH || '/Users/robertle/tomcat_registry/data/registry.db';

export async function POST(req: Request) {
    try {
        const { lead_id, domain, what_you_sell } = await req.json();

        if (!lead_id || !domain || !what_you_sell) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch lead details from SQLite database
        const lead: any = await new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) return reject(err);
            });

            db.get("SELECT * FROM leads WHERE id = ?", [lead_id], (err, row) => {
                db.close();
                if (err) return reject(err);
                resolve(row);
            });
        });

        if (!lead) {
            return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        // 2. Draft dynamic prompt for Gemini
        const leadType = lead.lead_type === 'mca' ? 'Capital Refinance demand' : 'Contract Renewal opportunity';
        const collateral = lead.collateral_desc || 'Commercial Operations';
        const securedParty = lead.secured_party || 'Verified Lender';

        // Deterministic contact first name selection
        const contactName = lead.contact_name || "Manager";
        const contactFirstName = contactName.split(' ')[0] || "Manager";

        // 3. Generate structured email outreach pitch using Gemini
        const prompt = `You are an Elite B2B Sales Representative working for a client with website ${domain}.
The client sells / offers the following product/service: ${what_you_sell}

You have intercepted a highly actionable operational trigger for a prospect:
- Company Name: ${lead.company_name}
- Geography: ${lead.city}, ${lead.state || lead.source_state}
- Event Type: ${leadType}
- Asset Focus / Collateral: ${collateral}
- Existing Lender: ${securedParty}

Write a concise, 3-paragraph cold outbound email to this prospect pitching the client's product/service in the context of the prospect's event/expansion.
Rules:
1. Do NOT mention 'UCC filing', 'SEC database', or 'public records'. Frame the trigger naturally as 'noticing their operational scale', 'active logistics lists', or 'upcoming asset cycles'.
2. Be direct, professional, and conversational. Do not use generic corporate jargon.
3. Call to Action: Ask for a quick 5-minute chat to explore how the client's product/service can support their active operational and equipment needs.
4. Output exactly a JSON object with two keys:
"subject": "Email Subject Line",
"body": "Email body content with paragraphs separated by newlines."
Do not wrap in markdown block.`;

        let subject = "";
        let body = "";
        try {
            const responseText = await callGemini(prompt, true);
            const parsed = JSON.parse(responseText.trim());
            subject = parsed.subject || `Sourcing solutions for ${lead.company_name}`;
            body = parsed.body || "";
        } catch (err) {
            console.error("Gemini outreach drafting failed, using fallback template:", err);
            
            // Fallback templates based on category matching
            const product = what_you_sell.toLowerCase();
            
            if (product.includes('tractor') || product.includes('excavat') || product.includes('deere') || product.includes('caterpillar') || product.includes('machinery') || product.includes('equipment')) {
                subject = `Sourcing operational machinery for ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI noticed your active operations in ${lead.city} and your upcoming capex cycles. At ${domain}, we specialize in sourcing and leasing high-capacity heavy equipment, including excavators, loaders, and tractors.\n\nGiven the recent equipment filings under ${securedParty}, we can help you acquire premium machinery at more competitive rates than captive finance companies.\n\nWould you be open to a quick 5-minute call next Tuesday to review availability?\n\nBest regards,\nOutbound Agent`;
            } else if (product.includes('insurance') || product.includes('fleet') || product.includes('truck') || product.includes('trailer')) {
                subject = `Commercial Fleet Insurance review for ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI saw that you recently registered new commercial vehicles for your logistics operations in ${lead.state || lead.source_state}. At ${domain}, we provide specialized commercial insurance policies designed for logistics operations to reduce premiums and increase coverage.\n\nWe review active fleet risk profiles and can structure a policy that saves up to 15% compared to standard captive programs.\n\nDo you have 5 minutes for a brief introductory call next Wednesday?\n\nBest regards,\nOutbound Agent`;
            } else if (product.includes('loan') || product.includes('finance') || product.includes('debt') || product.includes('refinance') || product.includes('mca') || product.includes('receivables') || product.includes('advance')) {
                subject = `Optimizing working capital options for ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI noticed your recent receivables and capital expansion filings. At ${domain}, we offer flexible working capital advances and private debt refinancing solutions with faster approvals and lower overall rates.\n\nInstead of high-APR merchant cash advances, we can refinance your existing debt into a structured monthly payment that frees up cash flow.\n\nAre you available for a brief conversation this week to discuss options?\n\nBest regards,\nOutbound Agent`;
            } else if (product.includes('lease') || product.includes('lien')) {
                subject = `Equipment leasing options for ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI noticed your equipment acquisition filings in ${lead.city}. At ${domain}, we provide customized equipment leasing and leaseback structures that preserve operational capital while letting you use the latest machinery.\n\nWe can restructure existing vendor liens into a single, tax-advantaged lease schedule with lower monthly outlays.\n\nWould you be open to a brief call next Thursday to look at some draft lease scenarios?\n\nBest regards,\nOutbound Agent`;
            } else if (product.includes('computer') || product.includes('software') || product.includes('server') || product.includes('hardware')) {
                subject = `IT infrastructure expansion at ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI noticed your recent technology hardware additions. At ${domain}, we deliver enterprise-grade server, network, and laptop configurations with integrated deployment services.\n\nWe can help you scale your hardware footprint while providing direct leasing options that bypass standard OEM markup.\n\nDo you have time for a quick 10-minute briefing next week?\n\nBest regards,\nOutbound Agent`;
            } else {
                subject = `Operational scale and solutions for ${lead.company_name}`;
                body = `Hi ${contactFirstName},\n\nI noticed your recent operational activity and wanted to connect. At ${domain}, we help businesses like yours scale by providing: ${what_you_sell}.\n\nGiven your active asset and capital cycles, I believe we can help you streamline operations and improve margins.\n\nAre you open to a brief 5-minute introductory call next Tuesday?\n\nBest regards,\nOutbound Agent`;
            }
        }

        return NextResponse.json({ subject, body });

    } catch (error: any) {
        console.error("Outreach API error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate outreach copy" }, { status: 500 });
    }
}
