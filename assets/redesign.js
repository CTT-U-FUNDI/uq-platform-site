const symbols = {
 grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
 wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-6 4h6v4h-6zM5 5V3h12v2"/>',
 chat:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z"/><path d="M7 9h10M7 13h6"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${symbols[name]}</svg>`;
function enhance(){
 const land=document.querySelector('.uq-land');
 if(!land || land.dataset.refreshed) return;
 land.dataset.refreshed='true';
 const visual=land.querySelector('.uq-land-hero-visual');
 visual.removeAttribute('aria-hidden');
 visual.innerHTML=`<div class="uq-scene"><img class="uq-scene-photo" src="./assets/architecture.jpg" alt="Architecture contemporaine, façades de verre tournées vers le ciel" width="1600" height="1067" fetchpriority="high"><div class="uq-scene-label"><span></span> CONSTRUIRE DEMAIN, ENSEMBLE</div><div class="uq-orbit-note">${icon('shield')}Une identité. Tout un écosystème.</div><div class="uq-glass"><div class="uq-glass-head">${icon('grid')}<div><strong>Votre univers UQ.</strong><small>Des outils connectés à votre quotidien</small></div><span class="uq-status">UN SEUL COMPTE</span></div><div class="uq-app-row">${icon('wallet')}<div><strong>BORB Wallet</strong><small>Votre portefeuille numérique</small></div><span>↗</span></div><div class="uq-app-row">${icon('chat')}<div><strong>UQ Chat & Mail</strong><small>Vos échanges, au même endroit</small></div><span>↗</span></div><div class="uq-app-row">${icon('shield')}<div><strong>UQ Auth</strong><small>Votre identité numérique sécurisée</small></div><span>↗</span></div></div><small class="uq-photo-credit">Photo : <a href="https://unsplash.com/photos/low-angle-photography-of-high-rise-buildings-PhYq704ffdA" target="_blank" rel="noopener noreferrer">Sean Pollock / Unsplash</a></small></div>`;
 const nav=land.querySelector('.uq-land-nav');
 nav.id='uq-main-navigation';nav.setAttribute('aria-label','Navigation principale');
 const toggle=document.createElement('button');toggle.className='uq-menu-toggle';toggle.type='button';toggle.setAttribute('aria-label','Ouvrir le menu');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',nav.id);toggle.innerHTML=icon('menu');
 const closeMenu=()=>{nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');};
 toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');});
 nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
 land.addEventListener('keydown',event=>{if(event.key==='Escape'){closeMenu();toggle.focus();}});
 land.querySelector('.uq-land-head').append(toggle);
 // Portrait Eliezer — section équipe
 const equipe=land.querySelector('.uq-land-equipe');
 if(equipe){
  const av=equipe.querySelector('.uq-land-equipe-avatar');
  if(av && !av.dataset.photo){
   av.dataset.photo='1';
   av.style.overflow='hidden';
   av.innerHTML='<img src="./assets/eliezer.jpeg" alt="Eliezer — fondateur UQ Platform" style="width:100%;height:100%;object-fit:cover;display:block">';
  }
 }
 const form=land.querySelector('.uq-land-contact-form');
 if(form){for(const [index,field] of [...form.querySelectorAll('input,textarea')].entries()){const label=document.createElement('label');field.id=`uq-contact-${index}`;label.htmlFor=field.id;label.textContent=field.placeholder;field.before(label);if(field.type==='email')field.autocomplete='email';if(field.type==='text')field.autocomplete='name';}}
}
new MutationObserver(enhance).observe(document.getElementById('root'),{childList:true,subtree:true});
enhance();
