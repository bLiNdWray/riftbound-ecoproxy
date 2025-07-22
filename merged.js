// merged.js – Riftbound Eco Proxy
(() => {
  // ── Constants & State ──────────────────────────────────────────────
  const API_BASE     = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME   = 'Riftbound Cards';
  const container    = document.getElementById('card-container');
  const openBtn      = document.getElementById('open-search');
  const closeBtn     = document.getElementById('close-search');
  const modal        = document.getElementById('search-modal');
  const input        = document.getElementById('card-search-input');
  const results      = document.getElementById('search-results');
  const importBtn    = document.getElementById('btn-import');
  const printBtn     = document.getElementById('btn-print');
  const fullProxyBtn = document.getElementById('btn-full-proxy');
  const resetBtn     = document.getElementById('btn-reset');
  const btnOverview  = document.getElementById('btn-overview');

  window.cardCounts = {};

  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    window[callbackName] = data => {
      delete window[callbackName]; document.head.removeChild(script); cb(data);
    };
    const qs = Object.entries(params).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  function formatDescription(txt=''){let out=String(txt); function replaceCode(c,i){out=out.replace(new RegExp(`\\s*\\[${c}\\]\\s*`,'gi'),i);} replaceCode('Tap',`<img src="images/Tap.png" class="inline-icon" alt="Tap">`); replaceCode('Might',`<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`); replaceCode('power',`<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`); ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(c=>replaceCode(c,`<img src="images/${c}.png" class="inline-icon" alt="${c}">`)); return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();}
  function build(id,html){const w=document.createElement('div');w.className='card';w.setAttribute('data-variant',id);w.insertAdjacentHTML('beforeend',html);const b=document.createElement('div');b.className='qty-badge';b.textContent=window.cardCounts[id]||0;w.appendChild(b);const hb=document.createElement('div');hb.className='hover-bar';const a=document.createElement('button'),r=document.createElement('button');a.className='add-btn';a.textContent='+';r.className='remove-btn';r.textContent='−';hb.append(a,r);w.appendChild(hb);a.addEventListener('click',()=>window.addCard(id));r.addEventListener('click',e=>{e.stopPropagation();window.removeCard(id,w);});return w;}

  function makeUnit(c){const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);const costN=Number(c.energy)||0;const powN=Number(c.power)||0;const costIcons=Array(powN).fill().map(_=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');const mightHTML=c.might?`<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`:'';const descHTML=formatDescription(c.description);const tags=(c.tags||'').split(/;\s*/).join(' ');const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;return build(c.variantNumber,`<div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div><div class="name">${c.name}</div><div class="middle"><div class="desc-wrap">${descHTML}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div><div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>`);}  
  function makeSpell(c){const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);const costN=Number(c.energy)||0;const powN=Number(c.power)||0;const costIcons=Array(powN).fill().map(_=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');const descHTML=formatDescription(c.description);const tags=(c.tags||'').split(/;\s*/).join(' ');const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;return build(c.variantNumber,`<div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might"></span></div><div class="name">${c.name}</div><div class="middle"><div class="desc-wrap">${descHTML}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div><div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>`);}  
  function makeBattlefield(c){const d=c.description||'';return build(c.variantNumber,`<div class="bf-columns"><div class="bf-col side left"><div class="bf-text">${d}</div></div><div class="bf-col center"><div class="bf-type-text">${c.type.toUpperCase()}</div><div class="bf-name">${c.name}</div></div><div class="bf-col side right"><div class="bf-text">${d}</div></div></div>`);}  
  function makeLegend(c){const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);const iconsHTML=cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join('');const [ch,mon]=(c.name||'').split(',').map(s=>s.trim());const bodyHTML=formatDescription(c.description);return build(c.variantNumber,`<div class="legend-header"><div class="legend-icons">${iconsHTML}</div><div class="legend-title">LEGEND</div></div><div class="legend-name"><div class="main-title">${ch}</div>${mon?`<div class="subtitle">${mon}</div>`:''}</div><div class="legend-body"><div class="legend-body-text">${bodyHTML}</div></div>`);}  
  function makeRune(c){const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);const img=cols[0]||'Body';return build(c.variantNumber,`<div class="rune-title">${c.name}</div><div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>`);}  

  function renderSearchResults(list){results.innerHTML='';list.forEach(c=>{const t=(c.type||'').trim().toLowerCase();if(!allowedTypes.includes(t))return;const el=({unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune})[t](c);el.classList.add(typeClassMap[t]);results.appendChild(el);});}  
  function renderCards(ids,clear=true){if(clear)container.innerHTML='';ids.forEach(vn=>{jsonpFetch({sheet:SHEET_NAME,id:vn},data=>{if(!Array.isArray(data)||!data[0])return;const c=data[0],t=(c.type||'').trim().toLowerCase();if(!allowedTypes.includes(t))return;const el=({unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune})[t](c);el.classList.add(typeClassMap[t]);container.appendChild(el);} );});}  

  window.addCard=v=>{renderCards([v],false);window.cardCounts[v]=(window.cardCounts[v]||0)+1;refreshBadge(v);updateCount();saveState();};window.removeCard=(v,el)=>{if(el)el.remove();window.cardCounts[v]=Math.max((window.cardCounts[v]||0)-1,0);refreshBadge(v);updateCount();saveState();};  
  function saveState(){localStorage.setItem('riftboundCardCounts',JSON.stringify(window.cardCounts));}function loadState(){try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}}catch{window.cardCounts={}}}function refreshBadge(v){const b=container.querySelector(`.card[data-variant="${v}"] .qty-badge`);if(b)b.textContent=container.querySelectorAll(`.card[data-variant="${v}"]`).length;}function updateCount(){const t=container.querySelectorAll('.card').length;document.getElementById('card-count').textContent=t+' card'+(t!==1?'s':'');}  
  openBtn.addEventListener('click',()=>{modal.classList.remove('hidden');input.value='';results.innerHTML='';input.focus();});closeBtn.addEventListener('click',()=>modal.classList.add('hidden'));input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();if(!q)return results.innerHTML='';renderSearchResults(allCards.filter(c=>((c.name||'').toLowerCase().includes(q)||(c.variantNumber||'').toLowerCase().includes(q))&&allowedTypes.includes((c.type||'').toLowerCase())));});  
  importBtn.addEventListener('click',()=>{const p=document.getElementById('import-modal');if(p)p.remove();const o=document.createElement('div');o.id='import-modal';o.className='modal-overlay';o.innerHTML=`<div class="modal-content"><button id="close-import" class="modal-close">×</button><h2>Import List</h2><textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea><label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label><div class="modal...
