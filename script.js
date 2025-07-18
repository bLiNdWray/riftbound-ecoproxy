// script.js - Riftbound Eco Proxy
(() => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  const addedCounts = {};
  let allCards = [];

  /**
   * JSONP fetch helper.
   */
  function jsonpFetch(params, cb) {
    const callbackName = 'jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params)
      .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // Allowed types whitelist
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];

  // Load all cards for search
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
  });

  // Initial render from URL (?id=...)
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(vn => addedCounts[vn] = (addedCounts[vn]||0) + 1);
  }

  // Modal open/close
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Live search filtering & rendering
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const filtered = allCards.filter(c => {
      const nameMatch = (c.name||'').toLowerCase().includes(q);
      const idMatch   = (c.variantNumber||'').toLowerCase().includes(q);
      const typeMatch = allowedTypes.includes((c.type||'').toLowerCase());
      return (nameMatch || idMatch) && typeMatch;
    });
    renderSearchResults(filtered);
  });

  // Render list of search results
  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      let el;
      const type = (c.type||'').toLowerCase();
      switch (type) {
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
  }

  // Render specific cards by ID
  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || data.length === 0) return;
        const c = data[0];
        const type = (c.type||'').toLowerCase();
        if (!allowedTypes.includes(type)) return;
        let el;
        switch (type) {
          case 'unit':        el = makeUnit(c);        break;
          case 'spell':
          case 'gear':        el = makeSpell(c);       break;
          case 'battlefield': el = makeBattlefield(c); break;
          case 'legend':      el = makeLegend(c);      break;
          case 'rune':        el = makeRune(c);        break;
        }
        container.appendChild(el);
      });
    });
  }

  // Add & remove helpers
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

  // Helper: format icons in descriptions
  function formatDescription(text = '', colorCode) {
    let out = text
      .replace(/\[Tap\]:/g,  `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[Might\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`)
      .replace(/\[Rune\]/g,  `<img src="images/RainbowRune.png" class="inline-icon" alt="Rune">`)
      .replace(/\[S\]/g,     `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g,     `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(
        new RegExp(`\\[${col}\\]`, 'g'),
        `<img src="images/${col}.png" class="inline-icon" alt="${col}">`
      );
    });
    return out;
  }

  // Card builder functions
  function makeUnit(c) {
    const colors    = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const forceHTML = c.energy
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const tagText   = c.tags ? ` • ${c.tags}` : '';
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
        <span class="type-line-alt">${c.type} — ${c.variantType}${tagText}</span>
      </div>`);
  }

  function makeSpell(c) {
    const colors    = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const forceHTML = c.energy
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
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
    const descHTML  = formatDescription(c.description, '');
    return build('legend', c.variantNumber, `
      <div class="legend-header"><span class="legend-title">${c.name}</span></div>
      <div class="legend-body"><p>${descHTML}</p></div>`);
  }

  function makeRune(c) {
    const descHTML  = formatDescription(c.description, '');
    return build('rune', c.variantNumber, `
      <div class="rune-body"><p>${descHTML}</p></div>`);
  }

  // Generic build helper
  function build(typeClass, id, innerHTML) {
    const wrapper = document.createElement('div');
    wrapper.className = `card ${typeClass}`;
    wrapper.setAttribute('data-variant', id);

    const qtyBadge = document.createElement('div');
    qtyBadge.className = 'qty-badge';
    qtyBadge.textContent = addedCounts[id] || 0;

    wrapper.innerHTML = innerHTML;
    wrapper.appendChild(qtyBadge);
    wrapper.addEventListener('click', () => {
      if (wrapper.classList.contains('added')) {
        removeCard(id, wrapper);
      } else {
        addCard(id);
      }
      wrapper.classList.toggle('added');
      qtyBadge.textContent = addedCounts[id] || 0;
    });
    return wrapper;
  }
})();
