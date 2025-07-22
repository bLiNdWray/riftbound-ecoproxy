// ui.js – Minimal Overview Integration
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('card-container');
  if (!container) {
    console.error('ui.js: #card-container not found—overview disabled.');
    return;
  }
  const btnOverview = document.getElementById('btn-overview');
  if (!btnOverview) {
    console.error('ui.js: #btn-overview not found.');
    return;
  }

  // Build & show the Overview modal
  function buildOverview() {
    // Remove existing modal
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    // Gather card counts by variant
    const counts = {};
    container.querySelectorAll('.card[data-variant]').forEach(card => {
      const vn = card.getAttribute('data-variant');
      counts[vn] = (counts[vn] || 0) + 1;
    });

    // Populate list
    const listEl = overlay.querySelector('#overview-list');
    Object.keys(counts).sort().forEach(vn => {
      const count = counts[vn];
      const cardEl = container.querySelector(\`.card[data-variant="${vn}"]\`);
      const name = cardEl && cardEl.dataset.name ? cardEl.dataset.name : vn;
      const item = document.createElement('div');
      item.className = 'overview-item';
      item.innerHTML = `
        <span class="overview-text">${name} – ${vn}</span>
        <span class="overview-count">(${count})</span>
      `;
      listEl.appendChild(item);
    });
  }

  btnOverview.addEventListener('click', buildOverview);
});
