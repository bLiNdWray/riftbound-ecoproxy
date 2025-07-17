// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  const colorMap = {
    Orange: 'Body',
    Green:  'Calm',
    Purple: 'Chaos',
    Red:    'Fury',
    Blue:   'Mind',
    Yellow: 'Order'
  };

  // Load all cards (for future features)
  let allCards = [];
  async function loadAllCards() {
    allCards = await (await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`)).json();
  }
  await loadAllCards();

  // On load, render any IDs
  const ids = (new URLSearchParams(window.location.search).get('id') || '')
    .split(',').map(s=>s.trim()).filter(Boolean);
  if (ids.length) renderCards(ids);

  async function renderCards(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      const [card] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`
      )).json();
      if (!card) continue;

      let el;
      const type = (card.TYPE||'').toLowerCase();
      if (type === 'unit') el = makeUnitCard(card);
      else if (type === 'spell') el = makeSpellCard(card);
      else if (type === 'battlefield') el = makeBattlefieldCard(card);
      else if (type === 'legend') el = makeLegendCard(card);
      else if (type === 'rune') el = makeRuneCard(card);
      else continue;

      container.appendChild(el);
    }
  }

  function makeUnitCard(card) {
    const code = colorMap[card.COLOR]||card.COLOR;
    // only show force icon if FORCE is non-empty/non-zero
    const forceHTML = card.FORCE
      ? `<img src="images/${code}2.png" class="force-icon-alt" alt="Force">`
      : '';
    const mightHTML = card.MIGHT
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${card.MIGHT}`
      : '';

    return createCard('unit-alt', `
      <div class="top-bar-alt">
        <span class="cost-alt">${card.COST} ${forceHTML}</span>
        <span class="might-alt">${mightHTML}</span>
      </div>
      <div class="name-alt">${card.NAME}</div>
      <div class="middle-alt">
        <p>${card.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${code}.png" class="color-icon-alt" alt="${card.COLOR}">
          <span class="color-text-alt">${card.COLOR}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">
          ${card.TYPE} — ${card.TAGS}${card.SUPER && card.SUPER!=='None' ? ' • '+card.SUPER : ''}
        </span>
      </div>
    `);
  }

  function makeSpellCard(card) {
    const code = colorMap[card.COLOR]||card.COLOR;
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
          <img src="images/${code}.png" class="color-icon-alt" alt="${card.COLOR}">
          <span class="color-text-alt">${card.COLOR}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${card.TYPE} — ${card.TAGS}</span>
      </div>
    `);
  }

  // … battlefield, legend, rune builders unchanged …

  function createCard(cssClass, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    return el;
  }

})();
