(function(){
  const SUPABASE_URL='https://jkqddapfluevbrzfdtsl2.supabase.co';
  const SUPABASE_KEY='sb_publishable_Oq52s8TINBuJitmrbh0hag_vrPWHKXJ';
  const waitForSupabase=()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.supabase){clearInterval(t);resolve()}else if(++n>120){clearInterval(t);reject(new Error('Supabase client failed to load'))}},50)});
  const $=id=>document.getElementById(id);
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  async function init(){
    const form=$('signup'), input=$('username');
    if(!form||!input)return;
    let box=$('usernameStatus');
    if(!box){
      box=document.createElement('div');box.id='usernameStatus';box.setAttribute('aria-live','polite');
      box.style.cssText='font-size:12px;line-height:1.5;margin-top:-10px;margin-bottom:2px;';
      input.parentElement.appendChild(box);
    }
    await waitForSupabase();
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    let timer=0,request=0,last='';let available=false;
    function show(text,type){
      box.innerHTML=text;box.style.color=type==='ok'?'#166534':type==='bad'?'#991b1b':'#64748b';
    }
    async function check(raw){
      const username=raw.trim().toLowerCase();available=false;
      if(!username){show('','');return false}
      if(!/^[a-z0-9_]{3,30}$/.test(username)){show('Use 3–30 letters, numbers or underscores.','bad');return false}
      const id=++request;show('Checking username…','wait');
      const {data,error}=await client.rpc('is_username_available',{p_username:username});
      if(id!==request)return false;
      if(error){show('Unable to check username right now. Please try again.','bad');return false}
      if(data===true){available=true;last=username;show('✓ Username available to use','ok');return true}
      const candidates=[];
      for(const suffix of ['11','213','527','821','934','1203','2026','77','88','99']){
        if(candidates.length>=5)break;
        const candidate=username+suffix;
        const r=await client.rpc('is_username_available',{p_username:candidate});
        if(!r.error&&r.data)candidates.push(candidate);
      }
      last=username;
      const suggestionHtml=candidates.length?'<div style="margin-top:4px">Available suggestions: '+candidates.map(x=>'<button type="button" data-username="'+esc(x)+'" style="border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:8px;padding:4px 8px;margin:3px 3px 0 0;cursor:pointer;font-size:12px">'+esc(x)+'</button>').join('')+'</div>':'<div style="margin-top:4px">Try adding numbers to create a unique username.</div>';
      show('✕ Username already exists.'+suggestionHtml,'bad');
      box.querySelectorAll('[data-username]').forEach(btn=>btn.addEventListener('click',()=>{input.value=btn.dataset.username;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()}));
      return false;
    }
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>check(input.value),300)});
    input.addEventListener('blur',()=>check(input.value));
    form.addEventListener('submit',async e=>{
      const value=input.value.trim().toLowerCase();input.value=value;
      const ok=await check(value);
      if(!ok){e.preventDefault();e.stopImmediatePropagation();input.focus();}
    },true);
    if(input.value.trim())check(input.value);
  }
  init().catch(err=>{const b=$('usernameStatus');if(b){b.textContent='Username availability check could not be loaded.';b.style.color='#991b1b'}});
})();