// script.js
(async () => {
  const API_BASE = 'https://script.google.com/macros/s/AKfycbzAPCWQtZVlaDuQknhAa8KGaW2TWwLwcI_fxaSVxe05vHkqqXiE5EOphhCFABvzuqCqTg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container = document.getElementById('card-container');

  const colorMap = {
    Orange: 'Body', Green: 'Calm', Purple: 'Chaos',
    Red: 'Fury', Blue: 'Mind', Yellow: 'Order'
  };
  const addedCounts = {};
  let allCards = [];

  // Fetch all cards for search
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

  // Render helpers
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let id of ids) {
      const [card] = await (await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`
      )).json();
      if (!card) continue;
      let el;
      const t = (card.TYPE||'').toLowerCase();
      if (t==='unit') el = makeUnit(card);
      else if (t==='spell'||t==='gear') el = makeSpell(card);
      else if (t==='battlefield') el = makeBF(card);
      else if (t==='legend') el = makeLegend(card);
      else if (t==='rune') el = makeRune(card);
      else continue;
      container.appendChild(el);
    }
  }
  function addCard(id) {
    renderCards([id], false);
    addedCounts[id] = (addedCounts[id]||0)+1;
  }

  // Card builders
  function makeUnit(c) {
    const code = colorMap[c.COLOR]||c.COLOR;
    const force = c.FORCE ? `<img src="images/${code}2.png" class="force-icon-alt">` : '';
    const might = c.MIGHT ? `<img src="images/SwordIconRB.png" class="might-icon-alt"> ${c.MIGHT}` : '';
    const sup = (c.SUPER&&c.SUPER.toLowerCase()!=='none')?` • ${c.SUPER}`:'';
    return build('unit-alt', `
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
    return build('spell-alt', `
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
    return build('battlefield', `
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
    return build('legend', `
      <div class="top-bar">
        <div class="legend-colors">
          ${cols.map(x=>`<img src="images/${x}.png" class="legend-color-icon">`).join('')}
        </div>
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
    return build('rune', `
      <div class="rune-top"><span class="rune-name">${c.NAME}</span></div>
      <div class="rune-middle">
        <img src="images/${code}.png" class="rune-icon">
      </div>`);
  }
  function build(cls, html) {
    const d = document.createElement('div');
    d.className = `card ${cls}`;
    d.innerHTML = html;
    return d;
  }

  // --- Search modal logic ---
  const openBtn = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const modal    = document.getElementById('search-modal');
  const input    = document.getElementById('card-search-input');
  const results  = document.getElementById('search-results');
  const preview  = document.getElementById('card-preview');
  const prevAdd  = document.getElementById('preview-add');
  let currentId  = null;

  openBtn.addEventListener('click', ()=>{
    modal.classList.remove('hidden');
    input.value = '';
    renderSearch(allCards);
    input.focus();
  });
  closeBtn.addEventListener('click', ()=>modal.classList.add('hidden'));
  input.addEventListener('input', ()=>{
    const q = input.value.toLowerCase();
    renderSearch(allCards.filter(c=>c.NAME.toLowerCase().includes(q)||c.NUMBER.toLowerCase().includes(q)));
  });

  function renderSearch(list){
    results.innerHTML = '';
    preview.innerHTML = '<em>Select a card to preview</em>';
    prevAdd.disabled = true;
    currentId = null;
    list.forEach(c=>{
      const id = c.NUMBER;
      const div = document.createElement('div');
      div.className = 'search-card';
      div.innerHTML = `
        <div class="name">${c.NAME}</div>
        <button class="btn-add">Add</button>
        <div class="count-badge">Added: ${addedCounts[id]||0}</div>`;
      div.querySelector('.btn-add')
         .addEventListener('click', ()=>addCard(id));
      div.addEventListener('mouseover', ()=>{
        currentId = id;
        preview.innerHTML = '';
        preview.appendChild(build('unit-alt', makeUnit(c).innerHTML));
        prevAdd.disabled = false;
      });
      results.appendChild(div);
    });
  }

  prevAdd.addEventListener('click', ()=>{
    if(currentId) addCard(currentId);
  });

})();
