// ===== Video autoplay fix (mobilni / iOS) =====
function forceVideoPlay() {
    document.querySelectorAll('video').forEach(v => {
      v.muted = true;
      v.defaultMuted = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    });
  }
  
  forceVideoPlay();
  document.addEventListener('DOMContentLoaded', forceVideoPlay);
  window.addEventListener('load', forceVideoPlay);
  
  // če brskalnik blokira avtoplay do prve interakcije — sproži ob prvem dotiku/skrolu
  ['touchstart', 'click', 'scroll'].forEach(evt =>
    document.addEventListener(evt, forceVideoPlay, { once: true, passive: true })
  );