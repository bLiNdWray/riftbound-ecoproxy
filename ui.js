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

  // — Persistence Helpers —
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      const s = localStorage.getItem('riftboundCardCounts');
      return s ? JSON.parse(s) : {};
    } catch {
      return {};
    }
  }

  // — State —
  window.cardCounts = loadState();
  let fullProxy     = false;

  // — MutationObserver for badges/count —
  const observer = new MutationObserver(() => {
    const total = container.querySelectorAll('.card').length;
    if (countLabel) countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
    // update badges
    const variants = [...container.querySelectorAll('.card[data-variant]')].map(c => c.dataset.variant);
    const counts = variants.reduce((acc, vn) => ({...acc, [vn]: (acc[vn]||0) +1}), {});
    Object.entries(counts).forEach(([vn, c]) => {
      const badge = container.querySelector(`.card[data-variant="${vn}"] .qty-badge`);
      if (badge) badge.textContent = c;
    });
  });
  observer.observe(container, { childList: true, subtree: true });

  // — Wrap addCard/removeCard to persist —
  const origAdd = window.addCard;
  window.addCard = function(vn) {
    const el = origAdd(vn);
    if (el) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
    }
    return el;
  };
  const origRm = window.removeCard;
  window.removeCard = function(vn, el) {
    const removed = origRm(vn, el);
    if (removed && window.cardCounts[vn]) {
      window.cardCounts[vn]--;
      if (window.cardCounts[vn] <= 0) delete window.cardCounts[vn];
      saveState();
    }
    return removed;
  };

  // — Top-Bar Buttons —
  btnImport.addEventListener('click', handleImport);
  btnPrint.addEventListener('click', handlePrint);
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', () => fullProxy = !fullProxy);
  btnReset.addEventListener('click', () => {
    container.innerHTML = '';
    window.cardCounts = {};
    saveState();
  });

  document.addEventListener('DOMContentLoaded', () => {
    // No need to replay counts here: DOM scan drives state
    observer.takeRecords();
  });

  // — Handlers —
  function handleImport() {
    // existing import logic
  }
  function handlePrint() {
    document.getElementById('top-bar').style.display = 'none';
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  }

  // — Overview Modal —
  function buildOverview() {
    const prev = document.getElementById('overview-modal');
    if (prev) prev.remove();
    const overlay = document.createElement('div');
    overlay.id        = 'overview-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-content">` +
      `<button id="close-overview" class="modal-close">×</button>` +
      `<h2>Overview</h2><div id="overview-list"></div></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-overview').onclick = () => overlay.remove();

    // build list from DOM
    const listEl = overlay.querySelector('#overview-list');
    const variants = [...container.querySelectorAll('.card[data-variant]')].map(c => c.dataset.variant);
    const counts = variants.reduce((acc, vn) => ({...acc, [vn]: (acc[vn]||0) +1}), {});
    // map to array with names
    const entries = Object.entries(counts).map(([vn, count]) => {
      const cardEl = container.querySelector(`.card[data-variant="${vn}"]`);
      return { name: cardEl?.dataset.name || vn, vn, count };
    }).sort((a,b) => a.name.localeCompare(b.name));

    entries.forEach(({name, vn, count}) => {
      const row = document.createElement('div');
      row.className = 'overview-item';
      row.innerHTML = `<span class="overview-text">${name} – ${vn}</span>` +
                      `<span class="overview-count">(${count})</span>`;
      listEl.appendChild(row);
    });
  }
})();
