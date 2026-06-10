// ---------- NAV scroll ----------
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40));

// ---------- Init (render + filtri iz djs.js) ----------
renderDJs('djGrid', window.innerWidth <= 560 ? 3 : 6);
initFilters('djGrid');