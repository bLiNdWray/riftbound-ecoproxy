// script.js – Riftbound Eco Proxy (updated Overview data attributes)
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
  
  // JSONP fetch helper
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

  // Allowed types & class map
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];
  const typeClassMap = { unit:'unit', spell:'spell', gear:'spell', battlefield:'battlefield', legend:'legend', rune:'rune' };

  // Load all cards
  jsonpFetch({ sheet: SHEET_NAME }, data => { allCards = Array.isArray(data) ? data : []; });

  // ... (rest of script.js unchanged until build and make functions) ...

  function makeUnit(c) {
    const cols      = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const costN     = Number(c.energy) || 0;
    const powN      = Number(c.power)  || 0;
    const costIcons = Array(powN).fill().map(_=>
      `<img src="images/${cols[0]||'Body'}2.png" class="cost-icon" alt="">`
    ).join('');
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, cols[0]||'');

    // Build and then attach dataset attributes
    const wrapper = build(c.variantNumber, `
      <div class="top-bar">
        <span class="cost">${costN}${costIcons}</span>
        <span class="might">${mightHTML}</span>
      </div>
      <div class="name">${c.name}</div>
      <div class="middle">
       <div class="desc-wrap">${descHTML}</div>
        <div class="color-indicator">
          <img src="images/${cols[0]||'Body'}.png" class="inline-icon" alt=""> <span class="color-text">${cols.join(' ')}</span>
        </div>
      </div>
      <div class="bottom-bar">
        <span class="type-line">${c.type}</span>
      </div>
    `);
    wrapper.dataset.name = c.name;
    wrapper.dataset.type = capitalize(c.type);
    wrapper.dataset.set  = c.variantNumber.split('-')[0];
    wrapper.dataset.colorLogo = `images/${cols[0]||'Body'}.png`;
    return wrapper;
  }
  // Repeat analogous dataset-attachment in makeSpell, makeBattlefield, makeLegend, makeRune

  // Helper to capitalize first letter
  function capitalize(str){ return str.charAt(0).toUpperCase()+str.slice(1).toLowerCase(); }

  /**
   * Creates a card element in #card-container
   */
  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    wrapper.insertAdjacentHTML('beforeend', html);

    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    badge.textContent = addedCounts[id] || 0;
    wrapper.appendChild(badge);

    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button'); addBtn.className = 'add-btn'; addBtn.textContent = '+';
    const removeBtn = document.createElement('button'); removeBtn.className = 'remove-btn'; removeBtn.textContent = '−';
    hoverBar.append(addBtn, removeBtn);
    wrapper.appendChild(hoverBar);

    addBtn.addEventListener('click', () => window.addCard(id));
    removeBtn.addEventListener('click', (e) => { e.stopPropagation(); window.removeCard(id, wrapper); });

    return wrapper;
  }

  // Expose functions
  window.addCard    = addCard;
  window.removeCard = removeCard;
})();
