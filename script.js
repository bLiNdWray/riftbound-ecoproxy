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
    // normalize once, up front
    const raw = (c.type||'').trim();
    const t   = raw.toLowerCase();
    if (!allowedTypes.includes(t)) return;

    // pick builder by lowercase key
    const el = {
      unit:        () => makeUnit(c),
      spell:       () => makeSpell(c),
      gear:        () => makeSpell(c),
      battlefield: () => makeBattlefield(c),
      legend:      () => makeLegend(c),
      rune:        () => makeRune(c),
    }[t]();

    // attach the correct CSS class
    el.classList.add(typeClassMap[t]);
    results.appendChild(el);
  });
}

function renderCards(ids, clear = true) {
  if (clear) container.innerHTML = '';
  ids.forEach(vn => {
    jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
      if (!Array.isArray(data) || !data[0]) return;
      const c   = data[0];
      const raw = (c.type||'').trim();
      const t   = raw.toLowerCase();
      if (!allowedTypes.includes(t)) return;

      const el = {
        unit:        () => makeUnit(c),
        spell:       () => makeSpell(c),
        gear:        () => makeSpell(c),
        battlefield: () => makeBattlefield(c),
        legend:      () => makeLegend(c),
        rune:        () => makeRune(c),
      }[t]();

      el.classList.add(typeClassMap[t]);
      container.appendChild(el);
    });
  });
}

  function addCard(vn) { renderCards([vn], false); addedCounts[vn] = (addedCounts[vn]||0)+1; }
  function removeCard(vn, el) { if ((addedCounts[vn]||0)>0) { addedCounts[vn]--; el.remove(); } }

 function formatDescription(txt = '', color) {
    let out = String(txt);

    function replaceCode(code, imgTag) {
      const re = new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi');
      out = out.replace(re, imgTag);
    }

    // Core symbols
    replaceCode('Tap',  `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power',  `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);

    // Elemental runes
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      const imgTag = `<img src="images/${col}.png" class="inline-icon" alt="${col}">`;
      replaceCode(col, imgTag);
    });

    // Collapse any stray inter-tag whitespace
    out = out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
    return out;
  }

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
     <div class="desc-wrap">${descHTML}</div>
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
    <div class="desc-wrap">${descHTML}</div>
      <div class="color-indicator">
        ${colorIcon}<span class="color-text">${colorText}</span>
      </div>
    </div>
    <div class="bottom-bar">
      <span class="type-line">${c.type}${ tags ? ' - '+tags : '' }</span>
    </div>`);
}

function makeBattlefield(c) {
  const desc = c.description || '';
  return build(c.variantNumber, `
    <div class="bf-columns">
      <div class="bf-col side left">
        <div class="bf-text">${desc}</div>
      </div>
      <div class="bf-col center">
        <div class="bf-type-text">${c.type.toUpperCase()}</div>
        <div class="bf-name">${c.name}</div>
      </div>
      <div class="bf-col side right">
        <div class="bf-text">${desc}</div>
      </div>
    </div>
  `);
}
 function makeLegend(c) {
  const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
  const iconsHTML = cols.map(col =>
    `<img src="images/${col}.png" alt="${col}">`
  ).join('');

  // Character name and moniker
  const [charName, moniker] = (c.name || '').split(',').map(s => s.trim());
  const mainTitle = charName || '';
  const subtitle  = moniker || '';  // moniker from variantType previously

  const bodyHTML  = formatDescription(c.description, cols[0]||'');

  return build(c.variantNumber, `
    <div class="legend-header">
      <div class="legend-icons">${iconsHTML}</div>
      <div class="legend-title">LEGEND</div>
    </div>
    <div class="legend-name">
      <div class="main-title">${mainTitle}</div>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    </div>
<div class="legend-body">
    <div class="legend-body-text">${bodyHTML}</div>
</div>
  `);
}
function makeRune(c) {
  const title = c.name || '';
  // Pull the first color (e.g. “Fury”, “Body”, etc.)
  const cols   = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
  const color  = cols[0] || 'Body';  
  // Use the color name to choose the image file
  const imgSrc = `images/${color}.png`;

  return build(c.variantNumber, `
    <div class="rune-title">${title}</div>
    <div class="rune-image">
      <img src="${imgSrc}" alt="${title}">
    </div>
  `);
}
// In script.js, replace the existing build() function with:

/**
 * Creates a card element in #card-container
 */
function build(id, html) {
  // 1) Create wrapper and preserve your template exactly
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.setAttribute('data-variant', id);
  // Insert your full template inside the wrapper
  wrapper.insertAdjacentHTML('beforeend', html);

  // 2) Quantity badge (styled by .qty-badge in card.css)
  const badge = document.createElement('div');
  badge.className = 'qty-badge';
  badge.textContent = addedCounts[id] || 0;
  wrapper.appendChild(badge);

  // 3) Hover-bar container (styled by .hover-bar)
  const hoverBar = document.createElement('div');
  hoverBar.className = 'hover-bar';

  // 4) “+” button (styled by .add-btn)
  const addBtn = document.createElement('button');
  addBtn.className = 'add-btn';
  addBtn.textContent = '+';

  // 5) “–” button (styled by .remove-btn)
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '−';

  // 6) Put buttons into the hover-bar and append
  hoverBar.append(addBtn, removeBtn);
  wrapper.appendChild(hoverBar);

  // 7) Route clicks through the shared global API
  addBtn.addEventListener('click', function(e) {
    
    window.addCard(id);
  });
  removeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    window.removeCard(id, wrapper);
  });

  return wrapper;
}

// -------------------------------------------------
// Expose to ui.js (must be before the IIFE closes)
// -------------------------------------------------
window.addCard    = addCard;
window.removeCard = removeCard;

})(); // <-- this closes your top-level IIFE
