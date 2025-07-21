// ui.js – Riftbound Eco Proxy (stripped persistence + counting)
(function() {
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');

  // In-memory counts
  let counts = {}; 

  function updateCount() {
    const total = Object.values(counts).reduce((a,b)=>a+b, 0);
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }
  function refreshBadge(vn) {
    const badge = document.querySelector(`[data-variant="${vn}"] .qty-badge`);
    if (badge) badge.textContent = counts[vn] || 0;
  }

  // Wrap the raw API:
  const rawAdd = window.addCard;
  window.addCard = function(vn) {
    if (!rawAdd(vn)) return false;
    counts[vn] = (counts[vn]||0) + 1;
    refreshBadge(vn);
    updateCount();
    return true;
  };

  const rawRemove = window.removeCard;
  window.removeCard = function(vn,el) {
    rawRemove(vn,el);
    if (counts[vn] > 1) {
      counts[vn]--;
    } else {
      delete counts[vn];
    }
    refreshBadge(vn);
    updateCount();
  };

  // Import List
  btnImport.addEventListener('click', () => {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id    = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label><input type="checkbox" id="import-clear" /> Clear existing cards</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok" class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    overlay.querySelector('#close-import').onclick  = () => overlay.remove();
    overlay.querySelector('#import-cancel').onclick = () => overlay.remove();

    areaEl.value = Object.keys(counts).join(' ');
    overlay.querySelector('#import-ok').onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        for (let k in counts) delete counts[k];
        updateCount();
      }
      areaEl.value.trim().split(/\s+/).forEach(tok => {
        const parts = tok.split('-');
        if (parts.length >= 2) window.addCard(parts[0] + '-' + parts[1]);
      });
    };
  });

  // Print
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });

  // Full-proxy toggle, Reset, Overview (unchanged)…
  btnFullProxy.addEventListener('click', () => { /* … */ });
  btnReset.addEventListener('click', () => {
    counts = {};
    document.getElementById('card-container').innerHTML = '';
    updateCount();
  });
  btnOverview.addEventListener('click', () => { /* … */ });

  // No more localStorage or DOMContentLoaded restore
  updateCount();
})();
