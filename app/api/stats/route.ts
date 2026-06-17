import { NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

// Locate the python agent's local sqlite db
const dbPath = path.resolve(process.cwd(), '../listener_agent/signals_local.db');

export async function GET(): Promise<NextResponse> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error("Database connection error:", err.message);
                return resolve(NextResponse.json({ error: "Failed to connect to database" }, { status: 500 }));
            }
        });

        // Run multiple queries in parallel for the stats
        Promise.all([
            new Promise((res, rej) => db.get("SELECT COUNT(*) as count FROM signals", [], (err, row: any) => err ? rej(err) : res(row?.count || 0))),
            new Promise((res, rej) => db.get("SELECT COUNT(*) as count FROM decision_makers", [], (err, row: any) => err ? rej(err) : res(row?.count || 0))),
            new Promise((res, rej) => db.get("SELECT COUNT(*) as count FROM outbound_drafts", [], (err, row: any) => err ? rej(err) : res(row?.count || 0))),
            new Promise((res, rej) => db.get("SELECT COUNT(*) as count FROM outbound_drafts WHERE status = 'DISPATCHED'", [], (err, row: any) => err ? rej(err) : res(row?.count || 0))),
            new Promise((res, rej) => db.all("SELECT signal_type, COUNT(*) as count FROM signals GROUP BY signal_type", [], (err, rows: any) => err ? rej(err) : res(rows || []))),
        ]).then(([totalSignals, totalEnriched, totalDrafts, totalDispatched, distributionRows]) => {
            db.close();
            
            // Format distribution for Recharts
            const colors = ['#0070f3', '#f5a623', '#7928ca', '#ff4a4a', '#00ff9d', '#ff00ff'];
            const total: number = (totalSignals as number) || 1; // prevent div by 0
            const signalDistribution = (distributionRows as any[]).map((row, idx) => ({
                name: row.signal_type || 'Unknown Signal',
                value: Math.round((row.count / total) * 100),
                color: colors[idx % colors.length]
            }));

            resolve(NextResponse.json({
                totalSignals,
                totalEnriched,
                totalDrafts,
                totalDispatched,
                signalDistribution
            }));
        }).catch((err) => {
            console.error("Database query error:", err);
            db.close();
            resolve(NextResponse.json({ error: "Failed to query database" }, { status: 500 }));
        });
    });
}
