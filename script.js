// script.js – Riftbound Eco Proxy (render-only, counting removed)
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
  jsonpFetch({ sheet: SHEET_NAME }, data => {
    allCards = Array.isArray(data) ? data : [];
  });

  // Initial URL load
  const params = new URLSearchParams(window.location.search);
  const initialIds = (params.get('id')||'').split(',').map(s=>s.trim()).filter(Boolean);
  if (initialIds.length) {
    renderCards(initialIds, true);
    initialIds.forEach(id => {
      /* ui.js will handle initial counts */
      window.addCard(id);
    });
  }

  // Modal open/close & live search (unchanged) …
  openBtn.addEventListener('click', () => { modal.classList.remove('hidden'); input.value=''; results.innerHTML=''; input.focus(); });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML=''; return; }
    renderSearchResults(
      allCards.filter(c => {
        const nameMatch = (c.name||'').toLowerCase().includes(q);
        const idMatch   = (c.variantNumber||'').toLowerCase().includes(q);
        return (nameMatch||idMatch) && allowedTypes.includes((c.type||'').toLowerCase());
      })
    );
  });

  // renderSearchResults & renderCards are identical except they call build()
  // … (omitted for brevity, copy your existing functions)

  function build(id, html) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.setAttribute('data-variant', id);
    wrapper.insertAdjacentHTML('beforeend', html);

    // 2) Badge placeholder only
    const badge = document.createElement('div');
    badge.className = 'qty-badge';
    wrapper.appendChild(badge);

    // 3) Hover-bar with buttons
    const hoverBar = document.createElement('div');
    hoverBar.className = 'hover-bar';
    const addBtn = document.createElement('button');
    addBtn.className = 'add-btn';    addBtn.textContent = '+';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn'; removeBtn.textContent = '−';
    hoverBar.append(addBtn, removeBtn);
    wrapper.appendChild(hoverBar);

    // 4) Wire events
    addBtn.addEventListener('click', () => { window.addCard(id); });
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      window.removeCard(id, wrapper);
    });

    return wrapper;
  }

  // Expose the raw renderer hooks; ui.js will override these
  window.addCard    = addCard;
  window.removeCard = removeCard;

})(); 
