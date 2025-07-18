// ui.js — Handles top bar interactions and notifications
(() => {
  // Buttons
  const btnAdd       = document.getElementById('btn-add');
  const btnImport    = document.getElementById('btn-import');
  const btnPrint     = document.getElementById('btn-print');
  const btnOverview  = document.getElementById('btn-overview');
  const btnFullProxy = document.getElementById('btn-full-proxy');
  const btnReset     = document.getElementById('btn-reset');
  const countLabel   = document.getElementById('card-count');

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

  // TODO: Wire up events to existing search and render logic
  btnImport.addEventListener('click', () => {
    // Show a textarea dialog for paste-import
  });

  btnPrint.addEventListener('click', () => {
    // Open print dialog in a modal without helpers
  });

  btnOverview.addEventListener('click', () => {
    // Build and show overview modal grouped and ordered
  });

  btnFullProxy.addEventListener('click', () => {
    // Toggle image sources between proxies and real card art
  });

  btnReset.addEventListener('click', () => {
    history.replaceState({}, '', window.location.pathname);
    // Clear card container and counts
  });

  // Update count whenever a card is added/removed
  function updateCount() {
    // calculate total and update countLabel.textContent
  }

  // On page load, read URL params and restore state
  window.addEventListener('DOMContentLoaded', () => {
    // parse id params, call existing render, then updateCount()
  });

  // Make the search modal anchored under the top bar
  const searchModal = document.getElementById('search-modal');
  searchModal.style.top = '50px';
})();
