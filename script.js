// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  const colorMap = {
    Orange: 'Body', Green: 'Calm', Purple: 'Chaos',
    Red: 'Fury',   Blue: 'Mind',  Yellow: 'Order'
  };
  const addedCounts = {};
  let allCards = [];

  // Load all cards for search
  async function loadAll() {
    allCards = await (await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`)).json();
  }
  await loadAll();

  // Initial render from URL
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, true);
    initialIds.forEach(id => addedCounts[id] = (addedCounts[id]||0)+1);
  }

  // --- Render functions ---
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let id of ids) {
      const [card] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`
      )).json();
      if (!card) continue;
      let el;
      const t = (card.TYPE||'').toLowerCase();
      if (t === 'unit') el = makeUnit(card);
      else if (t === 'spell' || t === 'gear') el = makeSpell(card);
      else if (t === 'battlefield') el = makeBF(card);
      else if (t === 'legend') el = makeLegend(card);
      else if (t === 'rune') el = makeRune(card);
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

  // --- Card builders (as before) ---
  function makeUnit(c) {
    const code = colorMap[c.COLOR]||c.COLOR;
    const force = c.FORCE ? `<img src="images/${code}2.png" class="force-icon-alt">` : '';
    const might = c.MIGHT ? `<img src="images/SwordIconRB.png" class="might-icon-alt"> ${c.MIGHT}` : '';
    const sup = (c.SUPER&&c.SUPER.toLowerCase()!=='none')?` • ${c.SUPER}`:'';
    return build('unit-alt', c, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.COST} ${force}</span>
        <span class="might-alt">${might}</span>
      </div>
      <div class="name-alt">${c.NAME}</div>
      <div class="middle-alt">
        <p>${c.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${code}.png" class="color-icon-alt">
          <span class="color-text-alt">${code}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.TYPE} — ${c.TAGS}${sup}</span>
      </div>`);
  }
  function makeSpell(c) {
    const code = colorMap[c.COLOR]||c.COLOR;
    const force = c.FORCE ? `<img src="images/${code}2.png" class="force-icon-alt">` : '';
    return build('spell-alt', c, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.COST} ${force}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${c.NAME}</div>
      <div class="middle-alt">
        <p>${c.EFFECT}</p>
        <div class="color-indicator-alt">
          <img src="images/${code}.png" class="color-icon-alt">
          <span class="color-text-alt">${code}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.TYPE} — ${c.TAGS}</span>
      </div>`);
  }
  function makeBF(c) {
    return build('battlefield', c, `
      <div class="bf-columns">
        <div class="bf-col side left"><div class="bf-text">${c.EFFECT}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.TYPE}</div>
          <div class="bf-name">${c.NAME}</div>
        </div>
        <div class="bf-col side right"><div class="bf-text">${c.EFFECT}</div></div>
      </div>`);
  }
  function makeLegend(c) {
    const cols = c.COLOR.split(',').map(x=>colorMap[x.trim()]||x.trim());
    return build('legend', c, `
      <div class="top-bar">
        <div class="legend-colors">${cols.map(x=>
          `<img src="images/${x}.png" class="legend-color-icon">`).join('')}</div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${c.TAGS}</div>
        <div class="legend-name">${c.NAME}</div>
      </div>
      <div class="bottom-bar legend-bottom">
        <p class="legend-ability">${c.EFFECT}</p>
      </div>`);
  }
  function makeRune(c) {
    const code = colorMap[c.COLOR]||c.COLOR;
    return build('rune', c, `
      <div class="rune-top"><span class="rune-name">${c.NAME}</span></div>
      <div class="rune-middle"><img src="images/${code}.png" class="rune-icon"></div>`);
  }

  function build(cssClass, cardObj, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML;
    // add/remove controls
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+'; 
    addBtn.onclick = () => addCard(cardObj.NUMBER);
    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn'; remBtn.textContent = '–';
    remBtn.onclick = () => removeCard(cardObj.NUMBER, el);
    el.appendChild(addBtn);
    el.appendChild(remBtn);
    return el;
  }

  // --- Search modal logic ---
  const openBtn = document.getElementById('open-search');
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
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 1) {
      results.innerHTML = '';
      return;
    }
    const filtered = allCards.filter(c =>
      c.NAME.toLowerCase().includes(q) ||
      c.NUMBER.toLowerCase().includes(q)
    );
    renderSearch(filtered);
  });

 function renderSearch(list) {
  results.innerHTML = '';
  list.forEach(c => {
    const id = c.NUMBER;
    // Build the card template (styled via card.css)
    let cardEl;
    const t = (c.TYPE||'').toLowerCase();
    if (t === 'unit')           cardEl = makeUnit(c);
    else if (t === 'spell'||t==='gear')  cardEl = makeSpell(c);
    else if (t === 'battlefield') cardEl = makeBF(c);
    else if (t === 'legend')      cardEl = makeLegend(c);
    else if (t === 'rune')        cardEl = makeRune(c);
    else return;

    // Remove any leftover controls/badges
    cardEl.querySelectorAll('.add-btn, .remove-btn, .count-badge')
      .forEach(el => el.remove());
    cardEl.style.position = 'relative';

    // Create new add/remove buttons and badge
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn'; addBtn.textContent = '+';
    const remBtn = document.createElement('button');
    remBtn.className = 'remove-btn'; remBtn.textContent = '–';
    const badge  = document.createElement('div');
    badge.className = 'count-badge';
    badge.textContent = `Added: ${addedCounts[id]||0}`;

    // Hook up events
    addBtn.addEventListener('click', () => {
      addCard(id);
      badge.textContent = `Added: ${addedCounts[id]}`;
    });
    remBtn.addEventListener('click', () => {
      removeCard(id, cardEl);
      badge.textContent = `Added: ${addedCounts[id]||0}`;
    });

    // Append controls
    cardEl.appendChild(addBtn);
    cardEl.appendChild(remBtn);
    cardEl.appendChild(badge);

    // Finally, show it
    results.appendChild(cardEl);
  });
}
})();
