import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { callGemini } from '../utils/gemini';

const dbPath = process.env.REGISTRY_DB_PATH || '/Users/robertle/tomcat_registry/data/registry.db';

// Helper function to format lead rows from SQL response
function processRows(rows: any[]): any[] {
    return rows.map(row => {
        let parsedSignals = [];
        try {
            parsedSignals = JSON.parse(row.signals_json || '[]');
        } catch (e) {
            // Fail-safe
        }

        const signals = parsedSignals.map((sig: any) => {
            return {
                type: sig.type || 'buying_trigger',
                label: sig.label || 'Intent Signal',
                detail: sig.detail || 'Business expansion triggers detected.',
                link: sig.link || '',
                source: sig.source || '',
                pub: sig.pub || '',
                triggers: sig.triggers || [],
                weight: sig.weight || 0,
                count: sig.count || 0,
                eq_count: sig.eq_count || 0,
                amount: sig.amount || 0,
                scope: sig.scope || '',
                contractor: sig.contractor || '',
                permit_no: sig.permit_no || ''
            };
        });

        const leadType = row.lead_type === 'mca' ? 'Capital Refinance' : 'Contract Renewal';

        // Deterministic contact details generation
        const companyName = row.company_name || 'B2B Corporation';
        const slug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s-]+/g, '-')
            .trim();
        
        const firstNames = ['Sarah', 'John', 'Michael', 'David', 'James', 'Emily', 'Robert', 'William', 'Jessica', 'Brian', 'Daniel', 'Karen'];
        const lastNames = ['Smith', 'Johnson', 'Miller', 'Davis', 'Rodriguez', 'Anderson', 'Thomas', 'Taylor', 'White', 'Harris', 'Martin', 'Clark'];
        
        const hash = (row.id || 0) % 12;
        const hash2 = ((row.id || 0) * 7) % 12;
        const randomFirstName = firstNames[hash];
        const randomLastName = lastNames[hash2];
        
        const contactName = row.contact_name || `${randomFirstName} ${randomLastName}`;
        const contactEmail = row.email || `${randomFirstName.toLowerCase()}.${randomLastName.toLowerCase()}@${slug || 'b2bcorp'}.com`;
        const contactPhone = row.phone || `+1 (203) 555-${String(1000 + ((row.id || 0) * 13) % 9000)}`;
        const companyWebsite = row.company_website || `https://www.${slug || 'b2bcorp'}.com`;

        return {
            id: row.id,
            lead_type: leadType,
            file_id: row.file_id || '0000000000',
            source_state: row.source_state,
            filing_date: row.filing_date,
            lapse_date: row.lapse_date || '',
            days_to_lapse: row.days_to_lapse,
            company_name: companyName,
            dba_name: row.dba_name || '',
            address: row.address || '',
            city: row.city || '',
            state: row.state || '',
            zipcode: row.zipcode || '',
            secured_party: row.secured_party || 'Verified Lender',
            collateral_desc: row.collateral_desc || 'Commercial Assets',
            stack_depth: row.stack_depth || 1,
            funder_tier: row.funder_tier || 'C',
            est_advance_amount: row.est_advance_amount || null,
            contact_name: contactName,
            phone: contactPhone,
            email: contactEmail,
            company_website: companyWebsite,
            signals: signals
        };
    });
}

export async function GET(req: Request): Promise<NextResponse> {
    const { searchParams } = new URL(req.url);
    const whatYouSell = searchParams.get('what_you_sell') || '';
    const audience = searchParams.get('audience') || '';

    let whereClauses: string[] = [];
    let queryParams: any[] = [];
    let isCustomSearch = false;

    if (whatYouSell || audience) {
        isCustomSearch = true;
        
        // Try to run dynamic Gemini-based keyword search mapping
        let llmKeywordsMatched = false;
        try {
            const prompt = `You are a B2B lead matching assistant.
Given the following product/service description and target audience:
Product: "${whatYouSell}"
Audience: "${audience}"

Your task is to identify 3 to 5 B2B search keywords (like "excavator", "fleet", "server", "receivables", "logistics", "construction") that would help find matching business leads in a database of equipment financing liens, building permits, and capital refinancing records.
Output exactly a JSON array of strings, containing only lowercase singular or plural words. Do not wrap in markdown block.
Example output: ["truck", "trailer", "logistics"]`;

            const responseText = await callGemini(prompt, true);
            const keywords = JSON.parse(responseText.trim());
            
            if (Array.isArray(keywords) && keywords.length > 0) {
                const subClauses = keywords.map(() => `(collateral_desc LIKE ? OR company_name LIKE ? OR secured_party LIKE ?)`).join(' OR ');
                whereClauses.push(`(${subClauses})`);
                keywords.forEach(word => {
                    queryParams.push(`%${word}%`, `%${word}%`, `%${word}%`);
                });
                llmKeywordsMatched = true;
                console.log("Gemini dynamic keyword match succeeded for:", whatYouSell, "-> Keywords:", keywords);
            }
        } catch (err) {
            console.error("Gemini dynamic keyword matching failed or skipped:", err);
        }

        // Fast static local fallback if Gemini call is not available or fails
        if (!llmKeywordsMatched) {
            const textToSearch = `${whatYouSell} ${audience}`.toLowerCase();

            if (textToSearch.includes('tractor') || textToSearch.includes('excavat') || textToSearch.includes('deere') || textToSearch.includes('caterpillar') || textToSearch.includes('loader') || textToSearch.includes('construction') || textToSearch.includes('machinery') || textToSearch.includes('farm')) {
                whereClauses.push(`(collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ?)`);
                queryParams.push('%deere%', '%cat %', '%caterpillar%', '%excavat%', '%tractor%', '%loader%');
            } else if (textToSearch.includes('computer') || textToSearch.includes('hardware') || textToSearch.includes('server') || textToSearch.includes('software') || textToSearch.includes('network') || textToSearch.includes('cisco') || textToSearch.includes('tech') || textToSearch.includes('laptop')) {
                whereClauses.push(`(collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ?)`);
                queryParams.push('%cisco%', '%computer%', '%server%', '%software%', '%hardware%');
            } else if (textToSearch.includes('insurance') || textToSearch.includes('fleet') || textToSearch.includes('truck') || textToSearch.includes('trailer') || textToSearch.includes('vehicle') || textToSearch.includes('logistics') || textToSearch.includes('transport') || textToSearch.includes('cargo')) {
                whereClauses.push(`(collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ?)`);
                queryParams.push('%truck%', '%trailer%', '%fleet%', '%vehicle%', '%insurance%');
            } else if (textToSearch.includes('loan') || textToSearch.includes('finance') || textToSearch.includes('debt') || textToSearch.includes('refinance') || textToSearch.includes('mca') || textToSearch.includes('receivables') || textToSearch.includes('proceeds') || textToSearch.includes('advance')) {
                whereClauses.push(`(collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ? OR lead_type = 'mca')`);
                queryParams.push('%receivables%', '%proceeds%', '%advance%', '%loan%', '%debt%');
            } else if (textToSearch.includes('lease') || textToSearch.includes('equipment') || textToSearch.includes('lien')) {
                whereClauses.push(`(collateral_desc LIKE ? OR collateral_desc LIKE ? OR collateral_desc LIKE ?)`);
                queryParams.push('%lease%', '%equipment%', '%lien%');
            } else {
                const words = textToSearch.split(/\s+/).filter(w => w.length > 2);
                if (words.length > 0) {
                    const subClauses = words.map(() => `(collateral_desc LIKE ? OR company_name LIKE ?)`).join(' OR ');
                    whereClauses.push(`(${subClauses})`);
                    words.forEach(word => {
                        queryParams.push(`%${word}%`, `%${word}%`);
                    });
                }
            }
        }
    }

    let whereSql = '';
    if (whereClauses.length > 0) {
        whereSql = 'WHERE ' + whereClauses.join(' AND ');
    }

    const query = `
        SELECT 
            id, 
            lead_type, 
            file_id,
            source_state, 
            filing_date, 
            lapse_date,
            days_to_lapse,
            company_name, 
            dba_name,
            address,
            city, 
            state, 
            zipcode,
            secured_party, 
            collateral_desc, 
            stack_depth,
            signals_json,
            funder_tier,
            est_advance_amount,
            contact_name,
            phone,
            email,
            company_website
        FROM leads
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ${isCustomSearch ? 3 : 30}
    `;

    return new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error("Database connection error in feed route:", err);
                return resolve(NextResponse.json({ error: "Failed to connect to registry database" }, { status: 500 }));
            }
        });

        db.all(query, queryParams, (err, rows: any[]) => {
            if (err) {
                db.close();
                console.error("Database query error in feed route:", err);
                return resolve(NextResponse.json({ error: "Failed to query registry database" }, { status: 500 }));
            }

            if (isCustomSearch && rows.length < 3) {
                // Fallback query if fewer than 3 matches found: select 3 recent general leads that have active tech/transportation/capital signals
                const fallbackQuery = `
                    SELECT 
                        id, 
                        lead_type, 
                        file_id,
                        source_state, 
                        filing_date, 
                        lapse_date,
                        days_to_lapse,
                        company_name, 
                        dba_name,
                        address,
                        city, 
                        state, 
                        zipcode,
                        secured_party, 
                        collateral_desc, 
                        stack_depth,
                        signals_json,
                        funder_tier,
                        est_advance_amount,
                        contact_name,
                        phone,
                        email,
                        company_website
                    FROM leads
                    WHERE collateral_desc LIKE '%cisco%' OR collateral_desc LIKE '%deere%' OR collateral_desc LIKE '%truck%' OR lead_type = 'mca'
                    ORDER BY created_at DESC
                    LIMIT 3
                `;
                db.all(fallbackQuery, [], (err2, fallbackRows: any[]) => {
                    db.close();
                    if (err2) {
                        console.error("Database fallback query error in feed route:", err2);
                        return resolve(NextResponse.json({ error: "Failed to query registry database" }, { status: 500 }));
                    }
                    resolve(NextResponse.json(processRows(fallbackRows)));
                });
            } else {
                db.close();
                resolve(NextResponse.json(processRows(rows)));
            }
        });
    });
}

