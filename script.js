(async () => {
  const API_BASE   = 'https://script.google.com/macros/s/AKfycbxTZhEAgwVw51GeZL_9LOPAJ48bYGeR7X8eQcQMBOPWxxbEZe_A0ghsny-GdA9gdhIn/exec';
  const SHEET_NAME = 'Riftbound Cards';

  const container = document.getElementById('card-container');
  const openBtn   = document.getElementById('open-search');
  const closeBtn  = document.getElementById('close-search');
  const modal     = document.getElementById('search-modal');
  const input     = document.getElementById('card-search-input');
  const results   = document.getElementById('search-results');

  const addedCounts = {};
  let allCards = [];

  // JSONP helper omitted for brevity…

  // 1) Load all cards for search
  await new Promise(resolve => {
    jsonpFetch({ sheet: SHEET_NAME }, data => {
      allCards = Array.isArray(data) ? data : [];
      resolve();
    });
  });

  // 2) Initial render from URL (?id=variantNumber) omitted…

  // 6) Search modal logic
  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    input.value = '';
    results.innerHTML = '';
    input.focus();
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

  // Allowed types whitelist
  const allowedTypes = ['unit','spell','gear','battlefield','legend','rune'];

  // 7) Filter & render on input
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) return results.innerHTML = '';

    const filtered = allCards
      .filter(c => {
        const nameMatch = (c.name||'').toLowerCase().includes(q);
        const idMatch   = (c.variantNumber||'').toLowerCase().includes(q);
        const typeMatch = allowedTypes.includes((c.type||'').toLowerCase());
        return (nameMatch || idMatch) && typeMatch;
      });

    renderSearchResults(filtered);
  });

  function renderSearchResults(list) {
    results.innerHTML = '';
    list.forEach(c => {
      let el;
      switch ((c.type||'').toLowerCase()) {
        case 'unit':        el = makeUnit(c);        break;
        case 'spell':
        case 'gear':        el = makeSpell(c);       break;
        case 'battlefield': el = makeBattlefield(c); break;
        case 'legend':      el = makeLegend(c);      break;
        case 'rune':        el = makeRune(c);        break;
        default: return;  // safety net
      }
      results.appendChild(el);
    });
  }

  // ...rest of your build/add/remove and makeX functions remain unchanged...
})();
