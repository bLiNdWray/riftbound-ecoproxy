// script.js – Riftbound Eco Proxy
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

  // — Data stores —
  let allCards     = [];
  const addedCounts = {};

  // — JSONP helper —
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

  // — Allowed types & class map —
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

  // — Initial URL load —
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'')
    .split(',')
    .map(s=>s.trim())
    .filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(id => addedCounts[id] = 1);
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
        const c   = data[0];
        const t   = (c.type||'').trim().toLowerCase();
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

  // — Public add/remove —
  function addCard(vn) {
    renderCards([vn], false);
    addedCounts[vn] = (addedCounts[vn]||0) + 1;
    return true;
  }
  function removeCard(vn, el) {
    if ((addedCounts[vn]||0) > 0) {
      addedCounts[vn]--;
      el.remove();
      return true;
    }
    return false;
  }

  // — Description formatter —
  function formatDescription(txt = '', color) {
    let out = String(txt);
    function replaceCode(code, imgTag) {
      out = out.replace(new RegExp(`\\s*\\[${code}\\]\\s*`, 'gi'), imgTag);
    }
    replaceCode('Tap',   `<img src="images/Tap.png" class="inline-icon" alt="Tap">`);
    replaceCode('Might', `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`);
    replaceCode('power', `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      replaceCode(col, `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out.replace(/>\s+</g,'><').replace(/\s{2,}/g,' ').trim();
  }

  // — Card builder & templates —
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.dataset.variant = id;
    wrapper.insertAdjacentHTML('beforeend', html);

    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = addedCounts[id] || 0;
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
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, cols[0]||'');
    const tags      = (c.tags||'').split(/;\s*/).join(' ');
    const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
        <span class="might">${mightHTML}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${descHTML}</div>
        <div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}${tags?' - '+tags:''}</span>
      </div>`);
  }

  function makeSpell(c) {
    const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN     = Number(c.energy) || 0;
    const powN      = Number(c.power)  || 0;
    const costIcons = Array(powN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const descHTML  = formatDescription(c.description, cols[0]||'');
    const colorIcon = `<img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt="">`;
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
        <div class="desc-wrap">${descHTML}</div>
        <div class="color-indicator">${colorIcon}<span class="color-text">${cols.join(' ')}</span></div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}</span>
      </div>`);
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
      </div>`);
  }

  function makeLegend(c) {
    const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const iconsHTML = cols.map(col => `<img src="images/${col}.png" alt="${col}">`).join('');
    const [charName, moniker] = (c.name||'').split(',').map(s=>s.trim());
    const bodyHTML  = formatDescription(c.description, cols[0]||'');
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
      </div>`);
  }

  function makeRune(c) {
    const title = c.name || '';
    const cols  = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const imgSrc= `images/${cols[0]||'Body'}.png`;
    return build(c.variantNumber, `
      <div class="rune-title">${title}</div>
      <div class="rune-image"><img src="${imgSrc}" alt="${title}"></div>`);
  }

  // — Expose to ui.js —
  window.renderCards  = renderCards;
  window.addCard      = addCard;
  window.removeCard   = removeCard;
})();
