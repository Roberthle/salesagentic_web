import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const redditPath = path.join(process.cwd(), '../.gemini/antigravity/LeadBot/logs/reddit/latest_targets.json');
        const linkedinPath = path.join(process.cwd(), '../.gemini/antigravity/LeadBot/logs/linkedin/latest_targets.json');
        
        let combinedFeed: any[] = [];
        
        // Load Reddit
        if (fs.existsSync(redditPath)) {
            const rData = JSON.parse(fs.readFileSync(redditPath, 'utf-8'));
            const tagged = rData.map((item: any) => ({ ...item, platform: "reddit" }));
            combinedFeed = combinedFeed.concat(tagged);
        }
        
        // Load LinkedIn
        if (fs.existsSync(linkedinPath)) {
            const lData = JSON.parse(fs.readFileSync(linkedinPath, 'utf-8'));
            const tagged = lData.map((item: any) => ({ ...item, platform: "linkedin" }));
            combinedFeed = combinedFeed.concat(tagged);
        }
        
        // Sort organically (pseudo-random or by date if needed; we'll leave it simple for now)
        return NextResponse.json(combinedFeed);
    } catch (error) {
        console.error("Social Feed Route Error:", error);
        return NextResponse.json({ error: "Failed to read aggregate target data." }, { status: 500 });
    }
}
