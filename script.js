// script.js
(() => {
  // Config: update to your new Apps Script exec URL and sheet name
  const API_BASE =
    'https://script.google.com/macros/s/AKfycbzjps0P-SEz_mJM722Mb_Gym7qinNaNwHznm3jdlHlBrFZmHKflMPAl5wbAWb-GlUDZKg/exec';
  const SHEET_NAME = 'Riftbound Cards';

  // Elements
  const container = document.getElementById('card-container');
  const idForm = document.getElementById('id-form');
  const idInput = document.getElementById('id-input');
  const addBtn = document.getElementById('add-cards-btn');
  const importBtn = document.getElementById('import-list-btn');
  const addModal = document.getElementById('add-cards-modal');
  const importModal = document.getElementById('import-list-modal');
  const closeButtons = document.querySelectorAll('.close-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const importText = document.getElementById('import-text');
  const importSubmit = document.getElementById('import-submit');

  let allCards = [];

  // Modal controls
  function openModal(modal) { modal.classList.remove('hidden'); }
  function closeModal(modal) { modal.classList.add('hidden'); }
  addBtn.addEventListener('click', () => openModal(addModal));
  importBtn.addEventListener('click', () => openModal(importModal));
  closeButtons.forEach(btn => btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.target))));

  // Load all cards for search
  async function loadAllCards() {
    try {
      const res = await fetch(`${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}`);
      allCards = await res.json();
    } catch (e) {
      console.error('Failed to load all cards:', e);
    }
  }

  // Search handler
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const matches = allCards
      .filter(c => c.Name.toLowerCase().includes(query) || (c.name && c.name.toLowerCase().includes(query)))
      .slice(0, 10);
    searchResults.innerHTML = '';
    matches.forEach(c => {
      const li = document.createElement('li');
      const displayId = c.Number || c.id || c.ID;
      const displayName = c.Name || c.name || '';
      li.textContent = `${displayId} — ${displayName}`;
      li.addEventListener('click', () => {
        const current = idInput.value.split(',').map(s => s.trim()).filter(Boolean);
        if (!current.includes(displayId)) {
          current.push(displayId);
          idInput.value = current.join(',');
        }
        closeModal(addModal);
      });
      searchResults.appendChild(li);
    });
  });

  // Import list handler
  importSubmit.addEventListener('click', () => {
    const lines = importText.value.split('\n').map(s => s.trim().toUpperCase()).filter(Boolean);
    idInput.value = Array.from(new Set(lines)).join(',');
    closeModal(importModal);
  });

  // Generate proxies
  async function generateProxies(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      console.log(`Fetching ${id}`);
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      container.appendChild(cardEl);
      try {
        const url = `${API_BASE}?sheet=${encodeURIComponent(SHEET_NAME)}&id=${encodeURIComponent(id)}`;
        console.log('URL:', url);
        const res = await fetch(url);
        const data = await res.json();
        console.log('Data for', id, data);
        const card = data[0];
        if (!card) throw new Error('Not found');
        const img = document.createElement('img');
        img.src = card.imageUrl || card.ImageUrl || card['Image URL'];
        img.alt = card.Name || card.name || '';
        cardEl.appendChild(img);
        const info = document.createElement('div');
        info.className = 'info';
        const nameText = card.Name || card.name || '';
        const typeText = card.Type || card.type || '';
        const costText = card.Cost || card.cost ? ` — ${card.Cost || card.cost}` : '';
        info.innerHTML = `<strong>${nameText}</strong><br/>${typeText}${costText}`;
        cardEl.appendChild(info);
      } catch (e) {
        console.error(`Error loading ${id}:`, e);
        cardEl.innerHTML = `<div class="info">Error: ${id}</div>`;
      }
    }
  }

  // Handle form submission
  idForm.addEventListener('submit', e => {
    e.preventDefault();
    const ids = idInput.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (ids.length) {
      history.replaceState(null, '', `${location.pathname}?id=${ids.join(',')}`);
      generateProxies(ids);
    }
  });

  // Init
  (async () => {
    await loadAllCards();
    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get('id');
    if (idsParam) {
      const ids = idsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      idInput.value = ids.join(',');
      generateProxies(ids);
    }
  })();
})();
