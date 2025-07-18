// ui.js — Handles top bar interactions and notifications
(() => {
  // Buttons
  const openBtn       = document.getElementById('open-search');
  const btnImport     = document.getElementById('btn-import');
  const btnPrint      = document.getElementById('btn-print');
  const btnOverview   = document.getElementById('btn-overview');
  const btnFullProxy  = document.getElementById('btn-full-proxy');
  const btnReset      = document.getElementById('btn-reset');
  const countLabel    = document.getElementById('card-count');

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

  // Wire up top-bar stubs
  btnImport.addEventListener('click', () => {
    notify('Import List clicked');
    // TODO: launch import-text dialog
  });

  btnPrint.addEventListener('click', () => {
    notify('Print clicked');
    // TODO: open print-only dialog
  });

  btnOverview.addEventListener('click', () => {
    notify('Overview clicked');
    // TODO: show overview modal
  });

  btnFullProxy.addEventListener('click', () => {
    notify('Full Proxy toggled');
    // TODO: swap proxy ↔ full art
  });

  btnReset.addEventListener('click', () => {
    history.replaceState({}, '', window.location.pathname);
    document.getElementById('card-container').innerHTML = '';
    notify('Reset complete');
  });

  // Update count whenever a card is added/removed
  function updateCount() {
    const total = Object.values(window.addedCounts || {}).reduce((a,b)=>a+b,0);
    countLabel.textContent = `${total} card${total!==1?'s':''}`;
  }
  // Monkey-patch addCard/removeCard to also refresh count & URL
  const origAdd = window.addCard;
  const origRm  = window.removeCard;
  window.addCard = vn => { origAdd(vn); updateCount(); };
  window.removeCard = (vn, el) => { origRm(vn, el); updateCount(); };

  // On page load, read URL params and restore state
  window.addEventListener('DOMContentLoaded', () => {
    updateCount();
    // your existing init logic in script.js will fire first (renderCards, etc)
  });

  // Anchor search modal below bar
  const searchModal = document.getElementById('search-modal');
  searchModal.style.top = '50px';
})();
