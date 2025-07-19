(function() {
  // Top-bar buttons
  var openBtn      = document.getElementById('open-search');
  var btnImport    = document.getElementById('btn-import');
  var btnPrint     = document.getElementById('btn-print');
  var btnOverview  = document.getElementById('btn-overview');
  var btnFullProxy = document.getElementById('btn-full-proxy');
  var btnReset     = document.getElementById('btn-reset');
  var countLabel   = document.getElementById('card-count');

  // State & flags
  window.cardCounts    = window.cardCounts    || {};
  var fullProxy        = false;
  var isImporting      = false;

  // ===== Toasts =====
  function notify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 4000);
    setTimeout(function(){ n.remove(); }, 4500);
  }
  function errorNotify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice error';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 10000);
    setTimeout(function(){ n.remove(); }, 10500);
  }
  function longNotify(msg) {
    var n = document.createElement('div');
    n.className = 'toast-notice';
    n.textContent = msg;
    document.getElementById('toast-container').appendChild(n);
    setTimeout(function(){ n.classList.add('visible'); }, 10);
    setTimeout(function(){ n.classList.remove('visible'); }, 4000);
    setTimeout(function(){ n.remove(); }, 4500);
  }

  // ===== Persistence =====
  function saveState() {
    localStorage.setItem('riftboundCardCounts', JSON.stringify(window.cardCounts));
  }
  function loadState() {
    try {
      var s = localStorage.getItem('riftboundCardCounts');
      window.cardCounts = s ? JSON.parse(s) : {};
    } catch (e) {
      console.warn('Failed to load state', e);
      window.cardCounts = {};
    }
  }

  // ===== Helpers =====
  function updateCount() {
    var total = Object.values(window.cardCounts).reduce(function(a,b){ return a+b; }, 0);
    countLabel.textContent = total + ' card' + (total!==1?'s':'');
  }
  function refreshBadge(vn) {
    var b = document.querySelector('[data-variant="' + vn + '"] .qty-badge');
    if (b) b.textContent = window.cardCounts[vn] || 0;
  }

  // ===== Wrap core addCard/removeCard =====
  var origAdd = typeof window.addCard === 'function' ? window.addCard : function(){};
  var origRm  = typeof window.removeCard === 'function' ? window.removeCard : function(){};

window.addCard = function(vn) {
  origAdd(vn);
  // check existence in DOM
  var el = document.querySelector('[data-variant="' + vn + '"]');
  if (!el) return false;        // indicate failure

  // increment count
  window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
  updateCount();
  saveState();
  refreshBadge(vn);

  // manual-add toast when not importing
  if (!isImporting) {
    var name = el.dataset.name || vn;
    notify(name + ' - ' + vn);
  }
  return true;                  // indicate success
};


  window.removeCard = function(vn, el) {
    origRm(vn, el);
    if (window.cardCounts[vn] > 1) {
      window.cardCounts[vn]--;
    } else {
      delete window.cardCounts[vn];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    updateCount();
    saveState();
    refreshBadge(vn);
  };

// ===== IMPORT LIST (modal) =====
btnImport.addEventListener('click', function(){
  // 1) Teardown any existing modal
  var prev = document.getElementById('import-modal');
  if (prev) prev.remove();

  // 2) Build & append modal
  var overlay = document.createElement('div');
  overlay.id = 'import-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content large" style="max-width:600px; padding:16px;">
      <button id="close-import" class="modal-close">×</button>
      <h2>Import List</h2>
      <p>Paste your Table Top Simulator Deck Code. The trailing “-NN” is ignored.</p>
      <textarea id="import-area"
        style="width:100%; height:200px; font-family:monospace;"
        placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
      <div style="text-align:right; margin-top:12px;">
        <button id="import-cancel" class="topbar-btn">Cancel</button>
        <button id="import-ok"     class="topbar-btn">Import</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // 3) Grab elements
  var areaEl    = overlay.querySelector('#import-area');
  var closeBtn  = overlay.querySelector('#close-import');
  var cancelBtn = overlay.querySelector('#import-cancel');
  var okBtn     = overlay.querySelector('#import-ok');

  closeBtn.onclick  = () => overlay.remove();
  cancelBtn.onclick = () => overlay.remove();

  // 4) Handle Import
  okBtn.onclick = function(){
    overlay.remove();
    longNotify('Deck Import in Progress');

    // Clear existing cards & state
    document.getElementById('card-container').innerHTML = '';
    window.cardCounts = {};

    // Parse tokens and add
    var tokens     = (areaEl.value||'').trim().split(/\s+/).filter(Boolean);
    var totalAdded = 0;

    isImporting = true;
    tokens.forEach(function(tok){
      var parts = tok.split('-');
      if (parts.length < 2) return;
      var vn = parts[0] + '-' + parts[1];
      // add exactly once per token
      window.addCard(vn);
      totalAdded++;
    });
    isImporting = false;

    // Persist and update counter
    saveState();
    updateCount();

    // Summary toast only
    if (totalAdded)
      notify(totalAdded + ' card' + (totalAdded>1?'s':'') + ' added');
  };
});



  // ===== Other Top-Bar Buttons =====
  btnPrint.addEventListener('click', function(){
    document.getElementById('top-bar').style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(function(){
      document.getElementById('top-bar').style.display = '';
    }, 0);
  });

  btnOverview.addEventListener('click', function(){
    buildOverview();
    notify('Overview opened');
  });

  btnFullProxy.addEventListener('click', function(){
    fullProxy = !fullProxy;
    Object.keys(window.cardCounts).forEach(function(vn){
      var img = document.querySelector('[data-variant="' + vn + '"] img.card-img');
      if (img) img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy ? 'Full art ON' : 'Proxy art ON');
  });

  btnReset.addEventListener('click', function(){
    window.cardCounts = {};
    document.getElementById('card-container').innerHTML = '';
    updateCount();
    saveState();
    notify('Reset complete');
  });

  // ===== On Load: Restore State =====
  document.addEventListener('DOMContentLoaded', function(){
    loadState();
    Object.entries(window.cardCounts).forEach(function(pair){
      var vn = pair[0], cnt = pair[1];
      for (var i = 0; i < cnt; i++) window.addCard(vn);
    });
    updateCount();
    var sm = document.getElementById('search-modal'); if (sm) sm.style.top = '50px';
  });

  // ===== Overview Builder =====
  function buildOverview(){
    var ex = document.getElementById('overview-modal'); if (ex) ex.remove();
    var m = document.createElement('div'); m.id='overview-modal'; m.className='modal-overlay';
    m.innerHTML =
      '<div class="modal-content small">'+
        '<button id="close-overview" class="modal-close">×</button>'+
        '<h2>Overview</h2><div id="overview-list"></div>'+
      '</div>';
    document.body.appendChild(m);
    document.getElementById('close-overview').onclick = function(){ m.remove(); };

    var order=['Legend','Runes','Units','Spells','Gear','Battlefield'], grp={};
    Object.keys(window.cardCounts).forEach(function(vn){
      var el = document.querySelector('[data-variant="'+vn+'"]');
      var t  = (el&&el.dataset.type)?el.dataset.type:'Other';
      (grp[t]=grp[t]||[]).push(vn);
    });
    var cntEl=document.getElementById('overview-list');
    order.forEach(function(type){
      if (grp[type]){
        var sec=document.createElement('div'), h=document.createElement('h3');
        h.textContent=type; sec.appendChild(h);
        grp[type].forEach(function(vn){
          var el=document.querySelector('[data-variant="'+vn+'"]'),
              name=(el&&el.dataset.name)?el.dataset.name:vn,
              setNo=(el&&el.dataset.set)?el.dataset.set:'',
              logo=(el&&el.dataset.colorLogo)?el.dataset.colorLogo:'';
          var row=document.createElement('div'); row.className='overview-item';
          row.innerHTML=
            '<img src="'+logo+'" class="overview-logo"/>'+
            '<span>'+name+' ('+setNo+')</span>'+
            '<button class="overview-dec" data-vn="'+vn+'">–</button>'+
            '<span class="overview-count">'+window.cardCounts[vn]+'</span>'+
            '<button class="overview-inc" data-vn="'+vn+'">+</button>';
          sec.appendChild(row);
        });
        cntEl.appendChild(sec);
      }
    });
  }
})();
