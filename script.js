// script.js – Riftbound Eco Proxy (tags separator update)
(() => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  let allCards = [];
  const addedCounts = {};

  // JSONP fetch helper
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

  // Allowed types & class map
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };

  // Load all cards
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // Initial URL load
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(id => addedCounts[id] = 1);
  }

  // Modal handlers
  openBtn.addEventListener('click', () => { modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; input.focus(); });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Live search
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML=''; return; }
    renderSearchResults(
      allCards.filter(c => {
        const nameMatch = (c.name||'').toLowerCase().includes(q);
        const idMatch   = (c.variantNumber||'').toLowerCase().includes(q);
        const typeMatch = allowedTypes.includes((c.type||'').toLowerCase());
        return (nameMatch||idMatch) && typeMatch;
      })
    );
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').toLowerCase(); if (!allowedTypes.includes(t)) return;
      const el = { unit:makeUnit, spell:makeSpell, gear:makeSpell, battlefield:makeBattlefield, legend:makeLegend, rune:makeRune }[t](c);
      el.classList.add(typeClassMap[t]);
      results.appendChild(el);
    });
  }

  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => jsonpFetch({ sheet:SHEET_NAME, id:vn }, data => {
      if (!Array.isArray(data)||!data[0]) return;
      const c = data[0]; const t = (c.type||'').toLowerCase(); if (!allowedTypes.includes(t)) return;
      const el = { unit:makeUnit, spell:makeSpell, gear:makeSpell, battlefield:makeBattlefield, legend:makeLegend, rune:makeRune }[t](c);
      el.classList.add(typeClassMap[t]);
      container.appendChild(el);
    }));
  }

  function addCard(vn) { renderCards([vn], false); addedCounts[vn] = (addedCounts[vn]||0)+1; }
  function removeCard(vn, el) { if ((addedCounts[vn]||0)>0) { addedCounts[vn]--; el.remove(); } }

  // Icon replacer
  function formatDescription(txt='', color) {
    let out = txt
      .replace(/\[Tap\]:/g, `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[Might\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`)
      .replace(/\[Rune\]/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="Rune">`)
      .replace(/\[S\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g, `<img src="images/${color}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(new RegExp(`\\[${col}\\]`, 'g'), `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out;
  }

  // Builders with dash separator
  // … your setup, jsonpFetch, allowedTypes, typeClassMap, etc. …

function makeUnit(c) {
  const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
  const costN     = Number(c.energy) || 0;
  const powN      = Number(c.power)  || 0;
  const costIcons = Array(powN).fill().map(_=>
    `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
  ).join('');
  const mightHTML = c.might
    ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`
    : '';
  const descHTML  = formatDescription(c.description, cols[0]||'');
  const tags      = (c.tags||'').split(/;\s*/).join(' ');
  const colorText = cols.join(' ');
  const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;

  return build(c.variantNumber, `
    <div class="top-bar">
      <span class="cost">${costN}${costIcons}</span>
      <span class="might">${mightHTML}</span>
    </div>
    <div class="name">${c.name}</div>
    <div class="middle">
      ${descHTML}
      <div class="color-indicator">
        ${colorIcon}<span class="color-text">${colorText}</span>
      </div>
    </div>
    <div class="bottom-bar">
      <span class="type-line">${c.type}${ tags ? ' - '+tags : '' }</span>
    </div>`);
}

function makeSpell(c) {
  const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
  const costN     = Number(c.energy) || 0;
  const powN      = Number(c.power)  || 0;
  const costIcons = Array(powN).fill().map(_=>
    `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
  ).join('');
  const descHTML  = formatDescription(c.description, cols[0]||'');
  const tags      = (c.tags||'').split(/;\s*/).join(' ');
  const colorText = cols.join(' ');
  const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;

  return build(c.variantNumber, `
    <div class="top-bar">
      <span class="cost">${costN}${costIcons}</span>
      <span class="might"></span>
    </div>
    <div class="name">${c.name}</div>
    <div class="middle">
      ${descHTML}
      <div class="color-indicator">
        ${colorIcon}<span class="color-text">${colorText}</span>
      </div>
    </div>
    <div class="bottom-bar">
      <span class="type-line">${c.type}${ tags ? ' - '+tags : '' }</span>
    </div>`);
}

  function makeBattlefield(c) {
    const desc = formatDescription(c.description, '');
    const tagsArr = c.tags?c.tags.split(/;\s*/):[];
    const tagsStr = tagsArr.length?` - ${tagsArr.join(' ')}`:'';
    return build(c.variantNumber, `
      <div class="bf-columns"><div class="bf-col side"><div class="bf-text">${desc}</div></div><div class="bf-col center"><div class="bf-type-text">${c.type}${tagsStr}</div><div class="bf-name">${c.name}</div></div><div class="bf-col side"><div class="bf-text">${desc}</div></div></div>`);
  }

  function makeLegend(c) {
  // Colors → icons
  const cols       = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
  const iconsHTML  = cols.map(col =>
    `<img src="images/${col}.png" alt="${col}">`
  ).join('');

  // Moniker above the name
  const subtitle   = c.variantType || '';   // e.g. “Volibear”
  const mainTitle  = c.name;                // e.g. “Relentless Storm”

  // Body description
  const bodyHTML   = formatDescription(c.description, cols[0]||'');

  return build(c.variantNumber, `
    <div class="legend-header">
      <div class="legend-icons">
        ${iconsHTML}
      </div>
      <div class="legend-title">LEGEND</div>
    </div>
    <div class="legend-name">
      <div class="subtitle">${subtitle}</div>
      <div class="main-title">${mainTitle}</div>
    </div>
    <div class="legend-body">${bodyHTML}</div>
  `);
}

  function makeRune(c) {
    const desc = formatDescription(c.description, '');
    const tagsArr = c.tags?c.tags.split(/;\s*/):[];
    const tagsStr = tagsArr.length?` - ${tagsArr.join(' ')}`:'';
    return build(c.variantNumber, `<div class="rune-body">${desc}</div><div class="bottom-bar"><span class="type-line">${c.type}${tagsStr}</span></div>`);
  }

  // Generic build
  function build(id, html) {
    const wrapper = document.createElement('div'); wrapper.className='card'; wrapper.setAttribute('data-variant',id); wrapper.innerHTML=html;
    const badge = document.createElement('div'); badge.className='qty-badge'; badge.textContent=addedCounts[id]||0; wrapper.appendChild(badge);
    wrapper.addEventListener('click',()=>{if(wrapper.classList.toggle('added')) addCard(id); else removeCard(id,wrapper); badge.textContent=addedCounts[id]||0;});
    return wrapper;
  }
})();
