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

  // Exposed counts (single source of truth)
  window.cardCounts = {};

  // ── JSONP Fetch Helper ──────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    window[callbackName] = data => { delete window[callbackName]; document.head.removeChild(script); cb(data); };
    const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // ── Card Rendering Core ─────────────────────────────────────────────
  const allowedTypes = ['unit', 'spell', 'gear', 'battlefield', 'legend', 'rune'];
  const typeClassMap = { unit: 'unit', spell: 'spell', gear: 'spell', battlefield: 'battlefield', legend: 'legend', rune: 'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // Helpers
  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(code, imgTag) {
      const re = new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi'); out = out.replace(re, imgTag);
    }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`));
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }
  function build(id, html) {
    const wrapper = document.createElement('div'); wrapper.className = 'card'; wrapper.dataset.variant = id;
    wrapper.insertAdjacentHTML('beforeend', html);
    const badge = document.createElement('div'); badge.className = 'qty-badge'; badge.textContent = window.cardCounts[id]||0; wrapper.appendChild(badge);
    const hover = document.createElement('div'); hover.className='hover-bar';
    const plus = document.createElement('button'); plus.className='add-btn'; plus.textContent='+';
    const minus = document.createElement('button'); minus.className='remove-btn'; minus.textContent='−';
    hover.append(plus, minus); wrapper.appendChild(hover);
    plus.onclick =()=>window.addCard(id); minus.onclick=e=>{e.stopPropagation(); window.removeCard(id,wrapper);};
    return wrapper;
  }
  function makeUnit(c){ /* as before */ return build(c.variantNumber,`...`);}  
  function makeSpell(c){ /* as before */ return build(c.variantNumber,`...`);}  
  function makeBattlefield(c){ /* as before */ return build(c.variantNumber,`...`);}  
  function makeLegend(c){ /* as before */ return build(c.variantNumber,`...`);}  
  function makeRune(c){ /* as before */ return build(c.variantNumber,`...`);}  

  // Render
  function renderSearchResults(list){ results.innerHTML=''; list.forEach(c=>{/* ... */}); }
  function renderCards(ids,clear=true){/* ... */}

  // Add/Remove
  window.addCard=(vn)=>{/* ... */}; window.removeCard=(vn,el)=>{/* ... */};

  // Persistence
  function saveState(){localStorage.setItem('riftboundCardCounts',JSON.stringify(window.cardCounts));}
  function loadState(){try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}}catch{window.cardCounts={}}}

  // UI Helpers
  function refreshBadge(vn){/* ... */} function updateCount(){/* ... */}

  // Search
  openBtn.onclick=()=>{/* ... */}; closeBtn.onclick=()=>modal.classList.add('hidden'); input.oninput=()=>{/* ... */};

  // Import
  importBtn.onclick=()=>{/* ... */};

  // Top-Bar
  printBtn.onclick=()=>{/* ... */}; fullProxyBtn.onclick=()=>{/* ... */}; resetBtn.onclick=()=>{/* ... */};

  // Overview
  function buildOverview(){
    const prev=document.getElementById('overview-modal'); if(prev)return prev.remove();
    const overlay=document.createElement('div'); overlay.id='overview-modal'; overlay.className='modal-overlay';
    overlay.innerHTML=`<div class="modal-content"><button id="close-overview" class="modal-close">×</button><h2>Overview</h2><div id="overview-list"></div></div>`;
    document.body.appendChild(overlay); overlay.querySelector('#close-overview').onclick=overlay.remove.bind(overlay);
    const order=['Legend','Battlefield','Runes','Units','Spells'];
    const grp={}; Object.entries(window.cardCounts).forEach(([vn,count])=>{if(!count)return; const cardEl=container.querySelector(`[data-variant="${vn}"]`); const type= cardEl.classList.contains('legend')?'Legend':cardEl.classList.contains('battlefield')?'Battlefield':cardEl.classList.contains('rune')?'Runes':cardEl.classList.contains('unit')?'Units':cardEl.classList.contains('spell')?'Spells':'Other'; grp[type]=grp[type]||{}; grp[type][vn]=count;});
    const listEl=overlay.querySelector('#overview-list'); order.forEach(type=>{if(!grp[type])return; const section=document.createElement('div'); section.innerHTML=`<h3>${type}</h3>`; Object.entries(grp[type]).forEach(([vn,count])=>{ const cardEl=container.querySelector(`[data-variant="${vn}"]`); const icons=[...cardEl.querySelectorAll('.color-indicator img.inline-icon')].map(i=>i.outerHTML).join(' '); const name=cardEl.querySelector('.name')?.textContent||vn; const row=document.createElement('div'); row.className='overview-item'; row.innerHTML=`<span class="overview-icons">${icons}</span> - ${name} - ${vn} <button class="overview-dec" data-vn="${vn}">−</button> <span class="overview-count">${count}</span> <button class="overview-inc" data-vn="${vn}">+</button>`; section.appendChild(row); }); listEl.appendChild(section); });
    listEl.querySelectorAll('.overview-inc').forEach(b=>b.onclick=()=>window.addCard(b.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(b=>b.onclick=()=>window.removeCard(b.dataset.vn));
  }
  btnOverview.onclick=buildOverview;

  // Init
  new MutationObserver(()=>{updateCount();Object.keys(window.cardCounts).forEach(refreshBadge);}).observe(container,{childList:true});
  document.addEventListener('DOMContentLoaded',()=>{ loadState(); Object.entries(window.cardCounts).forEach(([vn,c])=>{for(let i=0;i<c;i++) renderCards([vn],false);}); updateCount(); });
})();
