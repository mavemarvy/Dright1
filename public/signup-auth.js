(function(){
  const SUPABASE_URL='https://jkqddapfluevbrzfdtsl2.supabase.co';
  const SUPABASE_KEY='sb_publishable_Oq52s8TINBuJitmrbh0hag_vrPWHKXJ';
  const wait=()=>new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.supabase){clearInterval(t);resolve()}else if(++n>100){clearInterval(t);reject(new Error('Supabase client failed to load'))}},50)});
  const $=id=>document.getElementById(id);
  function message(text,type){const el=$('message');if(!el)return;el.textContent=text;el.className='message show '+(type||'error')}
  function status(text,type){const el=$('usernameStatus');if(!el)return;el.textContent=text;el.style.color=type==='ok'?'#166534':type==='bad'?'#991b1b':'#64748b'}
  async function init(){
    if(!$('signup'))return;
    await wait();
    const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const username=$('username');let timer;let usernameAvailable=false;
    async function check(name){
      name=name.trim().toLowerCase();usernameAvailable=false;
      if(!/^[a-z0-9_]{3,30}$/.test(name)){if(name)status('Use 3–30 letters, numbers or underscores.','bad');else status('');return false}
      status('Checking username…');
      const {data,error}=await client.rpc('is_username_available',{p_username:name});
      if(error){status('Unable to check username right now.','bad');return false}
      if(data===true){usernameAvailable=true;status('✓ Username available','ok');return true}
      const suggestions=[];const bases=[name,name.replace(/_+$/,''),name+'dright'];
      for(let i=0;i<30&&suggestions.length<5;i++){
        const candidate=bases[i%bases.length]+(i<3?String([11,213,527][i]):String(Math.floor(100+Math.random()*900)));
        const r=await client.rpc('is_username_available',{p_username:candidate});
        if(!r.error&&r.data&&!suggestions.includes(candidate))suggestions.push(candidate)
      }
      const el=$('usernameStatus');if(el){el.innerHTML='✕ Username already taken. Try <span class="username-suggestions">'+suggestions.map(x=>'<button type="button" data-username="'+x+'" style="border:0;background:#f1f5f9;border-radius:8px;padding:5px 8px;margin:3px;cursor:pointer">'+x+'</button>').join('')+'</span>';el.style.color='#991b1b';el.querySelectorAll('[data-username]').forEach(b=>b.onclick=()=>{username.value=b.dataset.username;check(b.dataset.username)})}return false
    }
    username.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>check(username.value),350)});
    username.addEventListener('blur',()=>check(username.value));
    $('signup').addEventListener('submit',async e=>{
      e.preventDefault();
      if(username.value.trim()!==username.value.trim().toLowerCase())username.value=username.value.trim().toLowerCase();
      if(!await check(username.value)){username.focus();return}
      const p=$('password').value,c=$('confirm').value;
      if(p!==c){message('Passwords do not match.','error');$('confirm').focus();return}
      const btn=$('submit');btn.disabled=true;btn.textContent='Creating account…';
      try{
        const meta={username:username.value.trim().toLowerCase(),full_name:($('firstName').value.trim()+' '+$('lastName').value.trim()).trim(),first_name:$('firstName').value.trim(),last_name:$('lastName').value.trim(),date_of_birth:$('dob').value,country:$('countryValue').value,phone_code:$('phoneCode').textContent,phone:$('phone').value.trim(),address_line1:$('address1').value.trim(),address_line2:$('address2').value.trim(),region:$('state').value,city:$('city').value,postal_code:$('postal').value.trim()};
        const {data,error}=await client.auth.signUp({email:$('email').value.trim(),password:p,options:{data:meta,emailRedirectTo:location.origin+'/'}});
        if(error)throw error;
        if(data.session){message('Account created successfully. Redirecting to the marketplace…','success');location.href='/';}
        else{message('Account created. Check your email to verify your account, then sign in.','success');btn.disabled=false;btn.textContent='Create my DRIGHT account'}
      }catch(err){message(err.message||'Unable to create your account.','error');btn.disabled=false;btn.textContent='Create my DRIGHT account'}
    });
  }
  init().catch(err=>message(err.message||'Authentication service could not be loaded.','error'));
})();
