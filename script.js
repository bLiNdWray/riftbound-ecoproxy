// script.js – Riftbound Eco Proxy (stripped counting logic)
(() => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  let allCards = [];

  // JSONP fetch helper
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

  // Load all cards
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
  });

  // Modal handlers
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Live search
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    renderSearchResults(
      allCards.filter(c => {
        return (
          (c.name  || '').toLowerCase().includes(q) ||
          (c.variantNumber || '').toLowerCase().includes(q)
        );
      })
    );
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').trim().toLowerCase();
      if (!['unit','spell','gear','battlefield','legend','rune'].includes(t)) return;
      const cardEl = {
        unit:        () => makeUnit(c),
        spell:       () => makeSpell(c),
        gear:        () => makeSpell(c),
        battlefield: () => makeBattlefield(c),
        legend:      () => makeLegend(c),
        rune:        () => makeRune(c),
      }[t]();
      cardEl.classList.add(t);
      results.appendChild(cardEl);
    });
  }

  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        const c = data[0];
        const t = (c.type||'').trim().toLowerCase();
        if (!['unit','spell','gear','battlefield','legend','rune'].includes(t)) return;
        const el = {
          unit:        () => makeUnit(c),
          spell:       () => makeSpell(c),
          gear:        () => makeSpell(c),
          battlefield: () => makeBattlefield(c),
          legend:      () => makeLegend(c),
          rune:        () => makeRune(c),
        }[t]();
        el.classList.add(t);
        container.appendChild(el);
      });
    });
  }

  // Expose for UI to hook into
  window.addCard    = vn => { renderCards([vn], false); return true; };
  window.removeCard = (vn,el) => { if (el&&el.parentNode) el.parentNode.removeChild(el); };

  // … the rest of your makeUnit/makeSpell/etc. and build() stay unchanged …

function makeUnit(c) {
  const el = document.createElement('div');
  el.className = 'card unit';
  el.innerHTML = `
    <img src="${c.imageUrl}" alt="${c.name}" />
    <div class="hover-bar">
      <button onclick="addCard('${c.variantNumber}')">＋</button>
      <button onclick="removeCard('${c.variantNumber}', this)">−</button>
    </div>
    <div class="qty-badge" data-variant="${c.variantNumber}">0</div>
    <div class="name">${c.name}</div>`;
  return el;
}

function makeSpell(c) {
  // similar to makeUnit, but adjust classes/details
  // …
}

function makeBattlefield(c) { /* … */ }
function makeLegend(c)      { /* … */ }
function makeRune(c)        { /* … */ }
  
})();
