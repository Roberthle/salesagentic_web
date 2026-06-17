"use client";

import { useEffect, useState, useRef } from 'react';
import '../style.css'; 

interface SocialTarget {
    id: string;
    subreddit: string;
    title: string;
    url: string;
    ai_response: string;
    date: string;
    platform: "reddit" | "linkedin";
}

export default function SocialPoachingDashboard() {
    const [targets, setTargets] = useState<SocialTarget[]>([]);
    const [activeTargetIndex, setActiveTargetIndex] = useState<number>(0);
    const traceEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchRedditData = async () => {
            try {
                const res = await fetch('/api/reddit');
                if (res.ok) {
                    const data = await res.json();
                    setTargets(data);
                }
            } catch (error) {
                console.error("Failed to fetch reddit targets", error);
            }
        };
        fetchRedditData();
        const interval = setInterval(fetchRedditData, 30000); 
        return () => clearInterval(interval);
    }, []);

    const activeTarget = targets[activeTargetIndex] || null;

    const handleCopy = () => {
        if (!activeTarget) return;
        navigator.clipboard.writeText(activeTarget.ai_response);
        alert("Native Authority Response Copied to Clipboard!");
    };

    return (
        <div className="dashboard-container" style={{padding: '40px', minHeight: '100vh', background: '#2d2f33'}}>
            
            {/* The V1 Header */}
            <header className="glass-header">
                <h1>Social Poaching <span>Hunter</span></h1>
                <div className="status-indicator">
                    <div className="dot"></div>
                    <span style={{color: '#ffbd2e'}}>Sweep Online [7:00 AM]</span>
                </div>
                <div className="mac-buttons" style={{position: 'absolute', top: '15px', left: '15px'}}>
                    <div className="mac-btn close" style={{width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}}></div>
                </div>
                <button 
                    onClick={() => {
                        fetch('http://localhost:5001/toggle_service/com.leadbot.social_intent_scraper', { method: 'POST' }).catch(console.error);
                    }}
                    style={{ position: 'absolute', top: '25px', right: '40px', padding: '8px 20px', backgroundColor: '#111', color: '#10b981', border: '1px solid #10b981', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', borderRadius: '4px', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }}>
                    INTERCEPT EXECUTIVES
                </button>
            </header>

            <main className="gts-screen">
                
                {/* 5-Dial Porsche Structure applied to Reddit Metrics */}
                <div className="porsche-5-dial-cluster">
                    
                    {/* Dial 1 */}
                    <div className="dial-wrapper dial-far-left">
                        <div className="tach-glass"></div>
                        <div className="tach-outer-ring" style={{borderRightColor: 'transparent'}}></div>
                        <div className="tach-core">
                            <div className="dial-title">Scan Rate</div>
                            <div className="dial-value" style={{color: 'var(--accent-blue)'}}>12.4</div>
                            <div className="dial-title-sub">SEC DELAY</div>
                        </div>
                    </div>

                    {/* Dial 2 */}
                    <div className="dial-wrapper dial-inner-left">
                        <div className="tach-glass"></div>
                        <div className="tach-outer-ring" style={{borderRightColor: 'transparent'}}></div>
                        <div className="tach-core">
                            <div className="dial-title">Daily Hits</div>
                            <div className="dial-value-large" style={{marginBottom: '10px'}}>{targets.length}</div>
                            <div className="dial-title-sub">OPPORTUNITIES</div>
                        </div>
                        <div className="tach-needle-small"></div>
                    </div>

                    {/* Center Dial */}
                    <div className="dial-wrapper dial-center">
                        <div className="tach-glass"></div>
                        <div className="tach-bezel"></div>
                        <div className="tach-ticks"></div>
                        <div className="tach-ticks-minor"></div>
                        <div className="tach-ring"></div>
                        
                        <span className="tach-num" style={{transform: 'rotate(-140deg) translateY(-175px) rotate(140deg)'}}>0</span>
                        <span className="tach-num" style={{transform: 'rotate(-105deg) translateY(-175px) rotate(105deg)'}}>1</span>
                        <span className="tach-num" style={{transform: 'rotate(-70deg) translateY(-175px) rotate(70deg)'}}>2</span>
                        <span className="tach-num" style={{transform: 'rotate(-35deg) translateY(-175px) rotate(35deg)'}}>3</span>
                        <span className="tach-num" style={{transform: 'rotate(0deg) translateY(-175px) rotate(0deg)'}}>4</span>
                        <span className="tach-num" style={{transform: 'rotate(35deg) translateY(-175px) rotate(-35deg)'}}>5</span>
                        
                        <div className="tach-needle revving"></div>

                        <div className="tach-core">
                            <div className="gtc-logo-stack" style={{position: 'absolute', top: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                <div className="gts-logo" style={{position: 'relative', top: '0', marginBottom: '2px', color: '#ff6600'}}>RDDT</div>
                                <div style={{fontSize: '0.55rem', letterSpacing: '3px', color: '#888', textTransform: 'uppercase', fontWeight: 700}}>Hunter</div>
                            </div>
                            <div className="metric-value-huge" style={{marginTop: '25px', color: '#ff6600'}}>89%</div>
                            <div className="gts-unit">AI CONFIDENCE</div>
                        </div>
                    </div>

                    {/* Dial 4 */}
                    <div className="dial-wrapper dial-inner-right">
                        <div className="tach-glass"></div>
                        <div className="tach-outer-ring" style={{borderRightColor: '#ff6600'}}></div>
                        <div className="tach-core">
                            <div className="dial-title">Subreddits</div>
                            <div className="dial-value-large" style={{color: '#ff6600', marginBottom: '5px'}}>4</div>
                            <div className="dial-title-sub">Trip Qual: <span style={{color: '#fff'}}>HIGH</span></div>
                        </div>
                    </div>

                    {/* Dial 5 */}
                    <div className="dial-wrapper dial-far-right">
                        <div className="tach-glass"></div>
                        <div className="tach-outer-ring" style={{borderBottomColor: '#0a66c2'}}></div>
                        <div className="tach-core">
                            <div className="dial-title" style={{marginBottom: '10px'}}>LinkedIn</div>
                            <div className="dial-value-large" style={{color: '#0a66c2', marginBottom: '5px'}}>
                                {targets.filter(t => t.platform === 'linkedin').length}
                            </div>
                            <div className="dial-title-sub" style={{color: '#666'}}>HITS FOUND</div>
                        </div>
                    </div>
                </div>

                <div className="sub-telemetry-bar" style={{display: 'flex', background: '#060608', border: '1px solid #1a1a1f', borderRadius: '8px', padding: '10px 20px', fontFamily: 'var(--font-mono)', marginTop: '30px', alignItems: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'}}>
                    <div style={{color: '#ffbd2e', fontWeight: 'bold', marginRight: '30px', whiteSpace: 'nowrap', fontSize: '0.8rem'}}>
                        [ POACHING TARGETS SECURED: <span>{targets.length}</span> ]
                    </div>
                    <div style={{flex: 1, overflow: 'hidden', color: '#a1a1aa', fontSize: '0.8rem', whiteSpace: 'nowrap'}}>
                        <span style={{color: '#666', marginRight: '15px', fontWeight: 800}}>DEPLOYMENT TRACE //</span>
                        <span style={{color: '#ddd'}}>Awaiting manual approval execution...</span>
                    </div>
                </div>

                {/* Main UI Layout for Target Interaction */}
                <div className="bg-layout" style={{ display: 'flex', gap: '30px', marginTop: '30px', height: '400px' }}>
                    
                    {/* LEFT PANEL: The Targets List */}
                    <div className="bg-left" style={{ flex: 1.2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <section className="terminal-section" style={{ height: '100%' }}>
                            <div className="terminal-header">
                                <h2>INBOUND.TARGETS</h2>
                                <div className="mac-buttons" style={{position: 'relative', top: 0, left: 0}}>
                                    <div className="mac-btn close" style={{width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56', display: 'inline-block'}}></div>
                                </div>
                            </div>
                            <div className="sys-logs" style={{backgroundColor: '#0a0a0a', padding: '0', overflowY: 'auto', flex: 1}}>
                                {targets.length === 0 ? (
                                    <div style={{padding: '20px', color: '#555', fontFamily: 'var(--font-mono)', fontSize: '0.8rem'}}>
                                        [SYSTEM] Waiting for cron sweep at 07:00 AM...
                                    </div>
                                ) : (
                                    <div style={{display: 'flex', flexDirection: 'column'}}>
                                        {targets.map((t, idx) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => setActiveTargetIndex(idx)}
                                                style={{
                                                padding: '15px 20px', 
                                                borderBottom: '1px solid #1a1a1f', 
                                                cursor: 'pointer',
                                                backgroundColor: activeTargetIndex === idx ? (t.platform === "linkedin" ? 'rgba(10, 102, 194, 0.1)' : 'rgba(255, 102, 0, 0.1)') : 'transparent',
                                                borderLeft: activeTargetIndex === idx ? `3px solid ${t.platform === "linkedin" ? '#0a66c2' : '#ff6600'}` : '3px solid transparent'
                                            }}>
                                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888'}}>
                                                    <span style={{color: t.platform === "linkedin" ? '#0a66c2' : '#ff6600', fontWeight: 'bold'}}>
                                                        {t.platform === "linkedin" ? "[IN] LinkedIn" : `[RD] r/${t.subreddit}`}
                                                    </span>
                                                    <span>{t.date}</span>
                                                </div>
                                                <div style={{fontFamily: 'Inter, sans-serif', color: '#fff', fontSize: '0.9rem', lineHeight: 1.4, fontWeight: 500}}>
                                                    {t.title}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT PANEL: The AI Response Terminal */}
                    <div className="bg-right" style={{ flex: 1.8, height: '100%' }}>
                        <section className="terminal-section" style={{ height: '100%' }}>
                            <div className="terminal-header" style={{
                                background: 'linear-gradient(to right, #0b0b0e, #1a1a24)'
                            }}>
                                <h2 style={{color: activeTarget?.platform === "linkedin" ? '#0a66c2' : '#ffbd2e'}}>AI_RESPONSE.MARKDOWN</h2>
                                {activeTarget && (
                                    <button 
                                        onClick={handleCopy}
                                        style={{
                                            background: activeTarget.platform === "linkedin" ? '#0a66c2' : '#ff6600', color: '#fff', border: 'none', padding: '4px 12px', 
                                            borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                                            textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>
                                        Copy to Clipboard
                                    </button>
                                )}
                            </div>
                            <div className="sys-logs" style={{backgroundColor: '#0a0a0a', padding: '20px', fontFamily: '"Fira Code", monospace', fontSize: '0.85rem', overflowY: 'auto', flex: 1}}>
                                {!activeTarget ? (
                                    <div style={{color: '#444'}}>[SYSTEM] No target selected.</div>
                                ) : (
                                    <div style={{color: '#a1a1aa', lineHeight: 1.6}}>
                                        <div style={{marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px dashed #333'}}>
                                            <div style={{color: '#555', marginBottom: '5px'}}>[ORIGINAL_URL_REF]</div>
                                            <a href={activeTarget.url} target="_blank" rel="noreferrer" style={{color: '#0ea5e9', textDecoration: 'none'}}>{activeTarget.url}</a>
                                        </div>
                                        <div style={{color: '#ffbd2e', marginBottom: '10px'}}>[GENERATED_PAYLOAD]</div>
                                        <div style={{whiteSpace: 'pre-wrap', color: '#fff'}}>{activeTarget.ai_response}</div>
                                    </div>
                                )}
                                <div ref={traceEndRef} />
                            </div>
                        </section>
                    </div>

                </div>

            </main>
            
        </div>
    );
}
