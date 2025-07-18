// script.js
(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';
  const container  = document.getElementById('card-container');
  const openBtn    = document.getElementById('open-search');
  const closeBtn   = document.getElementById('close-search');
  const modal      = document.getElementById('search-modal');
  const input      = document.getElementById('card-search-input');
  const results    = document.getElementById('search-results');

  const addedCounts = {};
  let allCards = [];

  /** JSONP helper */
  function jsonpFetch(params, cb) {
    const callbackName = 'jsonp_cb_' + Date.now();
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  /** Toast notification */
  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 2000);
  }

  /** Replace bracketed tokens */
  function formatDescription(text = '', colorCode) {
    let out = text
      .replace(/\[Tap\]/gi,   `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[Might\]/gi, `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`)
      .replace(/\[power\]/gi, `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`)
      .replace(/\[S\]/g,      `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g,      `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(new RegExp(`\\[${col}\\]`, 'g'),
        `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out;
  }

  // 1) Load all cards
  await new Promise(resolve => {
    jsonpFetch({ sheet: SHEET_NAME }, data => {
      allCards = Array.isArray(data) ? data : [];
      resolve();
    });
  });

  // 2) Initial render from URL
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(vn => addedCounts[vn] = (addedCounts[vn]||0) + 1);
  }

  /** Fetch & render */
  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data.length) return;
        const c = data[0];
        let el;
        switch ((c.type||'').toLowerCase()) {
          case 'unit':        el = makeUnit(c);        break;
          case 'spell':
          case 'gear':        el = makeSpell(c);       break;
          case 'battlefield': el = makeBattlefield(c); break;
          case 'legend':      el = makeLegend(c);      break;
          case 'rune':        el = makeRune(c);        break;
          default: return;
        }
        container.appendChild(el);
      });
    });
  }

  function addCard(vn) {
    renderCards([vn], false);
    addedCounts[vn] = (addedCounts[vn]||0) + 1;
    showToast('Card added!');
  }

  function removeCard(vn, el) {
    if ((addedCounts[vn]||0) > 0) {
      addedCounts[vn]--;
      el.remove();
    }
  }

  /** Builders */

  function makeUnit(c) {
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const forceHTML = c.power
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const tagsClean = (c.tags||'').replace(/;/g,' ');
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="color-icon-alt" alt="${col}">`).join(' ');
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
        <span class="type-line-alt">${c.type}${tagsClean ? ` • ${tagsClean}` : ''}</span>
      </div>`);
  }

  function makeSpell(c) {
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const forceHTML = c.power
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const tagsClean = (c.tags||'').replace(/;/g,' ');
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="color-icon-alt" alt="${col}">`).join(' ');
    const colorText = colors.join(', ');

    return build('spell-alt', c.variantNumber, `
      <div class="top-bar-alt">
        <span class="cost-alt">${c.energy} ${forceHTML}</span>
      </div>
      <div class="name-alt">${c.name}</div>
      <div class="middle-alt">
        <p>${descHTML}</p>
        <div class="color-indicator-alt">
          ${colorIcons}<span class="color-text-alt">${colorText}</span>
        </div>
      </div>
      <div class="bottom-bar-alt">
        <span class="type-line-alt">${c.type}${tagsClean ? ` • ${tagsClean}` : ''}</span>
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
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="legend-color-icon" alt="${col}">`).join(' ');
    const tagsClean = (c.tags||'').replace(/;/g,' ');
    const descHTML  = formatDescription(c.description, '');

    return build('legend-alt', c.variantNumber, `
      <div class="legend-top">
        <div class="legend-colors">${colorIcons}</div>
        <div class="legend-label">Legend</div>
      </div>
      <div class="legend-center">
        <div class="legend-tags">${tagsClean}</div>
        <div class="legend-name">${c.name}</div>
      </div>
      <div class="legend-bottom"><p>${descHTML}</p></div>`);
  }

  function makeRune(c) {
    const col = (c.colors||'').split(/[;,]\s*/)[0]||'';
    return build('rune', c.variantNumber, `
      <div class="rune-top"><span class="rune-name">${c.name}</span></div>
      <div class="rune-middle"><img src="images/${col}.png" class="rune-icon" alt="${col}"></div>`);
  }

  /** Generic builder */
  function build(cssClass, variantNumber, innerHTML) {
    const el = document.createElement('div');
    el.className = `card ${cssClass}`;
    el.innerHTML = innerHTML + `
      <div class="hover-controls">
        <button class="add-btn">+</button>
        <button class="remove-btn">–</button>
      </div>`;

    // Attach handlers
    el.querySelector('.add-btn').onclick = () => addCard(variantNumber);
    el.querySelector('.remove-btn').onclick = () => removeCard(variantNumber, el);

    return el;
  }

  /** Search modal */
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
      c.name.toLowerCase().includes(q) ||
      c.variantNumber.toLowerCase().includes(q)
    );
    results.innerHTML = '';
    filtered.forEach(c => {
      let el;
      switch ((c.type||'').toLowerCase()) {
        case 'unit':        el = makeUnit(c);        break;
        case 'spell':
        case 'gear':        el = makeSpell(c);       break;
        case 'battlefield': el = makeBattlefield(c); break;
        case 'legend':      el = makeLegend(c);      break;
        case 'rune':        el = makeRune(c);        break;
        default: return;
      }
      results.appendChild(el);
    });
  });

})();
