(function() {
  const TOPBAR_HEIGHT = 50;

  // — Elements —
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');

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

  // — Helpers —
  function refreshBadge(vn) {
    const count = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    const badge = document.querySelector(
      `#card-container .card[data-variant="${vn}"] .qty-badge`
    );
    if (badge) badge.textContent = count;
  }

  function updateCount() {
    const total = document.querySelectorAll('#card-container .card').length;
    const lbl   = document.getElementById('card-count');
    if (lbl) lbl.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  // — Wrap script.js addCard / removeCard —
  const origAdd = typeof window.addCard === 'function' ? window.addCard : () => {};
  window.addCard = function(vn) {
    const before = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    origAdd(vn);
    const after = document.querySelectorAll(
      `#card-container .card[data-variant="${vn}"]`
    ).length;
    if (after > before) {
      window.cardCounts[vn] = (window.cardCounts[vn]||0) + 1;
      saveState();
      refreshBadge(vn);
      updateCount();
      return true;
    }
    return false;
  };

  const origRm = typeof window.removeCard === 'function' ? window.removeCard : () => {};
  window.removeCard = function(vn, el) {
    origRm(vn, el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    saveState();
    refreshBadge(vn);
    updateCount();
  };

  // — Import List Modal —
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
        <label><input type="checkbox" id="import-clear" /> Clear existing cards before import</label>
        <div class="modal-actions">
          <button id="import-cancel" class="topbar-btn">Cancel</button>
          <button id="import-ok"     class="topbar-btn">Import</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const areaEl   = overlay.querySelector('#import-area');
    const clearChk = overlay.querySelector('#import-clear');
    const closeBtn = overlay.querySelector('#close-import');
    const cancelBtn= overlay.querySelector('#import-cancel');
    const okBtn    = overlay.querySelector('#import-ok');

    closeBtn.onclick  = () => overlay.remove();
    cancelBtn.onclick = () => overlay.remove();

    areaEl.value = Object.keys(window.cardCounts).join(' ');

    okBtn.onclick = () => {
      overlay.remove();
      if (clearChk.checked) {
        document.getElementById('card-container').innerHTML = '';
        window.cardCounts = {};
        updateCount();
      }
      const tokens = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
      isImporting = true;
      tokens.forEach(tok => {
        const parts = tok.split('-');
        if (parts.length < 2) return;
        const vn = parts[0] + '-' + parts[1];
        window.addCard(vn);
      });
      isImporting = false;
      saveState();
      updateCount();
    };
  });

  // — Other Top-Bar Buttons —
  btnPrint.addEventListener('click', () => {
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(() => document.getElementById('top-bar').style.display = '', 0);
  });
  btnOverview.addEventListener('click', buildOverview);
  btnFullProxy.addEventListener('click', () => {
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(vn => {
      const img = document.querySelector(`[data-variant="${vn}"] img.card-img`);
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
  });
  btnReset.addEventListener('click', () => {
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    saveState();
    updateCount();
  });

  // — On Load: Restore & Recount —
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    Object.entries(window.cardCounts).forEach(([vn, c]) => {
      for (let i = 0; i < c; i++) window.addCard(vn);
    });
    updateCount();
  });

  // — Overview Builder —
  function buildOverview() {
  // Remove old modal
  const prev = document.getElementById('overview-modal');
  if (prev) prev.remove();

  // Create modal shell
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

  // Group cards
  const typesOrder = ['Legend','Runes','Battlefield','Units','Spells'];
  const groups = {};
  document.querySelectorAll('#card-container .card').forEach(card => {
    const vn   = card.dataset.variant;
    const cls  = card.classList;
    const type = cls.contains('legend')      ? 'Legend'
               : cls.contains('rune')        ? 'Runes'
               : cls.contains('battlefield') ? 'Battlefield'
               : cls.contains('unit')        ? 'Units'
               : cls.contains('spell')       ? 'Spells'
               : cls.contains('gear')        ? 'Gear'
               : 'Other';
    groups[type] = groups[type] || {};
    groups[type][vn] = (groups[type][vn] || 0) + 1;
  });

  // Build sections
  const listEl = overlay.querySelector('#overview-list');
  typesOrder.concat(Object.keys(groups).filter(t=>!typesOrder.includes(t)))
    .forEach(type => {
      const variants = groups[type];
      if (!variants) return;
      const total = Object.values(variants).reduce((a,b)=>a+b,0);
      const section = document.createElement('div');
      section.className = 'overview-section';
      section.innerHTML = `<h3 data-type="${type}">${type} (${total})</h3>`;
      Object.entries(variants).forEach(([vn, count]) => {
        // grab card for name & icon
        const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
        let name = vn;
        const titleEl = cardEl.querySelector('.name, .legend-name .main-title, .rune-title, .bf-name');
        if (titleEl) name = titleEl.textContent.trim();
        const img = cardEl.querySelector('img.card-icon') || cardEl.querySelector('img');
        const logo = img ? img.src : '';

        // row
        const row = document.createElement('div');
        row.className = 'overview-item';
        row.dataset.variant = vn;
        row.innerHTML = `
          <img src="${logo}" class="overview-logo" alt="" />
          <span class="overview-text">${name} – ${vn}</span>
          <button class="overview-dec" data-vn="${vn}">–</button>
          <span class="overview-count">${count}</span>
          <button class="overview-inc" data-vn="${vn}">+</button>
        `;
        section.appendChild(row);
      });
      listEl.appendChild(section);
    });

  // Delegate clicks for both buttons
  listEl.addEventListener('click', e => {
    const inc = e.target.closest('.overview-inc');
    const dec = e.target.closest('.overview-dec');
    if (!inc && !dec) return;

    const isInc = !!inc;
    const btn   = inc || dec;
    const vn    = btn.dataset.vn;
    const row   = btn.closest('.overview-item');
    const countEl = row.querySelector('.overview-count');
    let count = parseInt(countEl.textContent, 10);

    if (isInc) {
      // Add in main list
      if (!window.addCard(vn)) return;
      count++;
    } else {
      // Remove in main list
      const cardEl = document.querySelector(`.card[data-variant="${vn}"]`);
      if (!cardEl || !window.removeCard(vn, cardEl)) return;
      count = Math.max(0, count - 1);
    }
    // Update row count
    countEl.textContent = count;

    // Update section total
    const section = row.closest('.overview-section');
    const hdr = section.querySelector('h3');
    const m   = hdr.textContent.match(/^(.+?)\s*\((\d+)\)/);
    if (m) {
      const label = m[1];
      const newTotal = isInc ? parseInt(m[2],10) + 1 : parseInt(m[2],10) - 1;
      hdr.textContent = `${label} (${newTotal})`;
    }
    // Update top-bar
    updateCount();
  });
}

  // — Live Recount via MutationObserver —
  (() => {
    const container = document.getElementById('card-container');
    if (!container) return;
    const observer = new MutationObserver(() => {
      updateCount();
      const variants = new Set();
      container.querySelectorAll('.card[data-variant]').forEach(c => {
        variants.add(c.getAttribute('data-variant'));
      });
      variants.forEach(vn => refreshBadge(vn));
    });
    observer.observe(container, { childList: true });
  })();

})();
