(function(){
  const SUPABASE_URL='https://jkqddapfluevbrzfdtsl.supabase.co';
  const SUPABASE_KEY='sb_publishable_Oq52s8TINBuJitmrbh0hag_vrPWHKXJ';
  const waitForSupabase=()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.supabase){clearInterval(t);resolve()}else if(++n>160){clearInterval(t);reject(new Error('Supabase client failed to load'))}},50)});
  const $=id=>document.getElementById(id);
  async function init(){
    const form=$('signup'),input=$('username');if(!form||!input)return;
    let box=$('usernameStatus');if(!box){box=document.createElement('div');box.id='usernameStatus';box.setAttribute('aria-live','polite');box.style.cssText='font-size:12px;line-height:1.5;margin-top:-10px;margin-bottom:2px;';input.parentElement.appendChild(box)}
    try{await waitForSupabase()}catch(e){box.textContent='';return}
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    let timer,seq=0,available=false;
    const show=(html,type)=>{box.innerHTML=html;box.style.color=type==='ok'?'#166534':type==='bad'?'#991b1b':'#64748b'};
    const check=async raw=>{const username=raw.trim().toLowerCase();available=false;if(!username){show('','');return false}if(!/^[a-z0-9_]{3,30}$/.test(username)){show('Use 3–30 letters, numbers or underscores.','bad');return false}const my=++seq;show('Checking username…','wait');
      let result=await client.rpc('is_username_available',{p_username:username});
      if(my!==seq)return false;
      if(result.error){show('Username availability is temporarily unavailable. You can continue and DRIGHT will verify it during signup.','wait');return true}
      if(result.data===true){available=true;show('✓ Username available to use','ok');return true}
      const candidates=[];for(const suffix of ['11','213','527','821','934','1203','2026','77','88','99']){if(candidates.length>=5)break;const candidate=username+suffix;const r=await client.rpc('is_username_available',{p_username:candidate});if(!r.error&&r.data)candidates.push(candidate)}
      const buttons=candidates.map(x=>'<button type="button" data-u="'+x+'" style="border:1px solid #e2e8f0;background:#fff;color:#334155;border-radius:8px;padding:4px 8px;margin:3px 3px 0 0;cursor:pointer;font-size:12px">'+x+'</button>').join('');show('✕ Username already exists.'+(buttons?'<div style="margin-top:4px">Available suggestions: '+buttons+'</div>':'<div style="margin-top:4px">Try adding numbers to create a unique username.</div>'),'bad');box.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{input.value=b.dataset.u;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus()});return false};
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>check(input.value),350)});input.addEventListener('blur',()=>check(input.value));
    form.addEventListener('submit',async e=>{const value=input.value.trim().toLowerCase();input.value=value;const ok=await check(value);if(!ok){e.preventDefault();e.stopImmediatePropagation();input.focus()}},true);
  }init();
})();