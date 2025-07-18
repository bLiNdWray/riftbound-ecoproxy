(function(){
  // Top‐bar buttons
  var openBtn      = document.getElementById('open-search');
  var btnImport    = document.getElementById('btn-import');
  var btnPrint     = document.getElementById('btn-print');
  var btnOverview  = document.getElementById('btn-overview');
  var btnFullProxy = document.getElementById('btn-full-proxy');
  var btnReset     = document.getElementById('btn-reset');
  var countLabel   = document.getElementById('card-count');

  // Replace addedVariants array with a cardCounts map
  window.cardCounts = window.cardCounts || {};  // { vn: count, ... }
  var fullProxy = false;

  function notify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 2000);
    setTimeout(function(){ n.remove(); }, 3000);
  }
// Persist cardCounts in localStorage under 'riftboundCardCounts'
function saveState() {
  localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
}
function loadState() {
  try {
    var stored = localStorage.getItem('riftboundCardCounts');
    if (stored) {
      window.cardCounts = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load saved state', e);
    window.cardCounts = {};
  }
}

  
  // IMPORT
  btnImport.addEventListener('click', function(){
    var text = prompt('Paste variant numbers (one per line):');
    if (!text) return;
    var list = text.split(/\r?\n/), imp = 0;
    list.forEach(function(line){
      var vn = line.trim();
      if (!vn) return;
      window.addCard(vn);
      imp++;
    });
    notify(imp + ' cards imported');
  });

  // PRINT
  btnPrint.addEventListener('click', function(){
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(function(){
      document.getElementById('top-bar').style.display = '';
    }, 0);
  });

  // OVERVIEW
  btnOverview.addEventListener('click', function(){
    buildOverview();
    notify('Overview opened');
  });

  // FULL PROXY
  btnFullProxy.addEventListener('click', function(){
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(function(vn){
      var img = document.querySelector('[data-variant="' + vn + '"] img.card-img');
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  });

  // RESET
  btnReset.addEventListener('click', function(){
    history.replaceState({}, '', window.location.pathname);
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    notify('Reset complete');
  });

  // Update top‐bar total
  function updateCount() {
    var total = Object.values(window.cardCounts).reduce(function(a,b){ return a + b; }, 0);
    countLabel.textContent = total + ' card' + (total !== 1 ? 's' : '');
  }

  

  // Wrap original hooks
  var origAdd = typeof window.addCard === 'function'
    ? window.addCard
    : function(vn){ console.warn('addCard not defined'); };
  var origRm  = typeof window.removeCard === 'function'
    ? window.removeCard
    : function(vn,el){ console.warn('removeCard not defined'); };

  // Refresh just one badge
  function refreshBadge(vn) {
    var b = document.querySelector('[data-variant="' + vn + '"] .qty-badge');
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // **New** global overrides using cardCounts map
  window.addCard = function(vn) {
    origAdd(vn);
    window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
    updateCount();
    saveState();
    refreshBadge(vn);
  };

  window.removeCard = function(vn, el) {
    origRm(vn, el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      // also remove the element if needed
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    updateCount();
    saveState();
    refreshBadge(vn);
  };

  
  // Overview builder (unchanged)
  function buildOverview(){
    var ex = document.getElementById('overview-modal');
    if (ex) ex.remove();
    var m = document.createElement('div');
    m.id = 'overview-modal'; m.className = 'modal-overlay';
    m.innerHTML =
      '<div class="modal-content small">'+
        '<button id="close-overview" class="modal-close">×</button>'+
        '<h2>Overview</h2><div id="overview-list"></div>'+
      '</div>';
    document.body.appendChild(m);
    document.getElementById('close-overview').onclick = function(){ m.remove(); };

    var order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    var grouped = {};
    Object.keys(window.cardCounts).forEach(function(vn){
      var el = document.querySelector('[data-variant="' + vn + '"]');
      var type = (el && el.dataset.type) ? el.dataset.type : 'Other';
      grouped[type] = grouped[type] || [];
      grouped[type].push(vn);
    });

    var container = document.getElementById('overview-list');
    order.forEach(function(type){
      if (grouped[type]) {
        var sec = document.createElement('div'),
            h   = document.createElement('h3');
        h.textContent = type; sec.appendChild(h);
        grouped[type].forEach(function(vn){
          var el    = document.querySelector('[data-variant="'+vn+'"]'),
              name  = (el && el.dataset.name ) ? el.dataset.name  : vn,
              setNo = (el && el.dataset.set  ) ? el.dataset.set   : '',
              logo  = (el && el.dataset.colorLogo) ? el.dataset.colorLogo : '';
          var row = document.createElement('div');
          row.className = 'overview-item';
          row.innerHTML =
            '<img src="'+logo+'" class="overview-logo" />'+
            '<span>'+name+' ('+setNo+')</span>'+
            '<button class="overview-dec" data-vn="'+vn+'">–</button>'+
            '<span class="overview-count">'+window.cardCounts[vn]+'</span>'+
            '<button class="overview-inc" data-vn="'+vn+'">+</button>';
          sec.appendChild(row);
        });
        container.appendChild(sec);
      }
    });
  }
document.addEventListener('DOMContentLoaded', function() {
  // 1. Load any saved cardCounts
  loadState();
  // 2. Re-render all saved cards
  Object.keys(window.cardCounts).forEach(function(vn) {
    for (var i = 0; i < window.cardCounts[vn]; i++) {
      window.addCard(vn);
    }
  });
  // 3. Update the top-bar total and badges
  updateCount();
  // 4. Anchor the search modal
  var sm = document.getElementById('search-modal');
  if (sm) sm.style.top = '50px';
});
})();
