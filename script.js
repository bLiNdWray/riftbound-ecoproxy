(function() {
  // — Persistence helpers —
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

  // — State & initial setup —
  window.cardCounts = {};
  let addedCounts   = {};

  // — Exposed API from your old script.js — keep these as-is
  // (assume renderCards and friends are defined elsewhere)
  // function renderCards(ids, skipUrlUpdate) { … }

  // — Wrap addCard so it updates cardCounts —
  const origAdd = typeof window.addCard === 'function' ? window.addCard : () => false;
  window.addCard = function(vn) {
    const before = document.querySelectorAll(`#card-container .card[data-variant="${vn}"]`).length;
    const ok = origAdd(vn);
    if (ok) {
      window.cardCounts[vn] = (window.cardCounts[vn] || 0) + 1;
      saveState();
    }
    return ok;
  };

  // — Wrap removeCard so it updates cardCounts —
  const origRm = typeof window.removeCard === 'function' ? window.removeCard : () => false;
  window.removeCard = function(vn, el) {
    // find a real card element if none passed
    const cardEl = el || document.querySelector(`#card-container .card[data-variant="${vn}"]`);
    if (!cardEl) return false;
    const ok = origRm(vn, cardEl);
    if (ok && typeof window.cardCounts[vn] === 'number') {
      window.cardCounts[vn] = Math.max(0, window.cardCounts[vn] - 1);
      saveState();
    }
    return ok;
  };

  // — Single DOMContentLoaded handler —
  document.addEventListener('DOMContentLoaded', () => {
    // 1) Load persisted counts
    loadState();

    // 2) Re-render cards from state
    Object.entries(window.cardCounts).forEach(([vn, count]) => {
      for (let i = 0; i < count; i++) {
        window.addCard(vn);
      }
    });

    // 3) Then parse URL if you still support ?id=... rendering
    //    renderCards(parseIdsFromURL(), true);

    // 4) Initialize addedCounts mirror
    addedCounts = { ...window.cardCounts };
  });

})();
