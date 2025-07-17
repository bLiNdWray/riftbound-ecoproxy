// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  // Load all cards (if you need search/import)
  let allCards = [];
  async function loadAllCards() {
    const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`);
    allCards = await res.json();
  }
  await loadAllCards();

  // On load, grab ?id= query
  const params = new URLSearchParams(window.location.search);
  const ids = (params.get('id') || '').split(',').map(s => s.trim()).filter(Boolean);
  if (ids.length) renderCards(ids);

  async function renderCards(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`);
      const data = await res.json();
      const card = data[0];
      if (!card) continue;

      let el;
      switch ((card.TYPE || '').toLowerCase()) {
        case 'unit':         el = makeUnitCard(card);         break;
        case 'spell':        el = makeSpellCard(card);        break;
        case 'battlefield':  el = makeBattlefieldCard(card);  break;
        case 'legend':       el = makeLegendCard(card);       break;
        case 'rune':         el = makeRuneCard(card);         break;
        default: continue;
      }
      container.appendChild(el);
    }
  }

  function makeUnitCard(card) {
    const el = document.createElement('div');
    el.className = 'card unit-alt';
    el.innerHTML = `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.COST} <img src="images/${card.COLOR}2.png" class="force-icon-alt" alt="Force">
        </span>
        <span class="might-alt">
          <img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${card.MIGHT}
        </span>
      </div>
      <div class="name-alt">${card.NAME}</div>
      <div class="middle-alt">
        <p>${card.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${card.COLOR}.png" class="color-icon-alt" alt="${card.COLOR}">
          <span class="color-text-alt">${card.COLOR}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">
          ${card.TYPE} — ${card.TAGS}${card.SUPER && card.SUPER !== 'None' ? ' • ' + card.SUPER : ''}
        </span>
      </div>`;
    return el;
  }

  function makeSpellCard(card) {
    const el = document.createElement('div');
    el.className = 'card spell-alt';
    el.innerHTML = `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.COST} <img src="images/${card.COLOR}2.png" class="force-icon-alt" alt="Force">
        </span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${card.NAME}</div>
      <div class="middle-alt">
        <p>${card.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${card.COLOR}.png" class="color-icon-alt" alt="${card.COLOR}">
          <span class="color-text-alt">${card.COLOR}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${card.TYPE} — ${card.TAGS}</span>
      </div>`;
    return el;
  }

  function makeBattlefieldCard(card) {
    const el = document.createElement('div');
    el.className = 'card battlefield';
    el.innerHTML = `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${card.EFFECT}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${card.TYPE}</div>
          <div class="bf-name">${card.NAME}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${card.EFFECT}</div></div>
      </div>`;
    return el;
  }

  function makeLegendCard(card) {
    const colors = (card.COLOR || '').split(',').map(c => c.trim());
    const el = document.createElement('div');
    el.className = 'card legend';
    el.innerHTML = `
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
      </div>`;
    return el;
  }

  function makeRuneCard(card) {
    const el = document.createElement('div');
    el.className = 'card rune';
    el.innerHTML = `
      <div class="rune-top"><span class="rune-name">${card.NAME}</span></div>
      <div class="rune-middle">
        <img src="images/${card.COLOR}.png" class="rune-icon" alt="${card.COLOR}">
      </div>`;
    return el;
  }
})();
