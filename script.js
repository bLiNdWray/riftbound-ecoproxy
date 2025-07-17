// script.js
(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycby4mtBcPmmvrCrO8sQgwxqY0MuxVEy6cxxt299IVSKGUQr-DKEVpbtclfjNQqxAhKJqfg/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container  = document.getElementById('card-container');
  const openBtn    = document.getElementById('open-search');
  const closeBtn   = document.getElementById('close-search');
  const modal      = document.getElementById('search-modal');
  const input      = document.getElementById('card-search-input');
  const results    = document.getElementById('search-results');

  const addedCounts = {};
  let allCards = [];

  // 1) Load all cards
  async function loadAllCards() {
    const res  = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`);
    const data = await res.json();
    allCards   = Array.isArray(data) ? data : Object.values(data);
  }
  await loadAllCards();

  // 2) Initial render from URL (?id=variantNumber)
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    await renderCards(initialIds, true);
    initialIds.forEach(vn => addedCounts[vn] = (addedCounts[vn]||0) + 1);
  }

  // 3) Description formatter
  function formatDescription(text = '', colorCode) {
    let out = text
      .replace(/\[Tap\]:/g, `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[Might\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`)
      .replace(/\[Rune\]/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="Rune">`)
      .replace(/\[S\]/g,      `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g,      `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(new RegExp(`\\[${col}\\]`, 'g'),
        `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out;
  }

  // 4) Render by variantNumber (uses &id=variantNumber)
  async function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    for (let vn of ids) {
      const res  = await fetch(
        `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&variantNumber=${encodeURIComponent(vn)}`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) continue;
      const c = data[0];

      let el;
      switch ((c.type||'').toLowerCase()) {
        case 'unit':        el = makeUnit(c);        break;
        case 'spell':
        case 'gear':        el = makeSpell(c);       break;
        case 'battlefield': el = makeBattlefield(c); break;
        case 'legend':      el = makeLegend(c);      break;
        case 'rune':        el = makeRune(c);        break;
        default: continue;
      }
      container.appendChild(el);
    }
  }

  function addCard(vn) {
    renderCards([vn], false);
    addedCounts[vn] = (addedCounts[vn]||0) + 1;
  }
  function removeCard(vn, el) {
    if ((addedCounts[vn]||0) > 0) {
      addedCounts[vn]--;
      el.remove();
    }
  }

  // 5) Builders

  function makeUnit(c) {
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const forceHTML = c.power
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const tagText   = c.tags ? ` • ${c.tags}` : '';
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="color-icon-alt" alt="${col}">`).join('');
    const colorText = colors.join(', ');
    return build('unit-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt">${mightHTML}</span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descHTML}</p>
        <div class="color-indicator-alt">
          ${colorIcons}<span class="color-text-alt">${colorText}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.type} — ${c.variantType}${tagText}</span>
      </div>`);
  }

  function makeSpell(c) {
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const forceHTML = c.power
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="color-icon-alt" alt="${col}">`).join('');
    const colorText = colors.join(', ');
    return build('spell-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
        <span class="might-alt"></span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descHTML}</p>
        <div class="color-indicator-alt">
          ${colorIcons}<span class="color-text-alt">${colorText}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.type} — ${c.variantType}</span>
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
    const colors   = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const descHTML = formatDescription(c.description, '');
    const tagText  = c.tags||'';
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="legend-color-icon" alt="${col}">`).join('');
    return build('legend', c.variantNumber, `
      <div class="top-bar">
        <div class="legend-colors">${colorIcons}</div>
        <span class="legend-label">Legend</span>
      </div>
      <div class="middle legend-middle">
        <div class="legend-tag">${tagText}</div>
        <div class="legend-name">${c.name}</div>
      </div>
      <div class="bottom-bar legend-bottom"><p>${descHTML}</p></div>`);
  }

  function makeRune(c) {
    const col = (c.colors||'').split(/[;,]\s*/)[0]||'';
    return build('rune', c.variantNumber, `
      <div class="rune-top"><span class="rune-name">${c.name}</span></div>
      <div class="rune-middle"><img src="images/${col}.png" class="rune-icon" alt="${col}"></div>`);
  }

  // 6) Generic builder
  function build(cssClass, variantNumber, html) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = html;
    el.style.position = 'relative';

    const btnAdd = document.createElement('button');
    btnAdd.className = 'add-btn'; btnAdd.textContent = '+';
    btnAdd.onclick = () => addCard(variantNumber);

    const btnRem = document.createElement('button');
    btnRem.className = 'remove-btn'; btnRem.textContent = '–';
    btnRem.onclick = () => removeCard(variantNumber, el);

    const badge = document.createElement('div');
    badge.className = 'count-badge';
    badge.textContent = `Added: ${addedCounts[variantNumber]||0}`;

    el.append(btnAdd, btnRem, badge);
    return el;
  }

  // 7) Search modal
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return results.innerHTML = '';
    const filtered = allCards.filter(c =>
      (c.name||'').toLowerCase().includes(q) ||
      (c.variantNumber||'').toLowerCase().includes(q)
    );
    renderSearchResults(filtered);
  });
  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      let el;
      switch ((c.type||'').toLowerCase()) {
        case 'unit': el = makeUnit(c); break;
        case 'spell':
        case 'gear': el = makeSpell(c); break;
        case 'battlefield': el = makeBattlefield(c); break;
        case 'legend': el = makeLegend(c); break;
        case 'rune': el = makeRune(c); break;
        default: return;
      }
      results.appendChild(el);
    });
  }
})();
