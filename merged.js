// merged.js – Riftbound Eco Proxy
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

  // Exposed counts
  window.cardCounts = {};

  // ── Type Order & Sorted Insertion ─────────────────────────────────
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

  // ── JSONP Fetch Helper ─────────────────────────────────────────────
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

  // ── Card Rendering Core ────────────────────────────────────────────
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };
  let allCards = [];
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // Helpers to build card HTML
  function formatDescription(txt = '') { /* ... unchanged ... */ }
  function build(id, html) { /* ... unchanged ... */ }
  function makeUnit(c){ /* ... unchanged ... */ }
  function makeSpell(c){ /* ... unchanged ... */ }
  function makeBattlefield(c){ /* ... unchanged ... */ }
  function makeLegend(c){ /* ... unchanged ... */ }
  function makeRune(c){ /* ... unchanged ... */ }

  // ── Render Functions ────────────────────────────────────────────────
  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = ({ unit: makeUnit, spell: makeSpell, gear: makeSpell,
                    battlefield: makeBattlefield, legend: makeLegend, rune: makeRune })[t](c);
      el.classList.add(typeClassMap[t]);
      insertSorted(el);
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
        insertSorted(el);
      });
    });
  }

  // ── Add/Remove ───────────────────────────────────────────────────────
  window.addCard = function(vn) {
    renderCards([vn], false);
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    refreshBadge(vn); updateCount(); saveState();
  };
  window.removeCard = function(vn, el) {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||1) - 1, 0);
    refreshBadge(vn); updateCount(); saveState();
  };

  // ── Persistence & Helpers ─────────────────────────────────────────────
  function saveState() { localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts)); }
  function loadState() { try { window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}; } catch { window.cardCounts = {}; } }
  function refreshBadge(vn) { /* ... unchanged ... */ }
  function updateCount() { /* ... unchanged ... */ }

  // ── UI Actions ───────────────────────────────────────────────────────
  openBtn.addEventListener('click', () => { modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; input.focus(); });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Import List
  importBtn.addEventListener('click', () => {
    const prev = document.getElementById('import-modal');
    if (prev) return prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
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
        container.innerHTML = '';
        window.cardCounts = {};
        updateCount();
      }
      area.value.trim().split(/\s+/).forEach(tok => {
        const parts = tok.split('-');
        if (parts.length >= 2) window.addCard(parts[0] + '-' + parts[1]);
      });
      overlay.remove();
    };
  });

  // Print
  printBtn.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    modal.classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  // Toggle Full Proxy
  fullProxyBtn.addEventListener('click', () => {
    window.fullProxy = !window.fullProxy;
    container.querySelectorAll('.card[data-variant]').forEach(card => {
      const img = card.querySelector('img.card-img');
      if (!img) return;
      img.src = window.fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    window.cardCounts = {};
    container.innerHTML = '';
    saveState();
    updateCount();
  });

  // ── Overview ─────────────────────────────────────────────────────────
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) { prev.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'overview-modal'; overlay.className = 'modal-overlay';
    overlay.innerHTML =
      '<div class="modal-content">' +
        '<button id="close-overview" class="modal-close">×</button>' +
        '<h2>Overview</h2>' +
        '<div id="overview-list"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    const order = ['Legend','Battlefield','Runes','Units','Spells'];
    const grp = {};
    Object.entries(window.cardCounts).forEach(([vn,count]) => {
      if (!count) return;
      const cardEl = container.querySelector('.card[data-variant="' + vn + '"]');
      if (!cardEl) return;
      let type = 'Other';
      if (cardEl.classList.contains('legend')) type = 'Legend';
      else if (cardEl.classList.contains('battlefield')) type = 'Battlefield';
      else if (cardEl.classList.contains('rune')) type = 'Runes';
      else if (cardEl.classList.contains
('unit')) type = 'Units';
      else if (cardEl.classList.contains('spell')) type = 'Spells';
      grp[type] = grp[type]||{};
      grp[type][vn] = count;
    });

    const listEl = overlay.querySelector('#overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const section = document.createElement('div');
      section.innerHTML = '<h3>' + type + '</h3>';
      Object.entries(grp[type]).forEach(([vn,count]) => {
        const cardEl = container.querySelector('.card[data-variant="' + vn + '"]');
        if (!cardEl) return;

        // icons
        let icons = '';
        const colWrap = cardEl.querySelector('.color-indicator');
        if (colWrap) icons = Array.from(colWrap.querySelectorAll('img.inline-icon')).map(i=>i.outerHTML).join(' ');
        else {
          const lgWrap = cardEl.querySelector('.legend-icons');
          if (lgWrap) icons = Array.from(lgWrap.querySelectorAll('img')).map(i=>i.outerHTML).join(' ');
          else {
            const runeImg = cardEl.querySelector('.rune-image img');
            if (runeImg) icons = runeImg.outerHTML;
          }
        }

        // name
        const nameEl = cardEl.querySelector('.name') || cardEl.querySelector('.main-title')
                     || cardEl.querySelector('.bf-name') || cardEl.querySelector('.rune-title');
        const name = nameEl ? nameEl.textContent.trim() : vn;

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
        listEl.appendChild(row);
      });
    });

    listEl.querySelectorAll('.overview-inc').forEach(btn => btn.onclick = () => window.addCard(btn.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(btn => btn.onclick = () => window.removeCard(btn.dataset.vn));
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => { updateCount(); Object.keys(window.cardCounts).forEach(refreshBadge); })
    .observe(container, { childList: true });
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn,c]) => { for (let i=0;i<c;i++) renderCards([vn], false); });
    updateCount();
  });
})();
