// ui.js — Handles top bar interactions, import/print/overview/full-proxy toggles, and notifications
(() => {
  // Buttons
  const openBtn       = document.getElementById('open-search');
  const btnImport     = document.getElementById('btn-import');
  const btnPrint      = document.getElementById('btn-print');
  const btnOverview   = document.getElementById('btn-overview');
  const btnFullProxy  = document.getElementById('btn-full-proxy');
  const btnReset      = document.getElementById('btn-reset');
  const countLabel    = document.getElementById('card-count');

  // State trackers
  window.addedVariants = window.addedVariants || [];
  let fullProxy = false;

  // Notification helper
  function notify(message) {
    const n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('visible'), 10);
    setTimeout(() => n.classList.remove('visible'), 2000);
    setTimeout(() => n.remove(), 3000);
  }

  // Import List: paste newline-separated variantNumbers
  btnImport.addEventListener('click', () => {
    const text = prompt('Paste your list of variant numbers (one per line):');
    if (!text) return;
const list = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    list.forEach(vn => {
      if (!window.addedVariants.includes(vn)) {
        window.addCard(vn);
        window.addedVariants.push(vn);
      }
    });
    updateCount();
    cacheState();
    notify(`${list.length} cards imported`);
  });

  // Print: open dialog view without helpers, then print
  btnPrint.addEventListener('click', () => {
    const bar = document.getElementById('top-bar');
    bar.style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => { bar.style.display = ''; }, 0);
  });

  // Overview modal
  function buildOverview() {
    // Remove existing
    let modal = document.getElementById('overview-modal');
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = 'overview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content small">
        <button id="close-overview" class="modal-close">×</button>
        <h2>Overview</h2>
        <div id="overview-list"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('close-overview').onclick = () => modal.remove();
    const list = document.getElementById('overview-list');

    // Group by type
    const order = ["Legend","Runes","Units","Spells","Gear","Battlefield"];
    const grouped = {};
    window.addedVariants.forEach(vn => {
      const el = document.querySelector(`[data-variant-number="${vn}"]`);
      const type = el?.dataset.type || 'Other';
      grouped[type] = grouped[type] || [];
      grouped[type].push({vn, el});
    });

    order.forEach(type => {
      if (grouped[type]) {
        const section = document.createElement('div');
        section.innerHTML = `<h3>${type}</h3>`;
        grouped[type].forEach(({vn, el}) => {
          const name = el.dataset.name || vn;
          const setNo = el.dataset.set || '';
          const logo = el.dataset.colorLogo || '';
          const row = document.createElement('div');
          row.className = 'overview-item';
          row.innerHTML = `
            <img src="${logo}" class="overview-logo" />
            <span>${name} (${setNo})</span>
            <button data-vn="${vn}" class="overview-dec">–</button>
            <span class="overview-count">1</span>
            <button data-vn="${vn}" class="overview-inc">+</button>
          `;
          section.appendChild(row);
        });
        list.appendChild(section);
      }
    });
  }
  btnOverview.addEventListener('click', () => {
    buildOverview();
    notify('Overview opened');
  });

  // Full Proxy toggle
  btnFullProxy.addEventListener('click', () => {
    fullProxy = !fullProxy;
    window.addedVariants.forEach(vn => {
      const el = document.querySelector(`[data-variant-number="${vn}"] img.card-img`);
      const src = fullProxy ? el.dataset.fullArt : el.dataset.proxyArt;
      el.src = src;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  });

  // Reset
  btnReset.addEventListener('click', () => {
    history.replaceState({}, '', window.location.pathname);
    window.addedVariants = [];
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    notify('Reset complete');
  });

  // Update count
  function updateCount() {
    const total = window.addedVariants.length;
    countLabel.textContent = `${total} card${total!==1?'s':''}`;
  }

  // Cache URL state
  function cacheState() {
    const params = new URLSearchParams();
    window.addedVariants.forEach(vn => params.append('id', vn));
    history.replaceState({}, '', `${window.location.pathname}?${params}`);
  }

  // Monkey-patch addCard/removeCard
  const origAdd = window.addCard;
  const origRm  = window.removeCard;
  window.addCard = vn => { origAdd(vn); updateCount(); window.addedVariants.push(vn); cacheState(); };
  window.removeCard = (vn, el) => { origRm(vn, el); window.addedVariants = window.addedVariants.filter(x=>x!==vn); updateCount(); cacheState(); };

  // On load: restore from URL
  window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    params.getAll('id').forEach(vn => {
      window.addCard(vn);
    });
    updateCount();
  });

  // Anchor search modal
  const searchModal = document.getElementById('search-modal');
  searchModal.style.top = '50px';
})();
