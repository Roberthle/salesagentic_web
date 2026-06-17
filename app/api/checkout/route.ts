import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve = promisify(dns.resolve);

const dbPath = process.env.REGISTRY_DB_PATH || '/Users/robertle/tomcat_registry/data/registry.db';

const FREE_EMAIL_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com', 'proton.me',
    'live.com', 'yandex.com', 'gmx.com'
]);

function cleanDomain(input: string): string {
    let d = input.trim().toLowerCase();
    d = d.replace(/^(https?:\/\/)?(www\.)?/, '');
    d = d.split('/')[0];
    return d;
}

async function validateDomainDns(domain: string): Promise<boolean> {
    try {
        const mxRecords = await resolveMx(domain);
        return mxRecords && mxRecords.length > 0;
    } catch (e) {
        try {
            const addresses = await resolve(domain);
            return addresses && addresses.length > 0;
        } catch (e2) {
            return false;
        }
    }
}

export async function POST(req: Request) {
    try {
        const { domain, audience, email, what_you_sell, weekly_digest } = await req.json();

        if (!domain || !audience || !email || !what_you_sell) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Enforce corporate work email (block free providers)
        const emailParts = email.trim().toLowerCase().split('@');
        if (emailParts.length !== 2) {
            return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
        }
        const emailDomain = emailParts[1];
        if (FREE_EMAIL_DOMAINS.has(emailDomain)) {
            return NextResponse.json({ 
                error: `Registration blocked: public email providers like @${emailDomain} are not allowed. Please use your corporate work email.` 
            }, { status: 400 });
        }

        // 2. Validate email domain matches business domain URL
        const cleanedBusinessDomain = cleanDomain(domain);
        if (emailDomain !== cleanedBusinessDomain && !emailDomain.endsWith('.' + cleanedBusinessDomain)) {
            return NextResponse.json({ 
                error: `Domain mismatch: Your email domain (@${emailDomain}) does not match your business domain (${cleanedBusinessDomain}).` 
            }, { status: 400 });
        }

        // 3. DNS Validation: check if domain exists and is active
        const isDnsActive = await validateDomainDns(cleanedBusinessDomain);
        if (!isDnsActive) {
            return NextResponse.json({ 
                error: `Invalid domain: The business domain ${cleanedBusinessDomain} could not be resolved. Please verify the URL.` 
            }, { status: 400 });
        }

        const isWeeklySubscribed = weekly_digest !== false;

        // 4. Save pending trial record to SQLite registry database
        await new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) return reject(err);
            });

            db.run(`
                INSERT OR REPLACE INTO trial_users (domain, audience, email, what_you_sell, status, subscribed_weekly)
                VALUES (?, ?, ?, ?, 'pending', ?)
            `, [cleanedBusinessDomain, audience, email, what_you_sell, isWeeklySubscribed ? 1 : 0], (err) => {
                db.close();
                if (err) return reject(err);
                resolve();
            });
        });

        // 5. If subscribed to weekly reports, save to weekly_subscribers table
        if (isWeeklySubscribed) {
            await new Promise<void>((resolve, reject) => {
                const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                    if (err) return reject(err);
                });
                db.run(`
                    INSERT OR REPLACE INTO weekly_subscribers (email, domain, what_you_sell, status)
                    VALUES (?, ?, ?, 'active')
                `, [email, cleanedBusinessDomain, what_you_sell], (err) => {
                    db.close();
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        // 6. Initialize Campaign & Auto-activate
        // Bypass Stripe entirely to remove paywalls and allow instant feature access
        console.log("Paywalls disabled: Autopopulating active trial user and starting sandbox campaign.");
        
        await new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) return reject(err);
            });
            
            db.serialize(() => {
                db.run(`
                    UPDATE trial_users
                    SET status = 'active'
                    WHERE email = ?
                `, [email], (err) => {
                    if (err) {
                        db.close();
                        return reject(err);
                    }
                });
                
                db.get("SELECT id FROM trial_users WHERE email = ?", [email], (err, row: any) => {
                    if (err || !row) {
                        db.close();
                        return reject(err || new Error("User not found"));
                    }
                    
                    db.run(`
                        INSERT OR REPLACE INTO trial_campaigns (trial_user_id, emails_sent, max_emails, status)
                        VALUES (?, 0, 50, 'running')
                    `, [row.id], (err) => {
                        db.close();
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
        });

        return NextResponse.json({ 
            message: "Simulation mode: Trial activated instantly.", 
            checkout_url: null 
        });

    } catch (error: any) {
        console.error("Checkout session error:", error);
        return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
    }
}


