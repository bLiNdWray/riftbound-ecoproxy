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

  // Exposed counts
  window.cardCounts = {};

  // ── JSONP Fetch Helper ─────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    window[callbackName] = data => { delete window[callbackName]; document.head.removeChild(script); cb(data); };
    const qs = Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // ── Core Types ─────────────────────────────────────────────────────
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // ── Helpers ─────────────────────────────────────────────────────────
  function formatDescription(txt=''){
    let out = String(txt);
    function replaceCode(code,imgTag){ const re=new RegExp(`\\s*\\[${code}\\]\\s*`,'gi'); out=out.replace(re,imgTag); }
    replaceCode('Tap',  `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might',`<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power',`<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col=> replaceCode(col,`<img src="images/${col}.png" class="inline-icon" alt="${col}">`));
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  function build(id,html){
    const wrapper=document.createElement('div'); wrapper.className='card'; wrapper.dataset.variant=id;
    wrapper.insertAdjacentHTML('beforeend',html);
    const badge=document.createElement('div'); badge.className='qty-badge'; badge.textContent=window.cardCounts[id]||0; wrapper.appendChild(badge);
    const hover=document.createElement('div'); hover.className='hover-bar';
    const plus=document.createElement('button'); plus.className='add-btn'; plus.textContent='+';
    const minus=document.createElement('button'); minus.className='remove-btn'; minus.textContent='−';
    hover.append(plus,minus); wrapper.appendChild(hover);
    plus.addEventListener('click',()=>window.addCard(id));
    minus.addEventListener('click',e=>{ e.stopPropagation(); window.removeCard(id,wrapper); });
    return wrapper;
  }

  // ── Card Builders ───────────────────────────────────────────────────
  function makeUnit(c){
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN=Number(c.energy)||0, powN=Number(c.power)||0;
    const costIcons=Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');
    const mightHTML=c.might?`<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`:'';
    const desc=formatDescription(c.description);
    const tags=(c.tags||'').split(/;\s*/).join(' ');
    const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;
    return build(c.variantNumber,`
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeSpell(c){
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN=Number(c.energy)||0, powN=Number(c.power)||0;
    const costIcons=Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');
    const desc=formatDescription(c.description);
    const tags=(c.tags||'').split(/;\s*/).join(' ');
    const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;
    return build(c.variantNumber,`
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeBattlefield(c){
    const desc=c.description||'';
    return build(c.variantNumber,`
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center"><div class="bf-type-text">${c.type.toUpperCase()}</div><div class="bf-name">${c.name}</div></div>
        <div class="bf-col side right"><div class="bf-text">${desc}</div></div>
      </div>
    `);
  }

  function makeLegend(c){
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML=cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(' ');
    const [charName, moniker]=(c.name||'').split(',').map(s=>s.trim());
    const body=formatDescription(c.description);
    return build(c.variantNumber,`
      <div class="legend-header"><div class="legend-icons">${iconsHTML}</div><div class="legend-title">LEGEND</div></div>
      <div class="legend-name"><div class="main-title">${charName}</div>${moniker?`<div class="subtitle">${moniker}</div>`:''}</div>
      <div class="legend-body"><div class="legend-body-text">${body}</div></div>
    `);
  }

  function makeRune(c){
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const img=cols[0]||'Body';
    return build(c.variantNumber,`
      <div class="rune-title">${c.name}</div>
      <div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>
    `);
  }

  // ── Render ───────────────────────────────────────────────────────────
  function renderSearchResults(list){
    results.innerHTML='';
    list.forEach(c=>{
      const t=(c.type||'').trim().toLowerCase(); if(!allowedTypes.includes(t))return;
      const el={ unit:makeUnit, spell:makeSpell, gear:makeSpell, battlefield:makeBattlefield, legend:makeLegend, rune:makeRune }[t](c);
      el.classList.add(typeClassMap[t]); results.appendChild(el);
    });
  }

  function renderCards(ids,clear=true){
    if(clear)container.innerHTML='';
    ids.forEach(vn=>{
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data=>{
        if(!data[0])return; const c=data[0], t=(c.type||'').trim().toLowerCase();
        if(!allowedTypes.includes(t))return;
        const el={ unit:makeUnit, spell:makeSpell, gear:makeSpell, battlefield:makeBattlefield, legend:makeLegend, rune:makeRune }[t](c);
        el.classList.add(typeClassMap[t]); container.appendChild(el);
      });
    });
  }

  // ── Add/Remove ───────────────────────────────────────────────────────
  window.addCard=v=>{ renderCards([v],false); window.cardCounts[v]=(window.cardCounts[v]||0)+1; refreshBadge(v); updateCount(); saveState(); };
  window.removeCard=(v,el)=>{ if(el)el.remove(); window.cardCounts[v]=Math.max((window.cardCounts[v]||1)-1,0); refreshBadge(v); updateCount(); saveState(); };

  // ── Persistence & Helpers ─────────────────────────────────────────────
  function saveState(){localStorage.setItem('riftboundCardCounts',JSON.stringify(window.cardCounts));}
  function loadState(){try{window.cardCounts=JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}}catch{window.cardCounts={}}}
  function refreshBadge(v){ const b=container.querySelector(`.card[data-variant="${v}"] .qty-badge`); if(b)b.textContent=container.querySelectorAll(`.card[data-variant="${v}"]`).length; }
  function updateCount(){ const total=container.querySelectorAll('.card').length; document.getElementById('card-count').textContent=total+' card'+(total!==1?'s':''); }

  // ── UI Actions ───────────────────────────────────────────────────────
  openBtn.addEventListener('click',()=>{ modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; input.focus(); });
  closeBtn.addEventListener('click',()=>modal.classList.add('hidden'));
  input.addEventListener('input',()=>{ const q=input.value.trim().toLowerCase(); if(!q)return results.innerHTML=''; renderSearchResults(allCards.filter(c=>(c.name.toLowerCase().includes(q)||c.variantNumber.toLowerCase().includes(q))&&allowedTypes.includes(c.type.toLowerCase()))); });
  importBtn.addEventListener('click',()=>{ /* existing import logic unchanged */ });
  printBtn.addEventListener('click',()=>{ document.getElementById('top-bar').style.display='none'; modal.classList.add('hidden'); window.print(); setTimeout(()=>document.getElementById('top-bar').style.display='',0); });
  fullProxyBtn.addEventListener('click',()=>{ /* existing full proxy logic */ });
  resetBtn.addEventListener('click',()=>{ window.cardCounts={}; container.innerHTML=''; saveState(); updateCount(); });

  // ── Overview ────────────────────────────────────────────────────────
  function buildOverview(){
    const prev = document.getElementById('overview-modal');
    if (prev) return prev.remove();
    const overlay = document.createElement('div');
    overlay.id = 'overview-modal'; overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = overlay.remove.bind(overlay);

    const order = ['Legend','Battlefield','Runes','Units','Spells'];
    const grp = {};
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      if (!count) return;
      const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
      let type = 'Other';
      if (cardEl.classList.contains('legend')) type = 'Legend';
      else if (cardEl.classList.contains('battlefield')) type = 'Battlefield';
      else if (cardEl.classList.contains('rune')) type = 'Runes';
      else if (cardEl.classList.contains('unit')) type = 'Units';
      else if (cardEl.classList.contains('spell')) type = 'Spells';
      grp[type] = grp[type] || {};
      grp[type][vn] = count;
    });

    const listEl = overlay.querySelector('#overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const section = document.createElement('div');
      section.innerHTML = `<h3>${type}</h3>`;
      Object.entries(grp[type]).forEach(([vn, count]) => {
        const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
                // extract icons: color-indicator, legend-icons, or rune-image
        let icons = '';
        const colWrap = cardEl.querySelector('.color-indicator');
        if (colWrap) {
          icons = [...colWrap.querySelectorAll('img.inline-icon')]
            .map(i => i.outerHTML)
            .join(' ');
        } else {
          const lgWrap = cardEl.querySelector('.legend-icons');
          if (lgWrap) {
            icons = [...lgWrap.querySelectorAll('img')]
              .map(i => i.outerHTML)
              .join(' ');
          } else {
            const runeImg = cardEl.querySelector('.rune-image img');
            if (runeImg) icons = runeImg.outerHTML;
          }
        }
        // extract name with fallbacksEl = cardEl.querySelector('.name')
                      || cardEl.querySelector('.main-title')
                      || cardEl.querySelector('.bf-name')
                      || cardEl.querySelector('.rune-title');
        const name = nameEl ? nameEl.textContent.trim() : vn;
        const row = document.createElement('div'); row.className = 'overview-item';
        row.innerHTML = `
          <span class="overview-icons">${icons}</span> ${name} - ${vn}
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });

    // Wire inc/dec buttons
    listEl.querySelectorAll('.overview-inc').forEach(btn => btn.addEventListener('click', () => window.addCard(btn.dataset.vn)));
    listEl.querySelectorAll('.overview-dec').forEach(btn => btn.addEventListener('click', () => window.removeCard(btn.dataset.vn)));
  }
  btnOverview.addEventListener('click', buildOverview);('click', buildOverview);

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => {
    updateCount();
    Object.keys(window.cardCounts).forEach(refreshBadge);
  }).observe(container, { childList: true });

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i = 0; i < c; i++) renderCards([vn], false);
    });
    updateCount();
  });
})();
