(async function() {
  // 1. Parse the `?id=` query parameter into an array of IDs
  const params = new URLSearchParams(window.location.search);
  const idsParam = params.get('id') || '';
  const ids = idsParam
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean);

  const container = document.getElementById('card-container');

  // 2. If no IDs, show a message and exit
  if (ids.length === 0) {
    container.innerHTML = '<p>No card IDs provided. Use ?id=RB001,RB002,…</p>';
    return;
  }

  // 3. Point this at your Apps Script exec URL
  const API_BASE =
    'https://script.google.com/macros/s/AKfycbzjps0P-SEz_mJM722Mb_Gym7qinNaNwHznm3jdlHlBrFZmHKflMPAl5wbAWb-GlUDZKg/exec';

  // 4. For each ID, fetch exactly that row from the sheet
  for (let id of ids) {
    // Create a card container
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    container.appendChild(cardEl);

    try {
      // Fetch only the matching card by passing id + sheet name
      const url = `${API_BASE}?sheet=Cards&id=${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // data is an array; take the first element
      const card = data[0];
      if (!card) throw new Error('No card found');

      // 5. Render the image
      const img = document.createElement('img');
      img.src = card.imageUrl;
      img.alt = card.name;
      cardEl.appendChild(img);

      // 6. Overlay the name/type/cost
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `
        <strong>${card.name}</strong><br/>
        ${card.type || ''} ${card.cost ? `— ${card.cost}` : ''}
      `;
      cardEl.appendChild(info);

    } catch (err) {
      console.error(`Failed to load ${id}:`, err);
      cardEl.innerHTML = `<div class="info">Error loading ${id}</div>`;
    }
  }
})();
