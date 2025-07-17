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

  // 1) Fetch all cards at once
  const allCards = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`)
    .then(r => r.json());

  // 2) Grab IDs from URL, then render
  const ids = (new URLSearchParams(window.location.search).get('id')||'')
    .split(',').map(s=>s.trim()).filter(Boolean);
  if (ids.length) renderCards(ids);

  function renderCards(ids) {
    container.innerHTML = '';
    // filter once
    const selected = allCards.filter(c => ids.includes(c.NUMBER));
    for (let card of selected) {
      let el;
      const type = (card.TYPE||'').toLowerCase();
      if (type === 'unit')         el = makeUnitCard(card);
      else if (type === 'spell' || type === 'gear') el = makeSpellCard(card);
      else if (type === 'battlefield') el = makeBattlefieldCard(card);
      else if (type === 'legend')      el = makeLegendCard(card);
      else if (type === 'rune')        el = makeRuneCard(card);
      else continue;
      container.appendChild(el);
    }
  }

  // … your makeXCard and createCard functions go here unchanged …

})();
