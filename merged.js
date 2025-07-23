// merged.js – Riftbound Eco Proxy with Full Proxy Toggle
(() => {
  // ── Constants & State ──────────────────────────────────────────────
  const API_BASE    = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME  = 'Riftbound Cards';
  const container   = document.getElementById('card-container');
  const openBtn     = document.getElementById('open-search');
  const closeBtn    = document.getElementById('close-search');
  const modal       = document.getElementById('search-modal');
  const input       = document.getElementById('card-search-input');
  const results     = document.getElementById('search-results');
  const importBtn   = document.getElementById('btn-import');
  const printBtn    = document.getElementById('btn-print');
  const fullProxyBtn= document.getElementById('btn-full-proxy');
  const resetBtn    = document.getElementById('btn-reset');
  const btnOverview = document.getElementById('btn-overview');

  window.cardCounts = {};
  window.fullProxy = false;

  // ── Sorted Insertion ────────────────────────────────────────────────
  const typeOrder = ['legend','battlefield','rune','unit','spell','gear'];
  function getType(el) {
    for (let t of typeOrder) if (el.classList.contains(t)) return t;
    return 'unit';
  }
  function getName(el) {
    let n = el.querySelector('.name');
    if (n && n.textContent) return n.textContent.trim();
    n = el.querySelector('.main-title');
    if (n && n.textContent) return n.textContent.trim();
    n = el.querySelector('.bf-name');
    if (n && n.textContent) return n.textContent.trim();
    n = el.querySelector('.rune-title');
    if (n && n.textContent) return n.textContent.trim();
    return '';
  }
  function insertSorted(el) {
    const newType = getType(el), newIdx = typeOrder.indexOf(newType);
    const children = Array.from(container.children);
    for (const child of children) {
      const childType = getType(child), childIdx = typeOrder.indexOf(childType);
      if (newIdx < childIdx) {
        container.insertBefore(el, child);
        return;
      }
      if (newIdx === childIdx) {
        if (getName(el).localeCompare(getName(child)) < 0) {
          container.insertBefore(el, child);
          return;
        }
      }
    }
    container.appendChild(el);
  }

  // ── JSONP Fetch ─────────────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random()*1e4);
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // ── Card Core ───────────────────────────────────────────────────────
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  function formatDescription(txt='') {
    let out = String(txt);
    function replaceCode(code, imgTag) {
      const re = new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi');
      out = out.replace(re, imgTag);
    }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out.replace(/>\\s+</g,'><').replace(/\\s{2,}/g,' ').trim();
  }

  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    // Insert full HTML (including image container)
    wrapper.insertAdjacentHTML('beforeend', html);
    // Quantity badge
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = window.cardCounts[id] || 0;
    wrapper.appendChild(badge);
    // Hover bar
    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button'); addBtn.className='add-btn'; addBtn.textContent='+';
    const remBtn = document.createElement('button'); remBtn.className='remove-btn'; remBtn.textContent='−';
    hoverBar.append(addBtn, remBtn);
    wrapper.appendChild(hoverBar);
    addBtn.addEventListener('click', ()=>window.addCard(id));
    remBtn.addEventListener('click', e=>{ e.stopPropagation(); window.removeCard(id, wrapper); });
    return wrapper;
  }

  // ── Builders with Image ─────────────────────────────────────────────
  function makeUnit(c) {
    const proxy = c.proxyImageUrl, full = c.variantImageUrl;
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean), costN=Number(c.energy)||0, powN=Number(c.power)||0;
    const costIcons = Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`).join('');
    const mightHTML = c.might?`<img src="images/SwordIconRB.png" class="might-icon"> ${c.might}`:'';
    const desc = formatDescription(c.description), tags=(c.tags||'').split(/;\\s*/).join(' ');
    const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon">`;
    return build(c.variantNumber,`
      <div class="card-image">
        <img class="card-img" src="${proxy}" data-proxy-art="${proxy}" data-full-art="${full}" alt="${c.name}">
      </div>
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span>${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span>${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeSpell(c) {
    const proxy = c.proxyImageUrl, full = c.variantImageUrl;
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean), costN=Number(c.energy)||0, powN=Number(c.power)||0;
    const costIcons=Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`).join('');
    const desc=formatDescription(c.description), tags=(c.tags||'').split(/;\\s*/).join(' ');
    const colorIcon=`<img src="images/${cols[0]||'Body'}.png" class="inline-icon">`;
    return build(c.variantNumber,`
      <div class="card-image">
        <img class="card-img" src="${proxy}" data-proxy-art="${proxy}" data-full-art="${full}" alt="${c.name}">
      </div>
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span>${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span>${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeBattlefield(c) {
    const proxy = c.proxyImageUrl, full = c.variantImageUrl;
    const desc = c.description || '';
    return build(c.variantNumber,`
      <div class="card-image">
        <img class="card-img" src="${proxy}" data-proxy-art="${proxy}" data-full-art="${full}" alt="${c.name}">
      </div>
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center"><div class="bf-type-text">${c.type.toUpperCase()}</div><div class="bf-name">${c.name}</div></div>
        <div class="bf-col side right"><div class="bf-text">${desc}</div></div>
      </div>
    `);
  }

  function makeLegend(c) {
    const proxy = c.proxyImageUrl, full = c.variantImageUrl;
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML=cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(' ');
    const parts=(c.name||'').split(',').map(s=>s.trim()), charName=parts[0], moniker=parts[1]||'';
    const body=formatDescription(c.description);
    return build(c.variantNumber,`
      <div class="card-image">
        <img class="card-img" src="${proxy}" data-proxy-art="${proxy}" data-full-art="${full}" alt="${c.name}">
      </div>
      <div class="legend-header"><div class="legend-icons">${iconsHTML}</div><div class="legend-title">LEGEND</div></div>
      <div class="legend-name"><div class="main-title">${charName}</div>${moniker?`<div class="subtitle">${moniker}</div>`:''}</div>
      <div class="legend-body"><div class="legend-body-text">${body}</div></div>
    `);
  }

  function makeRune(c) {
    const proxy = c.proxyImageUrl, full = c.variantImageUrl;
    const cols=(c.colors||'').split(/[;,]\s*/).filter(Boolean), img=cols[0]||'Body';
    return build(c.variantNumber,`
      <div class="card-image">
        <img class="card-img" src="${proxy}" data-proxy-art="${proxy}" data-full-art="${full}" alt="${c.name}">
      </div>
      <div class="rune-title">${c.name}</div>
      <div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>
    `);
  }

  // ── Rendering & Interactions ─────────────────────────────────────
  function renderSearchResults(list) { /* unchanged from original */ }
  function renderCards(ids, clear=true) { /* unchanged from original */ }

  window.addCard = vn => { /* unchanged */ };
  window.removeCard = (vn,el) => { /* unchanged */ };

  // ── Persistence & Helpers ────────────────────────────────────────────
  function saveState(){ /* unchanged */ }
  function loadState(){ /* unchanged */ }
  function refreshBadge(vn){ /* unchanged */ }
  function updateCount(){ /* unchanged */ }

  // ── Modal Setup (Search, Import, Overview) ───────────────────────────
  /* unchanged sections for search, import, overview */

  // ── Print ─────────────────────────────────────────────────────────────
  printBtn.addEventListener('click', () => { /* unchanged */ });

  // ── Toggle Full Proxy ────────────────────────────────────────────────
  fullProxyBtn.addEventListener('click', () => {
    window.fullProxy = !window.fullProxy;
    container.querySelectorAll('.card[data-variant]').forEach(card => {
      const img = card.querySelector('img.card-img');
      if (img) img.src = window.fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => { /* unchanged */ });

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => { updateCount(); Object.keys(window.cardCounts).forEach(refreshBadge); })
    .observe(container, { childList: true });
  document.addEventListener('DOMContentLoaded', () => { /* unchanged */ });
})();
