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
      .map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // — Types —
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
    .map(s=>s.trim()).filter(Boolean);
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

  // — Public add/remove —
  function addCard(vn) {
    renderCards([vn], false);
    addedCounts[vn] = (addedCounts[vn]||0) + 1;
  }
  function removeCard(vn, el) {
    if ((addedCounts[vn]||0) > 0) {
      addedCounts[vn]--;
      el.remove();
    }
  }

  // — Builders — insert your HTML templates here
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
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

  // (Insert here your makeUnit, makeSpell, makeGear… functions calling build)

  // Expose to ui.js
  window.renderCards  = renderCards;
  window.addCard      = addCard;
  window.removeCard   = removeCard;

})();
