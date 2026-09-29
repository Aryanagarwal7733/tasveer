// lazyLoadImages.js – IntersectionObserver based lazy loading

function lazyLoadImages() {
  const imgs = document.querySelectorAll('img[data-src]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      });
    });
    imgs.forEach(img => observer.observe(img));
  } else {
    // fallback – load all immediately
    imgs.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

// Export for manual call (if needed)
window.lazyLoadImages = lazyLoadImages;
