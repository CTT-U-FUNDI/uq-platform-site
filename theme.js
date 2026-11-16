// Bascule sombre/clair — persiste en localStorage
(function(){
  const KEY='uq-theme';
  function apply(t){
    document.querySelectorAll('link[data-theme]').forEach(l=>l.remove());
    if(t==='light'){
      const l=document.createElement('link');
      l.rel='stylesheet';l.href='./site-light.css';l.setAttribute('data-theme','light');
      document.head.appendChild(l);
    }
    const b=document.getElementById('themeBtn');
    if(b)b.textContent=t==='light'?'☾':'☀';
  }
  function toggle(){
    const cur=localStorage.getItem(KEY)==='light'?'dark':'light';
    localStorage.setItem(KEY,cur);apply(cur);
  }
  window.uqTheme=toggle;
  // injecte le bouton flottant
  const b=document.createElement('button');
  b.id='themeBtn';b.type='button';b.setAttribute('aria-label','Changer de thème');
  b.textContent=localStorage.getItem(KEY)==='light'?'☾':'☀';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:200;width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:rgba(20,22,30,.8);backdrop-filter:blur(10px);color:#fff;font-size:1.15rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:.25s';
  b.onmouseenter=()=>b.style.transform='scale(1.08)';
  b.onmouseleave=()=>b.style.transform='';
  b.onclick=toggle;
  document.body.appendChild(b);
  apply(localStorage.getItem(KEY)==='light'?'light':'dark');
})();
