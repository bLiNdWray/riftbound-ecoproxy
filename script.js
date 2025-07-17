// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  // Map sheet color names to image codes & display names
  const colorMap = {
    Orange: 'Body',
    Green:  'Calm',
    Purple: 'Chaos',
    Red:    'Fury',
    Blue:   'Mind',
    Yellow: 'Order'
  };

  // Store counts of how many copies have been added
  const addedCounts = {};

  // Load all cards (for search)
  let allCards = [];
  async function loadAllCards() {
    allCards = await (await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`)).json();
  }
  await loadAllCards();

  // On load: render any IDs in ?id=… (clearing first)
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id') || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, /*clear=*/true);
    // initialize counts
    initialIds.forEach(id => { addedCounts[id] = (addedCounts[id]||0) + 1; });
  }

  // --- Render functions ---

  // Renders an array of IDs; clear determines whether to wipe existing
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let id of ids) {
      const [card] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`
      )).json();
      if (!card) continue;
      let el;
      const type = (card.TYPE || '').toLowerCase();
      if (type === 'unit') el = makeUnitCard(card);
      else if (type === 'spell' || type === 'gear') el = makeSpellCard(card);
      else if (type === 'battlefield') el = makeBattlefieldCard(card);
      else if (type === 'legend') el = makeLegendCard(card);
      else if (type === 'rune') el = makeRuneCard(card);
      else continue;
      container.appendChild(el);
    }
  }

  // Adds exactly one copy of a card without clearing
  function addCard(id) {
    renderCards([id], /*clear=*/false);
    addedCounts[id] = (addedCounts[id]||0) + 1;
  }

  // --- Card template builders ---

  function makeUnitCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    const displayColor = code;
    const forceHTML = card.FORCE
      ? `<img src="images/${code}2.png" class="force-icon-alt" alt="Force">`
      : '';
    const mightHTML = card.MIGHT
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${card.MIGHT}`
      : '';
    const superText = (card.SUPER && card.SUPER.toLowerCase() !== 'none')
      ? ` • ${card.SUPER}` : '';

    return createCard('unit-alt', `
      <div class="top-bar-alt">
        <span class="cost-alt">${card.COST} ${forceHTML}</span>
        <span class="might-alt">${mightHTML}</span>
      </div>
      <div class="name-alt">${card.NAME}</div>
      <div class="middle-alt">
        <p>${card.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${code}.png" class="color-icon-alt" alt="${displayColor}">
          <span class="color-text-alt">${displayColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">
          ${card.TYPE} — ${card.TAGS}${superText}
        </span>
      </div>`);
  }

  function makeSpellCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    const displayColor = code;
    const forceHTML = card.FORCE
      ? `<img src="images/${code}2.png" class="force-icon-alt" alt="Force">`
      : '';
    return createCard('spell-alt', `
      <div class="top-bar-alt">
        <span class="cost-alt">${card.COST} ${forceHTML}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${card.NAME}</div>
      <div class="middle-alt">
        <p>${card.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${code}.png" class="color-icon-alt" alt="${displayColor}">
          <span class="color-text-alt">${displayColor}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${card.TYPE} — ${card.TAGS}</span>
      </div>`);
  }

  function makeBattlefieldCard(card) {
    return createCard('battlefield', `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${card.EFFECT}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${card.TYPE}</div>
          <div class="bf-name">${card.NAME}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${card.EFFECT}</div></div>
      </div>`);
  }

  function makeLegendCard(card) {
    const colors = (card.COLOR || '')
      .split(',')
      .map(c => (colorMap[c.trim()] || c.trim()));
    return createCard('legend', `
      <div class="top-bar">
        <div class="legend-colors">
          ${colors.map(c => `<img src="images/${c}.png" class="legend-color-icon" alt="${c}">`).join('')}
        </div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${card.TAGS}</div>
        <div class="legend-name">${card.NAME}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p class="legend-ability">${card.EFFECT}</p>
      </div>`);
  }

  function makeRuneCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    return createCard('rune', `
      <div class="rune-top"><span class="rune-name">${card.NAME}</span></div>
      <div class="rune-middle">
        <img src="images/${code}.png" class="rune-icon" alt="${card.COLOR}">
      </div>`);
  }

  function createCard(cssClass, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    return el;
  }

  // --- Search Modal Logic ---

  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    renderSearchResults(allCards);
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    const filtered = allCards.filter(card =>
      card.NAME.toLowerCase().includes(q) ||
      card.NUMBER.toLowerCase().includes(q)
    );
    renderSearchResults(filtered);
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(card => {
      const id = card.NUMBER;
      const div = document.createElement('div');
      div.className = 'search-card';
      div.innerHTML = `
        <div class="name">${card.NAME}</div>
        <button class="btn-add">Add</button>
        <div class="count-badge">Added: ${addedCounts[id]||0}</div>
      `;
      div.querySelector('.btn-add').addEventListener('click', () => {
        addCard(id);
        updateBadge(div, id);
      });
      results.appendChild(div);
    });
  }

  function updateBadge(el, id) {
    el.querySelector('.count-badge').textContent = `Added: ${addedCounts[id]||0}`;
  }

})();
