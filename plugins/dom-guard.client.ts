export default defineNuxtPlugin(() => {
    if (import.meta.server) return;
  
    // ✅ Allow-list trusted script sources
    const isTrustedScript = (node: Node) =>
      node.nodeType === Node.ELEMENT_NODE &&
      node.nodeName === 'SCRIPT' &&
      (node as HTMLElement).hasAttribute('data-trusted');
  
    // 🚨 Monitor for suspicious <script> tags
    const scriptObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.nodeName === 'SCRIPT' &&
            !(node as HTMLElement).hasAttribute('data-trusted')
          ) {
            console.warn('🚨 Removed suspicious script:', node);
            node.parentNode?.removeChild(node);
          }
        }
      }
    });
  
    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  
    // 🧩 Observe changes only outside the Nuxt dynamic region
    const protectedRegions = ['header', 'footer']; // Add more selectors if needed
    protectedRegions.forEach((selector) => {
      const region = document.querySelector(selector);
      if (region) {
        const original = region.innerHTML;
  
        const regionObserver = new MutationObserver(() => {
          if (region.innerHTML !== original) {
            console.warn(`⚠️ Protected region <${selector}> was changed! Reverting.`);
            region.innerHTML = original;
          }
        });
  
        regionObserver.observe(region, {
          childList: true,
          subtree: true,
        });
      }
    });
  
    // 🧱 Block dangerous APIs
    try {
      window.eval = () => {
        console.warn('❌ eval() is disabled');
        return null;
      };
  
      // @ts-ignore
      window.Function = () => {
        console.warn('❌ Function constructor is disabled');
        return () => {};
      };
    } catch (err) {
      console.error('Failed to override globals:', err);
    }
  
    // 🔍 Detect common browser extension hints
    if (document.querySelector('[id^="crx"]') || (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn('👀 Extension or DevTools hook detected');
    }
  
    console.log('[DOM Guard] Running in safe mode ✅');
  });
  