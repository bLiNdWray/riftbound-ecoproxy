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

  function jsonpFetch(params, cb) {
    const callbackName = 'jsonp_cb_' + Date.now();
    window[callbackName] = data => {
      delete window[callbackName];
      document.head.removeChild(script);
      cb(data);
    };
    const qs = Object.entries(params).map(
      ([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    ).join('&');
    const script = document.createElement('script');
    script.src = `${API_BASE}?${qs}&callback=${callbackName}`;
    document.head.appendChild(script);
  }

  // Load all cards
  await new Promise(resolve => {
    jsonpFetch({ sheet: SHEET_NAME }, data => {
      allCards = Array.isArray(data) ? data : [];
      resolve();
    });
  });

  // Initial render
  const params     = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(vn => addedCounts[vn] = (addedCounts[vn]||0) + 1);
  }

  // Format effects, including [Tap] and [power]
  function formatDescription(text = '', colorCode) {
    let out = text
      .replace(/\[Tap\]/gi, `<img src="images/Tap.png" class="inline-icon" alt="Tap">`)
      .replace(/\[power\]/gi, `<img src="images/RainbowRune.png" class="inline-icon" alt="Power">`)
      .replace(/\[S\]/g,      `<img src="images/SwordIconRB.png" class="inline-icon" alt="S">`)
      .replace(/\[C\]/g,      `<img src="images/${colorCode}2.png" class="inline-icon" alt="C">`);
    ['Body','Calm','Chaos','Fury','Mind','Order'].forEach(col => {
      out = out.replace(new RegExp(`\\[${col}\\]`, 'g'),
        `<img src="images/${col}.png" class="inline-icon" alt="${col}">`);
    });
    return out;
  }

  // Render cards
  function renderCards(ids, clear = true) {
    if (clear) container.innerHTML = '';
    ids.forEach(vn => {
      jsonpFetch({ sheet: SHEET_NAME, id: vn }, data => {
        if (!Array.isArray(data) || !data.length) return;
        const c = data[0];
        const el = buildCard(c);
        container.appendChild(el);
      });
    });
  }

  // Build a card element
  function buildCard(c) {
    const colors    = (c.colors||'').split(/[;,]\s*/).filter(Boolean);
    const forceHTML = c.power
      ? colors.map(col => `<img src="images/${col}2.png" class="force-icon-alt" alt="${col}">`).join(' ')
      : '';
    const mightHTML = c.might
      ? `<img src="images/SwordIconRB.png" class="might-icon-alt" alt="Might"> ${c.might}`
      : '';
    const descHTML  = formatDescription(c.description, colors[0]||'');
    const tagsClean = (c.tags||'').replace(/;/g, ' ');
    const colorIcons= colors.map(col => `<img src="images/${col}.png" class="color-icon-alt" alt="${col}">`).join(' ');
    const colorText = colors.join(', ');

    const wrapper = document.createElement('div');
    wrapper.className = `card unit-alt`;

    wrapper.innerHTML = `
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
      </div>
      <div class="hover-controls">
        <button class="add-btn">+</button>
        <button class="remove-btn">–</button>
      </div>
    `;

    // Attach behavior
    const btnAdd    = wrapper.querySelector('.add-btn');
    const btnRemove = wrapper.querySelector('.remove-btn');
    btnAdd.addEventListener('click', () => {
      addCard(c.variantNumber);
      alert('Card added!');
    });
    btnRemove.addEventListener('click', () => removeCard(c.variantNumber, wrapper));

    return wrapper;
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

  // Search modal logic
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
    filtered.forEach(c => results.appendChild(buildCard(c)));
  });

})();
