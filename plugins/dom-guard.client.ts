import { isVtrustedValue, nonceValue } from "~/utilities/controlls";

// ~/plugins/dom-guard.client.ts
// ~/plugins/dom-guard.client.ts
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const TRUSTED_ATTR = 'data-origin-tms';
  const TRUSTED_VAL = String(isVtrustedValue.value);
  const globalNonce = nonceValue.value;
 console.log('globalNonce', globalNonce);
  // ✅ Check if element is trusted
  const isTrusted = (el: Node): boolean =>
    el.nodeType === Node.ELEMENT_NODE &&
    (el as HTMLElement).getAttribute(TRUSTED_ATTR) === TRUSTED_VAL;

  // 🚨 Check if a node is a <script> or <style> without correct nonce
  const hasValidNonce = (el: HTMLElement): boolean =>
    el.getAttribute('nonce') === globalNonce;

  const isUntrustedNode = (el: Node): boolean => {
    if (el.nodeType !== Node.ELEMENT_NODE) return false;
    const tag = el.nodeName.toUpperCase();
    const htmlEl = el as HTMLElement;

    if (['SCRIPT', 'STYLE'].includes(tag) && !hasValidNonce(htmlEl)) {
      console.warn(`🚨 Removed <${tag.toLowerCase()}> with invalid nonce`, htmlEl);
      return true;
    }

    if (!isTrusted(el)) {
      console.warn(`🚫 Removed untrusted element: <${tag.toLowerCase()}>`, htmlEl);
      return true;
    }

    return false;
  };

  // 🔄 DOM Mutation Observer
  const domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (isUntrustedNode(node)) {
          (node as HTMLElement).remove();
        }
      });
    }
  });

  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // 🛡️ Block dangerous JS APIs
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
    console.error('💥 Failed to override unsafe globals:', err);
  }

  // 👀 DevTools/Extension Detection
  if (
    document.querySelector('[id^="crx"]') ||
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  ) {
    console.warn('👀 Suspicious extension or DevTools hook detected');
  }

  console.log('%c[DOM Guard] Trusted mode active ⚔️', 'color: #10b981; font-weight: bold');
});
