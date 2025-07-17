// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  // We no longer remap colors—COLOR now matches your image filenames directly
  const addedCounts = {};
  let allCards = [];

  // Load all cards for search
  async function loadAll() {
    allCards = await (await fetch(
      `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`
    )).json();
  }
  await loadAll();

  // Initial render from URL (?id=variantNumber)
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, true);
    initialIds.forEach(id => addedCounts[id] = (addedCounts[id]||0) + 1);
  }

  // Replace placeholders in effect text
  function formatEffect(text, colorCode) {
    return text
      .replace(/T:/g, `<img src="images/Tap.png" class="inline-icon" alt="T">`)
      .replace(/\bA\b/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="A">`)
      .replace(/\bS\b/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\bC\b/g, `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
  }

  // Render helpers
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let variant of ids) {
      const [c] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&variantNumber=${encodeURIComponent(variant)}`
      )).json();
      if (!c) continue;
      let el;
      const type = (c.TYPE || '').toLowerCase();
      if (type === 'unit')           el = makeUnit(c);
      else if (type === 'spell' || type === 'gear') el = makeSpell(c);
      else if (type === 'battlefield') el = makeBF(c);
      else if (type === 'legend')      el = makeLegend(c);
      else if (type === 'rune')        el = makeRune(c);
      else continue;
      container.appendChild(el);
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

  // Card builders
  function makeUnit(c) {
    const colorCode = c.COLOR;
    const forceHTML  = c.power ? `<img src="images/${colorCode}2.png" class="force-icon-alt">` : '';
    const mightHTML  = c.MIGHT ? `<img src="images/SwordIconRB.png" class="might-icon-alt"> ${c.MIGHT}` : '';
    const superText  = c.SUPER && c.SUPER.toLowerCase() !== 'none' ? ` • ${c.SUPER}` : '';
    const effectHTML = formatEffect(c.EFFECT, colorCode);

    return build('unit-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt">${mightHTML}</span>
      </div>
      <div class="name-alt">${c.Name}</div>
      <div class="middle-alt">
        <p>${effectHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${colorCode}.png" class="color-icon-alt">
          <span class="color-text-alt">${colorCode}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.TYPE} — ${c.TAGS}${superText}</span>
      </div>`);
  }

  function makeSpell(c) {
    const colorCode = c.COLOR;
    const forceHTML  = c.power ? `<img src="images/${colorCode}2.png" class="force-icon-alt">` : '';
    const effectHTML = formatEffect(c.EFFECT, colorCode);

    return build('spell-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${c.Name}</div>
      <div class="middle-alt">
        <p>${effectHTML}</p>
        <div class="color-indicator-alt">
          <img src="images/${colorCode}.png" class="color-icon-alt">
          <span class="color-text-alt">${colorCode}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.TYPE} — ${c.TAGS}</span>
      </div>`);
  }

  function makeBF(c) {
    const effectHTML = formatEffect(c.EFFECT, '');
    return build('battlefield', c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${effectHTML}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.TYPE}</div>
          <div class="bf-name">${c.Name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${effectHTML}</div></div>
      </div>`);
  }

  function makeLegend(c) {
    const colors = c.COLOR.split(',').map(x => x.trim());
    const effectHTML = formatEffect(c.EFFECT, '');
    return build('legend', c.variantNumber, `
      <div class="top-bar">
        <div class="legend-colors">
          ${colors.map(col => `<img src="images/${col}.png" class="legend-color-icon">`).join('')}
        </div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${c.TAGS}</div>
        <div class="legend-name">${c.Name}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p>${effectHTML}</p>
      </div>`);
  }

  function makeRune(c) {
    return build('rune', c.variantNumber, `
      <div class="rune-top"><span class="rune-name">${c.Name}</span></div>
      <div class="rune-middle">
        <img src="images/${c.COLOR}.png" class="rune-icon">
      </div>`);
  }

  // Generic builder adds controls & badge
  function build(cssClass, variantNumber, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    el.style.position = 'relative';

    // Add button
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    addBtn.onclick = () => addCard(variantNumber);

    // Remove button
    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn'; remBtn.textContent = '–';
    remBtn.onclick = () => removeCard(variantNumber, el);

    // Count badge
    const badge = document.createElement('div');
    badge.className = 'count-badge';
    badge.textContent = `Added: ${addedCounts[variantNumber]||0}`;

    el.append(addBtn, remBtn, badge);
    return el;
  }

  // Search modal logic
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
      c.Name.toLowerCase().includes(q) ||
      c.variantNumber.toLowerCase().includes(q)
    );
    renderSearch(filtered);
  });

  function renderSearch(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const el = (() => {
        const t = (c.TYPE||'').toLowerCase();
        if (t==='unit')           return makeUnit(c);
        if (t==='spell'||t==='gear') return makeSpell(c);
        if (t==='battlefield')    return makeBF(c);
        if (t==='legend')         return makeLegend(c);
        if (t==='rune')           return makeRune(c);
      })();
      results.appendChild(el);
    });
  }

})();
