import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, BriefcaseBusiness,
  ChevronDown, Clipboard, Copy, DollarSign, Eye, Filter, Globe2, LayoutDashboard,
  Link2, Menu, MessageCircle, Package, PauseCircle, Percent, RefreshCw, Search,
  Settings, ShieldCheck, ShoppingBag, Target, TrendingUp, UserRound, Users, X
} from 'lucide-react';
import { supabase } from './supabase';
import './seller-dashboard.css';

type RangeKey = 'today' | '7d' | '28d' | '30d' | '90d' | 'custom';
type Granularity = 'hour' | 'day' | 'week' | 'month';

type LinkMetric = {
  link_id: string;
  link_public_id: string | null;
  affiliate_user_id: string;
  product_id: string;
  product_public_id: string | null;
  product_name: string | null;
  product_type: string | null;
  seller_user_id: string;
  destination_url: string | null;
  tracking_code: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  expires_at: string | null;
  clicks: number | null;
  unique_clicks: number | null;
  attributed_visits: number | null;
  attributed_purchases: number | null;
  commission_earned: number | null;
  pending_commission: number | null;
  confirmed_commission: number | null;
  paid_commission: number | null;
  conversion_rate: number | null;
};

type SellerIdentity = { username: string | null; first_name: string | null; last_name: string | null; seller_id: string | null };

const ZERO = 0;
const ranges: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7D' }, { key: '28d', label: '28D' },
  { key: '30d', label: '30D' }, { key: '90d', label: '90D' }, { key: 'custom', label: 'Custom' }
];
const granularities: Granularity[] = ['hour', 'day', 'week', 'month'];

function fmtNumber(value: number) { return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0); }
function fmtMoney(value: number, currency = 'USD') { return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0); }
function fmtPct(value: number | null) { return value == null || !Number.isFinite(Number(value)) ? '—' : `${Number(value).toFixed(2)}%`; }
function daysForRange(range: RangeKey) { return range === 'today' ? 1 : range === '7d' ? 7 : range === '28d' ? 28 : range === '30d' ? 30 : range === '90d' ? 90 : 30; }
function EmptyChart({ label }: { label: string }) {
  return <div className="empty-chart"><div className="chart-grid"><span/><span/><span/><span/></div><div className="empty-chart-copy"><BarChart3 size={18}/><strong>No data available</strong><small>{label}</small></div><div className="chart-axis"><span>Start</span><span>Selected period</span><span>End</span></div></div>;
}
function MetricCard({ label, value, change, icon: Icon, tone = 'blue' }: { label: string; value: string; change?: string; icon: React.ElementType; tone?: string }) {
  return <article className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={17}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div>{change && <div className="metric-change neutral"><Activity size={12}/>{change}</div>}</article>;
}
function SectionTitle({ eyebrow, title, description, right }: { eyebrow: string; title: string; description?: string; right?: React.ReactNode }) {
  return <div className="section-title"><div><span>{eyebrow}</span><h2>{title}</h2>{description && <p>{description}</p>}</div>{right}</div>;
}

export default function SellerDashboard() {
  const [mobileNav, setMobileNav] = useState(false);
  const [range, setRange] = useState<RangeKey>('28d');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [identity, setIdentity] = useState<SellerIdentity>({ username: null, first_name: null, last_name: null, seller_id: null });
  const [links, setLinks] = useState<LinkMetric[]>([]);
  const [sellerUserId, setSellerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const load = async () => {
    setLoading(true); setNotice('');
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id ?? null;
    if (!userId) { setLoading(false); setNotice('Sign in with a Seller profile to view this command center.'); return; }
    setSellerUserId(userId);

    const [profileRes, roleRes, entityRes, metricsRes] = await Promise.all([
      supabase.from('profiles').select('username,first_name,last_name').eq('id', userId).maybeSingle(),
      supabase.from('user_profile_roles').select('profile_type,status').eq('user_id', userId).eq('profile_type', 'seller').maybeSingle(),
      supabase.from('dright_entities').select('public_id,entity_type').eq('owner_user_id', userId).in('entity_type', ['profile_seller','seller','store']).limit(1).maybeSingle(),
      supabase.from('affiliate_dashboard_link_metrics').select('*').eq('seller_user_id', userId).order('updated_at', { ascending: false }).limit(500)
    ]);

    if (profileRes.error) setNotice(profileRes.error.message);
    const roleActive = !roleRes.error && (!roleRes.data || roleRes.data.status === 'active' || roleRes.data.status === 'approved');
    if (!roleActive) setNotice('Your account does not currently have an active Seller profile.');
    setIdentity({
      username: profileRes.data?.username ?? null,
      first_name: profileRes.data?.first_name ?? null,
      last_name: profileRes.data?.last_name ?? null,
      seller_id: entityRes.data?.public_id ?? null
    });
    if (metricsRes.error) {
      setNotice(prev => prev || `Affiliate analytics could not be loaded: ${metricsRes.error.message}`);
      setLinks([]);
    } else {
      setLinks((metricsRes.data ?? []) as LinkMetric[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredLinks = useMemo(() => links.filter(row => `${row.link_public_id ?? ''} ${row.product_public_id ?? ''} ${row.product_name ?? ''} ${row.tracking_code ?? ''}`.toLowerCase().includes(search.toLowerCase())), [links, search]);
  const affiliateClicks = links.reduce((n, x) => n + Number(x.clicks || 0), ZERO);
  const uniqueClicks = links.reduce((n, x) => n + Number(x.unique_clicks || 0), ZERO);
  const affiliateViews = links.reduce((n, x) => n + Number(x.attributed_visits || 0), ZERO);
  const affiliatePurchases = links.reduce((n, x) => n + Number(x.attributed_purchases || 0), ZERO);
  const affiliateCommission = links.reduce((n, x) => n + Number(x.commission_earned || 0), ZERO);
  const pendingCommission = links.reduce((n, x) => n + Number(x.pending_commission || 0), ZERO);
  const paidCommission = links.reduce((n, x) => n + Number(x.paid_commission || 0), ZERO);
  const affiliateConversion = affiliateClicks > 0 ? (affiliatePurchases / affiliateClicks) * 100 : null;
  const activeLinks = links.filter(x => (x.status ?? '').toLowerCase() === 'active').length;
  const uniqueAffiliates = new Set(links.map(x => x.affiliate_user_id).filter(Boolean)).size;
  const productStats = useMemo(() => {
    const map = new Map<string, { id: string; name: string; clicks: number; purchases: number; commission: number; affiliates: Set<string> }>();
    links.forEach(x => {
      const id = x.product_public_id || x.product_id;
      const item = map.get(id) || { id, name: x.product_name || 'Untitled product', clicks: 0, purchases: 0, commission: 0, affiliates: new Set<string>() };
      item.clicks += Number(x.clicks || 0); item.purchases += Number(x.attributed_purchases || 0); item.commission += Number(x.commission_earned || 0); if (x.affiliate_user_id) item.affiliates.add(x.affiliate_user_id); map.set(id, item);
    });
    return [...map.values()].sort((a, b) => b.clicks - a.clicks);
  }, [links]);
  const sellerName = [identity.first_name, identity.last_name].filter(Boolean).join(' ') || identity.username || 'Seller';

  const nav = [
    ['overview', 'Seller Overview', LayoutDashboard], ['products', 'Products', Package], ['orders', 'Orders', ShoppingBag], ['customers', 'Customers', Users],
    ['affiliates', 'Affiliate Program', Link2], ['affiliate-links', 'Affiliate Links', Clipboard], ['affiliate-performance', 'Affiliate Performance', BarChart3],
    ['sales', 'Sales Analytics', TrendingUp], ['revenue', 'Revenue', DollarSign], ['promotions', 'Promotions', Target], ['coupons', 'Coupons', Percent],
    ['reviews', 'Reviews', MessageCircle], ['payouts', 'Payouts', DollarSign], ['reports', 'Reports', Activity], ['settings', 'Store Settings', Settings]
  ] as const;

  const scrollTo = (id: string) => { setActiveSection(id); setMobileNav(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  if (loading) return <div className="seller-shell loading-shell"><div className="loading-card"><RefreshCw className="spin" size={24}/><strong>Loading Seller Command Center</strong><span>Reading authorized DRIGHT data from Supabase…</span></div></div>;

  return <div className="seller-shell">
    {mobileNav && <div className="mobile-backdrop" onClick={() => setMobileNav(false)}/>} 
    <aside className={`seller-sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="seller-brand"><div className="brand-mark">D</div><span>DRIGHT</span><small>SELLER</small><button onClick={() => setMobileNav(false)}><X size={18}/></button></div>
      <div className="seller-identity"><div className="avatar"><UserRound size={19}/></div><div><strong>{sellerName}</strong><span>{identity.seller_id || 'Seller ID not assigned'}</span></div><ChevronDown size={15}/></div>
      <nav>{nav.map(([id, label, Icon]) => <button key={id} className={activeSection === id ? 'active' : ''} onClick={() => scrollTo(id)}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-foot"><button><Globe2 size={17}/> Global marketplace</button><button><ShieldCheck size={17}/> Security</button></div>
    </aside>

    <main className="seller-main">
      <header className="seller-header"><div className="header-left"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div><span className="header-kicker">SELLER / VENDOR</span><h1>Command Center</h1></div></div><div className="header-actions"><button><Search size={18}/></button><button><MessageCircle size={18}/></button><button><Bell size={18}/></button><button><Settings size={18}/></button><div className="header-avatar">{sellerName.slice(0, 2).toUpperCase()}</div></div></header>

      <div className="seller-content">
        {notice && <div className="data-notice"><ShieldCheck size={17}/><span>{notice}</span></div>}
        <section id="overview" className="dashboard-section hero-section"><div><span className="eyebrow">DRIGHT SELLER COMMAND CENTER</span><h2>Sales, product & affiliate performance</h2><p>Only authorized, Supabase-backed records are displayed. Missing records remain zero or empty.</p></div><div className="toolbar"><div className="segmented">{ranges.map(r => <button key={r.key} className={range === r.key ? 'selected' : ''} onClick={() => setRange(r.key)}>{r.label}</button>)}</div><div className="segmented compact">{granularities.map(g => <button key={g} className={granularity === g ? 'selected' : ''} onClick={() => setGranularity(g)}>{g[0].toUpperCase()+g.slice(1)}</button>)}</div><button className="refresh-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div></section>

        <section className="metric-grid">
          <MetricCard label="Total Sales" value={fmtMoney(0)} icon={DollarSign}/><MetricCard label="Total Orders" value={fmtNumber(0)} icon={ShoppingBag}/><MetricCard label="Product Views" value={fmtNumber(0)} icon={Eye}/><MetricCard label="Conversion Rate" value="—" icon={TrendingUp}/>
          <MetricCard label="Gross Revenue" value={fmtMoney(0)} icon={DollarSign}/><MetricCard label="Net Revenue" value={fmtMoney(0)} icon={DollarSign}/><MetricCard label="Affiliate Sales" value={fmtMoney(0)} icon={Link2}/><MetricCard label="Affiliate Revenue" value={fmtMoney(0)} icon={BarChart3}/>
          <MetricCard label="Active Affiliates" value={fmtNumber(uniqueAffiliates)} icon={Users}/><MetricCard label="Affiliate Link Clicks" value={fmtNumber(affiliateClicks)} icon={Link2}/><MetricCard label="Average Order Value" value="—" icon={ShoppingBag}/><MetricCard label="Refunds" value={fmtMoney(0)} icon={ArrowDownRight}/>
        </section>

        <section id="sales" className="dashboard-section"><SectionTitle eyebrow="01 · SALES ANALYTICS" title="Sales performance" description={`Selected range: ${ranges.find(r=>r.key===range)?.label} · ${granularity} granularity`} /><div className="chart-card"><div className="chart-tabs"><button className="active">Revenue</button><button>Orders</button><button>Product Views</button><button>Customers</button><button>Conversion Rate</button><button>Affiliate Sales</button><button>Affiliate Clicks</button></div><EmptyChart label="Sales and product telemetry will appear when authoritative records exist."/></div></section>

        <section id="affiliate-performance" className="dashboard-section"><SectionTitle eyebrow="02 · AFFILIATE PERFORMANCE" title="Affiliate Performance" description="Seller-authorized performance of affiliates promoting this seller's listings." /><div className="metric-grid eight"><MetricCard label="Total Affiliate Clicks" value={fmtNumber(affiliateClicks)} icon={Link2}/><MetricCard label="Unique Affiliate Visitors" value={fmtNumber(uniqueClicks)} icon={Users}/><MetricCard label="Affiliate Product Views" value={fmtNumber(affiliateViews)} icon={Eye}/><MetricCard label="Affiliate Purchases" value={fmtNumber(affiliatePurchases)} icon={ShoppingBag}/><MetricCard label="Affiliate Conversion Rate" value={fmtPct(affiliateConversion)} icon={TrendingUp}/><MetricCard label="Affiliate Revenue" value={fmtMoney(0)} icon={DollarSign}/><MetricCard label="Total Commissions" value={fmtMoney(affiliateCommission)} icon={Percent}/><MetricCard label="Active Affiliates" value={fmtNumber(uniqueAffiliates)} icon={Users}/></div><div className="two-col"><div className="panel"><h3>Organic Sales vs Affiliate Sales</h3><div className="legend"><span><i className="dot blue"/> Organic Sales</span><span><i className="dot purple"/> Affiliate Sales</span></div><EmptyChart label="No sales attribution data available."/></div><div className="panel"><h3>Affiliate Clicks vs Purchases vs Revenue</h3><div className="legend"><span><i className="dot blue"/> Clicks</span><span><i className="dot green"/> Purchases</span><span><i className="dot purple"/> Revenue</span></div><EmptyChart label="No affiliate event data available."/></div></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="03 · AFFILIATE FUNNEL" title="Attribution funnel" description="Server-side attribution path from referral click to verified purchase." /><div className="funnel">{[['Affiliate Link Click', affiliateClicks], ['Unique Visitor', uniqueClicks], ['Product Page View', affiliateViews], ['Checkout', 0], ['Successful Purchase', affiliatePurchases]].map(([label, value], i) => <div className="funnel-step" key={String(label)} style={{ width: `${100 - i * 13}%` }}><span>{label}</span><strong>{fmtNumber(Number(value))}</strong><small>{i === 0 ? '100%' : Number(affiliateClicks) > 0 ? `${((Number(value)/affiliateClicks)*100).toFixed(2)}% of clicks` : '—'}</small></div>)}</div></section>

        <section id="affiliate-links" className="dashboard-section"><SectionTitle eyebrow="04 · AFFILIATE LINK TRACKING" title="Affiliate-by-affiliate performance" description="Unique product-specific relationships and their authorized metrics." right={<div className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search affiliate link or product…"/><Filter size={15}/></div>}/><div className="table-card"><div className="table-scroll"><table><thead><tr><th>Affiliate ID</th><th>Affiliate Name</th><th>Product ID</th><th>Product Name</th><th>Unique Affiliate Link</th><th>Clicks</th><th>Unique Clicks</th><th>Views</th><th>Orders</th><th>Conv.</th><th>Commission</th><th>Status</th><th>Last Activity</th></tr></thead><tbody>{filteredLinks.length ? filteredLinks.map(row => <AffiliateRow key={row.link_id} row={row}/>) : <EmptyRow colSpan={13} label="No affiliate records for this seller."/>}</tbody></table></div></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="05 · PRODUCT AFFILIATE ANALYTICS" title="Product performance" description="Product-level affiliate participation and attribution."/><div className="insight-grid"><Insight label="Best affiliate product" value={productStats[0]?.name || '—'}/><Insight label="Most clicked product" value={productStats.sort((a,b)=>b.clicks-a.clicks)[0]?.name || '—'}/><Insight label="Highest converting product" value={productStats.find(x=>x.clicks>0)?.name || '—'}/><Insight label="Highest affiliate revenue" value={productStats.length ? fmtMoney(0) : '—'}/><Insight label="Highest affiliate participation" value={productStats.sort((a,b)=>b.affiliates.size-a.affiliates.size)[0]?.name || '—'}/></div><div className="table-card"><div className="table-scroll"><table><thead><tr><th>Product ID</th><th>Product Name</th><th>Total Sales</th><th>Organic Sales</th><th>Affiliate Sales</th><th>Affiliate Clicks</th><th>Affiliate Conv.</th><th>Active Affiliates</th><th>Affiliate Commission</th><th>Revenue Generated</th></tr></thead><tbody>{productStats.length ? productStats.map(p=><tr key={p.id}><td className="mono">{p.id}</td><td>{p.name}</td><td>{fmtNumber(0)}</td><td>{fmtNumber(0)}</td><td>{fmtNumber(p.purchases)}</td><td>{fmtNumber(p.clicks)}</td><td>{p.clicks ? `${((p.purchases/p.clicks)*100).toFixed(2)}%` : '—'}</td><td>{fmtNumber(p.affiliates.size)}</td><td>{fmtMoney(p.commission)}</td><td>{fmtMoney(0)}</td></tr>) : <EmptyRow colSpan={10} label="No product affiliate records yet."/>}</tbody></table></div></div></section>

        <section id="revenue" className="dashboard-section"><SectionTitle eyebrow="06 · REVENUE ATTRIBUTION" title="Revenue breakdown" description="Authoritative revenue is intentionally zero until an order/payment source exists in the current schema."/><div className="two-col"><div className="panel"><h3>Eligible revenue sources</h3><div className="source-list"><SourceRow label="Direct / Organic Sales" value={fmtMoney(0)}/><SourceRow label="Affiliate Sales" value={fmtMoney(0)}/><SourceRow label="Promotional Sales" value={fmtMoney(0)}/><SourceRow label="Other eligible sources" value={fmtMoney(0)}/></div></div><div className="panel"><h3>Seller revenue waterfall</h3><div className="waterfall"><span>Gross Sale</span><b>→</b><span>Affiliate Commission</span><b>→</b><span>DRIGHT Platform Fee</span><b>→</b><strong>Seller Net Revenue</strong></div><div className="waterfall-values"><strong>{fmtMoney(0)}</strong><strong>{fmtMoney(affiliateCommission)}</strong><strong>{fmtMoney(0)}</strong><strong>{fmtMoney(0)}</strong></div></div></div></section>

        <section id="promotions" className="dashboard-section"><SectionTitle eyebrow="07 · PROMOTION ANALYTICS" title="Promotions & campaigns" description="No promotional metrics are fabricated when the underlying records are absent."/><div className="metric-grid eight">{[['Spend',fmtMoney(0),DollarSign],['Impressions','0',Eye],['Reach','0',Users],['Clicks','0',Target],['CTR','—',Percent],['Conversions','0',TrendingUp],['Revenue',fmtMoney(0),DollarSign],['ROAS','—',BarChart3]].map(([l,v,I])=><MetricCard key={String(l)} label={String(l)} value={String(v)} icon={I as React.ElementType}/>)}</div><EmptyChart label="No promotion records available for the selected period."/></section>

        <section className="dashboard-section"><SectionTitle eyebrow="08 · TRAFFIC ANALYTICS" title="Traffic & audience" description="Privacy-safe aggregate telemetry only."/><div className="traffic-grid"><div className="panel map-panel"><h3>Countries</h3><div className="map-placeholder"><Globe2 size={30}/><span>No traffic records</span></div></div><div className="panel"><h3>Device mix</h3><EmptyChart label="No device telemetry available."/></div><div className="panel"><h3>Traffic sources</h3><EmptyChart label="No referral source data available."/></div></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="09 · SALES TEAM" title="Sales team performance" description="Operational analytics only; no invented leads, sales or commissions."/><div className="table-card"><div className="table-scroll"><table><thead><tr><th>Member ID</th><th>Assigned Products</th><th>Leads</th><th>Conversions</th><th>Sales</th><th>Revenue</th><th>Commission</th><th>Pending</th><th>Paid</th><th>Conversion Rate</th></tr></thead><tbody><EmptyRow colSpan={10} label="No authorized sales-team records yet."/></tbody></table></div></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="10 · PRODUCT AFFILIATE MANAGEMENT" title="Affiliate promotion controls" description="Controls are connected to the seller/product system when those records exist."/><div className="management-grid"><ControlCard icon={Link2} title="Enable affiliate promotion" text="Allow eligible affiliates to promote a product."/><ControlCard icon={Percent} title="Commission rate" text="Set an authorized commission rate per eligible product."/><ControlCard icon={Users} title="Participating affiliates" text="Review affiliates associated with each product."/><ControlCard icon={Clipboard} title="Copy Product ID" text="Use stable, human-shareable DRIGHT product IDs."/><ControlCard icon={BarChart3} title="View affiliate performance" text="Open product and affiliate attribution metrics."/><ControlCard icon={PauseCircle} title="Pause promotion" text="Temporarily stop new affiliate promotion for a listing."/></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="11 · FRAUD PROTECTION" title="Attribution integrity" description="Seller-visible summaries only. Private fraud signals and security identifiers are not exposed."/><div className="fraud-grid">{[['Valid affiliate clicks', affiliateClicks],['Suspicious clicks',0],['Blocked bot traffic',0],['Duplicate click detection',0],['Suspicious conversion detection',0],['Verified purchases',affiliatePurchases],['Reversed transactions',0]].map(([label,value])=><div className="fraud-item" key={String(label)}><ShieldCheck size={16}/><span>{label}</span><strong>{fmtNumber(Number(value))}</strong></div>)}</div><div className="security-note"><ShieldCheck size={16}/><span>Affiliate attribution is expected to be verified server-side against legitimate transactions before commission confirmation.</span></div></section>

        <section className="dashboard-section"><SectionTitle eyebrow="12 · RECENT AFFILIATE ACTIVITY" title="Activity timeline"/><div className="timeline-empty"><Activity size={20}/><strong>No recent activity</strong><span>Affiliate clicks, views, checkouts, purchases and commission events will appear here when authoritative records exist.</span></div></section>

        <section id="payouts" className="dashboard-section"><SectionTitle eyebrow="13 · FINANCE" title="Seller finance" description="Wallet balances are not calculated in the browser."/><div className="finance-grid"><MetricCard label="Pending Affiliate Commission" value={fmtMoney(pendingCommission)} icon={DollarSign}/><MetricCard label="Confirmed Commission" value={fmtMoney(links.reduce((n,x)=>n+Number(x.confirmed_commission||0),0))} icon={ShieldCheck}/><MetricCard label="Paid Commission" value={fmtMoney(paidCommission)} icon={DollarSign}/><MetricCard label="Withdrawable Balance" value={fmtMoney(0)} icon={DollarSign}/></div></section>

        <footer className="seller-footer"><span>DRIGHT Seller Command Center</span><span>Supabase-backed · RLS-authorized · No fabricated analytics</span></footer>
      </div>
    </main>
  </div>;
}

function AffiliateRow({ row }: { row: LinkMetric }) {
  const link = row.tracking_code ? `https://dright.com/go/${row.tracking_code}` : '—';
  const copy = async () => { if (row.tracking_code) await navigator.clipboard?.writeText(link); };
  return <tr><td className="mono">{row.link_public_id || '—'}</td><td className="mono muted">Private</td><td className="mono">{row.product_public_id || '—'}</td><td>{row.product_name || '—'}</td><td><div className="link-cell"><span className="mono">{link}</span>{row.tracking_code && <button title="Copy link" onClick={copy}><Copy size={13}/></button>}</div></td><td>{fmtNumber(Number(row.clicks||0))}</td><td>{fmtNumber(Number(row.unique_clicks||0))}</td><td>{fmtNumber(Number(row.attributed_visits||0))}</td><td>{fmtNumber(Number(row.attributed_purchases||0))}</td><td>{fmtPct(row.conversion_rate)}</td><td>{fmtMoney(Number(row.commission_earned||0))}</td><td><span className={`status ${(row.status||'unknown').toLowerCase()}`}>{row.status || 'unknown'}</span></td><td>{row.updated_at ? new Date(row.updated_at).toLocaleString() : '—'}</td></tr>;
}
function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) { return <tr><td colSpan={colSpan}><div className="empty-table"><Clipboard size={18}/><strong>{label}</strong></div></td></tr>; }
function Insight({ label, value }: { label: string; value: string }) { return <div className="insight"><span>{label}</span><strong>{value}</strong></div>; }
function SourceRow({ label, value }: { label: string; value: string }) { return <div className="source-row"><span>{label}</span><strong>{value}</strong></div>; }
function ControlCard({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) { return <div className="control-card"><div className="control-icon"><Icon size={18}/></div><div><strong>{title}</strong><p>{text}</p></div><button aria-label={title}><ChevronDown size={16}/></button></div>; }

createRoot(document.getElementById('seller-root')!).render(<SellerDashboard />);
