// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  // Map sheet color names to image codes
  const colorMap = {
    Orange: 'Body',
    Green:  'Calm',
    Purple: 'Chaos',
    Red:    'Fury',
    Blue:   'Mind',
    Yellow: 'Order'
  };

  // Load all cards (if needed)
  let allCards = [];
  async function loadAllCards() {
    const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`);
    allCards = await res.json();
  }
  await loadAllCards();

  // On load, render any ?id=…
  const params = new URLSearchParams(window.location.search);
  const ids = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (ids.length) renderCards(ids);

  async function renderCards(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`);
      const [card] = await res.json();
      if (!card) continue;
      let el;
      switch ((card.TYPE||'').toLowerCase()) {
        case 'unit':        el = makeUnitCard(card);       break;
        case 'spell':       el = makeSpellCard(card);      break;
        case 'battlefield': el = makeBattlefieldCard(card);break;
        case 'legend':      el = makeLegendCard(card);     break;
        case 'rune':        el = makeRuneCard(card);       break;
        default: continue;
      }
      container.appendChild(el);
    }
  }

  function makeUnitCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    return createCard('unit-alt', `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.COST} <img src="images/${code}2.png" class="force-icon-alt" alt="Force">
        </span>
        <span class="might-alt">
          <img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${card.MIGHT}
        </span>
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
          ${card.TYPE} — ${card.TAGS}${card.SUPER && card.SUPER !== 'None' ? ' • ' + card.SUPER : ''}
        </span>
      </div>
    `);
  }

  function makeSpellCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    return createCard('spell-alt', `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.COST} <img src="images/${code}2.png" class="force-icon-alt" alt="Force">
        </span>
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

  function makeBattlefieldCard(card) {
    return createCard('battlefield', `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${card.EFFECT}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${card.TYPE}</div>
          <div class="bf-name">${card.NAME}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${card.EFFECT}</div></div>
      </div>
    `);
  }

  function makeLegendCard(card) {
    const colors = (card.COLOR||'').split(',').map(c => (colorMap[c.trim()]||c.trim()));
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
      </div>
    `);
  }

  function makeRuneCard(card) {
    const code = colorMap[card.COLOR] || card.COLOR;
    return createCard('rune', `
      <div class="rune-top"><span class="rune-name">${card.NAME}</span></div>
      <div class="rune-middle">
        <img src="images/${code}.png" class="rune-icon" alt="${card.COLOR}">
      </div>
    `);
  }

  // Helper to build a card container with innerHTML
  function createCard(cssClass, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    return el;
  }

})();
