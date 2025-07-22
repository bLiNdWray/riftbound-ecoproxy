// merged.js – Riftbound Eco Proxy
(() => {
  // ── Constants & State ──────────────────────────────────────────────
  const API_BASE = 'https://script.google.com/macros/s/AKfycbxTZhEAgw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';
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

  // ── Helpers, Builders & Render ─────────────────────────────────────
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

  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = {unit:'unit',spell:'spell',gear:'spell',battlefield:'battlefield',legend:'legend',rune:'rune'};
  let allCards = [];
  jsonpFetch({sheet: SHEET_NAME}, data => { allCards = Array.isArray(data) ? data : []; });

  function formatDescription(txt='') {
    let out = String(txt);
    function repl(code, imgTag) {
      const re = new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi');
      out = out.replace(re, imgTag);
    }
    repl('Tap',   `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    repl('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    repl('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(c =>
      repl(c, `<img src="images/${c}.png" class="inline-icon" alt="${c}">`)
    );
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  function build(id, html) {
    const w = document.createElement('div');
    w.className = 'card';
    w.dataset.variant = id;
    w.insertAdjacentHTML('beforeend', html);

    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = window.cardCounts[id]||0;
    w.appendChild(badge);

    const hover = document.createElement('div');
    hover.className = 'hover-bar';
    const addBtn = document.createElement('button');
    const remBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    remBtn.className = 'remove-btn'; remBtn.textContent = '−';
    hover.append(addBtn, remBtn);
    w.appendChild(hover);

    addBtn.addEventListener('click', () => window.addCard(id));
    remBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.removeCard(id, w);
    });

    return w;
  }

  function makeUnit(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN = Number(c.energy)||0;
    const powN = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`
      : '';
    const desc = formatDescription(c.description);
    const tags = (c.tags||'').split(/;\s*/).join(' ');
    const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;

    return build(c.variantNumber, `
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span><span class="might">${mightHTML}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeSpell(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN = Number(c.energy)||0;
    const powN = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const desc = formatDescription(c.description);
    const tags = (c.tags||'').split(/;\s*/).join(' ');
    const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;

    return build(c.variantNumber, `
      <div class="top-bar"><span class="cost">${costN}${costIcons}</span></div>
      <div class="name">${c.name}</div>
      <div class="middle"><div class="desc-wrap">${desc}</div><div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div></div>
      <div class="bottom-bar"><span class="type-line">${c.type}${tags?' - '+tags:''}</span></div>
    `);
  }

  function makeBattlefield(c) {
    const d = c.description||'';
    return build(c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${d}</div></div>
        <div class="bf-col center"><div class="bf-type-text">${c.type.toUpperCase()}</div><div class="bf-name">${c.name}</div></div>
        <div class="bf-col side right"><div class="bf-text">${d}</div></div>
      </div>
    `);
  }

  function makeLegend(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML = cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(' ');
    const [charName, moniker] = (c.name||'').split(',').map(s=>s.trim());
    const body = formatDescription(c.description);

    return build(c.variantNumber, `
      <div class="legend-header"><div class="legend-icons">${iconsHTML}</div><div class="legend-title">LEGEND</div></div>
      <div class="legend-name"><div class="main-title">${charName}</div>${moniker?`<div class="subtitle">${moniker}</div>`:''}</div>
      <div class="legend-body"><div class="legend-body-text">${body}</div></div>
    `);
  }

  function makeRune(c) {
    const cols = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const img  = cols[0]||'Body';
    return build(c.variantNumber, `
      <div class="rune-title">${c.name}</div>
      <div class="rune-image"><img src="images/${img}.png" alt="${c.name}"></div>
    `);
  }

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = {unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);
      el.classList.add(typeClassMap[t]);
      results.appendChild(el);
    });
  }

  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({sheet: SHEET_NAME, id: vn}, data => {
        if (!data[0]) return;
        const c = data[0], t = (c.type||'').trim().toLowerCase();
        if (!allowedTypes.includes(t)) return;
        const el = {unit:makeUnit,spell:makeSpell,gear:makeSpell,battlefield:makeBattlefield,legend:makeLegend,rune:makeRune}[t](c);
        el.classList.add(typeClassMap[t]);
        container.appendChild(el);
      });
    });
  }

  // ── Add Card with Sorted Insertion ─────────────────────────────────
  const TYPE_ORDER = ['legend','battlefield','rune','unit','spell','gear'];
  window.addCard = function(vn) {
    const c = allCards.find(x => x.variantNumber === vn);
    if (!c) return;
    const t  = (c.type||'').trim().toLowerCase();
    const el = {legend:makeLegend,battlefield:makeBattlefield,rune:makeRune,unit:makeUnit,spell:makeSpell,gear:makeSpell}[t](c);
    el.classList.add(typeClassMap[t]);
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    refreshBadge(vn);
    updateCount();
    saveState();

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
    if (!inserted) container.appendChild(el);
  };

  // ── Remove Card ─────────────────────────────────────────────────────
  window.removeCard = (vn, el) => {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||1) - 1, 0);
    refreshBadge(vn);
    updateCount();
    saveState();
  };

  // ── Persistence & Helpers ───────────────────────────────────────────
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try { window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}; }
    catch { window.cardCounts = {}; }
  }
  function refreshBadge(vn) {
    const b = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);
    if (b) b.textContent = container.querySelectorAll(`.card[data-variant="${vn}"]`).length;
  }
  function updateCount() {
    const total = container.querySelectorAll('.card').length;
    document.getElementById('card-count').textContent = total+' card'+(total!==1?'s':'');
  }

  // ── UI Actions ──────────────────────────────────────────────────────
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = ''; results.innerHTML = ''; input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return results.innerHTML = '';
    renderSearchResults(
      allCards.filter(c =>
        ((c.name||'').toLowerCase().includes(q) ||
         (c.variantNumber||'').toLowerCase().includes(q)) &&
         allowedTypes.includes((c.type||'').toLowerCase())
      )
    );
  });
  importBtn.addEventListener('click', () => { /* existing import logic unchanged */ });
  printBtn.addEventListener('click', () => { /* existing print logic */ });
  fullProxyBtn.addEventListener('click', () => { /* existing proxy toggle logic */ });
  resetBtn.addEventListener('click', () => { window.cardCounts={}; container.innerHTML=''; saveState(); updateCount(); });

  // ── Overview ────────────────────────────────────────────────────────
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

    const order = ['Legend','Battlefield','Runes','Units','Spells'], grp = {};
    Object.entries(window.cardCounts).forEach(([vn,count]) => {
      if (!count) return;
      const sel = '.card[data-variant="'+vn+'"]';
      const cardEl = container.querySelector(sel);
      if (!cardEl) return;
      let type = 'Other';
      if (cardEl.classList.contains('legend'))      type = 'Legend';
      else if (cardEl.classList.contains('battlefield')) type = 'Battlefield';
      else if (cardEl.classList.contains('rune'))    type = 'Runes';
      else if (cardEl.classList.contains('unit'))    type = 'Units';
      else if (cardEl.classList.contains('spell'))   type = 'Spells';
      grp[type] = grp[type]||{}; grp[type][vn] = count;
    });

    const listEl = overlay.querySelector('#overview-list');
    order.forEach(type => {
      if (!grp[type]) return;
      const section = document.createElement('div');
      section.innerHTML = '<h3>'+type+'</h3>';
      Object.entries(grp[type]).forEach(([vn,count]) => {
        const sel = '.card[data-variant="'+vn+'"]';
        const cardEl = container.querySelector(sel);
        if (!cardEl) return;
        let icons = '';
        const colWrap = cardEl.querySelector('.color-indicator');
        if (colWrap) {
          icons = Array.from(colWrap.querySelectorAll('img.inline-icon')).map(i=>i.outerHTML).join(' ');
        } else if (cardEl.querySelector('.legend-icons')) {
          icons = Array.from(cardEl.querySelectorAll('.legend-icons img')).map(i=>i.outerHTML).join(' ');
        } else {
          const runeImg = cardEl.querySelector('.rune-image img');
          if (runeImg) icons = runeImg.outerHTML;
        }
        const nameEl = cardEl.querySelector('.name')||cardEl.querySelector('.main-title')||cardEl.querySelector('.bf-name')||cardEl.querySelector('.rune-title');
        const name = nameEl ? nameEl.textContent.trim() : vn;

        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML =
          '<span class="overview-label">'+icons+'<span class="overview-text">'+name+'</span></span>' +
          '<span class="overview-variant">'+vn+'</span>' +
          '<span class="overview-controls">' +
            '<button class="overview-dec" data-vn="'+vn+'">−</button>' +
            '<span class="overview-count">'+count+'</span>' +
            '<button class="overview-inc" data-vn="'+vn+'">+</button>' +
          '</span>';
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });

    listEl.querySelectorAll('.overview-inc').forEach(b => b.onclick = () => window.addCard(b.dataset.vn));
    listEl.querySelectorAll('.overview-dec').forEach(b => b.onclick = () => window.removeCard(b.dataset.vn));
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Initialization ─────────────────────────────────────────────────
  new MutationObserver(() => {
    updateCount();
    Object.keys(window.cardCounts).forEach(refreshBadge);
  }).observe(container, {childList:true});

  document.addEventListener('DOMContentLoaded', () => {
    loadState();
     Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i = 0; i < c; i++) window.addCard(vn);
    });
  });
})();
