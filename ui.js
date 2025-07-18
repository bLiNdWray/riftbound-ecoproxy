(function(){
  var openBtn       = document.getElementById('open-search');
  var btnImport     = document.getElementById('btn-import');
  var btnPrint      = document.getElementById('btn-print');
  var btnOverview   = document.getElementById('btn-overview');
  var btnFullProxy  = document.getElementById('btn-full-proxy');
  var btnReset      = document.getElementById('btn-reset');
  var countLabel    = document.getElementById('card-count');

  window.addedVariants = window.addedVariants || [];
  var fullProxy = false;

// Short toast
function notify(msg) {
  var n = document.createElement('div');
  n.className = 'toast-notice';
  n.textContent = msg;
  document.getElementById('toast-container').appendChild(n);
  // fade in/out
  setTimeout(function(){ n.classList.add('visible'); }, 10);
  setTimeout(function(){ n.classList.remove('visible'); }, 2000);
  setTimeout(function(){ n.remove(); }, 2500);
}

 // Long toast (4s)
function longNotify(msg) {
  var n = document.createElement('div');
  n.className = 'toast-notice';
  n.textContent = msg;
  document.getElementById('toast-container').appendChild(n);
  setTimeout(function(){ n.classList.add('visible'); }, 10);
  setTimeout(function(){ n.classList.remove('visible'); }, 4000);
  setTimeout(function(){ n.remove(); }, 4500);
}

  // Persistence helpers
  function saveState() {
    localStorage.setItem(
      'riftboundCardCounts',
      JSON.stringify(window.cardCounts || {})
    );
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

// ===== IMPORT LIST (modal) =====
btnImport.addEventListener('click', function(){
  window.cardCounts = window.cardCounts || {};

  // Remove old modal
  var prev = document.getElementById('import-modal');
  if (prev) prev.remove();

  // Build modal
  var overlay = document.createElement('div');
  overlay.id = 'import-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content large" style="max-width:600px; padding:16px;">
      <button id="close-import" class="modal-close">×</button>
      <h2>Import List</h2>
      <p>Paste your Table Top Simulator Deck Code.</p>
      <textarea id="import-area"
        style="width:100%; height:200px; font-family:monospace;"
        placeholder="e.g. OGN-045-03 OGN-046-02"></textarea>
      <label style="display:block; margin:8px 0;">
        <input type="checkbox" id="import-clear" />
        Clear existing cards before import
      </label>
      <div style="text-align:right; margin-top:12px;">
        <button id="import-cancel" class="topbar-btn">Cancel</button>
        <button id="import-ok"     class="topbar-btn">Import</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Grab elements
  var area  = document.getElementById('import-area'),
      clear = document.getElementById('import-clear');
  document.getElementById('close-import').onclick = closeModal;
  document.getElementById('import-cancel').onclick = closeModal;

  // Prefill
  area.value = Object.keys(window.cardCounts || {}).join(' ');

  function closeModal() { overlay.remove(); }

  // On Import
  document.getElementById('import-ok').onclick = function(){
    // Close modal & persist
    closeModal();
    saveState();

    // Show in-progress
    longNotify('Deck Import in Progress');

    // Optional clear
    if (clear.checked) {
      document.getElementById('card-container').innerHTML = '';
      window.cardCounts = {};
      updateCount();
      saveState();
    }

    // Parse & add, collect errors
    var tokens = (area.value||'').trim().split(/\s+/),
        errors = [];
    tokens.forEach(function(tok){
      var parts = tok.split('-');
      if (parts.length < 2) {
        errors.push(tok);
        return;
      }
      var vn = parts[0] + '-' + parts[1];
      var before = window.cardCounts[vn] || 0;
      window.addCard(vn);
      var after = window.cardCounts[vn] || 0;
      if (after === before) errors.push(vn);
    });

    // Show errors
    errors.forEach(function(vn){
      notify(vn + ' can\'t be found');
    });
  };
});

  btnPrint.addEventListener('click', function(){
    var bar = document.getElementById('top-bar');
    bar.style.display = 'none';
    document.getElementById('search-modal').classList.add('hidden');
    window.print();
    setTimeout(function(){ bar.style.display = ''; }, 0);
  });

  function buildOverview(){
    var existing = document.getElementById('overview-modal');
    if(existing) existing.remove();
    var modal = document.createElement('div');
    modal.id = 'overview-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-content small">'
      + '<button id="close-overview" class="modal-close">×</button>'
      + '<h2>Overview</h2><div id="overview-list"></div></div>';
    document.body.appendChild(modal);
    document.getElementById('close-overview').onclick = function(){ modal.remove(); };

    var order = ['Legend','Runes','Units','Spells','Gear','Battlefield'];
    var grouped = {};
    window.addedVariants.forEach(function(vn){
      var el = document.querySelector('[data-variant-number="'+vn+'"]');
      var type = el && el.dataset.type ? el.dataset.type : 'Other';
      grouped[type] = grouped[type] || [];
      grouped[type].push(vn);
    });

    var container = document.getElementById('overview-list');
    order.forEach(function(type){
      if(grouped[type]){
        var sec = document.createElement('div');
        var h = document.createElement('h3'); h.textContent = type;
        sec.appendChild(h);
        grouped[type].forEach(function(vn){
          var el = document.querySelector('[data-variant-number="'+vn+'"]');
          var name = el&&el.dataset.name||vn;
          var setNo = el&&el.dataset.set||'';
          var logo = el&&el.dataset.colorLogo||'';
          var row = document.createElement('div');
          row.className='overview-item';
          row.innerHTML='<img src="'+logo+'" class="overview-logo">'
            +'<span>'+name+' ('+setNo+')</span>'
            +'<button class="overview-dec" data-vn="'+vn+'">–</button>'
            +'<span class="overview-count">1</span>'
            +'<button class="overview-inc" data-vn="'+vn+'">+</button>';
          sec.appendChild(row);
        });
        container.appendChild(sec);
      }
    });
  }
  btnOverview.addEventListener('click', function(){ buildOverview(); notify('Overview opened'); });

  btnFullProxy.addEventListener('click', function(){
    fullProxy=!fullProxy;
    window.addedVariants.forEach(function(vn){
      var img = document.querySelector('[data-variant-number="'+vn+'"] img.card-img');
      if(!img) return;
      img.src = fullProxy ? img.dataset.fullArt : img.dataset.proxyArt;
    });
    notify(fullProxy?'Full art ON':'Proxy art ON');
  });

  btnReset.addEventListener('click', function(){
    history.replaceState({},'',window.location.pathname);
    window.addedVariants=[];
    document.getElementById('card-container').innerHTML='';
    updateCount(); notify('Reset complete');
  });

  function updateCount(){
    var t=window.addedVariants.length;
    countLabel.textContent=t+' card'+(t!==1?'s':'');
  }

  function cacheState(){
    var p=new URLSearchParams();
    window.addedVariants.forEach(function(vn){p.append('id',vn);});
    history.replaceState({},'',window.location.pathname+'?'+p);
  }

  var origAdd = typeof window.addCard==='function'?window.addCard:function(v){console.warn('addCard not defined');};
  var origRm  = typeof window.removeCard==='function'?window.removeCard:function(v,e){console.warn('removeCard not defined');};
  window.addCard=function(vn){ origAdd(vn); updateCount(); window.addedVariants.push(vn); cacheState();};
  window.removeCard=function(vn,el){ origRm(vn,el); window.addedVariants=window.addedVariants.filter(function(x){return x!==vn;}); updateCount(); cacheState();};

  document.addEventListener('DOMContentLoaded',function(){
    var ps=new URLSearchParams(window.location.search);
    ps.getAll('id').forEach(function(vn){window.addCard(vn);}); updateCount();
  });
})();
