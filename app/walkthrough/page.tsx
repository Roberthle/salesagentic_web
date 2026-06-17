import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Logs Walkthrough | SalesAgentic.ai',
  description: 'SalesAgentic system audit logs, implementation notes, and technical walkthrough.',
  alternates: {
    canonical: '/walkthrough',
  },
  openGraph: {
    title: 'System Logs Walkthrough | SalesAgentic.ai',
    description: 'SalesAgentic system audit logs, implementation notes, and technical walkthrough.',
    url: '/walkthrough',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Logs Walkthrough | SalesAgentic.ai',
    description: 'SalesAgentic system audit logs, implementation notes, and technical walkthrough.',
  },
};

export default function WalkthroughPage() {
    const filePath = path.join(process.cwd(), 'walkthrough.md');
    let content = '';
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
        content = 'Walkthrough file not found.';
    }

    const lines = content.split('\n');

    const parseMarkdownText = (text: string) => {
        const html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #fff; font-weight: 600;">$1</strong>')
            .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #00eeff; font-size: 0.85em; font-family: monospace;">$1</code>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <main style={{ 
            background: '#07070a', 
            minHeight: '100vh', 
            padding: '40px 20px', 
            color: '#e2e8f0', 
            fontFamily: 'monospace',
            backgroundImage: 'radial-gradient(circle at top right, rgba(0, 238, 255, 0.05) 0%, transparent 60%)'
        }}>
            <div style={{ 
                maxWidth: '900px', 
                margin: '0 auto', 
                background: 'rgba(13, 13, 22, 0.8)', 
                backdropFilter: 'blur(16px)', 
                border: '1px solid rgba(0, 238, 255, 0.15)', 
                borderRadius: '12px', 
                padding: '40px', 
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(0, 238, 255, 0.05)' 
            }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                    paddingBottom: '24px', 
                    marginBottom: '32px' 
                }}>
                    <div>
                        <h1 style={{ 
                            color: '#00eeff', 
                            margin: 0, 
                            fontSize: '1.4rem', 
                            fontWeight: 'bold', 
                            letterSpacing: '1px', 
                            textShadow: '0 0 10px rgba(0,238,255,0.3)' 
                        }}>
                            [SYSTEM LOGS] WALKTHROUGH INTEL
                        </h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            SALES AGENTIC AI DEPLOYMENT LEDGER
                        </p>
                    </div>
                    <Link href="/" style={{ 
                        color: '#94a3b8', 
                        textDecoration: 'none', 
                        border: '1px solid rgba(0, 238, 255, 0.25)', 
                        padding: '8px 18px', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        background: 'rgba(0, 238, 255, 0.03)', 
                        boxShadow: '0 0 10px rgba(0, 238, 255, 0.05)',
                        transition: 'all 0.2s', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer'
                    }}>
                        <span>[&lt;-] Back to Dashboard</span>
                    </Link>
                </div>

                {/* Content Renderer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {lines.map((line, idx) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('# ')) {
                            return (
                                <h2 key={idx} style={{ 
                                    color: '#fff', 
                                    fontSize: '1.6rem', 
                                    marginTop: '28px', 
                                    marginBottom: '12px', 
                                    borderBottom: '1px solid rgba(255,255,255,0.06)', 
                                    paddingBottom: '8px',
                                    fontWeight: '800'
                                }}>
                                    {parseMarkdownText(trimmed.slice(2))}
                                </h2>
                            );
                        }
                        if (trimmed.startsWith('## ')) {
                            return (
                                <h2 key={idx} style={{ 
                                    color: '#38bdf8', 
                                    fontSize: '1.2rem', 
                                    marginTop: '22px', 
                                    marginBottom: '10px',
                                    fontWeight: '700'
                                }}>
                                    {parseMarkdownText(trimmed.slice(3))}
                                </h2>
                            );
                        }
                        if (trimmed.startsWith('### ')) {
                            return (
                                <h3 key={idx} style={{ 
                                    color: '#00eeff', 
                                    fontSize: '1.0rem', 
                                    marginTop: '16px', 
                                    marginBottom: '8px',
                                    fontWeight: '600'
                                }}>
                                    {parseMarkdownText(trimmed.slice(4))}
                                </h3>
                            );
                        }
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                            return (
                                <div key={idx} style={{ 
                                    display: 'flex', 
                                    gap: '10px', 
                                    paddingLeft: '16px', 
                                    color: '#94a3b8', 
                                    fontSize: '0.85rem', 
                                    lineHeight: '1.6' 
                                }}>
                                    <span style={{ color: '#00eeff' }}>[-]</span>
                                    <span>{parseMarkdownText(trimmed.slice(2))}</span>
                                </div>
                            );
                        }
                        if (trimmed === '') {
                            return <div key={idx} style={{ height: '8px' }} />;
                        }
                        return (
                            <p key={idx} style={{ 
                                margin: 0, 
                                color: '#64748b', 
                                fontSize: '0.85rem', 
                                lineHeight: '1.6',
                                paddingLeft: '4px'
                            }}>
                                {parseMarkdownText(line)}
                            </p>
                        );
                    })}
                </div>
            </div>
        </main>
    );
}
