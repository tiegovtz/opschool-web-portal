export default defineNuxtPlugin(() => {
    if (import.meta.server) return;
  
  
    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      console.warn('🚫 Context menu blocked');
    });
  
    // Disable text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault();
      console.warn('🚫 Text selection blocked');
    });
  
    // Optional: Disable drag events
    document.addEventListener('dragstart', (e) => {
      e.preventDefault();
      console.warn('🚫 Drag blocked');
    });
  
    // Disable key combinations (F12, Ctrl+Shift+I/J/C/U, etc.)
    document.addEventListener('keydown', (e) => {
      const key = e.key?.toLowerCase();
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (e.ctrlKey && ['u'].includes(key))
      ) {
        e.preventDefault();
        console.warn(`🚫 Blocked key combo: ${e.key}`);
      }
    });
  
    // Style-based text selection block (fallback)
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
    `;
    document.head.appendChild(style);
  
    console.log('[Harden UI] UI protections enabled ✅');
  });
  