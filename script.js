// script.js

document.addEventListener('DOMContentLoaded', () => {
  const openBtn  = document.getElementById('open-search');
  const closeBtn = document.getElementById('close-search');
  const modal    = document.getElementById('search-modal');

  openBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
  });

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  // Optional: clicking backdrop also closes
  document.querySelector('.modal-backdrop').addEventListener('click', () => {
    modal.classList.add('hidden');
  });
});
