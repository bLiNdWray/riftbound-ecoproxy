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
  window.fullProxy  = false;

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
      if (newIdx < childIdx || (newIdx === childIdx && getName(el).localeCompare(getName(child)) < 0)) {
        container.insertBefore(el, child);
        return;
      }
    }
    container.appendChild(el);
  }

  // ── JSONP Fetch ─────────────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random()*1e4);
    window[callbackName] = data => { delete window[callbackName]; document.head.removeChild(script); cb(data); };
    const qs = Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
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
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  // Enhanced build: accepts fullArtUrl
  function build(id, html, fullArtUrl) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);

    // Full-art image element
    const img = document.createElement('img');
    img.className = 'card-img hidden';
    img.src = fullArtUrl;
    img.dataset.fullArt = fullArtUrl;
    wrapper.appendChild(img);

    // Insert main HTML
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
    addBtn.className = 'add-btn';
    addBtn.textContent = '+';
    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn';
    remBtn.textContent = '−';
    hoverBar.append(addBtn, remBtn);
    wrapper.appendChild(hoverBar);

    addBtn.addEventListener('click', () => window.addCard(id));
    remBtn.addEventListener('click', e => { e.stopPropagation(); window.removeCard(id, wrapper); });
    return wrapper;
  }

  // Builder functions pass variantImageUrl
  function makeUnit(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean),
          costN = Number(c.energy)||0, powN   = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(()=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`
    ).join('');
    const mightHTML = c.might? `<img src="images/SwordIconRB.png" class="might-icon"> ${c.might}` : '';
    const desc = formatDescription(c.description),
          tags = (c.tags||'').split(/;\s*/).join(' ');
    const html = `
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
        <div class="color-indicator">
          <img src="images/${cols[0]||'Body'}.png" class="inline-icon"><span>${cols.join(' ')}</span>
        </div>
      </div>
      <div class="bottom-bar"><span>${c.type}${tags?' - '+tags:''}</span></div>`;
    return build(c.variantNumber, html, c.variantImageUrl);
  }

  function makeSpell(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean),
          costN = Number(c.energy)||0, powN   = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(()=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`
    ).join('');
    const desc = formatDescription(c.description),
          tags = (c.tags||'').split(/;\s*/).join(' ');
    const html = `
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
        <div class="color-indicator">
          <img src="images/${cols[0]||'Body'}.png" class="inline-icon"><span>${cols.join(' ')}</span>
        </div>
      </div>
      <div class="bottom-bar"><span>${c.type}${tags?' - '+tags:''}</span></div>`;
    return build(c.variantNumber, html, c.variantImageUrl);
  }

  function makeBattlefield(c) {
    const desc = c.description || '';
    const html = `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type.toUpperCase()}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${desc}</div></div>
      </div>`;
    return build(c.variantNumber, html, c.variantImageUrl);
  }

  function makeLegend(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean),
          iconsHTML = cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(''),
          parts = (c.name||'').split(',').map(s=>s.trim()),
          charName = parts[0], moniker = parts[1]||'';
    const body = formatDescription(c.description);
    const html = `
      <div class="legend-header">
        <div class="legend-icons">${iconsHTML}</div>
        <div class="legend-title">LEGEND</div>
      </div>
      <div class="legend-name">
        <div class="main-title">${charName}</div>
        ${moniker?`<div class="subtitle">${moniker}</div>`:''}
      </div>
      <div class="legend-body"><div class="legend-body-text">${body}</div></div>`;
    return build(c.variantNumber, html, c.variantImageUrl);
  }

  function makeRune(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean),
          img  = cols[0]||'Body';
    const html = `
      <div class="rune-title">${c.name}</div>
      <div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>`;
    return build(c.variantNumber, html, c.variantImageUrl);
  }

  // ── Rendering ───────────────────────────────────────────────────────
  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = ({ unit: makeUnit, spell: makeSpell, gear: makeSpell,
                    battlefield: makeBattlefield, legend: makeLegend, rune: makeRune })[t](c);
      el.classList.add(typeClassMap[t]);

      // replace default buttons with clean clones
      const oldAdd = el.querySelector('.add-btn'),
            newAdd = oldAdd.cloneNode(true);
      oldAdd.replaceWith(newAdd);
      const oldRem = el.querySelector('.remove-btn'),
            newRem = oldRem.cloneNode(true);
      oldRem.replaceWith(newRem);

      el.addEventListener('click', e => e.stopPropagation());

      const searchBadge = el.querySelector('.qty-badge');
      if (searchBadge) searchBadge.textContent = window.cardCounts[c.variantNumber] || 0;

      newAdd.addEventListener('click', e => {
        e.stopPropagation();
        window.addCard(c.variantNumber);
        if (searchBadge) searchBadge.textContent = window.cardCounts[c.variantNumber];
      });
      newRem.addEventListener('click', e => {
        e.stopPropagation();
        const mainCard = container.querySelector(`.card[data-variant="${c.variantNumber}"]`);
        if (mainCard) window.removeCard(c.variantNumber, mainCard);
        if (searchBadge) searchBadge.textContent = window.cardCounts[c.variantNumber] || 0;
      });

      results.appendChild(el);
    });
  }

  function renderCards(ids, clear=true) {
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
  window.addCard = vn => {
    renderCards([vn], false);
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    refreshBadge(vn);
    updateCount();
    saveState();
  };
  window.removeCard = (vn, el) => {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||1) - 1, 0);
    refreshBadge(vn);
    updateCount();
    saveState();
  };

  // ── Persistence & Helpers ────────────────────────────────────────────
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try { window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}; }
    catch { window.cardCounts = {}; }
  }
  function refreshBadge(vn) {
    const count = window.cardCounts[vn] || 0;
    container.querySelectorAll(`.card[data-variant="${vn}"] .qty-badge`)
             .forEach(b => b.textContent = count);
  }
  function updateCount() {
    const total = container.querySelectorAll('.card').length;
    document.getElementById('card-count').textContent = total + ' card' + (total!==1?'s':'');
  }

  // ── Search Modal ─────────────────────────────────────────────────────
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    const matches = allCards.filter(c => {
      const name = (c.name||'').toLowerCase();
      const vn   = (c.variantNumber||'').toLowerCase();
      return name.includes(q) || vn.includes(q);
    });
    renderSearchResults(matches);
  });

  // ── Import List ───────────────────────────────────────────────────────
  // ... your existing cleaned-up import code here ...

  // ── Print ─────────────────────────────────────────────────────────────
  printBtn.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    modal.classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  // ── Toggle Full Proxy ────────────────────────────────────────────────
  fullProxyBtn.addEventListener('click', () => {
    window.fullProxy = !window.fullProxy;
    fullProxyBtn.classList.toggle('active', window.fullProxy);
    container.querySelectorAll('img.card-img').forEach(img => {
      img.classList.toggle('hidden', !window.fullProxy);
    });
  });

  // ── Reset ─────────────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    window.cardCounts = {};
    container.innerHTML = '';
    saveState();
    updateCount();
  });

  // ── Overview ─────────────────────────────────────────────────────────
  function buildOverview() { /* your existing overview code */ }
  btnOverview.addEventListener('click', buildOverview);

  // ── Observer & Init ────────────────────────────────────────────────
  new MutationObserver(() => {
    updateCount();
    Object.keys(window.cardCounts).forEach(refreshBadge);
  }).observe(container, { childList: true });

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i=0; i<c; i++) renderCards([vn], false);
    });
    updateCount();
  });
})();
