// ui.js – Riftbound Eco Proxy (updated Overview wiring)
(function() {
  // ... (imports and other handlers remain unchanged) ...

  // — Other Top-Bar Buttons —
  btnOverview.addEventListener('click', buildOverview);

  // ...

  // — Overview Builder —
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    // Group by type
    const groups = {};
    Object.entries(window.cardCounts).forEach(([vn,count]) => {
      if (!count) return;
      const type = document.querySelector(`.card[data-variant="${vn}"]`).dataset.type || 'Other';
      groups[type] = groups[type] || {};
      groups[type][vn] = count;
    });

    const order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    const listEl = document.getElementById('overview-list');

    order.concat(Object.keys(groups).filter(t=>!order.includes(t))).forEach(type => {
      const sectionData = groups[type]; if (!sectionData) return;
      const section = document.createElement('div'); section.className = 'overview-section';
      const total = Object.values(sectionData).reduce((a,b)=>a+b,0);
      section.innerHTML = `<h3>${type} (${total})</h3>`;

      Object.entries(sectionData).forEach(([vn,count]) => {
        const name = document.querySelector(`.card[data-variant="${vn}"]`).dataset.name;
        const setNo = document.querySelector(`.card[data-variant="${vn}"]`).dataset.set;
        const row = document.createElement('div'); row.className = 'overview-item';
        row.innerHTML = `
          <span class="overview-text">${name} (${setNo})</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });

    // Wire inc/dec
    listEl.querySelectorAll('.overview-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn; window.addCard(vn); buildOverview();
      });
    });
    listEl.querySelectorAll('.overview-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn; window.removeCard(vn); buildOverview();
      });
    });
  }
})();
