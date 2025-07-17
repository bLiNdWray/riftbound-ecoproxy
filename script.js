// script.js
(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'piltover_cards';  
  const container  = document.getElementById('card-container');

  const addedCounts = {};
  let allCards = [];

  // 1) Load all cards for search, ensure it's always an array
  async function loadAll() {
    const res  = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`);
    const data = await res.json();
    allCards = Array.isArray(data) ? data : Object.values(data);
  }
  await loadAll();

  // 2) Initial render from URL (?id=variantNumber)
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, true);
    initialIds.forEach(id => { addedCounts[id] = (addedCounts[id]||0) + 1 });
  }

  // 3) Placeholder→icon helper
  function formatDescription(text = '', colorCode) {
    return text
      .replace(/T:/g, `<img src="images/Tap.png" class="inline-icon" alt="T">`)
      .replace(/\bA\b/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="A">`)
      .replace(/\bS\b/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\bC\b/g, `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
  }

  // 4) Core render loop (fetches by variantNumber)
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let variant of ids) {
      const res  = await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&variantNumber=${encodeURIComponent(variant)}`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;
      const c = data[0];

      let cardEl;
      switch ((c.type || '').toLowerCase()) {
        case 'unit':        cardEl = makeUnit(c);        break;
        case 'spell':
        case 'gear':        cardEl = makeSpell(c);       break;
        case 'battlefield': cardEl = makeBattlefield(c); break;
        case 'legend':      cardEl = makeLegend(c);      break;
        case 'rune':        cardEl = makeRune(c);        break;
        default: continue;
      }
      container.appendChild(cardEl);
    }
  }

  function addCard(id) {
    renderCards([id], false);
    addedCounts[id] = (addedCounts[id]||0) + 1;
  }

  function removeCard(id, el) {
    if ((addedCounts[id]||0) > 0) {
      addedCounts[id]--;
      el.remove();
    }
  }

  // 5) Card builders using new CSV headers
  function makeUnit(c) {
    const colors       = (c.colors || '').split(',').map(s => s.trim());
    const primaryColor = colors[0] || '';
    const forceHTML    = c.power ? `<img src="images/${primaryColor}2.png" class="force-icon-alt">` : '';
    const mightHTML    = c.might ? `<img src="images/SwordIconRB.png" class="might-icon-alt"> ${c.might}` : '';
    const descHTML     = formatDescription(c.description, primaryColor);
    const tagText      = c.tags ? ` • ${c.tags}` : '';

    return build('unit-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt">${mightHTML}</span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${primaryColor}.png" class="color-icon-alt">
          <span class="color-text-alt">${primaryColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.type} — ${c.variantType}${tagText}</span>
      </div>`);
  }

  function makeSpell(c) {
    const colors       = (c.colors || '').split(',').map(s => s.trim());
    const primaryColor = colors[0] || '';
    const forceHTML    = c.power ? `<img src="images/${primaryColor}2.png" class="force-icon-alt">` : '';
    const descHTML     = formatDescription(c.description, primaryColor);

    return build('spell-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${primaryColor}.png" class="color-icon-alt">
          <span class="color-text-alt">${primaryColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.type} — ${c.variantType}</span>
      </div>`);
  }

  function makeBattlefield(c) {
    const descHTML = formatDescription(c.description, '');
    return build('battlefield', c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${descHTML}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${descHTML}</div></div>
      </div>`);
  }

  function makeLegend(c) {
    const colors   = (c.colors || '').split(',').map(s => s.trim());
    const descHTML = formatDescription(c.description, '');
    const tagText  = c.tags || '';
    return build('legend', c.variantNumber, `
      <div class="top-bar">
        <div class="legend-colors">
          ${colors.map(col => `<img src="images/${col}.png" class="legend-color-icon">`).join('')}
        </div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${tagText}</div>
        <div class="legend-name">${c.name}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p>${descHTML}</p>
      </div>`);
  }

  function makeRune(c) {
    const primaryColor = (c.colors || '').split(',')[0]?.trim() || '';
    return build('rune', c.variantNumber, `
      <div class="rune-top"><span class="rune-name">${c.name}</span></div>
      <div class="rune-middle">
        <img src="images/${primaryColor}.png" class="rune-icon">
      </div>`);
  }

  // 6) Generic builder: appends controls and badge
  function build(cssClass, variantNumber, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    el.style.position = 'relative';

    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    addBtn.onclick = () => addCard(variantNumber);

    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn'; remBtn.textContent = '–';
    remBtn.onclick = () => removeCard(variantNumber, el);

    const badge = document.createElement('div');
    badge.className = 'count-badge';
    badge.textContent = `Added: ${addedCounts[variantNumber]||0}`;

    el.append(addBtn, remBtn, badge);
    return el;
  }

  // 7) Search modal wiring with guarded filter
  const openBtn  = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const modal    = document.getElementById('search-modal');
  const input    = document.getElementById('card-search-input');
  const results  = document.getElementById('search-results');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) {
      results.innerHTML = '';
      return;
    }
    const filtered = allCards.filter(c => {
      const nm = (c.name           || '').toString().toLowerCase();
      const vn = (c.variantNumber || '').toString().toLowerCase();
      return nm.includes(q) || vn.includes(q);
    });
    renderSearch(filtered);
  });

  function renderSearch(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const el = (() => {
        const t = (c.type||'').toLowerCase();
        if (t==='unit')           return makeUnit(c);
        if (t==='spell'||t==='gear') return makeSpell(c);
        if (t==='battlefield')    return makeBattlefield(c);
        if (t==='legend')         return makeLegend(c);
        if (t==='rune')           return makeRune(c);
      })();
      results.appendChild(el);
    });
  }

})();
