// merged.js – Riftbound Eco Proxy
(() => {
  // ── Constants & State ──────────────────────────────────────────────
  const API_BASE     = 'https://script.google.com/macros/s/A...w51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
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

  let typeClassMap = {
    unit: 'unit',
    spell: 'spell',
    gear: 'spell',
    battlefield: 'battlefield',
    legend: 'legend',
    rune: 'rune',
  };

  window.cardCounts = {};

  // ── JSONP Fetch Helper ─────────────────────────────────────────────
  function jsonpFetch(params, cb) {
    const cbName = 'cb_' + Date.now();
    window[cbName] = data => { delete window[cbName]; document.head.removeChild(script); cb(data); };
    const qs = Object.entries(params).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${cbName}`;
    document.head.appendChild(script);
  }

  // ── Description Formatter ──────────────────────────────────────────
  function formatDescription(txt = '') {
    let out = String(txt);
    function replaceCode(code, imgTag) {
      const re = new RegExp(`\\s*${code}\\s*`, 'gi');
      out = out.replace(re, imgTag);
    }
    replaceCode('\\[Tap\\]', `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('\\[Might\\]', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('\\[power\\]', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  // ── Card Builder ────────────────────────────────────────────────────
  function build(id, html, proxyArt, fullArt) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);

    // 1) Image element (proxy vs real art)
    wrapper.insertAdjacentHTML('beforeend', `
      <img
        class="card-img"
        src="${proxyArt}"
        data-proxy-art="${proxyArt}"
        data-full-art="${fullArt}"
        alt="proxy for ${id}"
      >
    `);

    // 2) Rest of the card template
    wrapper.insertAdjacentHTML('beforeend', html);

    // 3) Quantity badge
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = window.cardCounts[id] || 0;
    wrapper.appendChild(badge);

    // 4) Hover bar with + / −
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

    // 5) Return it
    return wrapper;
  }

  // ── Card Type Factories ─────────────────────────────────────────────
  function makeUnit(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN    = Number(c.energy)||0;
    const powN     = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`).join('');
    const mightHTML = c.might ? `<img src="images/SwordIconRB.png" class="might-icon"> ${c.might}` : '';
    const desc      = formatDescription(c.description);
    const tags      = (c.tags||'').split(/;\s*/).join(' ');
    const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon">`;

    const html = `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
        <span class="might">${mightHTML}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
        <div class="color-indicator">${colorIcon}<span>${cols.join(' ')}</span></div>
      </div>
      <div class="bottom-bar">
        <span>${c.type}${tags ? ' - ' + tags : ''}</span>
      </div>
    `;
    return build(c.variantNumber, html, proxyArt, fullArt);
  }

  function makeSpell(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN    = Number(c.energy)||0;
    const powN     = Number(c.power)||0;
    const costIcons = Array(powN).fill().map(()=>`<img src="images/${cols[0]||'Body'}2.png" class="cost-icon">`).join('');
    const desc      = formatDescription(c.description);
    const html = `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${desc}</div>
      </div>
      <div class="bottom-bar">
        <span>${c.type}</span>
      </div>
    `;
    return build(c.variantNumber, html, proxyArt, fullArt);
  }

  function makeBattlefield(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const desc      = formatDescription(c.description);
    const html = `
      <div class="bf-container">
        <div class="bf-col side left">
          <div class="bf-title">${c.name}</div>
          <div class="bf-text">${desc}</div>
        </div>
        <div class="bf-col side right">
          <div class="bf-text">${desc}</div>
        </div>
      </div>
    `;
    return build(c.variantNumber, html, proxyArt, fullArt);
  }

  function makeLegend(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML= cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join(' ');
    const parts    = (c.name||'').split(',').map(s=>s.trim());
    const charName = parts[0], moniker = parts[1]||'';
    const body     = formatDescription(c.description);
    const html = `
      <div class="legend-header">
        <div class="legend-icons">${iconsHTML}</div>
        <div class="legend-title">LEGEND</div>
      </div>
      <div class="legend-name">
        <div class="main-title">${charName}</div>
        ${moniker ? `<div class="subtitle">${moniker}</div>` : ''}
      </div>
      <div class="legend-body">
        <div class="legend-body-text">${body}</div>
      </div>
    `;
    return build(c.variantNumber, html, proxyArt, fullArt);
  }

  function makeRune(c) {
    const proxyArt = c.proxyImageUrl;
    const fullArt  = c.variantImageUrl;
    const desc      = formatDescription(c.description);
    const html = `
      <div class="rune-image">
        <img src="images/Runes.png" alt="Rune">
      </div>
      <div class="rune-title">${c.name}</div>
      <div class="rune-desc">${desc}</div>
    `;
    return build(c.variantNumber, html, proxyArt, fullArt);
  }

  // ── Fetch & Render ──────────────────────────────────────────────────
  function renderCards(variants, clear = true) {
    if (clear) container.innerHTML = '';
    variants.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        const c = data[0];
        const t = (c.type||'').trim().toLowerCase();
        if (!typeClassMap[t]) return;
        const el = { 
          unit: makeUnit, spell: makeSpell, gear: makeSpell,
          battlefield: makeBattlefield, legend: makeLegend, rune: makeRune
        }[t](c);
        el.classList.add(typeClassMap[t]);
        insertSorted(el);
      });
    });
  }

  // ── Add / Remove ───────────────────────────────────────────────────
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

  // ── Badges & Count ──────────────────────────────────────────────────
  function refreshBadge(vn) {
    container.querySelectorAll(`.card[data-variant="${vn}"] .qty-badge`)
      .forEach(b => b.textContent = window.cardCounts[vn] || 0);
  }
  function updateCount() {
    const total = Array.from(container.querySelectorAll('.card')).reduce(
      (sum, card) => sum + (window.cardCounts[card.dataset.variant]||0), 0);
    document.getElementById('card-count').textContent = `${total} card${total !== 1 ? 's' : ''}`;
  }

  // ── State Persistence ───────────────────────────────────────────────
  function saveState(){
    localStorage.setItem('riftboundCardCounts',
      JSON.stringify(window.cardCounts));
  }
  function loadState(){
    try {
      window.cardCounts = JSON.parse(localStorage.getItem('riftboundCardCounts')) || {};
    } catch {
      window.cardCounts = {};
    }
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
    if (!q) { results.innerHTML = ''; return; }
    jsonpFetch({ sheet: SHEET_NAME, name: q }, data => {
      results.innerHTML = '';
      data.forEach(c => {
        const t = (c.type||'').trim().toLowerCase();
        if (!typeClassMap[t]) return;
        const el = document.createElement('div');
        el.className = `search-item ${typeClassMap[t]}`;
        el.innerHTML = `<span>${c.name}</span> <span class="qty-badge">${window.cardCounts[c.variantNumber]||0}</span>`;
        results.appendChild(el);

        // Remove default listeners and add fresh +/-
        const add = el.querySelector('.add-btn')?.cloneNode(true);
        const rem = el.querySelector('.remove-btn')?.cloneNode(true);
        el.querySelector('.add-btn')?.replaceWith(add);
        el.querySelector('.remove-btn')?.replaceWith(rem);
        add?.addEventListener('click', e => {
          e.stopPropagation();
          window.addCard(c.variantNumber);
          el.querySelector('.qty-badge').textContent = window.cardCounts[c.variantNumber];
        });
        rem?.addEventListener('click', e => {
          e.stopPropagation();
          window.removeCard(c.variantNumber, container.querySelector(`.card[data-variant="${c.variantNumber}"]`));
          el.querySelector('.qty-badge').textContent = window.cardCounts[c.variantNumber];
        });
        el.addEventListener('click', e => e.stopPropagation());
      });
    });
  });

  // ── Import List ─────────────────────────────────────────────────────
  importBtn.addEventListener('click', () => {
    const list = prompt('Enter variant numbers, comma-separated:');
    if (!list) return;
    renderCards(list.split(',').map(x=>x.trim()), true);
    modal.classList.add('hidden');
  });

  // ── Print ───────────────────────────────────────────────────────────
  printBtn.addEventListener(' click', () => {
    document.getElementById('top-bar').style.display = 'none';
    modal.classList.add('hidden');
    window.print();
    setTimeout(()=> document.getElementById('top-bar').style.display = '', 0);
  });

  // ── Toggle Image Proxy ──────────────────────────────────────────────
  fullProxyBtn.addEventListener('click', () => {
    window.fullProxy = !window.fullProxy;
    fullProxyBtn.classList.toggle('active', window.fullProxy);
    container.querySelectorAll('img.card-img').forEach(img => {
      img.src = window.fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });

  // ── Reset Counts ────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    window.cardCounts = {};
    container.innerHTML = '';
    saveState();
    updateCount();
  });

  // ── Overview ─────────────────────────────────────────────────────────
  function buildOverview() {
    const grp = {};
    document.querySelectorAll('.card').forEach(c => {
      const vn = c.dataset.variant;
      const type = c.classList.contains('unit') ? 'Units'
                  : c.classList.contains('spell') ? 'Spells'
                  : c.classList.contains('battlefield') ? 'Battlefields'
                  : c.classList.contains('legend') ? 'Legends'
                  : c.classList.contains('rune') ? 'Runes' : 'Other';
      grp[type] = grp[type] || {};
      grp[type][vn] = (grp[type][vn]||0) + window.cardCounts[vn];
    });
    // Render a modal or section here—left as your existing code…
  }
  btnOverview.addEventListener('click', buildOverview);

  // ── Observer & Init ─────────────────────────────────────────────────
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
