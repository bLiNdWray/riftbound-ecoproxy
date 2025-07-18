(function() {
  // State
  window.addedVariants = window.addedVariants || [];
  var fullProxy = false;

  // Simple toast notification
  function notify(message) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = message;
    document.body.appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 2000);
    setTimeout(function(){ n.remove(); }, 3000);
  }

  // update card counter badge
  function updateCount() {
    var countLabel = document.getElementById('card-count');
    var t = window.addedVariants.length;
    countLabel.textContent = t + ' card' + (t !== 1 ? 's' : '');
  }

  // cache current list to URL params
  function cacheState() {
    var p = new URLSearchParams();
    window.addedVariants.forEach(function(vn) {
      p.append('id', vn);
    });
    history.replaceState({}, '', window.location.pathname + '?' + p.toString());
  }

  // IMPORT LIST handler
  function handleImport() {
    var text = prompt('Paste your list of variant numbers (one per line):');
    if (!text) return;
    var list = text.split(/\r?\n/);
    var imported = 0;
    list.forEach(function(line) {
      var vn = line.trim();
      if (vn && window.addedVariants.indexOf(vn) === -1) {
        window.addCard(vn);
        window.addedVariants.push(vn);
        imported++;
      }
    });
    updateCount();
    cacheState();
    notify(imported + ' cards imported');
  }

  // PRINT handler
  function handlePrint() {
    var bar = document.getElementById('top-bar');
    bar.style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(function(){ bar.style.display = ''; }, 0);
  }

  // OVERVIEW builder
  function buildOverview() {
    var existing = document.getElementById('overview-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'overview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML =
      '<div class="modal-content small">' +
        '<button id="close-overview" class="modal-close">×</button>' +
        '<h2>Overview</h2>' +
        '<div id="overview-list"></div>' +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('close-overview').onclick = function() { modal.remove(); };

    var order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    var grouped = {};

    window.addedVariants.forEach(function(vn) {
      var el = document.querySelector('[data-variant="' + vn + '"]');
      var type = (el && el.dataset.type) ? el.dataset.type : 'Other';
      grouped[type] = grouped[type] || [];
      grouped[type].push(vn);
    });

    var container = document.getElementById('overview-list');
    order.forEach(function(type) {
      if (grouped[type]) {
        var sec = document.createElement('div');
        var h = document.createElement('h3'); h.textContent = type;
        sec.appendChild(h);

        grouped[type].forEach(function(vn) {
          var el = document.querySelector('[data-variant="' + vn + '"]');
          var name = (el && el.dataset.name) ? el.dataset.name : vn;
          var setNo = (el && el.dataset.set)    ? el.dataset.set    : '';
          var logo  = (el && el.dataset.colorLogo) ? el.dataset.colorLogo : '';
          var row = document.createElement('div');
          row.className = 'overview-item';
          row.innerHTML =
            '<img src="' + logo + '" class="overview-logo" />' +
            '<span>' + name + ' (' + setNo + ')</span>' +
            '<button class="overview-dec" data-vn="' + vn + '">–</button>' +
            '<span class="overview-count">1</span>' +
            '<button class="overview-inc" data-vn="' + vn + '">+</button>';
          sec.appendChild(row);
        });

        container.appendChild(sec);
      }
    });
  }

  // FULL PROXY handler
  function handleFullProxy() {
    fullProxy = !fullProxy;
    window.addedVariants.forEach(function(vn) {
      var img = document.querySelector('[data-variant="' + vn + '"] img.card-img');
      if (!img) return;
      img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  }

  // RESET handler
  function handleReset() {
    history.replaceState({}, '', window.location.pathname);
    window.addedVariants = [];
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    notify('Reset complete');
  }

  // Wrap original addCard/removeCard safely
  var origAdd = typeof window.addCard === 'function'
    ? window.addCard
    : function(vn) { console.warn('addCard not defined'); };
  var origRm  = typeof window.removeCard === 'function'
    ? window.removeCard
    : function(vn,el) { console.warn('removeCard not defined'); };

  window.addCard = function(vn) {
    origAdd(vn);
    if (window.addedVariants.indexOf(vn) === -1) {
      window.addedVariants.push(vn);
    }
    updateCount();
    cacheState();
  };
  window.removeCard = function(vn,el) {
    origRm(vn,el);
    window.addedVariants = window.addedVariants.filter(function(x){ return x !== vn; });
    updateCount();
    cacheState();
  };

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    // Lookup buttons
    var openBtn       = document.getElementById('open-search');
    var btnImport     = document.getElementById('btn-import');
    var btnPrint      = document.getElementById('btn-print');
    var btnOverview   = document.getElementById('btn-overview');
    var btnFullProxy  = document.getElementById('btn-full-proxy');
    var btnReset      = document.getElementById('btn-reset');
    var cardContainer = document.getElementById('card-container');
    var searchModal   = document.getElementById('search-modal');

    // Hook up your existing search modal open/close
    openBtn.addEventListener('click', function(){ searchModal.classList.remove('hidden'); });
    document.getElementById('close-search').addEventListener('click', function(){
      searchModal.classList.add('hidden');
    });

    // Hook up new controls
    btnImport.addEventListener('click', handleImport);
    btnPrint.addEventListener('click', handlePrint);
    btnOverview.addEventListener('click', function(){ buildOverview(); notify('Overview opened'); });
    btnFullProxy.addEventListener('click', handleFullProxy);
    btnReset.addEventListener('click', handleReset);

    // Restore from URL
    var ps = new URLSearchParams(window.location.search);
    ps.getAll('id').forEach(function(vn){ window.addCard(vn); });
    updateCount();

    // Anchor search modal
    if (searchModal) { searchModal.style.top = '50px'; }
  });

})();
