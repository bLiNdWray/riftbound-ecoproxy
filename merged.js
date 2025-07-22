// merged.js – Riftbound Eco Proxy
(() => {
  // ── Constants & State (flattened) ───────────────────────────────────
  const API_BASE = 'https://script.google.com/macros/s/AKfycbxTZhEAgw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec',
        SHEET_NAME = 'Riftbound Cards';
  const container    = document.getElementById('card-container'),
        openBtn      = document.getElementById('open-search'),
        closeBtn     = document.getElementById('close-search'),
        modal        = document.getElementById('search-modal'),
        input        = document.getElementById('card-search-input'),
        results      = document.getElementById('search-results'),
        importBtn    = document.getElementById('btn-import'),
        printBtn     = document.getElementById('btn-print'),
        fullProxyBtn = document.getElementById('btn-full-proxy'),
        resetBtn     = document.getElementById('btn-reset'),
        btnOverview  = document.getElementById('btn-overview');
  window.cardCounts = {};

  // ── Helpers, Builders & Render (flattened) ─────────────────────────
  function jsonpFetch(params, cb){ /* ... unchanged ... */ }
  const allowedTypes  = ['unit','spell','gear','battlefield','legend','rune'],
        typeClassMap  = {unit:'unit',spell:'spell',gear:'spell',battlefield:'battlefield',legend:'legend',rune:'rune'};
  let allCards = [];
  jsonpFetch({sheet:SHEET_NAME}, data=>{ allCards = Array.isArray(data)? data : []; });
  function formatDescription(txt){ /* ... unchanged ... */ }
  function build(id, html){ /* ... unchanged ... */ }
  function makeUnit(c){ /* ... unchanged ... */ }
  function makeSpell(c){ /* ... unchanged ... */ }
  function makeBattlefield(c){ /* ... unchanged ... */ }
  function makeLegend(c){ /* ... unchanged ... */ }
  function makeRune(c){ /* ... unchanged ... */ }
  function renderSearchResults(list){ /* ... unchanged ... */ }
  function renderCards(ids, clear=true){ /* ... unchanged ... */ }

  // ── Add Card with Sorted Insertion (expanded) ───────────────────────
const TYPE_ORDER = ['legend','battlefield','rune','unit','spell','gear'];
  window.addCard = function(vn) {
    const c = allCards.find(x => x.variantNumber === vn);
    if (!c) return;
    // Build new card element
    const t  = (c.type||'').trim().toLowerCase();
    const el = {
      legend: makeLegend,
      battlefield: makeBattlefield,
      rune: makeRune,
      unit: makeUnit,
      spell: makeSpell,
      gear: makeSpell
    }[t](c);
    el.classList.add(typeClassMap[t]);
    // Update counts & badge
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    refreshBadge(vn);
    updateCount();
    saveState();
    // Insert in order
    let inserted = false;
    Array.from(container.children).forEach(existing => {
      if (inserted) return;
      const exType = TYPE_ORDER.find(type => existing.classList.contains(type)) || 'spell';
      const newIdx = TYPE_ORDER.indexOf(t);
      const exIdx  = TYPE_ORDER.indexOf(exType);
      if (exIdx > newIdx) {
        container.insertBefore(el, existing);
        inserted = true;
      } else if (exIdx === newIdx) {
        const exName = (existing.querySelector('.name, .main-title, .bf-name, .rune-title').textContent||'').toLowerCase();
        if (c.name.toLowerCase() < exName) {
          container.insertBefore(el, existing);
          inserted = true;
        }
      }
    });
    if (!inserted) {
      container.appendChild(el);
    }
  };

  // ── Remove Card (flattened) ─────────────────────────────────────────
  window.removeCard = (vn, el) => {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||1) - 1, 0);
    refreshBadge(vn);
    updateCount();
    saveState();
  };

  // ── Persistence & Helpers (flattened) ───────────────────────────────
  function saveState(){ /* ... unchanged ... */ }
  function loadState(){ /* ... unchanged ... */ }
  function refreshBadge(vn){ /* ... unchanged ... */ }
  function updateCount(){ /* ... unchanged ... */ }

  // ── UI Actions & Overview (flattened) ─────────────────────────────
  openBtn.addEventListener('click', ()=>{/* ... */});
  closeBtn.addEventListener('click', ()=>{/* ... */});
  input.addEventListener('input', ()=>{/* ... */});
  importBtn.addEventListener('click', ()=>{/* ... */});
  printBtn.addEventListener('click', ()=>{/* ... */});
  fullProxyBtn.addEventListener('click', ()=>{/* ... */});
  resetBtn.addEventListener('click', ()=>{/* ... */});
  btnOverview.addEventListener('click', buildOverview);

 // ── Overview ────────────────────────────────────────────────────────
  function buildOverview() {
    // remove existing modal
    const prev = document.getElementById('overview-modal');
    if (prev) { prev.remove(); return; }

    // create overlay + content
    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-content">' +
        '<button id="close-overview" class="modal-close">×</button>' +
        '<h2>Overview</h2>' +
        '<div id="overview-list"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    // wire close
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    // group cards by type
    const order = ['Legend','Battlefield','Runes','Units','Spells'];
    const grp = {};
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      if (!count) return;
      const sel = '.card[data-variant="' + vn + '"]';
      const cardEl = container.querySelector(sel);
      if (!cardEl) return;
      let type = 'Other';
      if (cardEl.classList.contains('legend'))      type = 'Legend';
      else if (cardEl.classList.contains('battlefield')) type = 'Battlefield';
      else if (cardEl.classList.contains('rune'))    type = 'Runes';
      else if (cardEl.classList.contains('unit'))    type = 'Units';
      else if (cardEl.classList.contains('spell'))   type = 'Spells';
      grp[type] = grp[type] || {};
      grp[type][vn] = count;
    });

    // build list
    const listEl = overlay.querySelector('#overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const section = document.createElement('div');
      section.innerHTML = '<h3>' + type + '</h3>';
      Object.entries(grp[type]).forEach(([vn, count]) => {
        const sel = '.card[data-variant="' + vn + '"]';
        const cardEl = container.querySelector(sel);
        if (!cardEl) return;

        // icons
        let icons = '';
        const colWrap = cardEl.querySelector('.color-indicator');
        if (colWrap) {
          icons = Array.from(colWrap.querySelectorAll('img.inline-icon')).map(i => i.outerHTML).join(' ');
        } else if (cardEl.querySelector('.legend-icons')) {
          icons = Array.from(cardEl.querySelectorAll('.legend-icons img')).map(i => i.outerHTML).join(' ');
        } else {
          const runeImg = cardEl.querySelector('.rune-image img');
          if (runeImg) icons = runeImg.outerHTML;
        }

        // name
        const nameEl = cardEl.querySelector('.name')
          || cardEl.querySelector('.main-title')
          || cardEl.querySelector('.bf-name')
          || cardEl.querySelector('.rune-title');
        const name = nameEl ? nameEl.textContent.trim() : vn;

        // row
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML =
          '<span class="overview-label">' + icons + '<span class="overview-text">' + name + '</span></span>' +
          '<span class="overview-variant">' + vn + '</span>' +
          '<span class="overview-controls">' +
            '<button class="overview-dec" data-vn="' + vn + '">−</button>' +
            '<span class="overview-count">' + count + '</span>' +
            '<button class="overview-inc" data-vn="' + vn + '">+</button>' +
          '</span>';
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });

    // wire controls
    listEl.querySelectorAll('.overview-inc').forEach(btn => btn.onclick = () => window.addCard(btn.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(btn => btn.onclick = () => window.removeCard(btn.dataset.vn));
  }
  btnOverview.addEventListener('click', buildOverview);
  
  // ── Initialization ─────────────────────────────────────────────────
  new MutationObserver(() => {/* ... */}).observe(container, {childList:true});
  document.addEventListener('DOMContentLoaded', () => {/* ... */});
})();
