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

  // — State —
  window.cardCounts = {};
  let isImporting   = false;
  let fullProxy     = false;

  // — Persistence —
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      const s = localStorage.getItem('riftboundCardCounts');
      window.cardCounts = s ? JSON.parse(s) : {};
    } catch {
      window.cardCounts = {};
    }
  }

  // — Count & Badge Helpers —
  function updateCount() {
    const total = container.querySelectorAll('.card').length;
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  function refreshBadge(vn) {
    const count = container.querySelectorAll(`.card[data-variant="${vn}"]`).length;
    const badge = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);
    if (badge) badge.textContent = count;
  }

  // — Wrap addCard/removeCard to keep our cardCounts in sync —
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const before = container.querySelectorAll(`.card[data-variant="${vn}"]`).length;
    const success = origAdd(vn);
    const after  = container.querySelectorAll(`.card[data-variant="${vn}"]`).length;
    if (success && after > before) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
    }
    return success;
  };

  const origRm = window.removeCard;
  window.removeCard = function(vn, el) {
    const cardEl = el || container.querySelector(`.card[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const success = origRm(vn, cardEl);
    if (success && window.cardCounts[vn] > 0) {
      window.cardCounts[vn]--;
      saveState();
    }
    return success;
  };

  // — MutationObserver for live updates —
  const observer = new MutationObserver(mutations => {
    // If cards are added/removed, update overall count and badges
    updateCount();
    const variants = new Set(
      Array.from(container.querySelectorAll('.card[data-variant]'))
           .map(c => c.getAttribute('data-variant'))
    );
    variants.forEach(refreshBadge);
  });
  observer.observe(container, { childList: true });

  // — Wire Overview “+” / “–” inside modal —
  function wireOverviewButtons(listEl) {
    listEl.querySelectorAll('.overview-inc').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.addCard(btn.dataset.vn)) buildOverview();
      });
    });
    listEl.querySelectorAll('.overview-dec').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.removeCard(btn.dataset.vn)) buildOverview();
      });
    });
  }

  // — Build & show the Overview modal —
  function buildOverview() {
    // Tear down any existing
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id        = 'overview-modal';
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

    // Build flat list of [variant, count]
    const listEl = overlay.querySelector('#overview-list');
    const entries = Object.entries(window.cardCounts)
      .filter(([vn, c]) => c > 0)
      .map(([vn, count]) => {
        // Grab card name & logo from DOM if possible
        const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
        const name   = cardEl?.dataset.name || vn;
        const logo   = cardEl?.dataset.colorLogo || '';
        // Create the row
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.innerHTML = `
          <img src="${logo}" class="overview-logo" alt="" />
          <span class="overview-text">${name} – ${vn}</span>
          <button class="overview-dec" data-vn="${vn}">−</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        return row;
      });

    // Alphabetize by name text
    entries.sort((a, b) => {
      const ta = a.querySelector('.overview-text').textContent.toLowerCase();
      const tb = b.querySelector('.overview-text').textContent.toLowerCase();
      return ta.localeCompare(tb);
    });

    // Append to modal
    entries.forEach(row => listEl.appendChild(row));
    wireOverviewButtons(listEl);
  }

  // — Top-bar button handlers —

  // Import List
  btnImport.addEventListener('click', () => {
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
        <label>
          <input type="checkbox" id="import-clear" />
          Clear existing cards before import
        </label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn= overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    closeBtn.onclick  = cancelBtn.onclick = () => overlay.remove();
    areaEl.value      = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        container.innerHTML = '';
        window.cardCounts = {};
        saveState();
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        window.addCard(parts[0] + '-' + parts[1]);
      });
      updateCount();
    };
  });

  // Print
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => {
      document.getElementById('top-bar').style.display = '';
    }, 0);
  });

  // Overview
  btnOverview.addEventListener('click', buildOverview);

  // Full Proxy toggle (example stub—adjust as needed)
  btnFullProxy.addEventListener('click', () => {
    fullProxy = !fullProxy;
    // … your existing fullProxy logic …
  });

  // Reset
  btnReset.addEventListener('click', () => {
    window.cardCounts = {};
    container.innerHTML = '';
    saveState();
    updateCount();
  });

  // — On Load: restore + initial count/badges —
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i = 0; i < c; i++) window.addCard(vn);
    });
    updateCount();
  });

})(); 
