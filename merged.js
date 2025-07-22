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

  // JSONP fetch helper
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 1e4);
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // Types and mapping
  const allowedTypes = ['unit', 'spell', 'gear', 'battlefield', 'legend', 'rune'];
  const typeClassMap = {
    unit: 'unit',
    spell: 'spell',
    gear: 'spell',
    battlefield: 'battlefield',
    legend: 'legend',
    rune: 'rune'
  };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // Description formatter
  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(c, i) {
      out = out.replace(new RegExp(`\\s*\\[${c}\\]\\s*`, 'gi'), i);
    }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col =>
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`)
    );
    return out.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }

  // Core builder
  function build(id, html) {
    const w = document.createElement('div');
    w.className = 'card';
    w.setAttribute('data-variant', id);
    w.insertAdjacentHTML('beforeend', html);

    const b = document.createElement('div');
    b.className = 'qty-badge';
    b.textContent = window.cardCounts[id] || 0;
    w.appendChild(b);

    const hb = document.createElement('div');
    hb.className = 'hover-bar';
    const a = document.createElement('button');
    const r = document.createElement('button');
    a.className = 'add-btn'; a.textContent = '+';
    r.className = 'remove-btn'; r.textContent = '−';
    hb.append(a, r);
    w.appendChild(hb);

    a.addEventListener('click', () => window.addCard(id));
    r.addEventListener('click', e => {
      e.stopPropagation();
      window.removeCard(id, w);
    });
    return w;
  }

  // Card builders (unit, spell, battlefield, legend, rune)
  function makeUnit(c) { /* ... */ }
  function makeSpell(c) { /* ... */ }
  function makeBattlefield(c) { /* ... */ }
  function makeLegend(c) { /* ... */ }
  function makeRune(c) { /* ... */ }

  // Render functions
  function renderSearchResults(list) { /* ... */ }
  function renderCards(ids, clear = true) { /* ... */ }

  // Add/Remove handlers
  window.addCard = vn => { /* ... */ };
  window.removeCard = (vn, el) => { /* ... */ };

  // Persistence
  function saveState() { /* ... */ }
  function loadState() { /* ... */ }

  // UI Helpers
  function refreshBadge(vn) { /* ... */ }
  function updateCount() { /* ... */ }

  // Search modal handlers
  openBtn.addEventListener('click', () => { /* ... */ });
  closeBtn.addEventListener('click', () => /* ... */ );
  input.addEventListener('input', () => { /* ... */ });

  // Import list handler
  importBtn.addEventListener('click', () => { /* ... */ });

  // Top-bar actions
  printBtn.addEventListener('click', () => { /* ... */ });
  fullProxyBtn.addEventListener('click', () => { /* ... */ });
  resetBtn.addEventListener('click', () => { /* ... */ });

  // Overview builder with guard
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) return prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = overlay.remove.bind(overlay);

    const order = ['legend','battlefield','rune','unit','spell'];
    const sections = {};

    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      if (!count) return;
      const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
      if (!cardEl) return;
      const cls = order.find(t => cardEl.classList.contains(t)) || 'unit';
      sections[cls] = sections[cls] || [];
      sections[cls].push(vn);
    });

    const listEl = document.getElementById('overview-list');
    order.forEach(type => {
      const vns = sections[type];
      if (!vns) return;
      const sec = document.createElement('div');
      sec.innerHTML = `<h3>${type.charAt(0).toUpperCase() + type.slice(1)}</h3>`;

      vns.forEach(vn => {
        const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
        if (!cardEl) return;
        const icons = Array.from(cardEl.querySelectorAll('.color-indicator .inline-icon'))
                          .map(i => i.outerHTML).join(' ');
        const name = cardEl.querySelector('.name')?.textContent || vn;
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <span class="overview-icon">${icons}</span>
          <span>${name} – ${vn}</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${window.cardCounts[vn]}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        sec.appendChild(row);
      });

      listEl.appendChild(sec);
    });

    listEl.querySelectorAll('.overview-inc').forEach(b =>
      b.addEventListener('click', () => window.addCard(b.dataset.vn))
    );
    listEl.querySelectorAll('.overview-dec').forEach(b =>
      b.addEventListener('click', () => window.removeCard(b.dataset.vn))
    );
  }
  btnOverview.addEventListener('click', buildOverview);

  // Observer & init
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
