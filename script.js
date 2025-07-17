// script.js
 (async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET = 'Riftbound Cards';

  const container = document.getElementById('card-container');

  // 1. Load all cards once (for search & import)
  let allCards = [];
  async function loadAll() {
    const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET)}`);
    allCards = await res.json();
  }
  await loadAll();

  // 2. Read URL ids or form submission…
  const params = new URLSearchParams(window.location.search);
  const ids = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (ids.length) renderCards(ids);

  // 3. Main render function
  async function renderCards(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET)}&id=${encodeURIComponent(id)}`);
      const [card] = await res.json();
      if (!card) continue;

      let cardEl;
      switch (card.Type || card.type) {
        case 'Unit':
          cardEl = makeUnitCard(card);
          break;
        case 'Spell':
          cardEl = makeSpellCard(card);
          break;
        case 'Battlefield':
          cardEl = makeBattlefieldCard(card);
          break;
        case 'Legend':
          cardEl = makeLegendCard(card);
          break;
        case 'Rune':
          cardEl = makeRuneCard(card);
          break;
        default:
          continue;
      }
      container.appendChild(cardEl);
    }
  }

  // 4. Template builders
  function makeUnitCard(card) {
    const el = document.createElement('div');
    el.className = 'card unit-alt';
    el.innerHTML = `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.Cost} <img src="images/${card.Color}2.png" class="force-icon-alt" />
        </span>
        <span class="might-alt">
          <img src="images/SwordIconRB.png" class="might-icon-alt" /> ${card.Might}
        </span>
      </div>
      <div class="name-alt">${card.Name}</div>
      <div class="middle-alt">
        <p>${card.Effect}</p>
        <div class="color-indicator-alt">
          <img src="images/${card.Color}.png" class="color-icon-alt" />
          <span class="color-text-alt">${card.Color}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${card.Type} — ${card.Subtype}${card.Super !== 'None' ? ' • '+card.Super : ''}</span>
      </div>`;
    return el;
  }

  function makeSpellCard(card) {
    const el = document.createElement('div');
    el.className = 'card spell-alt';
    el.innerHTML = `
      <div class="top-bar-alt">
        <span class="cost-alt">
          ${card.Cost} <img src="images/${card.Color}2.png" class="force-icon-alt" />
        </span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${card.Name}</div>
      <div class="middle-alt">
        <p>${card.Effect}</p>
        <div class="color-indicator-alt">
          <img src="images/${card.Color}.png" class="color-icon-alt" />
          <span class="color-text-alt">${card.Color}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${card.Type} — ${card.Subtype}</span>
      </div>`;
    return el;
  }

  function makeBattlefieldCard(card) {
    const el = document.createElement('div');
    el.className = 'card battlefield';
    el.innerHTML = `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${card.Effect}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${card.Type}</div>
          <div class="bf-name">${card.Name}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${card.Effect}</div></div>
      </div>`;
    return el;
  }

  function makeLegendCard(card) {
    const colors = card.Colors.split(','); // e.g. "Red,Orange"
    const el = document.createElement('div');
    el.className = 'card legend';
    el.innerHTML = `
      <div class="top-bar">
        <div class="legend-colors">
          ${colors.map(c => `<img src="images/${c}.png" class="legend-color-icon" />`).join('')}
        </div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${card.Tag}</div>
        <div class="legend-name">${card.Name}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p class="legend-ability">${card.Effect}</p>
      </div>`;
    return el;
  }

  function makeRuneCard(card) {
    const el = document.createElement('div');
    el.className = 'card rune';
    el.innerHTML = `
      <div class="rune-top"><span class="rune-name">${card.Name}</span></div>
      <div class="rune-middle">
        <img src="images/${card.Color}.png" class="rune-icon" />
      </div>`;
    return el;
  }

})();
