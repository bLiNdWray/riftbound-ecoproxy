(function() {
  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');

  // — Wrap original add/remove if present —
  const origAdd = window.addCard || function(){};
  const origRm  = window.removeCard || function(){};

  // — Helpers —
  function updateCount() {
    const total = document.querySelectorAll('#card-container .card').length;
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  function wireOverviewButtons(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        origAdd(vn);
        buildOverview();
      });
    });
    listEl.querySelectorAll('.overview-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        const vn = btn.dataset.vn;
        const el = document.querySelector(`.card[data-variant="${vn}"]`);
        if (el) origRm(vn, el);
        buildOverview();
      });
    });
  }

  // — Overview Builder —
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'overview-modal';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);

    document.getElementById('close-overview').addEventListener('click', () => overlay.remove());

    // Build counts dynamically
    const cards = Array.from(document.querySelectorAll('#card-container .card[data-variant]'));
    const counts = cards.reduce((acc, el) => {
      const vn = el.getAttribute('data-variant');
      acc[vn] = (acc[vn] || 0) + 1;
      return acc;
    }, {});

    const listEl = document.getElementById('overview-list');
    if (Object.keys(counts).length === 0) {
      listEl.innerHTML = '<p class="overview-empty">No cards to display</p>';
      return;
    }

    Object.entries(counts).forEach(([vn, count]) => {
      const card = document.querySelector(`.card[data-variant="${vn}"]`);
      const name = card?.dataset.name || vn;
      const logo = card?.dataset.colorLogo || '';
      const row = document.createElement('div');
      row.className = 'overview-item';
      row.innerHTML = `
        <img src="${logo}" class="overview-logo" alt=""> 
        <span class="overview-text">${name} – ${vn}</span>
        <button class="overview-dec" data-vn="${vn}">−</button>
        <span class="overview-count">${count}</span>
        <button class="overview-inc" data-vn="${vn}">+</button>
      `;
      listEl.appendChild(row);
    });

    wireOverviewButtons(listEl);
  }

  // — Import Modal —
  btnImport.addEventListener('click', () => {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'import-modal';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area"></textarea>
        <label><input type="checkbox" id="import-clear"> Clear existing</label>
        <div class="modal-actions">
          <button id="import-cancel">Cancel</button>
          <button id="import-ok">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('close-import').onclick = () => overlay.remove();
    document.getElementById('import-cancel').onclick = () => overlay.remove();
    document.getElementById('import-ok').onclick = () => {
      const area = document.getElementById('import-area').value.trim();
      if (document.getElementById('import-clear').checked) document.getElementById('card-container').innerHTML = '';
      area.split(/\s+/).forEach(tok => {
        const [h, v] = tok.split('-');
        origAdd(`${h}-${v}`);
      });
      overlay.remove();
      updateCount();
    };
  });

  // — Other Buttons —
  btnPrint.addEventListener('click', () => { document.getElementById('top-bar').style.display='none'; window.print(); setTimeout(()=>document.getElementById('top-bar').style.display='',0); });
  btnOverview.addEventListener('click', buildOverview);
  btnReset.addEventListener('click', () => { document.getElementById('card-container').innerHTML = ''; updateCount(); });

  // — Init —
  document.addEventListener('DOMContentLoaded', updateCount);
})();
