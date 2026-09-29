// error-handler.js – global error handling & init lazy loading

const MAX_ERROR_LOGS = 50;

function appendErrorLog(entry) {
  try {
    const logs = JSON.parse(localStorage.getItem('tasveer_error_logs') || '[]');
    logs.push(entry);
    while (logs.length > MAX_ERROR_LOGS) logs.shift();
    localStorage.setItem('tasveer_error_logs', JSON.stringify(logs));
  } catch (e) {
    // Avoid infinite error loops when localStorage is full
    try { localStorage.removeItem('tasveer_error_logs'); } catch (_) {}
  }
}

// Global error & unhandled promise rejection logging
window.addEventListener('error', (e) => {
  console.error('Global error captured:', e.message, 'at', e.filename + ':' + e.lineno);
  appendErrorLog({ type: 'error', message: e.message, file: e.filename, line: e.lineno, time: Date.now() });
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  appendErrorLog({ type: 'unhandledrejection', reason: String(e.reason), time: Date.now() });
});

// Initialize lazy loading after DOM is ready
window.addEventListener('load', () => {
  if (window.lazyLoadImages) {
    window.lazyLoadImages();
  }
});
