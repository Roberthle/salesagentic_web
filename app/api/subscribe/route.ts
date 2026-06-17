import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';

const dbPath = process.env.REGISTRY_DB_PATH || '/Users/robertle/tomcat_registry/data/registry.db';

export async function POST(req: Request) {
    try {
        const { email, domain, what_you_sell } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        await new Promise<void>((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) return reject(err);
            });
            db.run(`
                INSERT OR REPLACE INTO weekly_subscribers (email, domain, what_you_sell, status)
                VALUES (?, ?, ?, 'active')
            `, [email, domain || '', what_you_sell || ''], (err) => {
                db.close();
                if (err) return reject(err);
                resolve();
            });
        });

        return NextResponse.json({ message: "Successfully subscribed to weekly digest." });

    } catch (error: any) {
        console.error("Subscription error:", error);
        return NextResponse.json({ error: error.message || "Failed to subscribe" }, { status: 500 });
    }
}
