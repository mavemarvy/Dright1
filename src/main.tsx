import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Search, Menu, Bell, Globe2, ChevronDown, ArrowRight, Sparkles, ShoppingBag, BriefcaseBusiness, GraduationCap, Megaphone, CheckCircle2, Heart, Share2, MessageCircle, ShieldCheck, Copy, ArrowLeft, SlidersHorizontal, X, Palette} from 'lucide-react';
import './styles.css';

type ThemeKey='midnight'|'commerce'|'aurora'|'executive'|'ai';
type Product={id:string;title:string;category:string;price:string;seller:string;description:string;status:string;featured?:boolean;accent:string};

const themes:Record<ThemeKey,{label:string;description:string;className:string}>={
 midnight:{label:'Midnight',description:'Premium DRIGHT dark',className:'theme-midnight'},
 commerce:{label:'Commerce',description:'High-conversion marketplace',className:'theme-commerce'},
 aurora:{label:'Aurora',description:'Bright modern ecosystem',className:'theme-aurora'},
 executive:{label:'Executive',description:'Professional business',className:'theme-executive'},
 ai:{label:'AI Studio',description:'Futuristic AI accent',className:'theme-ai'}
};

const categories=[
 {label:'Products',icon:ShoppingBag,desc:'Digital and physical offers'},
 {label:'Services',icon:BriefcaseBusiness,desc:'Experts and professional work'},
 {label:'Courses',icon:GraduationCap,desc:'Learning and education'},
 {label:'Campaigns',icon:Megaphone,desc:'Promotions and creator campaigns'},
 {label:'Jobs',icon:BriefcaseBusiness,desc:'Opportunities and tasks'},
 {label:'Stores',icon:ShoppingBag,desc:'Discover independent sellers'}
];

const products:Product[]=[
 {id:'DR-TEST-001',title:'AI Content Strategy Kit',category:'Digital Product',price:'$29',seller:'Dright Studio',description:'A practical toolkit for planning high-converting AI-assisted content campaigns.',status:'Published',featured:true,accent:'linear-gradient(135deg,#2563eb,#7c3aed)'},
 {id:'DR-TEST-002',title:'Brand Identity Sprint',category:'Services',price:'$180',seller:'Northstar Creative',description:'A focused brand strategy and identity sprint for growing digital businesses.',status:'Published',accent:'linear-gradient(135deg,#0f766e,#14b8a6)'},
 {id:'DR-TEST-003',title:'Prompt Engineering Masterclass',category:'Courses',price:'$49',seller:'AI Academy',description:'Learn practical prompt design, evaluation and workflow building for modern AI tools.',status:'Published',featured:true,accent:'linear-gradient(135deg,#ea580c,#f59e0b)'},
 {id:'DR-TEST-004',title:'Social Launch Campaign',category:'Campaigns',price:'$75',seller:'Growth Lab',description:'A ready-to-run campaign package for creators launching a new digital offer.',status:'Published',accent:'linear-gradient(135deg,#be185d,#8b5cf6)'},
 {id:'DR-TEST-005',title:'Frontend Product Designer',category:'Jobs',price:'$1,200',seller:'DRIGHT Marketplace',description:'Example marketplace job listing used only for frontend testing.',status:'Published',accent:'linear-gradient(135deg,#334155,#64748b)'},
 {id:'DR-TEST-006',title:'Creator Growth Dashboard',category:'Digital Product',price:'$39',seller:'Metric House',description:'A sample analytics template for creators tracking audience and revenue growth.',status:'Published',accent:'linear-gradient(135deg,#0369a1,#06b6d4)'}
];

function App(){
 const [theme,setTheme]=useState<ThemeKey>(()=>(localStorage.getItem('dright-theme') as ThemeKey)||'midnight');
 const [page,setPage]=useState<'welcome'|'market'|'product'>('welcome');
 const [selected,setSelected]=useState<Product|null>(null);
 const [query,setQuery]=useState('');
 const [category,setCategory]=useState('All');
 const [sort,setSort]=useState('Recommended');
 const [themeOpen,setThemeOpen]=useState(false);
 useEffect(()=>{localStorage.setItem('dright-theme',theme)},[theme]);
 const filtered=useMemo(()=>{let list=products.filter(p=>(category==='All'||p.category===category)&&(`${p.title} ${p.category} ${p.seller}`.toLowerCase().includes(query.toLowerCase()))); if(sort==='Price: Low to High') list=[...list].sort((a,b)=>Number(a.price.replace(/[^0-9.]/g,''))-Number(b.price.replace(/[^0-9.]/g,''))); if(sort==='Featured') list=[...list].sort((a,b)=>Number(b.featured)-Number(a.featured)); return list},[query,category,sort]);
 const openProduct=(p:Product)=>{setSelected(p);setPage('product');window.scrollTo({top:0,behavior:'smooth'})};
 return <div className={`app ${themes[theme].className}`}>
  <Header query={query} setQuery={setQuery} onMarket={()=>setPage('market')} onWelcome={()=>setPage('welcome')} onTheme={()=>setThemeOpen(v=>!v)} />
  {themeOpen&&<ThemePicker theme={theme} setTheme={setTheme} close={()=>setThemeOpen(false)}/>} 
  {page==='welcome'&&<Welcome onMarket={()=>setPage('market')} query={query} setQuery={setQuery} onProduct={openProduct}/>} 
  {page==='market'&&<Market query={query} setQuery={setQuery} category={category} setCategory={setCategory} sort={sort} setSort={setSort} products={filtered} onProduct={openProduct} back={()=>setPage('welcome')}/>} 
  {page==='product'&&selected&&<ProductDetails product={selected} back={()=>setPage('market')} onProduct={openProduct}/>} 
  <Footer />
 </div>
}

function Header({query,setQuery,onMarket,onWelcome,onTheme}:{query:string;setQuery:(v:string)=>void;onMarket:()=>void;onWelcome:()=>void;onTheme:()=>void}){return <header className="topbar"><div className="brand" onClick={onWelcome}><span className="brand-mark">D</span><span>DRIGHT</span></div><nav className="desktop-nav"><button onClick={onMarket}>Marketplace</button><button>AI tools</button><button>For business</button></nav><div className="header-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, services, courses, jobs and more..."/><kbd>⌘ K</kbd></div><div className="header-actions"><button className="icon-btn" aria-label="Language"><Globe2 size={18}/></button><button className="icon-btn" aria-label="Notifications"><Bell size={18}/></button><button className="theme-trigger" onClick={onTheme}><Palette size={16}/><span>Theme</span><ChevronDown size={14}/></button><button className="profile-btn">Profile</button><button className="menu-btn"><Menu size={20}/></button></div></header>}

function ThemePicker({theme,setTheme,close}:{theme:ThemeKey;setTheme:(v:ThemeKey)=>void;close:()=>void}){return <div className="theme-popover"><div className="theme-head"><div><strong>Choose platform theme</strong><span>Professional presets for marketplace, marketing and AI</span></div><button onClick={close}><X size={18}/></button></div><div className="theme-grid">{Object.entries(themes).map(([key,t])=><button key={key} className={`theme-option ${theme===key?'selected':''}`} onClick={()=>{setTheme(key as ThemeKey);close()}}><span className={`theme-swatch ${t.className}`}><i/><i/><i/></span><span><strong>{t.label}</strong><small>{t.description}</small></span>{theme===key&&<CheckCircle2 size={16}/>}</button>)}</div></div>}

function Welcome({onMarket,query,setQuery,onProduct}:{onMarket:()=>void;query:string;setQuery:(v:string)=>void;onProduct:(p:Product)=>void}){return <main><section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="pulse"/>AI-powered marketplace</span><h1>Discover something that <em>moves you forward.</em></h1><p>Explore products, services, courses, jobs and opportunities across the DRIGHT ecosystem — built for people who create, sell, learn and grow.</p><div className="hero-search"><Search size={21}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, keyword or listing ID..."/><button onClick={onMarket}>Explore <ArrowRight size={17}/></button></div><div className="hero-actions"><button className="primary" onClick={onMarket}>Explore marketplace</button><button className="secondary">Start selling <ArrowRight size={16}/></button></div></div><div className="hero-panel"><div className="ai-card"><Sparkles size={20}/><span>DRIGHT AI</span><strong>Find the right opportunity faster.</strong><p>Search across products, services, learning and work from one intelligent marketplace.</p></div><div className="mini-stat"><span>Marketplace</span><strong>Always discovering</strong><div className="avatar-stack"><i/><i/><i/><b>+</b></div></div></div></section><section className="section"><div className="section-heading"><div><span className="section-kicker">Explore</span><h2>Everything in one marketplace</h2></div><button className="text-btn" onClick={onMarket}>See all <ArrowRight size={15}/></button></div><div className="category-grid">{categories.map(c=><button className="category-card" key={c.label} onClick={onMarket}><span className="category-icon"><c.icon size={22}/></span><strong>{c.label}</strong><small>{c.desc}</small></button>)}</div></section><section className="section"><div className="section-heading"><div><span className="section-kicker">For you</span><h2>Featured opportunities</h2></div><button className="text-btn" onClick={onMarket}>Browse marketplace <ArrowRight size={15}/></button></div><div className="product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)}/>)}</div></section></main>}

function Market({query,setQuery,category,setCategory,sort,setSort,products,onProduct,back}:{query:string;setQuery:(v:string)=>void;category:string;setCategory:(v:string)=>void;sort:string;setSort:(v:string)=>void;products:Product[];onProduct:(p:Product)=>void;back:()=>void}){const cats=['All','Products','Services','Courses','Jobs','Tasks'];return <main className="market-page"><button className="back-link" onClick={back}><ArrowLeft size={16}/> Welcome</button><section className="market-hero"><span className="section-kicker">DRIGHT Marketplace</span><h1>Find products, services and opportunities.</h1><p>Discover listings from the growing DRIGHT ecosystem.</p><div className="market-search"><Search size={19}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, keyword or listing ID..."/></div></section><div className="filter-row"><div className="category-pills">{cats.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="sort"><SlidersHorizontal size={16}/><span>Sort</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recommended</option><option>Featured</option><option>Price: Low to High</option></select></label></div><div className="market-meta"><strong>{products.length} listings</strong><span>Example/test content for frontend development</span></div><div className="product-grid market-grid">{products.map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)}/>)}</div></main>}

function ProductCard({product,onClick}:{product:Product;onClick:()=>void}){return <button className="product-card" onClick={onClick}><div className="product-image" style={{background:product.accent}}><span>{product.category}</span>{product.featured&&<b>FEATURED</b>}<Heart className="heart" size={18}/><div className="product-art"><ShoppingBag size={34}/></div></div><div className="product-body"><div className="product-top"><small>{product.seller}</small><small>Test listing</small></div><h3>{product.title}</h3><p>{product.description}</p><div className="product-bottom"><strong>{product.price}</strong><span>View details <ArrowRight size={14}/></span></div></div></button>}

function ProductDetails({product,back,onProduct}:{product:Product;back:()=>void;onProduct:(p:Product)=>void}){return <main className="details-page"><button className="back-link" onClick={back}><ArrowLeft size={16}/> Marketplace</button><div className="details-grid"><section><div className="detail-media" style={{background:product.accent}}><div><ShoppingBag size={76}/><span>Example product media</span></div></div><div className="detail-title"><div className="tag-row"><span>{product.category}</span><span><CheckCircle2 size={13}/> {product.status}</span></div><h1>{product.title}</h1><p>{product.description}</p><div className="listing-id"><small>DRIGHT LISTING ID</small><div><code>{product.id}</code><button onClick={()=>navigator.clipboard?.writeText(product.id)}><Copy size={15}/> Copy ID</button></div><span>Frontend test listing — intended to be replaced by administrator-managed marketplace content later.</span></div></div></section><aside className="purchase-card"><small>Price</small><strong>{product.price}</strong><button className="primary wide"><ShoppingBag size={18}/> Add to cart</button><div className="split-actions"><button><Heart size={17}/> Save</button><button><Share2 size={17}/> Share</button></div><button className="secondary wide"><MessageCircle size={17}/> Contact seller</button><div className="trust"><h3><ShieldCheck size={19}/> DRIGHT protection</h3><p><CheckCircle2 size={15}/> Secure marketplace experience</p><p><CheckCircle2 size={15}/> Listing and transaction traceability</p><p><CheckCircle2 size={15}/> Seller and product information can be verified</p></div></aside></div><section className="similar"><div className="section-heading"><div><span className="section-kicker">Continue exploring</span><h2>Similar listings</h2></div></div><div className="product-grid">{products.filter(p=>p.id!==product.id).slice(0,4).map(p=><ProductCard key={p.id} product={p} onClick={()=>onProduct(p)}/>)}</div></section></main>}

function Footer(){return <footer><div><div className="brand"><span className="brand-mark">D</span><span>DRIGHT</span></div><p>The marketplace for products, services, learning, opportunities and AI-powered growth.</p></div><div className="footer-links"><span>Marketplace</span><span>AI</span><span>For business</span><span>Help</span></div><small>Frontend development build · No Supabase, auth or external APIs connected.</small></footer>}

createRoot(document.getElementById('root')!).render(<App/>);
