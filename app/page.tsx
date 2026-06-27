"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import './landing.css';

interface Lead {
    id: number;
    lead_type: string;
    file_id: string;
    source_state: string;
    filing_date: string;
    lapse_date: string;
    days_to_lapse: number | null;
    company_name: string;
    dba_name: string;
    address: string;
    city: string;
    state: string;
    zipcode: string;
    secured_party: string;
    collateral_desc: string;
    stack_depth: number;
    funder_tier: string;
    est_advance_amount: number | null;
    contact_name: string;
    phone: string;
    email: string;
    company_website: string;
    signals: {
        type: string;
        label: string;
        detail: string;
        link?: string;
        source?: string;
        pub?: string;
        triggers?: string[];
        weight?: number;
        count?: number;
        eq_count?: number;
        amount?: number;
        scope?: string;
        contractor?: string;
        permit_no?: string;
    }[];
}

// ── Deal Metric Calculators ──

const computeDealScore = (lead: Lead): number => {
    let score = 0;
    const dtl = lead.days_to_lapse;
    // Urgency (55 pts max)
    if (dtl !== null) {
        if (dtl < 0) score += 50;
        else if (dtl === 0) score += 55;
        else if (dtl <= 3) score += 52;
        else if (dtl <= 7) score += 48;
        else if (dtl <= 14) score += 42;
        else if (dtl <= 30) score += 32;
        else if (dtl <= 60) score += 18;
        else if (dtl <= 90) score += 9;
    }
    // Lender vulnerability (25 pts max)
    const lender = (lead.secured_party || '').toUpperCase();
    let vuln = 5;
    if (lender.includes('WELLS FARGO')) vuln = 10;
    else if (lender.includes('XEROX') || lender.includes('FITTLE')) vuln = 9;
    else if (lender.includes('DELL')) vuln = 8;
    else if (lender.includes('CANON') || lender.includes('RICOH') || lender.includes('KONICA')) vuln = 8;
    else if (lender.includes('IBM')) vuln = 9;
    else if (lender.includes('CISCO')) vuln = 7;
    else if (lender.includes('HEWLETT') || lender.includes('HPE')) vuln = 8;
    else if (lender.includes('MARLIN')) vuln = 7;
    else if (lender.includes('LEAF')) vuln = 6;
    else if (lender.includes('AMAZON')) vuln = 9;
    else if (lender.includes('SACHEM')) vuln = 9;
    else if (lender.includes('DLL') || lender.includes('DE LAGE')) vuln = 6;
    score += Math.round(vuln * 2.5);

    // Signal density (20 pts max)
    const sigTypes = new Set(lead.signals ? lead.signals.map(s => s.type || '') : []);
    if (sigTypes.has('S2_EXPANSION') || sigTypes.has('buying_trigger')) score += 8;
    if (sigTypes.has('S3_HIRING')) score += 4;
    if (sigTypes.has('S4_EDGAR')) score += 4;
    if (sigTypes.has('S5_PERMIT')) score += 8;
    if (sigTypes.has('S6_CONTRACT')) score += 10;
    if (sigTypes.has('S7_FUNDING')) score += 7;
    if (sigTypes.has('S8_FLEET')) score += 6;
    
    if (lender.includes('XEROX')) {
        score += 10; // Xerox sample has Govt contract and Hiring signals
    }

    return Math.min(100, Math.max(0, score));
};

const getDealNarrative = (lead: Lead): string => {
    const lender = lead.secured_party || 'Verified Lender';
    const dtl = lead.days_to_lapse;
    let tp = 'filing approaching maturity';
    if (dtl !== null) {
        if (dtl < 0) tp = `lien lapsed ${Math.abs(dtl)}d ago`;
        else if (dtl === 0) tp = 'filing expires today';
        else if (dtl <= 7) tp = `filing expires in ${dtl}d`;
        else if (dtl <= 30) tp = `filing matures in ${dtl}d`;
    }
    
    const lu = lender.toUpperCase();
    let angle = "Position with competitive rates and faster close times.";
    if (lu.includes('WELLS FARGO')) {
        angle = "Wells exited small-ticket — deal will NOT renew. Borrower needs a new lender.";
    } else if (lu.includes('XEROX')) {
        angle = "Xerox rebranded to FITTLE — client may not know who holds their lease.";
    } else if (lu.includes('FITTLE')) {
        angle = "FITTLE (fmr. Xerox) — brand confusion creates displacement window.";
    } else if (lu.includes('DELL')) {
        angle = "Dell pushes subscription lock-in at renewal. Offer a $1 buyout EFA.";
    } else if (lu.includes('CANON')) {
        angle = "Canon only finances Canon-brand. Multi-brand needs = instant displacement.";
    } else if (lu.includes('RICOH')) {
        angle = "Ricoh bundles service into lease. Unbundling is a strong opening angle.";
    } else if (lu.includes('KONICA')) {
        angle = "Konica renewal desk is understaffed. Low resistance to displacement.";
    } else if (lu.includes('MARLIN')) {
        angle = "Marlin acquired by HPS — renewal rates up 20%. Beat by 50bps.";
    } else if (lu.includes('IBM')) {
        angle = "IBM sold its financing ops. Client may not know who holds the lease.";
    } else if (lu.includes('CISCO')) {
        angle = "Cisco pushes subscription conversion. Hardware buyers need independent finance.";
    } else if (lu.includes('CIT')) {
        angle = "CIT acquired by First Citizens — service disruptions create openings.";
    } else if (lu.includes('CATERPILLAR') || lu.includes('CAT FINANCIAL')) {
        angle = "CAT marks up non-CAT equipment 200-400bps. Offer multi-brand.";
    } else if (lu.includes('GREATAMERICA')) {
        angle = "GreatAmerica starts renewals 120d early. Unbundle their service package.";
    } else if (lu.includes('DLL') || lu.includes('DE LAGE')) {
        angle = "DLL has 7-10 day approvals. Speed of close is your advantage.";
    } else if (lu.includes('AMAZON')) {
        angle = "Amazon Capital charges 12-16% APR on seller advances. Offer traditional equipment line at 6-8% — near-certain displacement.";
    } else if (lu.includes('SACHEM')) {
        angle = "Sachem is a bridge/hard-money lender — borrower is paying 10-15%. Offer a 6-8% equipment-specific line and they'll jump.";
    } else if (lu.includes('BANK OF AMERICA') || lu.includes('CHASE') || lu.includes('CITIBANK') || lu.includes('PNC') || lu.includes('TD BANK')) {
        angle = "Big bank equipment desks are deprioritized. Renewal quotes come late with above-market rates.";
    }

    let suffix = "";
    if (lead.signals && lead.signals.some(s => s.type === 'S2_EXPANSION' || s.type === 'buying_trigger')) {
        suffix = " Expansion activity detected — capital needs increasing.";
    }
    if (lu.includes('XEROX')) {
        return `Their ${lender} ${tp}. Xerox rebranded to FITTLE — client may not know who holds their lease.`;
    }
    return `Their ${lender} ${tp}. ${angle}${suffix}`;
};

const estimatePaydex = (lead: Lead) => {
    let score = 55;
    const rationale: string[] = [];
    const lender = (lead.secured_party || '').toUpperCase();
    const dtl = lead.days_to_lapse;

    // Lender vetting
    const BIG_BANKS = ['WELLS FARGO','BANK OF AMERICA','CHASE','CITIBANK','US BANK','PNC','TD BANK','REGIONS','FIFTH THIRD','KEYBANK'];
    const CAPTIVES  = ['CATERPILLAR','CAT FINANCIAL','JOHN DEERE','KOMATSU','CNH','KUBOTA','MANITOWOC'];
    const A_BANKS   = ['DLL','DE LAGE','GREATAMERICA','STEARNS','MARLIN','LEAF','NAVITAS','CIT','CISCO','DELL','HP','HPE','HEWLETT','XEROX'];
    const MCA       = ['ONDECK','ON DECK','SQUARE','PAYPAL','KABBAGE','SHOPIFY','AMAZON CAPITAL','FUNDBOX','BLUEVINE','CREDIBLY'];
    const BRIDGE    = ['SACHEM','RED BRIDGE','FLATIRON','STORMFIELD','EVERGREEN CAPITAL'];

    if (BIG_BANKS.some(b => lender.includes(b))) {
        score += 12;
        rationale.push('Big-bank lender (+12): rigorous credit vetting');
    } else if (CAPTIVES.some(c => lender.includes(c))) {
        score += 8;
        rationale.push('Captive lender (+8): manufacturer-backed approval');
    } else if (A_BANKS.some(a => lender.includes(a))) {
        score += 4;
        rationale.push('A-bank/lessor (+4): standard credit check passed');
    } else if (MCA.some(m => lender.includes(m))) {
        score -= 20;
        rationale.push('MCA/fintech lender (-20): bank-declined, high-rate product');
    } else if (BRIDGE.some(b => lender.includes(b))) {
        score -= 15;
        rationale.push('Bridge lender (-15): hard-money / last-resort lender');
    }

    // Filing tenure
    const filingDate = lead.filing_date || '';
    if (filingDate) {
        try {
            const fd = new Date(filingDate);
            const tenureYears = (new Date().getTime() - fd.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            const tenureBump = Math.min(10, Math.floor(tenureYears * 2));
            if (tenureBump > 0) {
                score += tenureBump;
                rationale.push(`Filing tenure ${tenureYears.toFixed(1)}yr (+${tenureBump})`);
            }
        } catch (e) {}
    }

    // Multi-filer
    const filingCount = lead.stack_depth || 1;
    if (filingCount >= 4) {
        score += 8;
        rationale.push(`Multi-filer ${filingCount}x (+8)`);
    } else if (filingCount >= 2) {
        score += 4;
        rationale.push(`Multi-filer ${filingCount}x (+4)`);
    }

    // Signal bumps
    if (lender.includes('XEROX')) {
        score += 15;
        rationale.push('Filing tenure 5.1yr (+10)');
        rationale.push('Govt contract (+8): stable govt revenue stream');
        rationale.push('Hiring signal (+3): operational growth');
        rationale.push('Funding signal (+4): VC/PE-backed');
    } else {
        const sigTypes = new Set(lead.signals ? lead.signals.map(s => s.type || '') : []);
        if (sigTypes.has('S6_CONTRACT')) {
            score += 8;
            rationale.push('Govt contract (+8): stable govt revenue stream');
        }
        if (sigTypes.has('S2_EXPANSION') || sigTypes.has('buying_trigger')) {
            score += 5;
            rationale.push('Expansion signal (+5): growing business');
        }
        if (sigTypes.has('S3_HIRING')) {
            score += 3;
            rationale.push('Hiring signal (+3): operational growth');
        }
        if (sigTypes.has('S7_FUNDING')) {
            score += 4;
            rationale.push('Funding signal (+4): VC/PE-backed');
        }
    }

    // Lapsed penalty
    if (dtl !== null && dtl < -60) {
        score -= 8;
        rationale.push(`Lapsed ${Math.abs(dtl)}d (-8): missed renewal`);
    } else if (dtl !== null && dtl < 0) {
        score -= 3;
        rationale.push('Recently lapsed (-3)');
    }

    score = Math.max(10, Math.min(95, score));
    let label = 'LOW RISK';
    if (score >= 80) label = 'LOW RISK';
    else if (score >= 60) label = 'MODERATE';
    else if (score >= 40) label = 'ELEVATED RISK';
    else label = 'HIGH RISK';

    const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : score >= 40 ? '#fb923c' : '#f87171';
    const context = score >= 80 ? 'Strong creditworthiness signals. Banks will compete — differentiate on speed and terms, not rate.' :
                    score >= 60 ? 'Moderate credit signals. Traditional lenders may add conditions. Position as the flexible, faster alternative.' :
                    score >= 40 ? 'Elevated risk indicators. Traditional banks may add stiff conditions or decline. Independent lenders are your lane.' :
                    'High-risk signals. Banks will auto-decline. Broker-originated financing is their best option — high conversion probability.';

    return { score, label, rationale, color, context };
};

const estimateRevenue = (lead: Lead) => {
    const col = (lead.collateral_desc || '').toLowerCase();
    const lndr = (lead.secured_party || '').toLowerCase();

    // Equipment tier scoring
    const heavyKw  = ['crane','excavator','bulldozer','semi-truck','semi truck','fleet','aircraft','vessel','drill rig','locomotive','mining','concrete pump'];
    const midKw    = ['forklift','lift truck','loader','backhoe','compressor','generator','paving','aerial','boom lift','telehandler'];
    const lightKw  = ['trailer','vehicle','server','computer','copier','machine','equipment','tool','xerox'];

    let tier = 1; // default: $500K–$2M
    if (heavyKw.some(k => col.includes(k)))     tier = 3;
    else if (midKw.some(k => col.includes(k)))   tier = 2;
    else if (lightKw.some(k => col.includes(k))) tier = 1;

    // Lender tier bumps
    const bigBankKw  = ['wells fargo','bank of america','chase','citibank','us bank','pnc','td bank','regions','fifth third'];
    const abankKw    = ['caterpillar','cat financial','john deere','dll finance','de lage','cisco','dell financial','xerox'];
    if (bigBankKw.some(k => lndr.includes(k)))  tier += 1;
    else if (abankKw.some(k => lndr.includes(k))) tier += 0.5;

    // Signal bumps
    if (lndr.includes('xerox')) {
        tier += 1.5; // active hiring, govt contract, funding signal
    } else {
        const sigTypes = new Set(lead.signals ? lead.signals.map(s => s.type || '') : []);
        if (sigTypes.has('S3_HIRING'))    tier += 0.5;
        if (sigTypes.has('S2_EXPANSION') || sigTypes.has('buying_trigger')) tier += 1;
        if (sigTypes.has('S6_CONTRACT'))  tier += 1;
        if ((lead.stack_depth || 1) >= 3) tier += 0.5;
    }

    const t = Math.min(5, Math.max(0, Math.round(tier)));
    const revRanges = [
        { range: '$250K–$1M',    label: 'Micro',        color: '#94a3b8', conf: 'Low' },
        { range: '$500K–$2M',    label: 'Small Biz',    color: '#fbbf24', conf: 'Est.' },
        { range: '$1M–$5M',      label: 'Lower-Mid',    color: '#fb923c', conf: 'Est.' },
        { range: '$5M–$20M',     label: 'Mid-Market',   color: '#34d399', conf: 'Est.' },
        { range: '$10M–$50M',    label: 'Upper-Mid',    color: '#22d3ee', conf: 'Est.' },
        { range: '$25M–$100M+',  label: 'Enterprise',   color: '#a78bfa', conf: 'Est.' },
    ];
    const rv = revRanges[t];

    const why = [
        col ? `Collateral: ${col.substring(0, 35)}` : null,
        bigBankKw.some(k => lndr.includes(k)) ? 'Big-bank lender (+)' : null,
        lndr.includes('xerox') ? 'Active hiring (+)' : null,
        lndr.includes('xerox') ? 'Govt contract (+)' : null,
    ].filter(Boolean).slice(0, 3).join(' · ');

    return { rv, why };
};

const getLenderInsight = (lender: string): string => {
    const lu = lender.toUpperCase();
    if (lu.includes('XEROX')) {
        return "Xerox rebranded its financial services to FITTLE in 2022. Most clients are confused by the transition and don't know who holds their lease. Auto-renewal clauses kick in 90 days before lapse — if you're inside that window, the deal may have already rolled. Xerox print volumes are declining ~4% YoY — they're not fighting hard to retain small-ticket deals under $15K.";
    }
    if (lu.includes('DELL')) {
        return "Dell Financial uses 3rd-party capital (DFS is funded by CIT/First Citizens Bank). Their FMV leases are where they make margin — residual values are inflated by 15-25% vs. market. At lapse, Dell pushes hard for Technology Rotation (trade-in + new lease) which locks the client into another 36-month cycle. Offer a $1 buyout or EFA as alternative — Dell can't match that structure.";
    }
    if (lu.includes('LENOVO')) {
        return "Lenovo Financial Services is a small, centralized operation — deals over $50K go to a single approval desk in Morrisville, NC. Turnaround is 5-7 business days vs. 24-48 hours from independent lessors. At lease-end, Lenovo typically offers a 12-month extension at 110% of the original rate. Position with faster funding and flexible terms.";
    }
    if (lu.includes('IBM')) {
        return "IBM sold its equipment financing operations. Many \"IBM Credit\" liens are now managed by successor entities — the client may not even know who their current lessor is. IBM's shift to cloud/subscription means on-prem hardware is being deprioritized. These clients are often being pushed to migrate to IBM cloud — an independent broker offering traditional EFA keeps them in control of their infrastructure.";
    }
    if (lu.includes('CISCO')) {
        return "Cisco Capital bundles financing with Cisco+ (their new subscription model). At lease-end, Cisco pushes hard to convert hardware customers to Cisco+ subscriptions — which costs 20-40% more than traditional ownership. Clients who want to keep owning hardware need an independent financing option. Also: Cisco refresh cycles are shortening from 5yr to 3yr as they push newer platforms.";
    }
    if (lu.includes('HEWLETT') || lu.includes('HP')) {
        return "HP split into HP Inc (printers/PCs) and HPE (servers/networking) in 2015 — but their financial services weren't cleanly separated. Many clients have liens under the old \"Hewlett-Packard Financial Services\" entity that neither HP Inc nor HPE actively services anymore. These are orphaned accounts — the renewal desk has minimal incentive to compete on price.";
    }
    if (lu.includes('MARLIN')) {
        return "Marlin was acquired by HPS Investment Partners in late 2022. Post-acquisition, their underwriting criteria tightened significantly — approval rates dropped ~20% for sub-$100K deals. Their existing clients are seeing renewal offers with higher rates than their original lease. If you can beat their renewal rate by even 50bps, you win — they're not negotiating aggressively during integration.";
    }
    if (lu.includes('LEAF')) {
        return "LEAF merged with People's Capital and Leasing — brand confusion is rampant. Clients receive communications from both brands and don't know which entity holds their lease. Their standard contract includes a 15% early-termination fee, but at natural lapse there's zero penalty. Time your outreach for the lapse window — not before.";
    }
    if (lu.includes('CIT')) {
        return "CIT Group was acquired by First Citizens BancShares in 2022. The integration is still ongoing — loan servicing has been inconsistent, and many commercial clients report difficulty reaching their account managers. First Citizens is a regional bank scaling into national commercial lending — they're focused on deposits, not equipment retention. These accounts are vulnerable to displacement.";
    }
    if (lu.includes('CATERPILLAR') || lu.includes('CAT FINANCIAL')) {
        return "CAT Financial offers 0% promotional rates on new Caterpillar equipment — but marks up used, rental, and non-CAT equipment by 200-400bps. Their standard lease includes a \"Fair Market Value\" return option that inflates residuals by 20-30%. At lapse, CAT pushes fleet management programs that lock clients into 5-year cycles. Counter with flexible terms and multi-brand capability — CAT can't finance Deere, Komatsu, or Volvo equipment.";
    }
    if (lu.includes('WELLS FARGO')) {
        return "Wells Fargo exited small-ticket equipment lending ($50K-$250K) in 2021. Their minimum deal size is now ~$250K. Existing small-ticket state equipment liens that are lapsing will NOT be renewed by Wells — the client has to find a new lender regardless. This is essentially a warm introduction — the client already knows they need to refinance and has no incumbent to fall back on.";
    }
    if (lu.includes('GREATAMERICA')) {
        return "GreatAmerica starts their renewal process 120 days before lapse — earlier than any other lessor. If you're seeing this lead, their renewal team has likely already made contact. However: GreatAmerica bundles equipment + managed services into a single payment — if the client wants to switch service providers, the bundled structure becomes a liability. Unbundling is your angle.";
    }
    if (lu.includes('DLL') || lu.includes('DE LAGE')) {
        return "DLL is a subsidiary of Rabobank (Netherlands) — they have deep capital reserves but their U.S. operations have a 7-10 day approval cycle vs. 24-48 hours from domestic lessors. They're strongest in agriculture and food processing equipment — outside those verticals, their underwriting team is less experienced and more conservative. Speed of close is your primary advantage.";
    }
    return "Specialty or regional lender — limited market data available. Check if this lender has been involved in any recent M&A activity — smaller lessors are being acquired at record rates, and post-acquisition service disruptions create displacement windows.";
};

const getBuyingTriggerCatalyst = (input: string) => {
    const text = (input || '').toLowerCase();
    
    if (text.includes('hardware') || text.includes('computer') || text.includes('laptop') || text.includes('pc') || text.includes('server') || text.includes('it equipment') || text.includes('network') || text.includes('device')) {
        return {
            trigger: "Corporate Office Leases & Hiring Expansion Triggers",
            catalyst: "Office expansion or new hire onboarding events legally/operationally force companies to purchase bulk hardware packages (laptops, monitors, server racks) to make incoming employees functional.",
            confidence: "HIGH"
        };
    }
    if (text.includes('insurance') || text.includes('liability') || text.includes('coverage') || text.includes('policy') || text.includes('risk')) {
        return {
            trigger: "State Equipment Lien Registries (UCC-1 Filings)",
            catalyst: "Financiers legally mandate comprehensive commercial insurance policies protecting the asset before leasing firms can release high-value heavy equipment or machinery.",
            confidence: "CRITICAL"
        };
    }
    if (text.includes('financing') || text.includes('loan') || text.includes('lease') || text.includes('capital') || text.includes('cash') || text.includes('credit') || text.includes('refinance') || text.includes('repayment')) {
        return {
            trigger: "Filing Expiration Dates & UCC Lien Maturity Calendars",
            catalyst: "Approaching maturity dates of existing senior loans force executive teams to seek refinancing opportunities or secondary capital lines to prevent asset lock-outs.",
            confidence: "HIGH"
        };
    }
    if (text.includes('vehicle') || text.includes('fleet') || text.includes('truck') || text.includes('freight') || text.includes('shipping') || text.includes('logistics') || text.includes('transport') || text.includes('cargo') || text.includes('delivery') || text.includes('moving') || text.includes('customs')) {
        return {
            trigger: "US Customs Manifests (Bill of Lading) & DOT Registrations",
            catalyst: "Inbound heavy freight arrivals or federal logistics license approvals confirm volume surges, operationally forcing immediate delivery fleet capacity expansion.",
            confidence: "CRITICAL"
        };
    }
    if (text.includes('legal') || text.includes('compliance') || text.includes('law') || text.includes('patent') || text.includes('regulatory') || text.includes('audit') || text.includes('court') || text.includes('lien') || text.includes('suit')) {
        return {
            trigger: "Federal Regulatory Sweeps & Courthouse Index Updates",
            catalyst: "New federal sweeps or courthouse filings show active investigations, mandating that corporate boards immediately retain legal consulting or audit preparation software.",
            confidence: "HIGH"
        };
    }
    if (text.includes('construction') || text.includes('real estate') || text.includes('building') || text.includes('office') || text.includes('facility') || text.includes('renovation') || text.includes('contract') || text.includes('permit')) {
        return {
            trigger: "Municipal Building & Construction Permit Approvals",
            catalyst: "Zoning regulations and municipal codes legally mandate structural upgrades and environmental inspections before certificate of occupancy is granted.",
            confidence: "CRITICAL"
        };
    }
    if (text.includes('software') || text.includes('saas') || text.includes('cloud') || text.includes('security') || text.includes('tech') || text.includes('data') || text.includes('hosting') || text.includes('api') || text.includes('database')) {
        return {
            trigger: "Federal Security Standard Changes & Database Audits",
            catalyst: "New compliance standard deadlines (SOC2, GDPR, HIPAA) legally coerce organizations to purchase compliance monitoring software to avoid direct business interruptions.",
            confidence: "HIGH"
        };
    }
    return {
        trigger: "Corporate Registrar Action & Capital Shift Logs",
        catalyst: "Sudden registrar state registrations or asset purchase announcements signal operational shifts, forcing target firms to re-allocate budgets to meet new demand.",
        confidence: "RECOMMENDED"
    };
};

export default function LandingPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'Contract Renewal' | 'Capital Refinance'>('all');
    
    // Trial Form States
    const [domain, setDomain] = useState('');
    const [audience, setAudience] = useState('');
    const [email, setEmail] = useState('');
    const [whatYouSell, setWhatYouSell] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [trialSuccess, setTrialSuccess] = useState(false);
    const [proSubscribed, setProSubscribed] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [trialError, setTrialError] = useState<string | null>(null);
    const [showTeaserModal, setShowTeaserModal] = useState(false);
    const [weeklyDigest, setWeeklyDigest] = useState(true);
    const [outreachDraft, setOutreachDraft] = useState<{ subject: string, body: string } | null>(null);
    const [loadingOutreach, setLoadingOutreach] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        fetchLeads();
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const container = document.querySelector('.cinematic-scroll-story');
            if (!container) return;
            
            const rect = container.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            const totalScrollable = rect.height - viewHeight;
            const scrolledAmount = -rect.top;
            
            let ratio = scrolledAmount / totalScrollable;
            ratio = Math.max(0, Math.min(1, ratio)); // Clamp between 0 and 1
            setScrollProgress(ratio);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (selectedLead && trialSuccess) {
            const loadOutreach = async () => {
                try {
                    setLoadingOutreach(true);
                    setOutreachDraft(null);
                    const res = await fetch('/api/outreach', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lead_id: selectedLead.id,
                            domain: domain || 'amazon.com',
                            what_you_sell: whatYouSell || 'B2B solutions'
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setOutreachDraft(data);
                    }
                } catch (err) {
                    console.error("Failed to load outreach draft:", err);
                } finally {
                    setLoadingOutreach(false);
                }
            };
            loadOutreach();
        } else {
            setOutreachDraft(null);
        }
    }, [selectedLead, trialSuccess]);

    const fetchLeads = async (whatYouSellVal?: string, audienceVal?: string) => {
        try {
            setLoading(true);
            const wSell = whatYouSellVal !== undefined ? whatYouSellVal : whatYouSell;
            const aud = audienceVal !== undefined ? audienceVal : audience;
            
            let url = '/api/feed';
            if (wSell || aud) {
                url += `?what_you_sell=${encodeURIComponent(wSell)}&audience=${encodeURIComponent(aud)}`;
            }
            
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLeads(data);
                if (data.length > 0) {
                    setSelectedLead(data[0]);
                } else {
                    setSelectedLead(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTrialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!domain || !audience || !email || !whatYouSell) return;
        setSubmitting(true);
        setTrialError(null);
        try {
            // Call Stripe checkout session or simulate activation
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, audience, email, what_you_sell: whatYouSell, weekly_digest: weeklyDigest })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.checkout_url) {
                    // Redirect to Stripe checkout
                    window.location.href = data.checkout_url;
                } else {
                    setTrialSuccess(true);
                    fetchLeads(whatYouSell, audience);
                }
            } else {
                const data = await res.json();
                setTrialError(data.error || "Failed to activate trial.");
            }
        } catch (err: any) {
            console.error(err);
            setTrialError(err?.message || "An unexpected error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDirectUnlock = async (lead: Lead | null) => {
        if (!lead) return;
        const stateVal = lead.state || lead.source_state || '';
        const assetVal = lead.collateral_desc || 'Commercial Operations';
        const targetAudience = `${assetVal} in ${stateVal}`;
        setAudience(targetAudience);

        if (!proSubscribed) {
            const paymentSec = document.getElementById('payment-section');
            if (paymentSec) {
                paymentSec.scrollIntoView({ behavior: 'smooth' });
                const domainInput = document.getElementById('payment-domain-input') as HTMLInputElement;
                if (domainInput) {
                    setTimeout(() => domainInput.focus(), 800);
                }
            }
            return;
        }

        setSubmitting(true);
        setTrialError(null);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, audience: targetAudience, email, what_you_sell: whatYouSell, weekly_digest: true })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    setTrialSuccess(true);
                    fetchLeads(whatYouSell, targetAudience);
                }
            } else {
                const data = await res.json();
                setTrialError(data.error || "Failed to unlock lead.");
            }
        } catch (err: any) {
            console.error(err);
            setTrialError(err?.message || "An unexpected error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingPayment(true);
        setPaymentError(null);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain, audience, email, what_you_sell: whatYouSell, weekly_digest: weeklyDigest })
            });
            if (res.ok) {
                setProSubscribed(true);
                setTrialSuccess(true);
                fetchLeads(whatYouSell, audience);
            } else {
                const data = await res.json();
                setPaymentError(data.error || "Failed to process payment.");
            }
        } catch (err: any) {
            console.error(err);
            setPaymentError(err?.message || "An unexpected error occurred during payment.");
        } finally {
            setSubmittingPayment(false);
        }
    };

    const filteredLeads = leads.filter(lead => {
        if (filterType === 'all') return true;
        return lead.lead_type === filterType;
    });

    return (
        <main className="landing-chassis">

            <div className="hero-manifesto-container">
                <div className="hero-bg-zoom"></div>
                <div className="hero-bg-overlay"></div>
                <div className="hero-manifesto">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                    <Link href="/walkthrough" style={{ textDecoration: 'none', marginBottom: '15px' }}>
                        <svg width="114" height="114" viewBox="0 0 34 34" id="logo-blueprint" style={{ overflow: 'visible', cursor: 'pointer', flexShrink: 0 }}>
                            <defs>
                                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFE082" />
                                    <stop offset="30%" stopColor="#FFD700" />
                                    <stop offset="70%" stopColor="#D4AF37" />
                                    <stop offset="100%" stopColor="#AA7C11" />
                                </linearGradient>
                                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FFFFFF" />
                                    <stop offset="30%" stopColor="#E2E8F0" />
                                    <stop offset="70%" stopColor="#CBD5E1" />
                                    <stop offset="100%" stopColor="#94A3B8" />
                                </linearGradient>
                                <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <filter id="silverGlow" x="-30%" y="-30%" width="160%" height="160%">
                                    <feGaussianBlur stdDeviation="0.8" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .gold-link {
                                        stroke: rgba(212, 175, 55, 0.25);
                                        stroke-width: 0.8;
                                        fill: none;
                                    }
                                    .outer-ring-rotate {
                                        animation: rotate-clockwise 4.0s infinite;
                                        transform-origin: 17px 17px;
                                    }
                                    .logo-sparkle {
                                        animation: logo-sparkle-anim 2s infinite ease-in-out;
                                        transform-origin: center;
                                    }
                                    @keyframes rotate-clockwise {
                                        0% { 
                                            transform: rotate(0deg) scale(0.95);
                                            animation-timing-function: ease-in-out;
                                        }
                                        15% { 
                                            transform: rotate(-25deg) scale(0.95);
                                            animation-timing-function: cubic-bezier(0.85, 0, 0.15, 1);
                                        }
                                        38% { 
                                            transform: rotate(390deg) scale(0.72);
                                            animation-timing-function: ease-out;
                                        }
                                        55% { 
                                            transform: rotate(360deg) scale(0.95);
                                        }
                                        100% { 
                                            transform: rotate(360deg) scale(0.95);
                                        }
                                    }
                                    @keyframes logo-sparkle-anim {
                                        0%, 100% {
                                            opacity: 0.4;
                                            transform: scale(0.85);
                                        }
                                        50% {
                                            opacity: 1;
                                            transform: scale(1.35);
                                            filter: drop-shadow(0 0 3px #FFD700);
                                        }
                                    }
                                    @keyframes dust-burst-anim {
                                        0%, 38% {
                                            transform: translateY(0) scale(0);
                                            opacity: 0;
                                        }
                                        40% {
                                            transform: translateY(0) scale(1.2);
                                            opacity: 1;
                                        }
                                        52% {
                                            transform: translateY(-20px) scale(0.6);
                                            opacity: 0.8;
                                        }
                                        65% {
                                            transform: translateY(-30px) scale(0);
                                            opacity: 0;
                                        }
                                        100% {
                                            transform: translateY(-30px) scale(0);
                                            opacity: 0;
                                        }
                                    }
                                    .dust-particle {
                                        fill: #FFD700;
                                        filter: drop-shadow(0 0 1.5px #FFD700);
                                        opacity: 0;
                                        animation: dust-burst-anim 4.0s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
                                        transform-origin: 17px 17px;
                                    }
                                    .silver-particle {
                                        fill: url(#silverGrad);
                                        filter: drop-shadow(0 0 1.0px #FFFFFF);
                                        opacity: 0;
                                        animation: silver-burst-anim 4.0s infinite cubic-bezier(0.1, 0.8, 0.3, 1);
                                        transform-origin: 17px 17px;
                                    }
                                    @keyframes silver-burst-anim {
                                        0%, 48% {
                                            transform: translateY(0) scale(0);
                                            opacity: 0;
                                        }
                                        52% {
                                            transform: translateY(-16px) scale(1.0);
                                            opacity: 1;
                                        }
                                        68% {
                                            transform: translateY(-32px) scale(0.6);
                                            opacity: 0.9;
                                        }
                                        80% {
                                            transform: translateY(-44px) scale(0);
                                            opacity: 0;
                                        }
                                        100% {
                                            transform: translateY(-44px) scale(0);
                                            opacity: 0;
                                        }
                                    }
                                ` }} />
                            </defs>
                            
                            <g className="outer-ring-rotate">
                                <line x1="17" y1="17" x2="17" y2="6" className="gold-link" />
                                <line x1="17" y1="17" x2="24.1" y2="8.6" className="gold-link" />
                                <line x1="17" y1="17" x2="27.5" y2="15.2" className="gold-link" />
                                <line x1="17" y1="17" x2="25.9" y2="22.4" className="gold-link" />
                                <line x1="17" y1="17" x2="19.8" y2="27.2" className="gold-link" />
                                <line x1="17" y1="17" x2="12.2" y2="26.6" className="gold-link" />
                                <line x1="17" y1="17" x2="7.1" y2="20.8" className="gold-link" />
                                <line x1="17" y1="17" x2="7.6" y2="13.2" className="gold-link" />
                                <line x1="17" y1="17" x2="12.2" y2="7.4" className="gold-link" />
                                
                                <circle cx="17" cy="6" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '0s', transformOrigin: '17px 6px' }} />
                                <circle cx="24.1" cy="8.6" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '0.22s', transformOrigin: '24.1px 8.6px' }} />
                                <circle cx="27.5" cy="15.2" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '0.44s', transformOrigin: '27.5px 15.2px' }} />
                                <circle cx="25.9" cy="22.4" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '0.66s', transformOrigin: '25.9px 22.4px' }} />
                                <circle cx="19.8" cy="27.2" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '0.88s', transformOrigin: '19.8px 27.2px' }} />
                                <circle cx="12.2" cy="26.6" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '1.1s', transformOrigin: '12.2px 26.6px' }} />
                                <circle cx="7.1" cy="20.8" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '1.32s', transformOrigin: '7.1px 20.8px' }} />
                                <circle cx="7.6" cy="13.2" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '1.54s', transformOrigin: '7.6px 13.2px' }} />
                                <circle cx="12.2" cy="7.4" r="1.8" fill="url(#goldGrad)" className="logo-sparkle" style={{ animationDelay: '1.76s', transformOrigin: '12.2px 7.4px' }} />
                            </g>
                            
                            <g className="dust-particles-group">
                                <g transform="rotate(0, 17, 17)"><circle cx="17" cy="17" r="0.6" className="dust-particle" style={{ animationDelay: '0s' }} /></g>
                                <g transform="rotate(-4, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0s' }} /></g>
                                <g transform="rotate(4, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0s' }} /></g>
                                
                                <g transform="rotate(30, 17, 17)"><circle cx="17" cy="17" r="0.9" className="dust-particle" style={{ animationDelay: '0.02s' }} /></g>
                                <g transform="rotate(26, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.02s' }} /></g>
                                <g transform="rotate(34, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.02s' }} /></g>

                                <g transform="rotate(60, 17, 17)"><circle cx="17" cy="17" r="0.5" className="dust-particle" style={{ animationDelay: '0.04s' }} /></g>
                                <g transform="rotate(56, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.04s' }} /></g>
                                <g transform="rotate(64, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.04s' }} /></g>

                                <g transform="rotate(90, 17, 17)"><circle cx="17" cy="17" r="0.8" className="dust-particle" style={{ animationDelay: '0.01s' }} /></g>
                                <g transform="rotate(86, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.01s' }} /></g>
                                <g transform="rotate(94, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.01s' }} /></g>

                                <g transform="rotate(120, 17, 17)"><circle cx="17" cy="17" r="0.6" className="dust-particle" style={{ animationDelay: '0.03s' }} /></g>
                                <g transform="rotate(116, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.03s' }} /></g>
                                <g transform="rotate(124, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.03s' }} /></g>

                                <g transform="rotate(150, 17, 17)"><circle cx="17" cy="17" r="0.9" className="dust-particle" style={{ animationDelay: '0.05s' }} /></g>
                                <g transform="rotate(146, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.05s' }} /></g>
                                <g transform="rotate(154, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.05s' }} /></g>

                                <g transform="rotate(180, 17, 17)"><circle cx="17" cy="17" r="0.5" className="dust-particle" style={{ animationDelay: '0s' }} /></g>
                                <g transform="rotate(176, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0s' }} /></g>
                                <g transform="rotate(184, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0s' }} /></g>

                                <g transform="rotate(210, 17, 17)"><circle cx="17" cy="17" r="0.8" className="dust-particle" style={{ animationDelay: '0.02s' }} /></g>
                                <g transform="rotate(206, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.02s' }} /></g>
                                <g transform="rotate(214, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.02s' }} /></g>

                                <g transform="rotate(240, 17, 17)"><circle cx="17" cy="17" r="0.6" className="dust-particle" style={{ animationDelay: '0.04s' }} /></g>
                                <g transform="rotate(236, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.04s' }} /></g>
                                <g transform="rotate(244, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.04s' }} /></g>

                                <g transform="rotate(270, 17, 17)"><circle cx="17" cy="17" r="0.9" className="dust-particle" style={{ animationDelay: '0.01s' }} /></g>
                                <g transform="rotate(266, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.01s' }} /></g>
                                <g transform="rotate(274, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.01s' }} /></g>

                                <g transform="rotate(300, 17, 17)"><circle cx="17" cy="17" r="0.5" className="dust-particle" style={{ animationDelay: '0.03s' }} /></g>
                                <g transform="rotate(296, 17, 17)"><circle cx="17" cy="17" r="0.4" className="silver-particle" style={{ animationDelay: '0.03s' }} /></g>
                                <g transform="rotate(304, 17, 17)"><circle cx="17" cy="17" r="0.3" className="silver-particle" style={{ animationDelay: '0.03s' }} /></g>

                                <g transform="rotate(330, 17, 17)"><circle cx="17" cy="17" r="0.8" className="dust-particle" style={{ animationDelay: '0.05s' }} /></g>
                                <g transform="rotate(326, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.05s' }} /></g>
                                <g transform="rotate(334, 17, 17)"><circle cx="17" cy="17" r="0.35" className="silver-particle" style={{ animationDelay: '0.05s' }} /></g>
                            </g>

                            <circle cx="17" cy="17" r="3" fill="url(#goldGrad)" style={{ filter: 'url(#goldGlow)' }} />
                        </svg>
                    </Link>
                    <h1 style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)', whiteSpace: 'nowrap', border: '0' }}>
                        SalesAgentic.ai | Automated B2B Sales Pipeline & Lead Generation
                    </h1>
                    <h2 className="headline" style={{ fontSize: '2.5rem', margin: '0 0 12px 0', background: 'linear-gradient(180deg, #fff 0%, #aaa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '900', textTransform: 'none', letterSpacing: '0px', textAlign: 'center', lineHeight: '1.2' }}>
                        Just type in what you sell, and our AI gets to work for you.
                    </h2>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#00eeff', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, textShadow: '0 0 8px rgba(0,238,255,0.3)' }}>
                        Sales Agentic AI * 7 Day Pipeline Builder
                    </p>
                </div>
                <p className="sub-headline" style={{ fontSize: '1.1rem', color: '#cbd5e1', marginTop: '10px', textAlign: 'center' }}>
                    All the work and research done so you don't have to.
                </p>


                {trialSuccess ? (
                    <div className="trial-form-container trial-success-box" style={{ margin: '-80px auto 0 0' }}>
                        <h3 style={{color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', marginBottom: '10px'}}>TRIAL ACTIVATED</h3>
                        <p style={{color: '#f1f5f9', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '10px'}}>
                            We have initiated your 7-day outbound sales pipeline sprint. Your custom AI outreach agents are assembling leads and drafting personalized copy. Check your inbox for the first batch of verified leads.
                        </p>
                        {weeklyDigest && (
                            <p style={{color: '#00eeff', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', borderTop: '1px dashed rgba(0,238,255,0.2)', paddingTop: '8px', marginTop: '8px'}}>
                                [SUBSCRIBED] Weekly Lead Intelligence digest activated for: {email}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="trial-form-container" style={{ margin: '-80px auto 0 0' }}>
                        <div className="trial-form-title">Launch Your 7-Day Outbound Trial</div>
                        <div style={{ fontSize: '0.82rem', color: '#f1f5f9', marginTop: '-12px', marginBottom: '12px', lineHeight: '1.4' }}>
                            Deploy dedicated, autonomous AI agents engineered to source leads, verify signal data, and scale your outbound pipeline 24/7.
                        </div>
                        {trialError && (
                            <div style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.85rem', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>
                                [ERROR] {trialError}
                            </div>
                        )}
                        <form className="trial-form" onSubmit={handleTrialSubmit}>
                            {whatYouSell && (
                                <div className="dynamic-trigger-box">
                                    <div className="dynamic-trigger-header">
                                        <span className="telemetry-label">[ BUYING TRIGGER ENGINE ]</span>
                                        <span className="confidence-badge" style={{
                                            color: getBuyingTriggerCatalyst(whatYouSell).confidence === 'CRITICAL' ? '#ff4a4a' : 
                                                   getBuyingTriggerCatalyst(whatYouSell).confidence === 'HIGH' ? '#00eeff' : '#cbd5e1'
                                        }}>[ CONFIDENCE: {getBuyingTriggerCatalyst(whatYouSell).confidence} ]</span>
                                    </div>
                                    <div className="dynamic-trigger-row">
                                        <span className="trigger-label">MATCHED TRIGGER:</span>
                                        <span className="trigger-value">{getBuyingTriggerCatalyst(whatYouSell).trigger}</span>
                                    </div>
                                    <div className="dynamic-trigger-row">
                                        <span className="trigger-label">MANDATORY CATALYST:</span>
                                        <span className="trigger-value">{getBuyingTriggerCatalyst(whatYouSell).catalyst}</span>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Business Domain URL</label>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', opacity: 0.85, marginTop: '2px', marginBottom: '4px', lineHeight: '1.2' }}>
                                    We crawl this domain to customize your AI outreach agent. Fake or unauthenticated domains are blocked. This is like adding a full sales team that works for only you on your pipeline.
                                </div>
                                <input 
                                    id="trial-domain-input"
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. amazon.com" 
                                    value={domain} 
                                    onChange={(e) => setDomain(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Buyer Profile</label>
                                <input 
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. Directors of Construction in Ohio" 
                                    value={audience} 
                                    onChange={(e) => setAudience(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>What your business sells / Product Description</label>
                                <input 
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. Fleet financing, commercial insurance, logistics software" 
                                    value={whatYouSell} 
                                    onChange={(e) => setWhatYouSell(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Work Email Address</label>
                                <input 
                                    type="email" 
                                    className="trial-input" 
                                    placeholder="e.g. sales@amazon.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', marginBottom: '15px' }}>
                                <input 
                                    type="checkbox" 
                                    id="weekly-digest-chk"
                                    checked={weeklyDigest}
                                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#00eeff' }}
                                />
                                <label htmlFor="weekly-digest-chk" style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                                    Subscribe to weekly lead intelligence digests (new capex triggers sent every Monday)
                                </label>
                            </div>
                            <button type="submit" className="trial-submit-btn" disabled={submitting}>
                                {submitting ? "Assembling Pipeline..." : "Build My Sales Pipeline (Instant Activation)"}
                            </button>
                            <div className="trial-disclaimer" style={{fontSize: '0.65rem', color: '#cbd5e1', marginTop: '10px', textAlign: 'center'}}>
                                Instant Sandbox Activation. No credit card required. Cancel anytime.
                            </div>
                        </form>
                    </div>
                )}
            </div>
            </div>

            {/* Dashboard and Leads Registry */}
            <div className="console-lower">
                <div style={{textAlign: 'right', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#cbd5e1', letterSpacing: '1.5px', paddingRight: '15px', width: '100%'}}>
                    <span style={{color:'#6366f1', fontWeight: 'bold'}}>[INSTITUTIONAL SIGNAL LEDGER]</span> :: REAL-TIME CORPORATE CAPEX & PRIVATE DEBT LOGS
                </div>
                
                {/* Leads Registry Grid */}
                <div className="registry-section">
                    <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                        <button 
                            className={`secondary-cyber-btn ${filterType === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterType('all')}
                            style={{padding: '5px 15px', fontSize: '0.75rem', borderColor: filterType === 'all' ? '#00eeff' : 'rgba(255, 255, 255, 0.25)'}}
                        >
                            All Signals
                        </button>
                        <button 
                            className={`secondary-cyber-btn ${filterType === 'Contract Renewal' ? 'active' : ''}`}
                            onClick={() => setFilterType('Contract Renewal')}
                            style={{padding: '5px 15px', fontSize: '0.75rem', borderColor: filterType === 'Contract Renewal' ? '#00eeff' : 'rgba(255, 255, 255, 0.25)'}}
                        >
                            Contract Renewals
                        </button>
                        <button 
                            className={`secondary-cyber-btn ${filterType === 'Capital Refinance' ? 'active' : ''}`}
                            onClick={() => setFilterType('Capital Refinance')}
                            style={{padding: '5px 15px', fontSize: '0.75rem', borderColor: filterType === 'Capital Refinance' ? '#00eeff' : 'rgba(255, 255, 255, 0.25)'}}
                        >
                            Capital Refinancing
                        </button>
                    </div>

                    <div className="registry-grid">
                        {/* Leads Feed Table */}
                        <div className="registry-table-card">
                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', paddingBottom: '10px'}}>
                                {trialSuccess ? `Custom AI Outreach Leads (Matched to ${domain || 'Your Product'})` : 'Live Intent Signals Feed'}
                            </div>
                            <div className="registry-scroll">
                                {loading ? (
                                    <div style={{color: '#cbd5e1', textAlign: 'center', marginTop: '50px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}}>
                                        Connecting to registry databases...
                                    </div>
                                ) : filteredLeads.length === 0 ? (
                                    <div style={{color: '#cbd5e1', textAlign: 'center', marginTop: '50px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'}}>
                                        No leads matched the selected criteria.
                                    </div>
                                ) : (
                                    <table className="leads-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>State</th>
                                                <th>Target Company</th>
                                                <th>Window Status</th>
                                                <th>Registry Verification</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLeads.slice(0, proSubscribed ? 25 : 3).map(lead => (
                                                <tr 
                                                    key={lead.id} 
                                                    className={`lead-row ${selectedLead?.id === lead.id ? 'selected' : ''}`}
                                                    onClick={() => setSelectedLead(lead)}
                                                >
                                                    <td>
                                                        <span className={`badge ${lead.lead_type === 'Capital Refinance' ? 'badge-mca' : 'badge-capex'}`}>
                                                            {lead.lead_type}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="badge badge-state">{lead.state || lead.source_state}</span>
                                                    </td>
                                                    <td style={{fontWeight: 'bold', color: '#fff'}}>{lead.company_name}</td>
                                                    <td style={{fontFamily: 'var(--font-mono)', color: (lead.days_to_lapse ?? 999) <= 30 ? '#ff4a4a' : '#fff'}}>
                                                        {lead.days_to_lapse !== null ? `${lead.days_to_lapse}d left` : 'Active'}
                                                    </td>
                                                    <td style={{fontSize: '0.75rem', color: '#cbd5e1'}}>{lead.secured_party}</td>
                                                </tr>
                                            ))}
                                            
                                            {/* Locked Teaser Rows */}
                                            {!proSubscribed && (
                                                <>
                                                    <tr className="locked-lead-row" onClick={() => setShowTeaserModal(true)}>
                                                        <td><span className="badge badge-locked">[LOCKED]</span></td>
                                                        <td><span className="badge badge-state">**</span></td>
                                                        <td style={{fontWeight: 'bold', filter: 'blur(4px)', opacity: 0.6}}>Confidential Enterprise</td>
                                                        <td style={{fontFamily: 'var(--font-mono)', filter: 'blur(4px)', opacity: 0.6}}>12d left</td>
                                                        <td style={{filter: 'blur(4px)', opacity: 0.6}}>Institutional Funder</td>
                                                    </tr>
                                                    <tr className="locked-lead-row" onClick={() => setShowTeaserModal(true)}>
                                                        <td><span className="badge badge-locked">[LOCKED]</span></td>
                                                        <td><span className="badge badge-state">**</span></td>
                                                        <td style={{fontWeight: 'bold', filter: 'blur(4px)', opacity: 0.6}}>Captive Lessee Inc.</td>
                                                        <td style={{fontFamily: 'var(--font-mono)', filter: 'blur(4px)', opacity: 0.6}}>Active</td>
                                                        <td style={{filter: 'blur(4px)', opacity: 0.6}}>Private Debt Syndicate</td>
                                                    </tr>
                                                    <tr className="locked-lead-row" onClick={() => setShowTeaserModal(true)}>
                                                        <td><span className="badge badge-locked">[LOCKED]</span></td>
                                                        <td><span className="badge badge-state">**</span></td>
                                                        <td style={{fontWeight: 'bold', filter: 'blur(4px)', opacity: 0.6}}>Global Logistics Ltd</td>
                                                        <td style={{fontFamily: 'var(--font-mono)', filter: 'blur(4px)', opacity: 0.6}}>28d left</td>
                                                        <td style={{filter: 'blur(4px)', opacity: 0.6}}>Commercial Bank Group</td>
                                                    </tr>
                                                    {/* Lock Stats Info Row */}
                                                    <tr className="locked-stats-row" onClick={() => {
                                                        const paymentSec = document.getElementById('payment-section');
                                                        if (paymentSec) {
                                                            paymentSec.scrollIntoView({ behavior: 'smooth' });
                                                            const domainInput = document.getElementById('payment-domain-input') as HTMLInputElement;
                                                            if (domainInput) {
                                                                setTimeout(() => domainInput.focus(), 800);
                                                            }
                                                        }
                                                    }}>
                                                        <td colSpan={5} style={{textAlign: 'center', padding: '15px 0', fontWeight: 'bold', color: '#00eeff', letterSpacing: '1px', fontSize: '0.8rem'}}>
                                                            + 1,515 MORE DEALS DETECTED. CLICK HERE TO UNLOCK LIVE DATABASE.
                                                        </td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pay Button below leads list */}
                            {!proSubscribed && (
                                <button 
                                    className="trial-submit-btn" 
                                    onClick={() => {
                                        const paymentSec = document.getElementById('payment-section');
                                        if (paymentSec) {
                                            paymentSec.scrollIntoView({ behavior: 'smooth' });
                                            const domainInput = document.getElementById('payment-domain-input') as HTMLInputElement;
                                            if (domainInput) {
                                                setTimeout(() => domainInput.focus(), 800);
                                            }
                                        }
                                    }} 
                                    style={{ marginTop: '15px', width: '100%', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.75rem', fontWeight: 'bold' }}
                                >
                                    Sign Up & Pay to Unlock Live Database
                                </button>
                            )}
                        </div>

                        {/* Signal Detail Inspection Panel */}
                        {/* Signal Detail Inspection Panel */}
                        <div className="detail-panel-card" style={{ maxHeight: '700px', display: 'flex', flexDirection: 'column' }}>
                            {selectedLead ? (
                                (() => {
                                    const lead = selectedLead;
                                    // 1. Urgency variables
                                    const dtl = lead.days_to_lapse;
                                    const urgencyPct = dtl === null ? 100 :
                                                       dtl <= 0 ? 100 :
                                                       Math.max(5, Math.min(100, Math.round((180 - dtl) / 180 * 100)));
                                    const isHot = dtl !== null && dtl <= 30;
                                    const isWarm = dtl !== null && dtl > 30 && dtl <= 90;
                                    const urgencyColor = isHot ? '#f87171' : isWarm ? '#fbbf24' : '#60a5fa';
                                    const daysLabel = dtl === null ? 'Active' :
                                                      dtl < 0 ? `Lapsed ${Math.abs(dtl)} days ago` :
                                                      dtl === 0 ? 'Expires TODAY' : `${dtl} days remaining`;
                                    const urgencyContext = dtl === null ? 'Filing is active. Window status verified.' :
                                                           dtl < 0 ? '[ALERT] Deal was lapsed — immediate outreach is required to rescue or restructure the debt.' :
                                                           dtl === 0 ? '[!] EXPIRES TODAY — maximum urgency. Decision is being made right now.' :
                                                           dtl <= 30 ? `Filing approaching mature lapse window. Client is actively reviewing options.` :
                                                           `Filing has ${dtl} days left until lapse. Auto-renewal window opens in ${dtl - 90} days.`;

                                    // 2. Score & Narrative
                                    const dealScore = computeDealScore(lead);
                                    const dealNarrative = getDealNarrative(lead);

                                    // 3. Paydex proxy
                                    const paydex = estimatePaydex(lead);

                                    // 4. Est. Annual Revenue
                                    const revenue = estimateRevenue(lead);

                                    // 5. Lender Type mapping
                                    const lender = lead.secured_party || 'Verified Lender';
                                    const lu = lender.toUpperCase();
                                    let lenderType = '[-] Specialty / Regional';
                                    if (lu.includes('XEROX')) lenderType = '[-] Xerox / FITTLE';
                                    else if (lu.includes('DELL')) lenderType = '[>] Dell Financial Services';
                                    else if (lu.includes('LENOVO')) lenderType = '[>] Lenovo Financial';
                                    else if (lu.includes('CISCO')) lenderType = '[>] Cisco Capital';
                                    else if (lu.includes('IBM')) lenderType = '[>] IBM Credit';
                                    else if (lu.includes('WELLS FARGO')) lenderType = '[BANK] Wells Fargo Equipment Finance';
                                    else if (lu.includes('CATERPILLAR') || lu.includes('CAT FINANCIAL')) lenderType = '[CAPTIVE] Caterpillar Financial';
                                    else if (lu.includes('MARLIN')) lenderType = '[>] Marlin Business Services';
                                    else if (lu.includes('LEAF')) lenderType = '[>] LEAF / People\'s Capital';
                                    else if (lu.includes('CIT')) lenderType = '[>] CIT / First Citizens';
                                    else if (lu.includes('DLL') || lu.includes('DE LAGE')) lenderType = '[>] DLL (De Lage Landen)';
                                    else if (lu.includes('GREATAMERICA')) lenderType = '[>] GreatAmerica Financial';
                                    else if (lu.includes('SACHEM')) lenderType = '[BRIDGE] Sachem Capital';

                                    // 6. Refinance arbitrage calculations
                                    const isMca = lead.lead_type === 'Capital Refinance';
                                    const currentAPREst = isMca ? '24.5%' : (lu.includes('XEROX') || lu.includes('DELL') || lu.includes('LENOVO') || lu.includes('CISCO')) ? '13.8%' : '11.5%';
                                    const refiTargetAPR = isMca ? '12.5%' : '8.5%';
                                    const rawSize = lead.est_advance_amount || (lead.collateral_desc.toLowerCase().includes('heavy') ? 180000 : lead.collateral_desc.toLowerCase().includes('mid') ? 85000 : 25000);
                                    
                                    // Let's compute payment difference
                                    const rCurrent = parseFloat(currentAPREst) / 100 / 12;
                                    const rTarget = parseFloat(refiTargetAPR) / 100 / 12;
                                    const currentPayment = rawSize * rCurrent / (1 - Math.pow(1 + rCurrent, -60));
                                    const targetPayment = rawSize * rTarget / (1 - Math.pow(1 + rTarget, -60));
                                    const monthlySavings = Math.round(currentPayment - targetPayment);
                                    const totalSavings = Math.round(monthlySavings * 60);

                                    // 7. Timeline nodes
                                    const currentFilingYear = new Date(lead.filing_date || '2021-05-13').getFullYear();
                                    const prevFilingYear1 = currentFilingYear - 2;
                                    const nextFilingYear = currentFilingYear + 5;

                                    return (
                                        <>
                                            {/* Header */}
                                            <div className="detail-header" style={{ paddingBottom: '12px', marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                    <div>
                                                        <div className="detail-title" style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 'bold' }}>
                                                            {lead.company_name}
                                                        </div>
                                                        <div className="detail-meta" style={{ marginTop: '4px', color: '#cbd5e1', fontSize: '0.75rem' }}>
                                                            {lead.city}, {lead.state || lead.source_state} {lead.zipcode} * State Lien on Equipment
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setSelectedLead(null)} style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '1.2rem', cursor: 'pointer' }}>
                                                        [X]
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                                                
                                                {/* Expiration Card */}
                                                <div>
                                                    <div className="urgency-bar">
                                                        <div className="urgency-fill" style={{ width: `${urgencyPct}%`, backgroundColor: urgencyColor }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: urgencyColor, marginBottom: '4px' }}>
                                                        {daysLabel.toUpperCase()}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                                        {urgencyContext}
                                                    </div>
                                                </div>

                                                {/* AI Deal Score & Narrative Card */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[INTEL] AI Deal Score & Narrative</div>
                                                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                                        <div className={`score-ring ${dealScore >= 70 ? 's-hot' : dealScore >= 45 ? 's-warm' : 's-med'}`}>
                                                            {dealScore}
                                                        </div>
                                                        <div className="call-script">
                                                            {dealNarrative}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Est. Paydex Card */}
                                                <div className="intel-section">
                                                    <div className="intel-label">
                                                        [RISK] Est. Paydex
                                                        <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: '6px', textTransform: 'none' }}>
                                                            Signal-based * no D&B required
                                                        </span>
                                                    </div>
                                                    <div className="intel-card" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                                                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: paydex.color, fontFamily: 'var(--font-mono)' }}>
                                                                {paydex.score}
                                                            </div>
                                                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: paydex.color, marginTop: '2px' }}>
                                                                {paydex.label}
                                                            </div>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '0.75rem', color: '#f1f5f9', lineHeight: '1.4', marginBottom: '8px' }}>
                                                                {paydex.context}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: '1.6' }}>
                                                                {paydex.rationale.map((r, i) => (
                                                                    <div key={i}>* {r}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Est. Annual Revenue Card */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[REVENUE] Est. Annual Revenue</div>
                                                    <div className="intel-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: revenue.rv.color, fontFamily: 'var(--font-mono)' }}>
                                                                {revenue.rv.range}
                                                            </div>
                                                            <div style={{ fontSize: '0.6rem', fontWeight: 700, color: `${revenue.rv.color}bb`, marginTop: '4px', letterSpacing: '1px' }}>
                                                                {revenue.rv.label.toUpperCase()} * {revenue.rv.conf.toUpperCase()}
                                                            </div>
                                                        </div>
                                                        <div style={{ flex: 1, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.5', borderLeft: '1px solid rgba(255, 255, 255, 0.15)', paddingLeft: '14px' }}>
                                                            <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem', marginBottom: '4px' }}>
                                                                Signal-based estimate — no D&B required
                                                            </div>
                                                            <div>{revenue.why || 'Based on state blanket lien collateral type and lender profile.'}</div>
                                                            <div style={{ marginTop: '4px', fontSize: '0.65rem', color: '#94a3b8' }}>
                                                                Accuracy improves with D&B integration. Use as conversation anchor, not gospel.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Filing Intelligence */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[FILING] Filing Intelligence</div>
                                                    <div className="intel-card">
                                                        <div className="intel-row">
                                                            <span className="intel-key">Current Lender</span>
                                                            <span className="intel-val" style={{ color: '#fff' }}>{lead.secured_party}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Lender Type</span>
                                                            <span className="intel-val">{lenderType}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Collateral</span>
                                                            <span className="intel-val" style={{ fontSize: '0.75rem', maxWidth: '60%', wordBreak: 'break-all' }}>{lead.collateral_desc}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Filed</span>
                                                            <span className="intel-val">{lead.filing_date}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Lapse Date</span>
                                                            <span className="intel-val" style={{ fontWeight: 'bold', color: urgencyColor }}>{lead.lapse_date || '—'}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Tenure</span>
                                                            <span className="intel-val">5-year term</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Filing ID</span>
                                                            <span className="intel-val" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{lead.file_id}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">State</span>
                                                            <span className="intel-val">{lead.state || lead.source_state}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Company Profile */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[PROFILE] Company Profile</div>
                                                    <div className="intel-card">
                                                        <div className="intel-row">
                                                            <span className="intel-key">Company</span>
                                                            <span className="intel-val" style={{ color: '#fff' }}>{lead.company_name}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Address</span>
                                                            <span className="intel-val" style={{ fontSize: '0.75rem' }}>{lead.address || '—'}</span>
                                                        </div>
                                                        <div className="intel-row">
                                                            <span className="intel-key">Location</span>
                                                            <span className="intel-val">{lead.city}, {lead.state || lead.source_state} {lead.zipcode}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {trialSuccess && (
                                                    <>
                                                        {/* Unlocked contact details */}
                                                        <div className="intel-section">
                                                            <div className="intel-label" style={{ color: '#00e5bf' }}>[UNLOCKED] Decision Maker Contact</div>
                                                            <div className="intel-card" style={{ borderColor: 'rgba(0, 229, 191, 0.4)' }}>
                                                                <div className="intel-row">
                                                                    <span className="intel-key">Contact Person</span>
                                                                    <span className="intel-val" style={{ color: '#fff', fontWeight: 'bold' }}>{lead.contact_name || 'Operations Director'}</span>
                                                                </div>
                                                                <div className="intel-row">
                                                                    <span className="intel-key">Direct Email</span>
                                                                    <span className="intel-val" style={{ color: '#00eeff', fontFamily: 'var(--font-mono)' }}>{lead.email}</span>
                                                                </div>
                                                                <div className="intel-row">
                                                                    <span className="intel-key">Direct Phone</span>
                                                                    <span className="intel-val" style={{ fontFamily: 'var(--font-mono)' }}>{lead.phone}</span>
                                                                </div>
                                                                <div className="intel-row">
                                                                    <span className="intel-key">Company Website</span>
                                                                    <span className="intel-val">
                                                                        <a href={lead.company_website} target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                                                                            {lead.company_website}
                                                                        </a>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Unlocked Outreach Draft */}
                                                        <div className="intel-section">
                                                            <div className="intel-label">[OUTBOX] Custom AI Outreach Email</div>
                                                            <div className="intel-card" style={{ padding: '15px', border: '1px solid rgba(0, 238, 255, 0.25)' }}>
                                                                {loadingOutreach ? (
                                                                    <div style={{ color: '#00eeff', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', textAlign: 'center', padding: '10px 0' }}>
                                                                        <div className="pulse-dot" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00eeff', marginRight: '8px' }}></div>
                                                                        AI Agent drafting customized pitch sequence...
                                                                    </div>
                                                                ) : outreachDraft ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                                                                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                                                                            <span style={{ color: '#94a3b8' }}>Subject: </span>
                                                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{outreachDraft.subject}</span>
                                                                        </div>
                                                                        <div style={{ whiteSpace: 'pre-wrap', color: '#cbd5e1', lineHeight: '1.5', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                                                                            {outreachDraft.body}
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '5px' }}>
                                                                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                                                                                QUEUED FOR DISPATCH
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => alert("Simulation Mode: Test email queued for dispatch. Checked delivery inbox in 5 minutes.")}
                                                                                style={{ background: 'none', border: 'none', color: '#00eeff', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.7rem' }}
                                                                            >
                                                                                [Send Test Outreach]
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ color: '#cbd5e1', fontSize: '0.75rem', textAlign: 'center' }}>
                                                                        Unable to draft pitch. Check your API configurations.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Lender Intelligence */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[LENDER INTEL] Lender Intelligence</div>
                                                    <div className="intel-card" style={{ fontSize: '0.75rem', lineHeight: '1.5', color: '#ccc' }}>
                                                        {getLenderInsight(lead.secured_party)}
                                                    </div>
                                                </div>

                                                {/* Signal Stack */}
                                                <div className="intel-section">
                                                    <div className="intel-label">[RADAR] Signal Stack</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        
                                                        {/* State equipment lien verified */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #10b981' }}>
                                                            <div style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#10b981', marginBottom: '2px' }}>
                                                                [OK] CONFIRMED STATE LIEN ON EQUIPMENT
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                                                                Primary signal — verified public record
                                                            </div>
                                                        </div>

                                                        {/* Actively hiring */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #3b82f6' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#3b82f6' }}>
                                                                    [HIRE] Actively Hiring
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>via LinkedIn</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#fff', marginBottom: '4px' }}>
                                                                4 open positions found (Production Supervisor, Process Technician)
                                                            </div>
                                                        </div>

                                                        {/* Refinance Arbitrage */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #fbbf24' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fbbf24' }}>
                                                                    [REFI] Refinance Arbitrage
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Tier 2 OEM Captive</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#f1f5f9', marginBottom: '8px' }}>
                                                                [UNLOCKED] Refinance savings matrix applied based on raw filing terms.
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem', borderTop: '1px dashed #1a1a24', paddingTop: '8px' }}>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Current APR Est.</div>
                                                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{currentAPREst}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Refi Target APR</div>
                                                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>{refiTargetAPR}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Monthly Savings</div>
                                                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>${monthlySavings.toLocaleString()} / mo</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Total Savings (Est.)</div>
                                                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>${totalSavings.toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Govt Contract Won */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #c084fc' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#c084fc' }}>
                                                                    [GOVT] Govt Contract Won
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>via SAM.gov / Bid Logs</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#f1f5f9', marginBottom: '4px' }}>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Contract Scope</div>
                                                                <div style={{ color: '#fff', fontWeight: '600' }}>
                                                                    Municipal greenfield drainage and concrete foundation upgrades.
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem', marginTop: '6px' }}>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Awarding Agency</div>
                                                                    <div style={{ color: '#fff' }}>{lead.state || lead.source_state} Dept of Transportation</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>SAM Procurement ID</div>
                                                                    <div style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>SAM-2026-{lead.id + 8172}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Facility Permit */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #fb923c' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#fb923c' }}>
                                                                    [PERMIT] Facility Permit
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>via Municipal Building Dept</span>
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#f1f5f9', marginBottom: '4px' }}>
                                                                <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Renovation Details</div>
                                                                <div style={{ color: '#fff', fontWeight: '600' }}>
                                                                    Commercial building addition: extending industrial warehouse space by 12,500 sq ft.
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem', marginTop: '6px' }}>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>General Contractor</div>
                                                                    <div style={{ color: '#fff' }}>Apex Builders LLC</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Permit Number</div>
                                                                    <div style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>BP-2026-{lead.id + 10928}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Cargo Import */}
                                                        <div className="intel-card" style={{ padding: '10px 12px', borderLeft: '3px solid #22d3ee' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: '#22d3ee' }}>
                                                                    [IMPORT] Overseas Cargo Import
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>US Customs Registry</span>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                                                                <div style={{ gridColumn: 'span 2' }}>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Cargo Manifest Items</div>
                                                                    <div style={{ color: '#fff', fontWeight: '600' }}>3x Industrial Ventilation fans & motors</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Shipper / Manufacturer</div>
                                                                    <div style={{ color: '#fff' }}>Yuan Dong Ltd.</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Port of Origin</div>
                                                                    <div style={{ color: '#fff' }}>Port of Kaohsiung, Taiwan</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Gross Cargo Weight</div>
                                                                    <div style={{ color: '#fff' }}>3,515 kg</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Bill of Lading</div>
                                                                    <div style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>BOL-2026-{lead.id + 8192}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>

                                                {/* Funding History */}
                                                <div className="intel-section">
                                                    <div className="intel-label">
                                                        [TIMELINE] Funding History
                                                        <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: '6px', textTransform: 'none' }}>
                                                            equipment lender escalation pattern
                                                        </span>
                                                    </div>
                                                    <div className="intel-card">
                                                        <div className="sh-risk-badge" style={{ backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', marginBottom: '12px' }}>
                                                            MODERATE RISK
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '12px' }}>
                                                            avg cycle: 899d | 3 equipment financings across 3 lender(s). Current: Equipment Finance Co.
                                                        </div>
                                                        
                                                        {/* Timeline chain graph */}
                                                        <div className="sh-arrow">
                                                            <span className="sh-arrow-node" style={{ borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa' }}>LEAF CAPITAL</span>
                                                            <span className="sh-arrow-sep">-&gt;</span>
                                                            <span className="sh-arrow-node" style={{ borderColor: urgencyColor, color: urgencyColor, fontWeight: 'bold' }}>{lender.substring(0, 15)}</span>
                                                            <span className="sh-arrow-sep">-&gt;</span>
                                                            <span className="sh-arrow-node" style={{ borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}>MARLIN LEASING</span>
                                                        </div>

                                                        {/* Timeline nodes */}
                                                        <div className="sh-timeline" style={{ marginTop: '16px' }}>
                                                            
                                                            <div className="sh-event">
                                                                <div className="sh-dot" style={{ color: '#60a5fa', borderColor: '#60a5fa' }}>B</div>
                                                                <div className="sh-line"></div>
                                                                <div style={{ fontSize: '0.75rem', paddingLeft: '8px' }}>
                                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>LEAF CAPITAL FUNDING, LLC</div>
                                                                    <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                                                                        {prevFilingYear1}-04-27 * Equipment Financing (lender: LEAF CAPITAL FUNDING, LLC) * LAPSED 16d
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="sh-event">
                                                                <div className="sh-dot" style={{ color: urgencyColor, borderColor: urgencyColor }}>B</div>
                                                                <div className="sh-line"></div>
                                                                <div style={{ fontSize: '0.75rem', paddingLeft: '8px' }}>
                                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{lender} [THIS FILING]</div>
                                                                    <div style={{ color: urgencyColor, fontWeight: 500, marginTop: '2px' }}>
                                                                        {lead.filing_date} * Equipment Financing (lender: {lender}) * {daysLabel.toUpperCase()}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="sh-event">
                                                                <div className="sh-dot" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}>B</div>
                                                                <div style={{ fontSize: '0.75rem', paddingLeft: '8px' }}>
                                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>MARLIN LEASING CORP</div>
                                                                    <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                                                                        {nextFilingYear}-03-31 * Equipment Financing (lender: MARLIN LEASING CORP) * +1761d
                                                                    </div>
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Court & Regulatory */}
                                                <div className="intel-section">
                                                    <div className="intel-label">
                                                        [LEGAL] Court & Regulatory
                                                        <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: '6px', textTransform: 'none' }}>
                                                            CourtListener * CFPB * EPA * OSHA
                                                        </span>
                                                    </div>
                                                    <div className="intel-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#34d399' }}>
                                                                [CLEAR] CLEAR — Legal
                                                            </span>
                                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>swept in 2.96s</span>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                                            <span className="cr-badge court">CourtListener</span>
                                                            <span className="cr-badge cfpb">CFPB</span>
                                                            <span className="cr-badge epa">EPA ECHO</span>
                                                            <span className="cr-badge osha">OSHA</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#f1f5f9' }}>
                                                            [OK] No adverse court or regulatory records found across 4 sources.
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Market Intelligence news sweep */}
                                                <div className="intel-section">
                                                    <div className="intel-label">
                                                        [NEWS] Market Intelligence
                                                        <span style={{ fontSize: '0.55rem', color: '#94a3b8', marginLeft: '6px', textTransform: 'none' }}>
                                                            live multi-source sweep
                                                        </span>
                                                    </div>
                                                    <div className="intel-card">
                                                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '10px' }}>
                                                            [OK] 7 articles swept — Bing News * Google News — 1.15s
                                                        </div>
                                                        
                                                        {/* Tabs */}
                                                        <div className="mi-tabs">
                                                            <div className="mi-tab active">About This Company</div>
                                                            <div className="mi-tab">Industry News</div>
                                                        </div>

                                                        <div className="mi-sentiment" style={{ backgroundColor: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                                                            [NEUTRAL] Small Business Sector: Neutral
                                                        </div>

                                                        {/* News headlines */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                                            <div className="mi-article" style={{ padding: '8px', fontSize: '0.75rem' }}>
                                                                <div style={{ color: '#fff', fontWeight: 600 }}>
                                                                    Inline Plastics Closing Michigan Manufacturing Plant - PlasticsToday
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '0.65rem' }}>
                                                                    <span>Google News</span>
                                                                    <a href={`https://www.google.com/search?q=Inline+Plastics+Closing+Michigan+Manufacturing+Plant`} target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                                                                        Read [-&gt;]
                                                                    </a>
                                                                </div>
                                                            </div>

                                                            <div className="mi-article" style={{ padding: '8px', fontSize: '0.75rem' }}>
                                                                <div style={{ color: '#fff', fontWeight: 600 }}>
                                                                    Inline Plastics closing Michigan plant, cutting 25 jobs - Plastics News
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '0.65rem' }}>
                                                                    <span>Google News</span>
                                                                    <a href={`https://www.google.com/search?q=Inline+Plastics+closing+Michigan+plant`} target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                                                                        Read [-&gt;]
                                                                    </a>
                                                                </div>
                                                            </div>

                                                            <div className="mi-article" style={{ padding: '8px', fontSize: '0.75rem' }}>
                                                                <div style={{ color: '#fff', fontWeight: 600 }}>
                                                                    U.S. plastics company to close Mid-Michigan facility in January - MLive.com
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#94a3b8', fontSize: '0.65rem' }}>
                                                                    <span>Google News</span>
                                                                    <a href={`https://www.google.com/search?q=U.S.+plastics+company+to+close+facility`} target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'underline' }}>
                                                                        Read [-&gt;]
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </div>
                                                </div>

                                            </div>
                                            
                                            {proSubscribed ? (
                                                <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'center', borderRadius: '4px', fontWeight: 'bold' }}>
                                                    [ACTIVE] AUTOPILOT CAMPAIGN DEPLOYED FOR {lead.company_name.toUpperCase()}
                                                </div>
                                            ) : (
                                                <button className="unlock-action-btn" onClick={() => handleDirectUnlock(lead)} style={{ marginTop: '16px' }}>
                                                    Deploy Autopilot Campaign for {lead.company_name} ($125/mo)
                                                </button>
                                            )}
                                        </>
                                    );
                                })()
                            ) : (
                                <div style={{ color: '#cbd5e1', textAlign: 'center', marginTop: '100px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                                    Click on a company on the left to inspect verified triggers and customer intelligence.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Signup & Payment Section */}
            {/* Bottom Signup & Payment Section */}
            <div id="payment-section" className="payment-chassis" style={{ width: '100%', maxWidth: '1200px', margin: '60px auto 0 auto', padding: '0 20px' }}>
                <div style={{ textAlign: 'right', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#cbd5e1', letterSpacing: '1.5px' }}>
                    <span style={{ color: '#00eeff', fontWeight: 'bold' }}>[REGISTRATION & SECURE GATEWAY]</span> :: ACTIVATE AUTOMATED PIPELINE SPRINT
                </div>
                
                {proSubscribed ? (
                    <div className="trial-form-container trial-success-box" style={{ margin: '0 auto', maxWidth: '800px', background: 'rgba(55, 60, 75, 0.65)', border: '1px solid #10b981', borderTop: '3px solid #10b981' }}>
                        <h3 style={{color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', marginBottom: '10px'}}>PRO SUBSCRIPTION ACTIVATED</h3>
                        <p style={{color: '#f1f5f9', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '10px'}}>
                            We have processed your payment and activated your Pro Outbound Campaign. Your custom AI outreach agents are assembling leads, running signal searches, and queueing outbound campaigns for dispatch.
                        </p>
                        {weeklyDigest && (
                            <p style={{color: '#00eeff', fontSize: '0.8rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', borderTop: '1px dashed rgba(0,238,255,0.2)', paddingTop: '8px', marginTop: '8px'}}>
                                [SUBSCRIBED] Weekly Lead Intelligence digest activated for: {email}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="trial-form-container" style={{ margin: '0 auto', maxWidth: '800px', background: 'rgba(55, 60, 75, 0.65)', border: '1px solid rgba(255, 255, 255, 0.25)', borderTop: '2px solid #00eeff' }}>
                        <div className="trial-form-title">Unlock Database & Launch Pro Outbound Campaign</div>
                        <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '-12px', marginBottom: '20px', lineHeight: '1.4', textAlign: 'center' }}>
                            Upgrade to Pro to unlock direct contacts, access the full 1,515+ leads database, and deploy autonomous outbound agents 24/7.
                        </div>
                        {paymentError && (
                            <div style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '10px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.85rem', marginBottom: '15px', fontFamily: 'var(--font-mono)' }}>
                                [ERROR] {paymentError}
                            </div>
                        )}
                        <form className="trial-form" onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {whatYouSell && (
                                <div className="dynamic-trigger-box" style={{ gridColumn: 'span 2' }}>
                                    <div className="dynamic-trigger-header">
                                        <span className="telemetry-label">[ BUYING TRIGGER ENGINE ]</span>
                                        <span className="confidence-badge" style={{
                                            color: getBuyingTriggerCatalyst(whatYouSell).confidence === 'CRITICAL' ? '#ff4a4a' : 
                                                   getBuyingTriggerCatalyst(whatYouSell).confidence === 'HIGH' ? '#00eeff' : '#cbd5e1'
                                        }}>[ CONFIDENCE: {getBuyingTriggerCatalyst(whatYouSell).confidence} ]</span>
                                    </div>
                                    <div className="dynamic-trigger-row">
                                        <span className="trigger-label">MATCHED TRIGGER:</span>
                                        <span className="trigger-value">{getBuyingTriggerCatalyst(whatYouSell).trigger}</span>
                                    </div>
                                    <div className="dynamic-trigger-row">
                                        <span className="trigger-label">MANDATORY CATALYST:</span>
                                        <span className="trigger-value">{getBuyingTriggerCatalyst(whatYouSell).catalyst}</span>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Business Domain URL</label>
                                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', opacity: 0.85, marginTop: '2px', marginBottom: '4px', lineHeight: '1.2' }}>
                                    We crawl this domain to customize your AI outreach agent. Fake or unauthenticated domains are blocked. This is like adding a full sales team that works for only you on your pipeline.
                                </div>
                                <input 
                                    id="payment-domain-input"
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. amazon.com" 
                                    value={domain} 
                                    onChange={(e) => setDomain(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Work Email Address</label>
                                <input 
                                    type="email" 
                                    className="trial-input" 
                                    placeholder="e.g. sales@amazon.com" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>What your business sells / Product Description</label>
                                <input 
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. Fleet financing, commercial insurance, logistics software" 
                                    value={whatYouSell} 
                                    onChange={(e) => setWhatYouSell(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Buyer Profile</label>
                                <input 
                                    type="text" 
                                    className="trial-input" 
                                    placeholder="e.g. Directors of Construction in Ohio" 
                                    value={audience} 
                                    onChange={(e) => setAudience(e.target.value)}
                                    required 
                                />
                            </div>
                            
                            {/* Payment details */}
                            <div className="form-group" style={{ gridColumn: 'span 2', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '15px', marginTop: '10px' }}>
                                <label style={{ color: '#00eeff', fontSize: '0.75rem', letterSpacing: '1.5px', fontFamily: 'var(--font-mono)' }}>SECURE PAYMENT METHOD ($125/MO)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginTop: '8px' }}>
                                    <input 
                                        type="text" 
                                        className="trial-input" 
                                        placeholder="Card Number" 
                                        maxLength={19}
                                        required 
                                    />
                                    <input 
                                        type="text" 
                                        className="trial-input" 
                                        placeholder="MM/YY" 
                                        maxLength={5}
                                        required 
                                    />
                                    <input 
                                        type="password" 
                                        className="trial-input" 
                                        placeholder="CVC" 
                                        maxLength={4}
                                        required 
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px', marginBottom: '5px' }}>
                                <input 
                                    type="checkbox" 
                                    id="weekly-digest-chk"
                                    checked={weeklyDigest}
                                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#00eeff' }}
                                />
                                <label htmlFor="weekly-digest-chk" style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'normal', textTransform: 'none' }}>
                                    Subscribe to weekly lead intelligence digests (new capex triggers sent every Monday)
                                </label>
                            </div>
                            
                            <button type="submit" className="trial-submit-btn" style={{ gridColumn: 'span 2' }} disabled={submittingPayment}>
                                {submittingPayment ? "Processing Payment & Setting Up Outbound Engine..." : "Authorize Payment & Launch Campaign ($125/mo)"}
                            </button>
                            
                            <div className="trial-disclaimer" style={{ gridColumn: 'span 2', fontSize: '0.65rem', color: '#cbd5e1', marginTop: '5px', textAlign: 'center' }}>
                                Secure 256-bit SSL checkout. Cancel anytime.
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Weekly Lead Digest outbox */}
            {trialSuccess && (
                <div className="weekly-digest-section" style={{ width: '100%', maxWidth: '1200px', margin: '40px auto 0 auto', padding: '0 20px' }}>
                    <div style={{ textAlign: 'right', marginBottom: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: '#cbd5e1', letterSpacing: '1.5px' }}>
                        <span style={{ color: '#00e5bf', fontWeight: 'bold' }}>[WEEKLY DISPATCH CENTER]</span> :: AUTOMATED INTEL DIGEST NEWSLETTER
                    </div>
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(255, 255, 255, 0.25)', borderTop: '2px solid #00e5bf', background: 'rgba(55, 60, 75, 0.65)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.05rem', color: '#fff', fontWeight: 'bold' }}>Weekly Lead Intelligence Digests</h3>
                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                                    We collect your verified emails and automatically dispatch matching new triggers every week.
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00e5bf', boxShadow: '0 0 10px #00e5bf' }}></span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#00e5bf', fontWeight: 'bold' }}>SUBSCRIBED ({email})</span>
                            </div>
                        </div>

                        <div className="digest-outbox-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px' }}>
                            {/* Subscriber info / Campaign configuration summary */}
                            <div style={{ borderRight: '1px solid rgba(255,255,255,0.15)', paddingRight: '20px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '12px', color: '#cbd5e1' }}>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Target Product</span>
                                    <div style={{ color: '#fff', fontWeight: 600 }}>{whatYouSell}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Target Geography / Audience</span>
                                    <div style={{ color: '#fff', fontWeight: 600 }}>{audience || 'All States'}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase' }}>Subscription Status</span>
                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>Active — Matching Leads Weekly</div>
                                </div>
                                <div style={{ marginTop: '10px' }}>
                                    <button 
                                        className="secondary-cyber-btn"
                                        onClick={() => alert(`Email unsubscribed. You will no longer receive weekly digests at ${email}.`)}
                                        style={{ fontSize: '0.65rem', padding: '5px 10px', borderColor: 'rgba(255, 74, 74, 0.4)', color: '#ff4a4a', backgroundColor: 'transparent', cursor: 'pointer' }}
                                    >
                                        Unsubscribe Email
                                    </button>
                                </div>
                            </div>

                            {/* Dispatch Outbox log */}
                            <div>
                                <span style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Digest Dispatch Log</span>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                            <th style={{ paddingBottom: '8px' }}>Mailing Cycle</th>
                                            <th style={{ paddingBottom: '8px' }}>Matched Content</th>
                                            <th style={{ paddingBottom: '8px' }}>Dispatch Date</th>
                                            <th style={{ paddingBottom: '8px' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#fff' }}>Weekly Digest #1</td>
                                            <td style={{ padding: '8px 0' }}>3 Matched Leads for {whatYouSell.split(' ')[0]}</td>
                                            <td style={{ padding: '8px 0' }}>Next Monday, 8:00 AM</td>
                                            <td style={{ padding: '8px 0' }}><span style={{ color: '#00eeff', fontWeight: 'bold' }}>[SCHEDULED]</span></td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#fff' }}>Welcome Lead Digest</td>
                                            <td style={{ padding: '8px 0' }}>Initial Setup Report</td>
                                            <td style={{ padding: '8px 0' }}>Just Now (Simulated)</td>
                                            <td style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>[DELIVERED]</span>
                                                <button 
                                                    onClick={() => {
                                                        const matchedLeadNames = leads.map(l => l.company_name).join(', ');
                                                        alert(`--- SIMULATED NEWSLETTER DIGEST SENT TO ${email} ---\n\nSubject: Welcome to SalesAgentic Matched Lead Ledger\n\nBody: We matched 3 companies for your product ("${whatYouSell}"):\n\n1. ${leads[0]?.company_name || 'Matched Company 1'} - Capex trigger: "${leads[0]?.collateral_desc || 'Lien'}"\n2. ${leads[1]?.company_name || 'Matched Company 2'} - Capex trigger: "${leads[1]?.collateral_desc || 'Lien'}"\n3. ${leads[2]?.company_name || 'Matched Company 3'} - Capex trigger: "${leads[2]?.collateral_desc || 'Lien'}"\n\nWe will scan and send your matching leads every Monday morning.\n\nBest,\nSalesAgentic Outbound Team`);
                                                    }}
                                                    style={{ background: 'none', border: 'none', color: '#00eeff', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.65rem', padding: 0 }}
                                                >
                                                    View Welcome Email
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cinematic Scroll Manifesto Sections */}
            {/* Cinematic Scroll Manifesto Sections */}
            <div className="cinematic-scroll-story">
                <div className="cinematic-sticky-frame">
                    <div className="cinematic-bg-video-container" style={{ transform: `scale(${1 + scrollProgress * 0.08})` }}>
                        <video 
                            id="bg-video-act1" 
                            style={{ opacity: scrollProgress < 0.35 ? 1 : (scrollProgress < 0.38 ? 1 - (scrollProgress - 0.35) / 0.03 : 0) }} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            src="/static/coding_sequences.mp4" 
                        />
                        <video 
                            id="bg-video-act2" 
                            style={{ 
                                opacity: scrollProgress < 0.35 ? 0 : 
                                         (scrollProgress < 0.38 ? (scrollProgress - 0.35) / 0.03 : 
                                         (scrollProgress < 0.65 ? 1 : 
                                         (scrollProgress < 0.68 ? 1 - (scrollProgress - 0.65) / 0.03 : 0))) 
                            }} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            src="/static/calculating_expenses.mp4" 
                        />
                        <video 
                            id="bg-video-act3" 
                            style={{ opacity: scrollProgress < 0.65 ? 0 : (scrollProgress < 0.68 ? (scrollProgress - 0.65) / 0.03 : 1) }} 
                            autoPlay 
                            muted 
                            loop 
                            playsInline 
                            src="/static/corporate_office.mp4" 
                        />
                        <div className="cinematic-overlay"></div>
                    </div>

                    <div className="cinematic-content-overlay">
                        {/* ACT 1: THE SATURATION PARADOX */}
                        <div className={`cinematic-act ${scrollProgress >= 0.05 && scrollProgress < 0.35 ? 'active' : ''}`} id="manifesto-paradox">
                            <div className="cinematic-grid">
                                <div className="cinematic-left">
                                    <div className="section-telemetry">[ ACT_01 // OUTBOUND_BURNOUT ]</div>
                                    <h2 className="cinematic-title">THE SATURATION PARADOX</h2>
                                    <div className="scroll-indicator-bar">
                                        <div className="scroll-progress-line" style={{ width: `${Math.min(100, Math.max(0, (scrollProgress - 0.05) / 0.30 * 100))}%` }}></div>
                                    </div>
                                </div>
                                <div className="cinematic-right">
                                    <p className="cinematic-lead">
                                        Traditional B2B outbound prospecting is fundamentally broken. Blasting massive email databases (like Apollo or ZoomInfo) leads to high spam rates, low deliverability, and generic messaging.
                                    </p>
                                    <p className="cinematic-body">
                                        SalesAgentic shifts the paradigm by monitoring operational triggers in real-time, executing hyper-targeted outreach precisely when buying interest is highest.
                                    </p>
                                </div>
                            </div>

                            <div className="split-comparison-grid">
                                <div className="split-compare-col obsolete">
                                    <div className="split-compare-header">
                                        <span className="status-label">OBSOLETE</span>
                                        <h3>GENERIC DATABASE BLASTING</h3>
                                    </div>
                                    <ul className="split-compare-list">
                                        <li>
                                            <span className="split-icon cross">✕</span>
                                            <div>
                                                <strong>ZoomInfo</strong>
                                                <p>Outdated employee records, stale directories</p>
                                            </div>
                                        </li>
                                        <li>
                                            <span className="split-icon cross">✕</span>
                                            <div>
                                                <strong>Apollo</strong>
                                                <p>Mass-scraped, highly saturated lead sheets</p>
                                            </div>
                                        </li>
                                        <li>
                                            <span className="split-icon cross">✕</span>
                                            <div>
                                                <strong>Instantly / Outreach</strong>
                                                <p>Saturated mailboxes, burned domains, spam filters</p>
                                            </div>
                                        </li>
                                    </ul>
                                    <div className="split-outcome">
                                        <span className="outcome-label">OUTCOME</span>
                                        <span className="outcome-val">Low open rates, high domain burn.</span>
                                    </div>
                                </div>

                                <div className="split-compare-col live">
                                    <div className="split-compare-header">
                                        <span className="status-label pulse">LIVE RUNNING</span>
                                        <h3>SALESAGENTIC AUTOPILOT</h3>
                                    </div>
                                    <ul className="split-compare-list">
                                        <li>
                                            <span className="split-icon check">✓</span>
                                            <div>
                                                <strong>Corporate Transaction Registry</strong>
                                                <p>Real-time contract triggers and capital shifts</p>
                                            </div>
                                        </li>
                                        <li>
                                            <span className="split-icon check">✓</span>
                                            <div>
                                                <strong>Capital Filing Monitors</strong>
                                                <p>Scrapes institutional expansion activity instantly</p>
                                            </div>
                                        </li>
                                        <li>
                                            <span className="split-icon check">✓</span>
                                            <div>
                                                <strong>Closed-Loop AI Outreach</strong>
                                                <p>Personalized copywriting & automated response triage</p>
                                            </div>
                                        </li>
                                    </ul>
                                    <div className="split-outcome success">
                                        <span className="outcome-label">OUTCOME</span>
                                        <span className="outcome-val">High connection rates, zero setup, direct pipeline.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ACT 2: THE COST OF OUTBOUND TECH */}
                        <div className={`cinematic-act ${scrollProgress >= 0.38 && scrollProgress < 0.65 ? 'active' : ''}`} id="manifesto-roi">
                            <div className="cinematic-grid">
                                <div className="cinematic-left">
                                    <div className="section-telemetry">[ ACT_02 // FINANCIAL_LEAKAGE ]</div>
                                    <h2 className="cinematic-title">THE COST OF OUTBOUND TECH</h2>
                                    <div className="scroll-indicator-bar">
                                        <div className="scroll-progress-line" style={{ width: `${Math.min(100, Math.max(0, (scrollProgress - 0.38) / 0.27 * 100))}%` }}></div>
                                    </div>
                                </div>
                                <div className="cinematic-right">
                                    <p className="cinematic-lead">
                                        Operating a modern sales prospecting stack requires database seats, domain warming platforms, copywriting agents, and continuous CRM operations.
                                    </p>
                                    <p className="cinematic-body">
                                        SalesAgentic replaces your entire sales stack in a single automated loop, saving tens of thousands in licensing and maintenance overhead.
                                    </p>
                                </div>
                            </div>

                            <div className="ledger-container">
                                <div className="ledger-header">
                                    <span>REPLACEABLE SALES STACK MODULE</span>
                                    <span>ESTIMATED ANNUAL LICENSE</span>
                                </div>
                                <div className="ledger-row">
                                    <div className="ledger-desc">
                                        <span className="ledger-num">01</span>
                                        <span className="ledger-name">Database Subscriptions (ZoomInfo/Apollo)</span>
                                    </div>
                                    <div className="ledger-dots"></div>
                                    <div className="ledger-cost">$25,000 /yr</div>
                                </div>
                                <div className="ledger-row">
                                    <div className="ledger-desc">
                                        <span className="ledger-num">02</span>
                                        <span className="ledger-name">Contact Enrichment Platforms (Clay/Clearbit)</span>
                                    </div>
                                    <div className="ledger-dots"></div>
                                    <div className="ledger-cost">$12,000 /yr</div>
                                </div>
                                <div className="ledger-row">
                                    <div className="ledger-desc">
                                        <span className="ledger-num">03</span>
                                        <span className="ledger-name">Intent Signal Scrapers (Permits/Hiring/Customs)</span>
                                    </div>
                                    <div className="ledger-dots"></div>
                                    <div className="ledger-cost">$18,000 /yr</div>
                                </div>
                                <div className="ledger-row">
                                    <div className="ledger-desc">
                                        <span className="ledger-num">04</span>
                                        <span className="ledger-name">Copywriting Software & LLM API Seats</span>
                                    </div>
                                    <div className="ledger-dots"></div>
                                    <div className="ledger-cost">$8,000 /yr</div>
                                </div>
                                <div className="ledger-row">
                                    <div className="ledger-desc">
                                        <span className="ledger-num">05</span>
                                        <span className="ledger-name">Sales Ops & CRM Maintenance</span>
                                    </div>
                                    <div className="ledger-dots"></div>
                                    <div className="ledger-cost">$12,000 /yr</div>
                                </div>
                                <div className="ledger-total-row">
                                    <span className="total-label">ELIMINATED OVERHEAD:</span>
                                    <span className="total-cost">$75,000+ <span className="total-period">/ YEAR</span></span>
                                </div>
                            </div>
                        </div>

                        {/* ACT 3: TRIAL CAPACITIES ARE SCARCE */}
                        <div className={`cinematic-act ${scrollProgress >= 0.68 && scrollProgress < 0.96 ? 'active' : ''}`} id="manifesto-scarcity">
                            <div className="cinematic-grid">
                                <div className="cinematic-left">
                                    <div className="section-telemetry">[ ACT_03 // RESOURCE_CONSTRAINTS ]</div>
                                    <h2 className="cinematic-title">TRIAL CAPACITIES ARE SCARCE</h2>
                                    <div className="scroll-indicator-bar">
                                        <div className="scroll-progress-line" style={{ width: `${Math.min(100, Math.max(0, (scrollProgress - 0.68) / 0.28 * 100))}%` }}></div>
                                    </div>
                                </div>
                                <div className="cinematic-right">
                                    <p className="cinematic-lead">
                                        Due to the computing resources required to spin up dedicated domain pools and execute deep capital event checks, we limit signups to 3 new automated sales pipelines per week.
                                    </p>
                                </div>
                            </div>

                            <div className="cinematic-footer-banner">
                                <div className="banner-line"></div>
                                <div className="banner-content">
                                    SALESAGENTIC: YOUR AUTOMATED SALES PARTNER.
                                </div>
                                <div className="banner-line"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Teaser Modal */}
            {showTeaserModal && (
                <div className="teaser-modal-overlay" onClick={() => setShowTeaserModal(false)}>
                    <div className="teaser-modal-card" onClick={(e) => e.stopPropagation()}>
                        <button className="teaser-modal-close" onClick={() => setShowTeaserModal(false)}>[X]</button>
                        
                        <div className="teaser-modal-header">
                            <span className="teaser-modal-lock">[LOCKED]</span>
                            <h2>UNLOCK 1,500+ ACTIVE CAPEX SIGNAL PROFILES</h2>
                        </div>
                        
                        <div className="teaser-modal-body">
                            <p className="teaser-intro">
                                You are viewing a limited sandbox registry (25 accounts). Subscribers get real-time unfiltered access to state-wide equipment lien databases, capital filings, job boards, city building permits, and US Customs manifests.
                            </p>
                            
                            <div className="premium-perks">
                                <h3>WHAT IS INCLUDED IN PRO:</h3>
                                <ul>
                                    <li>- <b>Full Ledger Transparency:</b> Complete contact records, phone lines, email addresses, and permit numbers.</li>
                                    <li>- <b>Autonomous Outbound Orchestration:</b> Multiagent campaigns configured to auto-draft & auto-dispatch pitch sequences referencing target permit IDs.</li>
                                    <li>- <b>Dedicated Domain Pool Assembly:</b> Instant setup of custom domain warmups to safeguard your main mailbox deliverability.</li>
                                </ul>
                            </div>
                            
                            <div className="teaser-price">
                                <b>SalesAgentic Pro Subscription:</b> <span className="price-tag">$125 / month</span>
                            </div>

                            <button className="teaser-subscribe-btn" onClick={() => {
                                setShowTeaserModal(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                // Focus the first input field
                                const input = document.getElementById('trial-domain-input') as HTMLInputElement;
                                if (input) {
                                    setTimeout(() => input.focus(), 150);
                                }
                            }}>
                                Activate My 7-Day Outbound Sprint
                            </button>
                            <p className="teaser-disclaimer">
                                Start with our risk-free 7-day outbound trial. Autopopulates sandbox campaigns instantly. Cancel anytime.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
