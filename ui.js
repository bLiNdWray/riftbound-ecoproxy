here is my current index.html, is my ui hooked up correctly to the html layout
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Riftbound Proxy Generator</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="card.css">
  <link rel="stylesheet" href="topbar.css">
</head>
<body>
  <nav id="top-bar">
    <div class="topbar-left">
      <button id="open-search" class="topbar-btn">Add Cards</button>
      <button id="btn-import" class="topbar-btn">Import List</button>
      <button id="btn-print" class="topbar-btn">Print</button>
      <button id="btn-overview" class="topbar-btn">Overview</button>
      <button id="btn-full-proxy" class="topbar-btn">Full Proxy</button>
    </div>
    <div class="topbar-center">
      <span id="card-count">0 cards</span>
    </div>
    <div class="topbar-right">
      <div class="donate-buttons">
  <!-- PayPal Donate -->
  <a href="" title="Donate via PayPal">
    <img
      src="https://www.paypalobjects.com/webstatic/icon/pp258.png"
      alt="PayPal"
      width="32" height="32"
    />
  </a>

  <!-- Venmo Donate -->
  <a href="" title="Donate via Venmo">
    <img
      src="https://cdn.jsdelivr.net/npm/supertinyicons@1.0.0/icons/venmo.svg"
      alt="Venmo"
      width="32" height="32"
    />
  </a>
</div>
      <button id="btn-reset" class="topbar-btn">Reset</button>
    </div>
  </nav>
<div id="toast-container"></div>
  <main id="card-container" class="layout-horizontal"></main>

  <div id="search-modal" class="search-modal hidden" style="top:50px;">
    <div class="modal-content">
      <div class="modal-body">
  <section class="search-panel" style="width:100%; border-right:none;">
    <div class="search-header">
      <button id="close-search" class="modal-close">×</button>
      <input type="text" id="card-search-input" placeholder="Type to search by name or ID…" />
    </div>
          <div id="search-results" class="results-grid"></div>
        </section>
      </div>
    </div>
  </div>

  <script src="script.js"></script>
  <script src="ui.js"></script>
</body>
</html>
