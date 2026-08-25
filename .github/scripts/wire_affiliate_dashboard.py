from pathlib import Path

p=Path('src/main.tsx')
s=p.read_text()

# Import the real Supabase-backed affiliate dashboard.
needle="import AdminPanel from './AdminPanel';"
insert="import AdminPanel from './AdminPanel';\nimport AffiliateDashboard from './AffiliateDashboard';"
if "import AffiliateDashboard from './AffiliateDashboard';" not in s:
    if needle not in s: raise SystemExit('AdminPanel import anchor not found')
    s=s.replace(needle,insert,1)

# Add a dedicated page state without disturbing existing pages.
s=s.replace("'affiliate-analytics';", "'affiliate-analytics'|'affiliate-dashboard';", 1)

# Pass the affiliate-dashboard route into the existing profile switcher.
old="onAffiliateAnalytics={()=>setPage('affiliate-analytics')} onSignOut={signOut} onAdmin={openAdmin}/>}"
new="onAffiliateAnalytics={()=>setPage('affiliate-analytics')} onAffiliateDashboard={()=>{setSidebarOpen(false);setPage('affiliate-dashboard')}} onSignOut={signOut} onAdmin={openAdmin}/>}"
if old not in s: raise SystemExit('Sidebar invocation anchor not found')
s=s.replace(old,new,1)

# Render the dedicated dashboard. Existing pages/components remain unchanged.
old="{page==='affiliate-analytics'&&<AffiliateAnalyticsPage back={()=>setPage('market')}/>} <Footer/>"
new="{page==='affiliate-analytics'&&<AffiliateAnalyticsPage back={()=>setPage('market')}/>} {page==='affiliate-dashboard'&&<AffiliateDashboard back={()=>setPage('market')} onMenu={()=>setSidebarOpen(true)}/>} {page!=='affiliate-dashboard'&&<Footer/>}"
if old not in s: raise SystemExit('page render anchor not found')
s=s.replace(old,new,1)

# Extend Sidebar props and route only when Affiliate is selected.
old="onLearning,onAffiliateAnalytics,onSignOut,onAdmin}:{open:boolean;onClose:()=>void;onWelcome:()=>void;onMarket:()=>void;onLearning:()=>void;onAffiliateAnalytics:()=>void;onSignOut:()=>void;onAdmin?:()=>void}"
new="onLearning,onAffiliateAnalytics,onAffiliateDashboard,onSignOut,onAdmin}:{open:boolean;onClose:()=>void;onWelcome:()=>void;onMarket:()=>void;onLearning:()=>void;onAffiliateAnalytics:()=>void;onAffiliateDashboard:()=>void;onSignOut:()=>void;onAdmin?:()=>void}"
if old not in s: raise SystemExit('Sidebar prop signature anchor not found')
s=s.replace(old,new,1)

old="const chooseProfile=(name:string)=>{setActiveProfile(name);localStorage.setItem('dright-active-profile',name);setProfileOpen(false)};"
new="const chooseProfile=(name:string)=>{setActiveProfile(name);localStorage.setItem('dright-active-profile',name);setProfileOpen(false);if(name==='Affiliate')onAffiliateDashboard();};"
if old not in s: raise SystemExit('profile chooser anchor not found')
s=s.replace(old,new,1)

p.write_text(s)
