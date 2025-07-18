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

  let allCards = [];
  const addedCounts = {};

  // Helper: JSONP fetch
  function jsonpFetch(params, cb) {
    const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random()*1e4);
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

  // Allowed types & CSS class map
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = {
    unit:        'unit',
    spell:       'spell',
    gear:        'spell',        // gear reuses spell layout
    battlefield: 'battlefield',
    legend:      'legend',
    rune:        'rune'
  };

  // Load entire sheet
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
  });

  // Initial URL load (e.g. ?id=OGN-001,OGN-002)
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(id => addedCounts[id] = 1);
  }

  // Modal toggles
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Live search
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
      return (nameMatch||idMatch) && typeMatch;
    });
    renderSearchResults(filtered);
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      const t = (c.type||'').toLowerCase();
      if (!allowedTypes.includes(t)) return;
      const el = {
        unit:        () => makeUnit(c),
        spell:       () => makeSpell(c),
        gear:        () => makeSpell(c),
        battlefield: () => makeBattlefield(c),
        legend:      () => makeLegend(c),
        rune:        () => makeRune(c),
      }[t]();
      el.classList.add(typeClassMap[t]);
      results.appendChild(el);
    });
  }

  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data[0]) return;
        const c = data[0];
        const t = (c.type||'').toLowerCase();
        if (!allowedTypes.includes(t)) return;
        const el = {
          unit:        () => makeUnit(c),
          spell:       () => makeSpell(c),
          gear:        () => makeSpell(c),
          battlefield: () => makeBattlefield(c),
          legend:      () => makeLegend(c),
          rune:        () => makeRune(c),
        }[t]();
        el.classList.add(typeClassMap[t]);
        container.appendChild(el);
      });
    });
  }

  // Add/remove count & click handler
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

  // Description icon replacer
  function formatDescription(txt='', color) {
    let out = txt
      .replace(/\[Tap\]:/g, `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[Might\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might">`)
      .replace(/\[Rune\]/g, `<img src="images/RainbowRune.png" class="inline-icon" alt="Rune">`)
      .replace(/\[S\]/g, `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g, `<img src="images/${color}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(new RegExp(`\\[${col}\\]`, 'g'),
        `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out;
  }

  // Card builders
  function makeUnit(c) {
    const cols    = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const force   = cols.map(col => `<img src="images/${col}2.png" class="inline-icon" alt="${col}">`).join(' ');
    const might   = c.might ? `<img src="images/SwordIconRB.png" class="inline-icon" alt="Might"> ${c.might}` : '';
    const desc    = formatDescription(c.description, cols[0]||'');
    const tags    = c.tags ? ` • ${c.tags}` : '';
    const colorIcons = cols.map(col => `<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join(' ');
    const colorText  = cols.join(', ');
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${c.energy} ${force}</span>
        <span class="might">${might}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">${desc}
        <div class="color-indicator">${colorIcons}<span class="color-text">${colorText}</span></div>
      </div>
      <div class="bottom-bar"><span class="type-line">${c.type} — ${c.variantType}${tags}</span></div>`);
  }

  function makeSpell(c) {
    const cols    = (c.colors||'').split(/[;]\s*/).filter(Boolean);
    const force   = cols.map(col => `<img src="images/${col}2.png" class="inline-icon" alt="${col}">`).join(' ');
    const desc    = formatDescription(c.description, cols[0]||'');
    const colorIcons = cols.map(col => `<img src="images/${col}.png" class="inline-icon" alt="${col}">`).join(' ');
    const colorText  = cols.join(', ');
    return build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${c.energy} ${force}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">${desc}
        <div class="color-indicator">${colorIcons}<span class="color-text">${colorText}</span></div>
      </div>
      <div class="bottom-bar"><span class="type-line">${c.type} — ${c.variantType}</span></div>`);
  }

  function makeBattlefield(c) {
    const desc = formatDescription(c.description, '');
    return build(c.variantNumber, `
      <div class="bf-columns">
        <div class="bf-col side"><div class="bf-text">${desc}</div></div>
        <div class="bf-col center">
          <div class="bf-type-text">${c.type}</div>
          <div class="bf-name">${c.name}</div>
        </div>
        <div class="bf-col side"><div class="bf-text">${desc}</div></div>
      </div>`);
  }

  function makeLegend(c) {
  // Pull in any color icons (if your sheet has them)
  const cols       = (c.colors||'').split(/[;]\s*/).filter(Boolean);
  const colorIcons = cols.map(col =>
    `<img src="images/${col}.png" alt="${col}">`
  ).join('');
  
  // Format rich-text description
  const desc       = formatDescription(c.description, cols[0]||'');
  
  // Build the legend card HTML
  return build(c.variantNumber, `
    <div class="legend-header-row">
      <div class="legend-icons">${colorIcons}</div>
      <div class="legend-label">LEGEND</div>
    </div>
    <hr class="legend-divider"/>
    <div class="legend-name">${c.name}</div>
    <div class="legend-body">${desc}</div>
  `);
}

  function makeRune(c) {
    const desc = formatDescription(c.description, '');
    return build(c.variantNumber, `
      <div class="rune-body">${desc}</div>`);
  }

  // Generic build()
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    wrapper.innerHTML = html;
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = addedCounts[id] || 0;
    wrapper.appendChild(badge);
    wrapper.addEventListener('click', () => {
      if (wrapper.classList.toggle('added')) addCard(id);
      else removeCard(id, wrapper);
      badge.textContent = addedCounts[id] || 0;
    });
    return wrapper;
  }

})();
