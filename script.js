(async function() {
  // 1. Read the `id` query param
  const params = new URLSearchParams(location.search);
  const idsParam = params.get('id') || '';
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    document.getElementById('card-container').innerHTML =
      '<p>No card IDs provided. Use ?id=RB001,RB002,…</p>';
    return;
  }

  const container = document.getElementById('card-container');

  // 2. For each ID, fetch data from your Riftbound API
  //    Adjust `API_BASE` to point to your database endpoint
  const API_BASE = 'https://api.riftboundtcg.com/cards';

  for (let id of ids) {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const card = await res.json();

      // 3. Render the card “proxy”
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      // if your card JSON has an image URL:
      const img = document.createElement('img');
      img.src = card.imageUrl;
      img.alt = card.name;
      cardEl.appendChild(img);

      // overlay info
      const info = document.createElement('div');
      info.className = 'info';
      info.innerHTML = `
        <strong>${card.name}</strong><br/>
        ${card.type} &mdash; ${card.cost || ''}
      `;
      cardEl.appendChild(info);

      container.appendChild(cardEl);

    } catch (err) {
      console.error(`Failed to load ${id}:`, err);
      const errorEl = document.createElement('div');
      errorEl.className = 'card';
      errorEl.innerHTML = `<div class="info">Error loading ${id}</div>`;
      container.appendChild(errorEl);
    }
  }
})();
