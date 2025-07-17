// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'piltover_cards';  // if your Apps Script sheet param is 'piltover_cards'
  const container = document.getElementById('card-container');

  const addedCounts = {};
  let allCards = [];

  // Load entire CSV via your Apps Script API
  async function loadAll() {
    allCards = await (await fetch(
      `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`
    )).json();
  }
  await loadAll();

  // Initial render from URL (?id=variantNumber)
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, true);
    initialIds.forEach(id => { addedCounts[id] = (addedCounts[id]||0) + 1 });
  }

  // Replace placeholders in description text
  function formatDescription(text, colorCode) {
    return text
      .replace(/T:/g, `<img src="images/Tap.png" class="inline-icon" alt="T">`)
      .replace(/\bA\b/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="A">`)
      .replace(/\bS\b/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\bC\b/g, `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
  }

  // Render a list of variantNumbers onto the page
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let variant of ids) {
      const [c] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&variantNumber=${encodeURIComponent(variant)}`
      )).json();
      if (!c) continue;

      let cardEl;
      const t = (c.type||'').toLowerCase();
      if (t === 'unit')           cardEl = makeUnit(c);
      else if (t === 'spell' || t === 'gear') cardEl = makeSpell(c);
      else if (t === 'battlefield') cardEl = makeBattlefield(c);
      else if (t === 'legend')      cardEl = makeLegend(c);
      else if (t === 'rune')        cardEl = makeRune(c);
      else continue;

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

  // --- Card Builders using new fields ---

  function makeUnit(c) {
    // colors field: comma-separated image base names
    const colorList = c.colors.split(',').map(s=>s.trim());
    const primaryColor = colorList[0]; // for the C placeholder and energy icon
    const forceIcon = c.power ? `<img src="images/${primaryColor}2.png" class="force-icon-alt">` : '';
    const mightIcon = c.might ? `<img src="images/SwordIconRB.png" class="might-icon-alt"> ${c.might}` : '';
    // no SUPER column in new CSV; omit that part
    const descriptionHTML = formatDescription(c.description, primaryColor);

    return build('unit-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceIcon}</span>
        <span class="might-alt">${mightIcon}</span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descriptionHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${primaryColor}.png" class="color-icon-alt">
          <span class="color-text-alt">${primaryColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">
          ${c.type} — ${c.variantType}${c.tags ? ' • '+c.tags : ''}
        </span>
      </div>`);
  }

  function makeSpell(c) {
    const colorList = c.colors.split(',').map(s=>s.trim());
    const primaryColor = colorList[0];
    const forceIcon = c.power ? `<img src="images/${primaryColor}2.png" class="force-icon-alt">` : '';
    const descriptionHTML = formatDescription(c.description, primaryColor);

    return build('spell-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceIcon}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descriptionHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${primaryColor}.png" class="color-icon-alt">
          <span class="color-text-alt">${primaryColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">
          ${c.type} — ${c.variantType}
        </span>
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
    const colorList = c.colors.split(',').map(s=>s.trim());
    const descHTML = formatDescription(c.description, '');
    return build('legend', c.variantNumber, `
      <div class="top-bar">
        <div class="legend-colors">
          ${colorList.map(col=>`<img src="images/${col}.png" class="legend-color-icon">`).join('')}
        </div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${c.tags || ''}</div>
        <div class="legend-name">${c.name}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p>${descHTML}</p>
      </div>`);
  }

  function makeRune(c) {
    const cols = c.colors.split(',').map(s=>s.trim());
    const primaryColor = cols[0];
    return build('rune', c.variantNumber, `
      <div class="rune-top"><span class="rune-name">${c.name}</span></div>
      <div class="rune-middle">
        <img src="images/${primaryColor}.png" class="rune-icon">
      </div>`);
  }

  // Generic builder: adds the +/– buttons and badge
  function build(cssClass, variantNumber, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    el.style.position = 'relative';

    // + button
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    addBtn.onclick = () => addCard(variantNumber);

    // – button
    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn'; remBtn.textContent = '–';
    remBtn.onclick = () => removeCard(variantNumber, el);

    // badge
    const badge = document.createElement('div');
    badge.className = 'count-badge';
    badge.textContent = `Added: ${addedCounts[variantNumber]||0}`;

    el.append(addBtn, remBtn, badge);
    return el;
  }

  // --- Search Modal Logic ---
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
    const filtered = allCards.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.variantNumber.toLowerCase().includes(q)
    );
    renderSearch(filtered);
  });

  function renderSearch(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const cardEl = (() => {
        const t = (c.type||'').toLowerCase();
        if (t==='unit') return makeUnit(c);
        if (t==='spell'||t==='gear') return makeSpell(c);
        if (t==='battlefield') return makeBattlefield(c);
        if (t==='legend') return makeLegend(c);
        if (t==='rune') return makeRune(c);
      })();
      results.appendChild(cardEl);
    });
  }

})();
