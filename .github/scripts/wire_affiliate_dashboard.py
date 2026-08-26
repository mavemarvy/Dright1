from pathlib import Path

p = Path('src/main.tsx')
s = p.read_text()

# The affiliate dashboard is now wired directly in main.tsx. Keep this
# historical workflow idempotent so future pushes do not fail when its
# legacy anchors are no longer present.
if "import AffiliateDashboard from './AffiliateDashboard';" in s and "affiliate-dashboard" in s:
    raise SystemExit(0)

# Legacy fallback for repositories that still have the original anchors.
needle="import AdminPanel from './AdminPanel';"
insert="import AdminPanel from './AdminPanel';\nimport AffiliateDashboard from './AffiliateDashboard';"
if needle not in s:
    raise SystemExit('AdminPanel import anchor not found')
s=s.replace(needle,insert,1)
s=s.replace("'affiliate-analytics';", "'affiliate-analytics'|'affiliate-dashboard';", 1)
old="onAffiliateAnalytics={()=>setPage('affiliate-analytics')} onSignOut={signOut} onAdmin={openAdmin}/>}"
new="onAffiliateAnalytics={()=>setPage('affiliate-analytics')} onAffiliateDashboard={()=>{setSidebarOpen(false);setPage('affiliate-dashboard')}} onSignOut={signOut} onAdmin={openAdmin}/>}"
if old in s:s=s.replace(old,new,1)
old="{page==='affiliate-analytics'&&<AffiliateAnalyticsPage back={()=>setPage('market')}/>} <Footer/>"
new="{page==='affiliate-analytics'&&<AffiliateAnalyticsPage back={()=>setPage('market')}/>} {page==='affiliate-dashboard'&&<AffiliateDashboard back={()=>setPage('market')} onMenu={()=>setSidebarOpen(true)}/>} {page!=='affiliate-dashboard'&&<Footer/>}"
if old in s:s=s.replace(old,new,1)
p.write_text(s)
