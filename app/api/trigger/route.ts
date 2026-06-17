import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
    const { agent } = await req.json();

    let command = '';
    const basePath = path.resolve(process.cwd(), '../');

    if (agent === 'listener') {
        command = `cd ${basePath} && node -e "require('child_process').execSync('python3 listener_agent/omni_listener.py', {stdio: 'inherit'})"`;
    } else if (agent === 'researcher') {
        command = `cd ${basePath} && node -e "require('child_process').execSync('python3 research_agent/linkedin_enricher.py', {stdio: 'inherit'})"`;
    } else if (agent === 'creator') {
        command = `cd ${basePath} && node -e "require('child_process').execSync('python3 creator_agent/outreach_generator.py', {stdio: 'inherit'})"`;
    } else if (agent === 'dispatcher') {
        command = `cd ${basePath} && node -e "require('child_process').execSync('python3 dispatcher_agent/gmail_dispatcher.py', {stdio: 'inherit'})"`;
    } else {
        return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
    }

    // Since Python scripts can take a long time, we trigger them asynchronously
    // In a real production environment we would use a job queue like BullMQ
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution error for ${agent}:`, error);
            return;
        }
        console.log(`[${agent}] stdout: ${stdout}`);
        if(stderr) console.error(`[${agent}] stderr: ${stderr}`);
    });

    return NextResponse.json({ message: `${agent} execution started successfully.` });
}
