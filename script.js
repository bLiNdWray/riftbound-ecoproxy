// script.js
(() => {
  // Config
  const API_BASE =
    'https://script.google.com/macros/s/AKfycbzjps0P-SEz_mJM722Mb_Gym7qinNaNwHznm3jdlHlBrFZmHKflMPAl5wbAWb-GlUDZKg/exec';
  const SHEET_NAME = 'Cards';

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
  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      closeModal(target);
    });
  });

  // Fetch all cards for search
  async function loadAllCards() {
    try {
      const res = await fetch(`${API_BASE}?sheet=${SHEET_NAME}`);
      allCards = await res.json();
    } catch (e) {
      console.error('Failed to load all cards:', e);
    }
  }

  // Search handler
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const matches = allCards
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 10);
    searchResults.innerHTML = '';
    matches.forEach(c => {
      const li = document.createElement('li');
      li.textContent = `${c.id} — ${c.name}`;
      li.addEventListener('click', () => {
        // add to id input
        const current = idInput.value.split(',').map(s => s.trim()).filter(Boolean);
        if (!current.includes(c.id)) {
          current.push(c.id);
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

  // Generate proxies from IDs
  async function generateProxies(ids) {
    container.innerHTML = '';
    for (let id of ids) {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';
      container.appendChild(cardEl);
      try {
        const res = await fetch(`${API_BASE}?sheet=${SHEET_NAME}&id=${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        const card = data[0];
        if (!card) throw new Error('Not found');
        const img = document.createElement('img');
        img.src = card.imageUrl;
        img.alt = card.name;
        cardEl.appendChild(img);
        const info = document.createElement('div');
        info.className = 'info';
        info.innerHTML = `<strong>${card.name}</strong><br/>${card.type || ''}${card.cost ? ` — ${card.cost}` : ''}`;
        cardEl.appendChild(info);
      } catch (e) {
        console.error(`Error loading ${id}`, e);
        cardEl.innerHTML = `<div class="info">Error: ${id}</div>`;
      }
    }
  }

  // Form submit
  idForm.addEventListener('submit', e => {
    e.preventDefault();
    const ids = idInput.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (ids.length) {
      const newUrl = `${location.pathname}?id=${ids.join(',')}`;
      history.replaceState(null, '', newUrl);
      generateProxies(ids);
    }
  });

  // On page load
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
