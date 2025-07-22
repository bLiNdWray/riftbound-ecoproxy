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

  // ── Card Rendering Core ─────────────────────────────────────────────
  const allowedTypes = ['unit', 'spell', 'gear', 'battlefield', 'legend', 'rune'];
  const typeClassMap = { unit: 'unit', spell: 'spell', gear: 'spell', battlefield: 'battlefield', legend: 'legend', rune: 'rune' };
  let allCards = [];

  // Load entire sheet
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // Helpers
  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(code, imgTag) {
      const re = new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi');
      out = out.replace(re, imgTag);
    }
    replaceCode('Tap', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body', 'Calm', 'Chaos', 'Fury', 'Mind', 'Order'].forEach(col => {
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();
  }

  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    wrapper.insertAdjacentHTML('beforeend', html);

    // Quantity badge
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = window.cardCounts[id] || 0;
    wrapper.appendChild(badge);

    // Hover controls
    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button');
    const remBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    remBtn.className = 'remove-btn'; remBtn.textContent = '−';
    hoverBar.append(addBtn, remBtn);
    wrapper.appendChild(hoverBar);

    addBtn.addEventListener('click', () => window.addCard(id));
    remBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.removeCard(id, wrapper);
    });

    return wrapper;
  }

  // Card builders
  function makeUnit(c) {
    const cols = (c.colors || '').split(/[;,]\s*/).filter(Boolean);
    const costN = Number(c.energy) || 0;
    const powN = Number(c.power) || 0;
    const costIcons = Array(powN).fill().map(() => `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');
    const mightHTML = c.might ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}` : '';
    const descHTML = formatDescription(c.description);
    const tags = (c.tags || '').split(/;\s*/).join(' ');
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
          ${colorIcon}<span class="color-text">${cols.join(' ')}</span>
        </div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}${tags?' - '+tags:''}</span>
      </div>
    `);
  }
  function makeSpell(c) {
    const cols = (c.colors || '').split(/[;,]\s*/).filter(Boolean);
    const costN = Number(c.energy) || 0;
    const powN = Number(c.power) || 0;
    const costIcons = Array(powN).fill().map(() => `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`).join('');
    const descHTML = formatDescription(c.description);
    const tags = (c.tags || '').split(/;\s*/).join(' ');
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
          ${colorIcon}<span class="color-text">${cols.join(' ')}</span>
        </div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}${tags?' - '+tags:''}</span>
      </div>
    `);
  }
  function makeBattlefield(c) {
    const desc = c.description || '';
    return build(c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type.toUpperCase()}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${desc}</div></div>
      </div>
    `);
  }
  function makeLegend(c) {
    const cols = (c.colors || '').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML = cols.map(col => `<img src="images/${col}.png" alt="${col}">`).join('');
    const [charName, moniker] = (c.name||'').split(',').map(s=>s.trim());
    const bodyHTML = formatDescription(c.description);
    return build(c.variantNumber, `
      <div class="legend-header">
        <div class="legend-icons">${iconsHTML}</div>
        <div class="legend-title">LEGEND</div>
      </div>
      <div class="legend-name">
        <div class="main-title">${charName}</div>
        ${moniker?`<div class="subtitle">${moniker}</div>`:''}
      </div>
      <div class="legend-body">
        <div class="legend-body-text">${bodyHTML}</div>
      </div>
    `);
  }
  function makeRune(c) {
    const cols = (c.colors || '').split(/[;,]\s*/).filter(Boolean);
    const img = cols[0] || 'Body';
    return build(c.variantNumber, `
      <div class="rune-title">${c.name}</div>
      <div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>
    `);
  }

  // ── Render ───────────────────────────────────────────────────────────
  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = ({ unit: makeUnit, spell: makeSpell, gear: makeSpell,
                    battlefield: makeBattlefield, legend: makeLegend, rune: makeRune })[t](c);
      el.classList.add(typeClassMap[t]);
      results.appendChild(el);
    });
  }
  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        const c = data[0], t = (c.type||'').trim().toLowerCase();
        if (!allowedTypes.includes(t)) return;
        const el = ({ unit: makeUnit, spell: makeSpell, gear: makeSpell,
                      battlefield: makeBattlefield, legend: makeLegend, rune: makeRune })[t](c);
        el.classList.add(typeClassMap[t]);
        container.appendChild(el);
      });
    });
  }

  // ── Add/Remove ───────────────────────────────────────────────────────
  window.addCard = function(vn) {
    renderCards([vn], false);
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    refreshBadge(vn);
    updateCount();
    saveState();
  };
  window.removeCard = function(vn, el) {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||0)-1, 0);
    refreshBadge(vn);
    updateCount();
    saveState();
  };

  // ── Persistence ──────────────────────────────────────────────────────
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try { window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}; }
    catch { window.cardCounts = {}; }
  }

  // ── UI Helpers ───────────────────────────────────────────────────────
  function refreshBadge(vn) {
    const badge = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);
    if (badge) badge.textContent = container.querySelectorAll(`.card[data-variant="${vn}"]`).length;
  }
  function updateCount() {
    const total = container.querySelectorAll('.card').length;
    document.getElementById('card-count').textContent = total + ' card' + (total!==1?'s':'');
  }

  // ── Search Modal ────────────────────────────────────────────────────
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = ''; results.innerHTML = ''; input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return results.innerHTML = '';
    renderSearchResults(
      allCards.filter(c => ((c.name||'').toLowerCase().includes(q) || (c.variantNumber||'').toLowerCase().includes(q)) && allowedTypes.includes((c.type||'').toLowerCase()))
    );
  });

  // ── Import List ─────────────────────────────────────────────────────
  importBtn.addEventListener('click', () => {
    const prev = document.getElementById('import-modal'); if (prev) prev.remove();
    const overlay = document.createElement('div'); overlay.id = 'import-modal'; overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok" class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const area = overlay.querySelector('#import-area');
    overlay.querySelector('#close-import').onclick = overlay.remove.bind(overlay);
    overlay.querySelector('#import-cancel').onclick = overlay.remove.bind(overlay);
    area.value = Object.keys(window.cardCounts).join(' ');
    overlay.querySelector('#import-ok').onclick = () => {
      if (overlay.querySelector('#import-clear').checked) {
        container.innerHTML = ''; window.cardCounts = {}; updateCount();
      }
      area.value.trim().split(/\s+/).forEach(tok => {
        const parts = tok.split('-'); if (parts.length>=2) window.addCard(parts[0]+'-'+parts[1]);
      });
      overlay.remove();
    };
  });

  // ── Top-Bar Actions ─────────────────────────────────────────────────
  printBtn.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none'; modal.classList.add('hidden');
    window.print(); setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });
  fullProxyBtn.addEventListener('click', () => { /* toggle fullProxy logic as before */ });
  resetBtn.addEventListener('click', () => { window.cardCounts = {}; container.innerHTML = ''; saveState(); updateCount(); });

  // ── Overview ────────────────────────────────────────────────────────
  function buildOverview() {
    const prev = document.getElementById('overview-modal'); if (prev) return prev.remove();
    const overlay = document.createElement('div'); overlay.id = 'overview-modal'; overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = overlay.remove.bind(overlay);
    const order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    const grp = {};
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      if (!count) return;
      const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
      const type = cardEl ? ( cardEl.classList.contains('legend')      ? 'Legend'
        : cardEl.classList.contains('rune')        ? 'Runes'
        : cardEl.classList.contains('battlefield') ? 'Battlefield'
        : cardEl.classList.contains('unit')        ? 'Units'
        : cardEl.classList.contains('spell')       ? 'Spells'
        : cardEl.classList.contains('gear')        ? 'Gear'
        : 'Other') : 'Other';
      grp[type] = grp[type]||{};
      grp[type][vn] = count;
    });
    const listEl = overlay.querySelector('#overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const section = document.createElement('div'); section.innerHTML = `<h3>${type}</h3>`;
      Object.entries(grp[type]).forEach(([vn, count]) => {
        const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
        const name = cardEl?.querySelector('.name')?.textContent||vn;
        const row = document.createElement('div'); row.className = 'overview-item';
        row.innerHTML = `
          <span>${name} (${vn})</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });
    listEl.querySelectorAll('.overview-inc').forEach(b => b.addEventListener('click', () => window.addCard(b.dataset.vn)));
    listEl.querySelectorAll('.overview-dec').forEach(b => b.addEventListener('click', () => window.removeCard(b.dataset.vn)));
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => { updateCount(); Object.keys(window.cardCounts).forEach(refreshBadge); })
    .observe(container, { childList: true });
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => { for (let i=0;i<c;i++) renderCards([vn], false); });
    updateCount();
  });
})();
