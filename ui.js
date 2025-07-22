(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');
  const container    = document.getElementById('card-container');

  // — Persistence —
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem('riftboundCardCounts')) || {};
    } catch {
      return {};
    }
  }

  // — State Init —
  window.cardCounts = loadState();
  let fullProxy     = false;

  // — MutationObserver for live badges and total count —
  const observer = new MutationObserver(() => {
    const cards = container.querySelectorAll('.card');
    const total = cards.length;
    if (countLabel) countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
    // badge updates
    const counts = {};
    cards.forEach(c => {
      const vn = c.dataset.variant;
      if (!vn) return;
      counts[vn] = (counts[vn] || 0) + 1;
    });
    Object.entries(counts).forEach(([vn, c]) => {
      const badge = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);
      if (badge) badge.textContent = c;
    });
  });
  observer.observe(container, { childList: true, subtree: true });

  // — Wrap addCard/removeCard to persist counts —
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const el = origAdd(vn);
    if (el) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
    }
    return el;
  };
  const origRemove = window.removeCard;
  window.removeCard = function(vn, el) {
    const removed = origRemove(vn, el);
    if (removed && window.cardCounts[vn]) {
      window.cardCounts[vn]--;
      if (window.cardCounts[vn] <= 0) delete window.cardCounts[vn];
      saveState();
    }
    return removed;
  };

  // — Handlers —
  function handleImport() {
    const prev = document.getElementById('import-modal');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id = 'import-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-import" class="modal-close">×</button>
        <h2>Import List</h2>
        <textarea id="import-area" placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
        <label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const area  = overlay.querySelector('#import-area');
    const clear = overlay.querySelector('#import-clear');
    overlay.querySelector('#close-import').onclick  = () => overlay.remove();
    overlay.querySelector('#import-cancel').onclick = () => overlay.remove();
    area.value = Object.keys(window.cardCounts).join(' ');
    overlay.querySelector('#import-ok').onclick = () => {
      overlay.remove();
      if (clear.checked) {
        container.innerHTML = '';
        window.cardCounts = {};
        saveState();
      }
      const tokens = (area.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        const vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });
    };
  }

  function handlePrint() {
    document.getElementById('top-bar').style.display = 'none';
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  }

  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id        = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    const listEl = overlay.querySelector('#overview-list');
    listEl.innerHTML = '';
    // Gather variants from DOM
    const variants = Array.from(container.querySelectorAll('.card[data-variant]')).map(c => c.dataset.variant);
    const counts   = variants.reduce((acc, vn) => (acc[vn] = (acc[vn]||0)+1, acc), {});
    // Build entries
    Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0])).forEach(([vn, count]) => {
      const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
      const name   = cardEl?.dataset.name || vn;
      const row    = document.createElement('div');
      row.className = 'overview-item';
      row.innerHTML = `<span class="overview-text">${name} – ${vn}</span>`+
                      `<span class="overview-count">(${count})</span>`;
      listEl.appendChild(row);
    });
  }

  // — Attach Listeners —
  btnImport.addEventListener('click', handleImport);
  btnPrint.addEventListener('click', handlePrint);
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', () => fullProxy = !fullProxy);
  btnReset.addEventListener('click', () => {
    container.innerHTML = '';
    window.cardCounts = {};
    saveState();
  });

  // — Initialize —
  document.addEventListener('DOMContentLoaded', () => {
    // nothing to replay; observer handles UI
  });
})();
