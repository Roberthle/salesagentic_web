"use client";

import { useEffect, useState, useRef } from 'react';
import styles from './page.module.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, Send, Database, TrendingUp, Clock, Terminal } from 'lucide-react';
import { io } from 'socket.io-client';

interface TraceLog {
    engine: string;
    message: string;
    timestamp: string;
}

interface Stats {
    totalSignals: number;
    totalEnriched: number;
    totalDrafts: number;
    totalDispatched: number;
    signalDistribution?: { name: string, value: number, color: string }[];
}

interface Signal {
    id?: number;
    signal_id?: number;
    company_name: string;
    lead_type?: string;
    signal_type?: string;
    status: string;
    // adding a mock decay variable
    decay_timer_mins?: number;
}

export default function CommandCenter() {
    const [stats, setStats] = useState<Stats>({ totalSignals: 0, totalEnriched: 0, totalDrafts: 0, totalDispatched: 0 });
    const [feed, setFeed] = useState<Signal[]>([]);
    const [loadingAgent, setLoadingAgent] = useState<string | null>(null);
    const [traces, setTraces] = useState<TraceLog[]>([]);
    const traceEndRef = useRef<HTMLDivElement>(null);

    const fetchData = async () => {
        try {
            const [statsRes, feedRes] = await Promise.all([
                fetch('/api/stats'),
                fetch('/api/feed')
            ]);
            
            if (statsRes.ok) setStats(await statsRes.json());
            if (feedRes.ok) {
                const data = await feedRes.json();
                setFeed(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); 
        
        // Initialize WebSocket for real-time Execution Trace
        const socket = io('http://localhost:5001');
        socket.on('new_log_trace', (data: { engine: string, message: string }) => {
            setTraces(prev => {
                const ms = String(new Date().getMilliseconds()).padStart(3, '0');
                const timestamp = `${new Date().toLocaleTimeString([], { hour12: false })}.${ms}`;
                const newTraces = [...prev, { ...data, timestamp }];
                return newTraces.length > 100 ? newTraces.slice(newTraces.length - 100) : newTraces;
            });
        });

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    // Auto-scroll the terminal
    useEffect(() => {
        if (traceEndRef.current) {
            traceEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [traces]);

    const triggerAgent = async (agentName: string) => {
        setLoadingAgent(agentName);
        try {
            await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent: agentName })
            });
            setTimeout(() => {
                setLoadingAgent(null);
                fetchData();
            }, 3000);
        } catch (error) {
            console.error("Failed to trigger agent", error);
            setLoadingAgent(null);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'ENRICHED') return <span className={`${styles.badge} ${styles.badgeEnriched}`}>ENRICHED</span>;
        if (status === 'OUTREACH_GENERATED') return <span className={`${styles.badge} ${styles.badgeDrafted}`}>DRAFTED</span>;
        return <span className={`${styles.badge} ${styles.badgeNew}`}>{status || 'NEW'}</span>;
    }

    const ACV = 15000;
    const pipelineValue = stats.totalSignals * ACV; 
    
    // Dynamic signals distribution from SQLite
    const signalData = stats.signalDistribution || [];

    return (
        <main className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.headerTitle}>SalesAgentic</h1>
                    <div className={styles.headerSubtitle}>Revenue Operations Hub</div>
                </div>
                <div style={{textAlign: 'right'}}>
                    <div className={styles.statusIndicator}>SYSTEM SECURE & ONLINE</div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px'}}>
                        Avg SLA / Decay: <strong>14m 22s</strong>
                    </div>
                </div>
            </header>

            {/* Pipeline Overview Card */}
            <div className={`glass-panel`} style={{padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600}}>
                        <TrendingUp size={16} color="var(--success-color)"/> Estimated Pipeline Value Initiated
                    </div>
                    <div style={{fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-2px', color: 'var(--text-primary)'}}>
                        ${pipelineValue.toLocaleString()}
                    </div>
                </div>
                <div style={{textAlign: 'right'}}>
                    <div style={{color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', fontWeight: 600}}>Assumed ACV</div>
                    <div style={{fontSize: '1.5rem', fontWeight: 500, color: 'var(--text-primary)'}}>${ACV.toLocaleString()}</div>
                </div>
            </div>

            <section className={styles.agentGrid}>
                {/* Listener */}
                <div className={`${styles.agentCard} glass-panel`}>
                    <div className={styles.agentHeader}>
                        <h2 className={styles.agentTitle}>Listener</h2>
                        <Database size={16} className={styles.agentIcon} />
                    </div>
                    <div style={{marginBottom: '1rem'}}>
                        <div className={styles.metricValue}>{stats.totalSignals}</div>
                        <div className={styles.metricLabel}>Intent Handshakes</div>
                    </div>
                    <button className="cyber-btn" onClick={() => triggerAgent('listener')} disabled={loadingAgent !== null}>
                        {loadingAgent === 'listener' ? 'Executing...' : 'Run Sweep'}
                    </button>
                </div>

                {/* Researcher */}
                <div className={`${styles.agentCard} glass-panel`}>
                    <div className={styles.agentHeader}>
                        <h2 className={styles.agentTitle}>Researcher</h2>
                        <Users size={16} className={styles.agentIcon} />
                    </div>
                    <div style={{marginBottom: '1rem'}}>
                        <div className={styles.metricValue}>{stats.totalEnriched}</div>
                        <div className={styles.metricLabel}>Personas Validated</div>
                    </div>
                    <button className="cyber-btn" onClick={() => triggerAgent('researcher')} disabled={loadingAgent !== null}>
                        {loadingAgent === 'researcher' ? 'Executing...' : 'Deep Enrich'}
                    </button>
                </div>

                {/* Creator */}
                <div className={`${styles.agentCard} glass-panel`}>
                    <div className={styles.agentHeader}>
                        <h2 className={styles.agentTitle}>Creator</h2>
                        <Activity size={16} className={styles.agentIcon} />
                    </div>
                    <div style={{marginBottom: '1rem'}}>
                        <div className={styles.metricValue}>{stats.totalDrafts}</div>
                        <div className={styles.metricLabel}>Assets Engineered</div>
                    </div>
                    <button className="cyber-btn" onClick={() => triggerAgent('creator')} disabled={loadingAgent !== null}>
                        {loadingAgent === 'creator' ? 'Executing...' : 'Generate Copy'}
                    </button>
                </div>

                {/* Dispatcher */}
                <div className={`${styles.agentCard} glass-panel`}>
                    <div className={styles.agentHeader}>
                        <h2 className={styles.agentTitle}>Dispatcher</h2>
                        <Send size={16} className={styles.agentIcon} />
                    </div>
                    <div style={{marginBottom: '1rem'}}>
                        <div className={styles.metricValue}>{stats.totalDispatched}</div>
                        <div className={styles.metricLabel}>Payloads Deployed</div>
                    </div>
                    <button className="cyber-btn" onClick={() => triggerAgent('dispatcher')} disabled={loadingAgent !== null}>
                        {loadingAgent === 'dispatcher' ? 'Executing...' : 'Dispatch'}
                    </button>
                </div>
            </section>

            <section className={styles.dashboardMain}>
                <div className={`${styles.dataFeed} glass-panel`}>
                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)'}}>
                        Live Intent Pipeline
                    </h3>
                    <table className={styles.feedTable}>
                        <thead>
                            <tr>
                                <th>Target Enterprise</th>
                                <th>Trigger Event</th>
                                <th>Decay Timer</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                             {feed.map((signal) => (
                                <tr key={signal.id ?? signal.signal_id ?? Math.random()}>
                                    <td style={{fontWeight: 500}}>{signal.company_name}</td>
                                    <td style={{color: 'var(--text-secondary)'}}>{signal.lead_type ?? signal.signal_type}</td>
                                    <td>
                                        <span style={{
                                            fontSize: '0.85rem', 
                                            fontWeight: 500,
                                            color: signal.decay_timer_mins && signal.decay_timer_mins < 15 ? 'var(--signal-high)' : 'var(--text-secondary)'
                                        }}>
                                            <Clock size={12} style={{marginRight: 4, verticalAlign: 'middle', marginTop: -2}}/>
                                            -{signal.decay_timer_mins}m
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(signal.status)}</td>
                                </tr>
                            ))}
                            {feed.length === 0 && (
                                <tr>
                                    <td colSpan={4} style={{textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0', fontWeight: 500}}>
                                        Awaiting Signal Interception...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={`${styles.chartContainer} glass-panel`}>
                    <h3 style={{fontSize: '1.1rem', fontWeight: 600, paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-primary)'}}>
                        Universal Static Signals
                    </h3>
                    <div style={{height: 250, width: '100%', marginTop: '1.5rem', marginBottom: '1rem'}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={signalData} innerRadius={65} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                                    {signalData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.5)'}} 
                                    itemStyle={{color: '#fff', fontSize: '0.85rem', fontWeight: 500}} 
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                        {signalData.map((s, idx) => (
                             <div key={idx} style={{display: 'flex', alignItems: 'center', fontSize: '0.85rem'}}>
                                <div style={{width: 12, height: 12, borderRadius: '4px', backgroundColor: s.color, marginRight: 12}}></div>
                                <span style={{color: 'var(--text-secondary)', fontWeight: 500}}>{s.name}</span>
                                <span style={{marginLeft: 'auto', fontWeight: 600, color: 'var(--text-primary)'}}>{s.value}%</span>
                             </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* LIVE EXECUTION TRACE - WEB SOCKET TERMINAL */}
            <section style={{ marginTop: '2rem' }}>
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: '1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
                        <Terminal size={18} color="var(--signal-high)" style={{ marginRight: '10px' }} />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Watch Tomcat Run Live</h3>
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success-color)', marginRight: 6, boxShadow: '0 0 10px var(--success-color)' }}></div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', fontWeight: 600, letterSpacing: 1 }}>WEBSOCKET CONNECTED</span>
                        </div>
                    </div>
                    
                    <div style={{ 
                        backgroundColor: '#0a0a0a', 
                        height: '350px', 
                        overflowY: 'auto', 
                        padding: '1.5rem', 
                        fontFamily: '"Fira Code", monospace',
                        fontSize: '0.85rem'
                    }}>
                        {traces.length === 0 && (
                            <div style={{ color: '#444' }}>[SYSTEM] Awaiting live execution blocks...</div>
                        )}
                        {traces.map((trace, i) => (
                            <div key={i} style={{ marginBottom: '8px', lineHeight: 1.5 }}>
                                <span style={{ color: '#555' }}>[{trace.timestamp}]</span>{' '}
                                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{trace.engine.toUpperCase()}:</span>{' '}
                                <span style={{ 
                                    color: trace.message.includes('Error') ? '#ff4a4a' : 
                                           trace.message.includes('Success') || trace.message.includes('Emailed') ? 'var(--success-color)' : 
                                           '#00eeff',
                                    opacity: 0.9 
                                }}>
                                    {trace.message}
                                </span>
                            </div>
                        ))}
                        <div ref={traceEndRef} />
                    </div>
                </div>
            </section>
        </main>
    );
}
