// script.js – Riftbound Eco Proxy Core Logic
(() => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  // — DOM refs —
  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  // — Data store for master search list —
  let allCards = [];

  // — JSONP helper —
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random()*1e4);
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // — Allowed types & map to CSS class —
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = {
    unit: 'unit',
    spell: 'spell',
    gear: 'spell',
    battlefield: 'battlefield',
    legend: 'legend',
    rune: 'rune'
  };

  // — Load master list for search —
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
  });

  // — Initial URL load of cards —
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
  }

  // — Search modal handlers —
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // — Live search —
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '';
      return;
    }
    renderSearchResults(
      allCards.filter(c => {
        const nm = (c.name||'').toLowerCase().includes(q);
        const id = (c.variantNumber||'').toLowerCase().includes(q);
        const tp = allowedTypes.includes((c.type||'').toLowerCase());
        return (nm||id) && tp;
      })
    );
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
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
      results.appendChild(el);
    });
  }

  // — Core renderer —
  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        const c = data[0];
        const t = (c.type||'').trim().toLowerCase();
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

  // — Public add/remove for UI —
  function addCard(vn) {
    renderCards([vn], false);
    return true;
  }
  function removeCard(vn, el) {
    if (el && el.parentNode === container) {
      el.remove();
      return true;
    }
    return false;
  }

  // — Description formatter —
  function formatDescription(txt = '') {
    let out = String(txt);
    ;['Tap','Might','power','Body','Calm','Chaos','Fury','Mind','Order'].forEach(code => {
      const img = `<img src="images/${code.replace(/power/,'RainbowRune')}.png" class="inline-icon" alt="${code}">`;
      out = out.replace(new RegExp(`\\[${code}\\]`, 'gi'), img);
    });
    return out.trim();
  }

  // — Card builder & templates —
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.dataset.variant = id;
    wrapper.insertAdjacentHTML('beforeend', html);

    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = '0';
    wrapper.appendChild(badge);

    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    const rmBtn  = document.createElement('button');
    rmBtn.className = 'remove-btn'; rmBtn.textContent = '−';
    hoverBar.append(addBtn, rmBtn);
    wrapper.appendChild(hoverBar);

    addBtn.addEventListener('click', () => addCard(id));
    rmBtn.addEventListener('click', e => {
      e.stopPropagation();
      removeCard(id, wrapper);
    });

    return wrapper;
  }

  function makeUnit(c) {
    const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN     = Number(c.energy) || 0;
    const powN      = Number(c.power)  || 0;
    const costIcons = Array(powN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const descHTML  = formatDescription(c.description);
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${descHTML}</div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}</span>
      </div>`);
  }

  function makeSpell(c) {
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN    = Number(c.energy) || 0;
    const costIcons= Array(costN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const descHTML = formatDescription(c.description);
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${costIcons}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${descHTML}</div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}</span>
      </div>`);
  }

  function makeBattlefield(c) {
    const desc = c.description||'';
    return build(c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type.toUpperCase()}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${desc}</div></div>
      </div>`);
  }

  function makeLegend(c) {
    const cols     = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const icons    = cols.map(col=>`<img src="images/${col}.png" alt="${col}">`).join('');
    const [main, sub] = c.name.split(',').map(s=>s.trim());
    const bodyHTML = formatDescription(c.description);
    return build(c.variantNumber, `
      <div class="legend-header">
        <div class="legend-icons">${icons}</div>
      </div>
      <div class="legend-name">
        <div class="main-title">${main}</div>
        ${sub?`<div class="subtitle">${sub}</div>`:''}
      </div>
      <div class="legend-body">${bodyHTML}</div>`);
  }

  function makeRune(c) {
    const title = c.name||'';
    return build(c.variantNumber, `
      <div class="rune-title">${title}</div>
      <div class="rune-image"><img src="images/${(c.colors||'Body')} .png" alt="${title}"></div>`);
  }

  // — Expose for UI layer —
  window.renderCards  = renderCards;
  window.addCard      = addCard;
  window.removeCard   = removeCard;
})();
