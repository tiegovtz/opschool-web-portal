export default defineNuxtPlugin(() => {
    if (import.meta.server) return;
  
    // 1. 🧬 Mutation Observer to detect suspicious <script> tags
    const scriptObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.nodeName === 'SCRIPT' &&
            !(node as HTMLElement).hasAttribute('data-trusted')
          ) {
            console.warn('🚨 Blocked suspicious script injection:', node);
            node.parentNode?.removeChild(node);
          }
        }
      }
    });
  
    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  
    // 2. 🔒 Lock down critical DOM node (Nuxt root)
    const appRoot = document.getElementById('__nuxt');
    const originalHTML = appRoot?.innerHTML;
  
    if (appRoot && originalHTML) {
      const domLock = new MutationObserver(() => {
        if (appRoot.innerHTML !== originalHTML) {
          console.warn('⚠️ App root was tampered with! Reverting changes.');
          appRoot.innerHTML = originalHTML;
        }
      });
  
      domLock.observe(appRoot, {
        childList: true,
        subtree: true,
      });
    }
  
    // 3. 🧨 Disable dangerous global APIs
    try {
      window.eval = () => {
        console.warn('❌ eval() is blocked by dom-guard.');
        return null;
      };
  
      // @ts-ignore
      window.Function = () => {
        console.warn('❌ Function constructor is blocked by dom-guard.');
        return () => {};
      };
    } catch (err) {
      console.error('Failed to override dangerous globals:', err);
    }
  
    // 4. 🕵️‍♂️ Detect common extension clues
    if (document.querySelector('[id^="crx"]') || (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.warn('👀 Extension or DevTools hook detected!');
    }
  
    console.log('[DOM Guard] Protection active ✅');
  });
  