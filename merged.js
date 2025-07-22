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
  function formatDescription(txt = '') {
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
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    wrapper.insertAdjacentHTML('beforeend', html);
    const badge = document.createElement('div'); badge.className = 'qty-badge'; badge.textContent = window.cardCounts[id] || 0;
    wrapper.appendChild(badge);
    const hoverBar = document.createElement('div'); hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button'); addBtn.className = 'add-btn'; addBtn.textContent = '+';
    const remBtn = document.createElement('button'); remBtn.className = 'remove-btn'; remBtn.textContent = '−';
    hoverBar.append(addBtn, remBtn); wrapper.appendChild(hoverBar);
    addBtn.addEventListener('click', () => window.addCard(id));
    remBtn.addEventListener('click', e => { e.stopPropagation(); window.removeCard(id, wrapper); });
    return wrapper;
  }
  // Definitions for makeUnit, makeSpell, makeBattlefield, makeLegend, makeRune remain unchanged

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
  function refreshBadge(vn) { const b = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`); if (b) b.textContent = container.querySelectorAll(`.card[data-variant="${vn}"]`).length; }
  function updateCount() { const total = container.querySelectorAll('.card').length; document.getElementById('card-count').textContent = total + ' card' + (total!==1?'s':''); }

  // ── UI Actions (search, import, print, proxy, reset) ──────────────────
  openBtn.addEventListener('click', () => { modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; input.focus(); });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase(); if (!q) return results.innerHTML = '';
    renderSearchResults(allCards.filter(c => ((c.name||'').toLowerCase().includes(q) || (c.variantNumber||'').toLowerCase().includes(q)) && allowedTypes.includes((c.type||'').toLowerCase())));
  });
  importBtn.addEventListener('click', /* import logic unchanged */);
  printBtn.addEventListener('click', () => { document.getElementById('top-bar').style.display='none'; modal.classList.add('hidden'); window.print(); setTimeout(() => document.getElementById('top-bar').style.display='', 0); });
  fullProxyBtn.addEventListener('click', /* full proxy logic unchanged */);
  resetBtn.addEventListener('click', () => { window.cardCounts = {}; container.innerHTML = ''; saveState(); updateCount(); });

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
      const selector = '.card[data-variant="' + vn + '"]';
      const cardEl = container.querySelector(selector);
      if (!cardEl) return;
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
      const section = document.createElement('div'); section.innerHTML = '<h3>' + type + '</h3>';
      Object.entries(grp[type]).forEach(([vn,count]) => {
        const selector = '.card[data-variant="' + vn + '"]';
        const cardEl = container.querySelector(selector);
        if (!cardEl) return;
        let icons = '';
        const colWrap = cardEl.querySelector('.color-indicator');
        if (colWrap) icons = Array.from(colWrap.querySelectorAll('img.inline-icon')).map(i => i.outerHTML).join(' ');
        else {
          const lgWrap = cardEl.querySelector('.legend-icons');
          if (lgWrap) icons = Array.from(lgWrap.querySelectorAll('img')).map(i => i.outerHTML).join(' ');
          else {
            const runeImg = cardEl.querySelector('.rune-image img');
            if (runeImg) icons = runeImg.outerHTML;
          }
        }
        const nameEl = cardEl.querySelector('.name') || cardEl.querySelector('.main-title') || cardEl.querySelector('.bf-name') || cardEl.querySelector('.rune-title');
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
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });
    listEl.querySelectorAll('.overview-inc').forEach(btn => btn.onclick = () => window.addCard(btn.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(btn => btn.onclick = () => window.removeCard(btn.dataset.vn));
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => { updateCount(); Object.keys(window.cardCounts).forEach(refreshBadge); }).observe(container, { childList: true });
  document.addEventListener('DOMContentLoaded', () => { loadState(); Object.entries(window.cardCounts).forEach(([vn,c]) => { for (let i=0;i<c;i++) renderCards([vn], false); }); updateCount(); });
})();
