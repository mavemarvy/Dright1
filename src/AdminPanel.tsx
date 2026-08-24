import React from 'react';
import { LayoutDashboard, Users, Megaphone, ShieldCheck, Settings, FileText, LifeBuoy, ScrollText, ArrowLeft } from 'lucide-react';

export default function AdminPanel({onBack}:{onBack:()=>void}){
  const items=[['Overview',LayoutDashboard],['Users',Users],['Announcements',Megaphone],['Moderation',ShieldCheck],['Settings',Settings],['Audit Logs',ScrollText],['Support',LifeBuoy],['Content',FileText]] as const;
  return <div className="admin-panel-page">
    <aside className="admin-panel-sidebar">
      <div className="admin-brand"><div className="admin-brand-mark">D</div><div><strong>DRIGHT</strong><small>Administrator</small></div></div>
      <nav>{items.map(([label,Icon],i)=><button key={label} className={i===0?'active':''}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <button className="admin-back" onClick={onBack}><ArrowLeft size={17}/> Back to DRIGHT</button>
    </aside>
    <main className="admin-panel-main"><header><div><span className="admin-eyebrow">DRIGHT ADMINISTRATOR</span><h1>Admin Panel</h1><p>Manage the DRIGHT platform, users, content, moderation and support.</p></div></header><section className="admin-cards"><div><strong>Users</strong><span>Manage accounts and roles</span></div><div><strong>Announcements</strong><span>Create and publish platform notices</span></div><div><strong>Moderation</strong><span>Review platform activity</span></div><div><strong>Support</strong><span>Manage customer support tickets</span></div></section></main>
  </div>
}