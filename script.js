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

function build(id, html) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.setAttribute('data-variant', id);
  wrapper.innerHTML = html;

  // Quantity badge in bottom-right
  const badge = document.createElement('div');
  badge.className = 'qty-badge';
  badge.textContent = addedCounts[id] || 0;
  wrapper.appendChild(badge);

  // Hover bar with add/remove buttons
  const hoverBar = document.createElement('div');
  hoverBar.className = 'hover-bar';
  const addBtn = document.createElement('button');
  addBtn.className = 'add-btn';
  addBtn.textContent = '+';
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '–';
  hoverBar.append(addBtn, removeBtn);
  wrapper.appendChild(hoverBar);

  // Event handlers
  addBtn.addEventListener('click', e => {
    e.stopPropagation();
    addCard(id);
    badge.textContent = addedCounts[id] || 0;
  });
  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    removeCard(id, wrapper);
    badge.textContent = addedCounts[id] || 0;
  });

  return wrapper;
}

// --- TOP BAR ELEMENTS ---
const btnAdd      = document.getElementById('btn-add');
const btnImport   = document.getElementById('btn-import');
const btnPrint    = document.getElementById('btn-print');
const btnOverview = document.getElementById('btn-overview');
const btnFull     = document.getElementById('btn-fullproxy');
const btnReset    = document.getElementById('btn-reset');
const totalCount  = document.getElementById('total-count');

// move Add Cards wiring
btnAdd.addEventListener('click', () => openBtn.click());

// IMPORT LIST (paste newline-separated IDs)
btnImport.addEventListener('click', () => {
  const list = prompt('Paste your list of variant IDs (comma or newline separated):');
  if (!list) return;
  const ids = list.split(/[\s,]+/).filter(Boolean);
  renderCards(ids, true);
  ids.forEach(id => addedCounts[id]=1);
  syncURL();
  updateCount();
});

// PRINT
btnPrint.addEventListener('click', () => {
  const dlg = document.createElement('div');
  dlg.innerHTML = '<button id="print-confirm">Print Now</button>';
  Object.assign(dlg.style, { position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', background:'#fff', padding:'20px', zIndex:3000 });
  document.body.appendChild(dlg);
  document.getElementById('print-confirm')
    .addEventListener('click', () => { window.print(); dlg.remove(); });
});

// OVERVIEW PANEL
const overview = document.createElement('div');
overview.id = 'overview-panel';
overview.style = 'position:fixed;top:64px;right:16px;width:300px;height:70%;background:#fff;overflow:auto;box-shadow:0 2px 6px rgba(0,0,0,0.3);z-index:2001;display:none;';
document.body.appendChild(overview);
btnOverview.addEventListener('click', () => {
  overview.innerHTML = '';
  // group by type in order
  ['legend','rune','unit','spell','gear','battlefield'].forEach(type => {
    const group = Array.from(container.querySelectorAll(`.card.${type}`));
    if (!group.length) return;
    const title = document.createElement('h4');
    title.textContent = type.charAt(0).toUpperCase()+type.slice(1);
    overview.appendChild(title);
    group.forEach(card => {
      const id = card.getAttribute('data-variant');
      const name = card.querySelector('.name, .legend-name .main-title, .rune-title').textContent;
      const entry = document.createElement('div');
      entry.innerHTML = `
        <span>${name}</span>
        <button class="ov-sub" data-id="${id}">–</button>
        <span>${addedCounts[id]||0}</span>
        <button class="ov-add" data-id="${id}">+</button>
      `;
      overview.appendChild(entry);
    });
  });
  overview.style.display = overview.style.display==='none'?'block':'none';
  // delegate add/subtract
  overview.querySelectorAll('.ov-add').forEach(b => b.onclick = e => {
    const id = e.target.dataset.id; addCard(id); updateCount(); syncURL();
  });
  overview.querySelectorAll('.ov-sub').forEach(b => b.onclick = e => {
    const id = e.target.dataset.id; const el = container.querySelector(`.card[data-variant="${id}"]`);
    removeCard(id, el); updateCount(); syncURL();
  });
});

// FULL PROXY (toggle image src)
let proxyMode = true;
btnFull.addEventListener('click', () => {
  proxyMode = !proxyMode;
  document.querySelectorAll('.card img').forEach(img => {
    img.src = proxyMode ? img.src.replace('/real/', '/proxy/') : img.src.replace('/proxy/', '/real/');
  });
  btnFull.textContent = proxyMode ? 'Full Proxy' : 'Real Images';
});

// RESET
btnReset.addEventListener('click', () => {
  container.innerHTML = '';
  addedCounts = {};
  syncURL();
  updateCount();
});

// URL sync & cache
function syncURL() {
  const ids = Object.keys(addedCounts).filter(id=>addedCounts[id]>0);
  history.replaceState(null,'','?id='+ids.join(','));
  localStorage.setItem('lastIds', ids.join(','));
}
function loadFromCache() {
  const cached = localStorage.getItem('lastIds');
  if (cached) {
    const ids = cached.split(',').filter(Boolean);
    renderCards(ids, true);
    ids.forEach(id=>addedCounts[id]=1);
    updateCount();
  }
}
window.addEventListener('load', loadFromCache);

// COUNT & notification
function updateCount() {
  const total = Object.values(addedCounts).reduce((sum,n)=>sum+n, 0);
  totalCount.textContent = `${total} card${total!==1?'s':''}`;
}
function notify(msg) {
  const n = document.createElement('div');
  n.textContent = msg;
  Object.assign(n.style, { position:'fixed', bottom:'80px', right:'20px', background:'#28a745', color:'#fff', padding:'8px 12px', borderRadius:'4px', opacity:1, transition:'opacity 0.5s' });
  document.body.appendChild(n);
  setTimeout(()=> n.style.opacity=0, 2000);
  setTimeout(()=> n.remove(), 2500);
}
// hook into addCard
const origAdd = addCard;
addCard = function(vn) {
  origAdd(vn);
  notify(`Added ${vn}`);
  updateCount();
  syncURL();
};


})();
