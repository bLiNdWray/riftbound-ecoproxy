// merged.js – Riftbound Eco Proxy
(() => {
  // ── Constants & State ──────────────────────────────────────────────
  const API_BASE      = 'https://script.google.com/macros/s/AKfycb.../exec';
  const SHEET_NAME    = 'Riftbound Cards';
  const container     = document.getElementById('card-container');
  const openBtn       = document.getElementById('open-search');
  const closeBtn      = document.getElementById('close-search');
  const modal         = document.getElementById('search-modal');
  const input         = document.getElementById('card-search-input');
  const results       = document.getElementById('search-results');
  const importBtn     = document.getElementById('btn-import');
  const printBtn      = document.getElementById('btn-print');
  const fullProxyBtn  = document.getElementById('btn-full-proxy');
  const resetBtn      = document.getElementById('btn-reset');
  const btnOverview   = document.getElementById('btn-overview');

  window.cardCounts = {};
  window.fullProxy  = false;

  // ── Sorted Insertion ────────────────────────────────────────────────
  const typeOrder = ['legend','battlefield','rune','unit','spell','gear'];
  function getType(el) {
    for (let t of typeOrder) if (el.classList.contains(t)) return t;
    return 'unit';
  }
  function getName(el) {
    let n = el.querySelector('.name')
         || el.querySelector('.main-title')
         || el.querySelector('.bf-title')
         || el.querySelector('.rune-title');
    return n && n.textContent.trim() || '';
  }
  function insertSorted(el) {
    const newType = getType(el), newIdx = typeOrder.indexOf(newType);
    for (const child of container.children) {
      const childType = getType(child), childIdx = typeOrder.indexOf(childType);
      if (newIdx < childIdx ||
         (newIdx === childIdx && getName(el).localeCompare(getName(child)) < 0)) {
        container.insertBefore(el, child);
        return;
      }
    }
    container.appendChild(el);
  }

  // ── JSONP Fetch Helper ─────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random()*1e4);
    params.sheet = SHEET_NAME;
    const qs = Object.entries(params)
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    document.head.appendChild(script);
  }

  // ── Description Formatter ──────────────────────────────────────────
  function formatDescription(txt = '') {
    let out = String(txt);
    const repl = (pat, img) => { out = out.replace(new RegExp(pat,'gi'), img); };
    repl('\\[Tap\\]',     `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    repl('\\[Might\\]',   `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    repl('\\[power\\]',   `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order']
      .forEach(col => repl(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`));
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  // ── Card Builder ────────────────────────────────────────────────────
  function build(id, html, proxyArt, fullArt) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.dataset.variant = id;

    // image: proxy vs real art
    wrapper.insertAdjacentHTML('beforeend', `
      <img
        class="card-img"
        src="${proxyArt}"
        data-proxy-art="${proxyArt}"
        data-full-art="${fullArt}"
        alt="proxy for ${id}"
      >
    `);

    // rest of template
    wrapper.insertAdjacentHTML('beforeend', html);

    // qty badge
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = window.cardCounts[id] || 0;
    wrapper.appendChild(badge);

    // hover +/-
    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = Object.assign(document.createElement('button'), { className:'add-btn',    textContent:'+' });
    const remBtn = Object.assign(document.createElement('button'), { className:'remove-btn', textContent:'−' });
    hoverBar.append(addBtn, remBtn);
    wrapper.appendChild(hoverBar);

    // listeners
    addBtn.addEventListener('click',  e => { e.stopPropagation(); addCard(id); });
    remBtn.addEventListener('click',  e => { e.stopPropagation(); removeCard(id, wrapper); });

    return wrapper;
  }

  // ── Type Factories ──────────────────────────────────────────────────
  function makeUnit(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const energy   = Number(c.energy)||0;
    const power    = Number(c.power)||0;
    const icons    = Array(power).fill().map(() =>
                     `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`
                   ).join('');
    const might    = c.might ? `<img src="images/SwordIconRB.png" class="might-icon"> ${c.might}` : '';
    const desc     = formatDescription(c.description);
    const tags     = (c.tags||'').split(/;\s*/).join(' ');
    const colorImg = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon">`;

    const html = `
      <div class="top-bar">
        <span class="cost">${energy}${icons}</span>
        <span class="might">${might}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
        <div class="color-indicator">${colorImg}<span>${cols.join(' ')}</span></div>
      </div>
      <div class="bottom-bar">
        <span>${c.type}${tags? ' - '+tags : ''}</span>
      </div>
    `;
    const el = build(c.variantNumber, html, proxyArt, fullArt);
    el.classList.add('unit');
    return el;
  }

  function makeSpell(c) {
    const proxyArt = c.proxyImageUrl, fullArt = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const energy   = Number(c.energy)||0;
    const power    = Number(c.power)||0;
    const icons    = Array(power).fill().map(() =>
                     `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`
                   ).join('');
    const desc     = formatDescription(c.description);
    const html = `
      <div class="top-bar">
        <span class="cost">${energy}${icons}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
      </div>
      <div class="bottom-bar">
        <span>${c.type}</span>
      </div>
    `;
    const el = build(c.variantNumber, html, proxyArt, fullArt);
    el.classList.add('spell');
    return el;
  }

  function makeBattlefield(c) {
    const proxyArt = c.proxyImageUrl, fullArt = c.variantImageUrl;
    const desc     = formatDescription(c.description);
    const html = `
      <div class="bf-col side left">
        <div class="bf-title">${c.name}</div>
        <div class="bf-text">${desc}</div>
      </div>
      <div class="bf-col side right">
        <div class="bf-text">${desc}</div>
      </div>
    `;
    const el = build(c.variantNumber, html, proxyArt, fullArt);
    el.classList.add('battlefield');
    return el;
  }

  function makeLegend(c) {
    const proxyArt = c.proxyImageUrl, fullArt = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const icons    = cols.map(col =>
                     `<img src="images/${col}.png" alt="${col}">`
                   ).join(' ');
    const parts    = c.name.split(',').map(s=>s.trim());
    const title    = parts[0], sub = parts[1]||'';
    const desc     = formatDescription(c.description);
    const html = `
      <div class="legend-header">
        <div class="legend-icons">${icons}</div>
        <div class="legend-title">LEGEND</div>
      </div>
      <div class="legend-name">
        <div class="main-title">${title}</div>
        ${sub? `<div class="subtitle">${sub}</div>` : ''}
      </div>
      <div class="legend-body">
        <div class="legend-body-text">${desc}</div>
      </div>
    `;
    const el = build(c.variantNumber, html, proxyArt, fullArt);
    el.classList.add('legend');
    return el;
  }

  function makeRune(c) {
    const proxyArt = c.proxyImageUrl, fullArt = c.variantImageUrl;
    const desc     = formatDescription(c.description);
    const html = `
      <div class="rune-image">
        <img src="images/Runes.png" alt="Rune">
      </div>
      <div class="rune-title">${c.name}</div>
      <div class="rune-desc">${desc}</div>
    `;
    const el = build(c.variantNumber, html, proxyArt, fullArt);
    el.classList.add('rune');
    return el;
  }

  // ── Fetch & Render ──────────────────────────────────────────────────
  function renderCards(list, clear=true) {
    if (clear) container.innerHTML = '';
    list.forEach(vn => {
      jsonpFetch({ id: vn }, data => {
        const c = Array.isArray(data) && data[0];
        if (!c) return;
        const t = (c.type||'').toLowerCase();
        let el;
        if (t==='unit')         el = makeUnit(c);
        else if (t==='spell'||t==='gear') el = makeSpell(c);
        else if (t==='battlefield')       el = makeBattlefield(c);
        else if (t==='legend')            el = makeLegend(c);
        else if (t==='rune')              el = makeRune(c);
        if (el) insertSorted(el);
      });
    });
  }

  // ── Add / Remove ───────────────────────────────────────────────────
  function addCard(vn) {
    window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
    renderCards([vn], false);
    refreshBadge(vn);
    updateCount();
    saveState();
  }

  function removeCard(vn, el) {
    if (el) el.remove();
    window.cardCounts[vn] = Math.max((window.cardCounts[vn]||1) - 1, 0);
    refreshBadge(vn);
    updateCount();
    saveState();
  }

  // ── Badges & Count ──────────────────────────────────────────────────
  function refreshBadge(vn) {
    container.querySelectorAll(`.card[data-variant="${vn}"] .qty-badge`)
      .forEach(b => b.textContent = window.cardCounts[vn]);
  }
  function updateCount() {
    const total = Object.values(window.cardCounts).reduce((a,b)=>a+b, 0);
    document.getElementById('card-count').textContent =
      `${total} card${total!==1?'s':''}`;
  }

  // ── Persistence ─────────────────────────────────────────────────────
  function saveState() {
    localStorage.setItem('riftboundCardCounts',
      JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try { window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts'))||{}; }
    catch { window.cardCounts = {}; }
  }

  // ── Search Modal ────────────────────────────────────────────────────
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim();
    results.innerHTML = '';
    if (!q) return;
    jsonpFetch({ name: q }, data => {
      data.forEach(c => {
        const t = (c.type||'').toLowerCase();
        if (!['unit','spell','gear','battlefield','legend','rune'].includes(t)) return;
        const item = document.createElement('div');
        item.className = `search-item ${t}`;
        item.innerHTML = `<span>${c.name}</span>
          <span class="qty-badge">${window.cardCounts[c.variantNumber]||0}</span>`;
        // reuse build hover buttons
        const add = item.querySelector('.add-btn');
        const rem = item.querySelector('.remove-btn');
        add.addEventListener('click', e => {
          e.stopPropagation(); addCard(c.variantNumber);
          item.querySelector('.qty-badge').textContent = window.cardCounts[c.variantNumber];
        });
        rem.addEventListener('click', e => {
          e.stopPropagation(); removeCard(c.variantNumber);
          item.querySelector('.qty-badge').textContent = window.cardCounts[c.variantNumber];
        });
        results.appendChild(item);
      });
    });
  });

  // ── Import List ─────────────────────────────────────────────────────
  importBtn.addEventListener('click', () => {
    const list = prompt('Enter variant numbers, comma-separated:');
    if (!list) return;
    renderCards(list.split(',').map(s=>s.trim()), true);
    modal.classList.add('hidden');
  });

  // ── Print ───────────────────────────────────────────────────────────
  printBtn.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    modal.classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  // ── Toggle Image Proxy ──────────────────────────────────────────────
  fullProxyBtn.addEventListener('click', () => {
    window.fullProxy = !window.fullProxy;
    fullProxyBtn.classList.toggle('active', window.fullProxy);
    container.querySelectorAll('img.card-img').forEach(img => {
      img.src = window.fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });

  // ── Reset ────────────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    window.cardCounts = {};
    container.innerHTML  = '';
    saveState();
    updateCount();
  });

  // ── Overview ─────────────────────────────────────────────────────────
  function buildOverview() {
    const groups = {};
    container.querySelectorAll('.card').forEach(c => {
      const vn = c.dataset.variant;
      const type = getType(c) + 's';
      groups[type] = groups[type]||{};
      groups[type][vn] = (groups[type][vn]||0) + window.cardCounts[vn];
    });
    // …render overview UI here…
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Init ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      for (let i = 0; i < count; i++) renderCards([vn], false);
    });
    updateCount();
  });
})();
