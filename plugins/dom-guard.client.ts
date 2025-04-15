import { isVtrustedValue } from "~/utilities/controlls";

// ~/plugins/dom-guard.client.ts
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;
  // This plugin is only for client-side use
  const TRUSTED_ATTR = 'data-origin-tms';
  const TRUSTED_VAL = String(isVtrustedValue.value);

  // ✅ Helper: Check if element is trusted
  const isTrusted = (el: Node): boolean =>
    el.nodeType === Node.ELEMENT_NODE &&
    (el as HTMLElement).getAttribute(TRUSTED_ATTR) === TRUSTED_VAL;

  // 🔒 Remove any untrusted script tag
  const isUntrustedScript = (el: Node): boolean =>
    el.nodeType === Node.ELEMENT_NODE &&
    el.nodeName === 'SCRIPT' &&
    !(el as HTMLElement).hasAttribute('data-trusted');

  // 🚨 Mutation observer: DOM Enforcement
  const domObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        const el = node as HTMLElement;

        // Remove untrusted <script>
        if (isUntrustedScript(node)) {
          console.warn('🚨 Removed untrusted <script>:', el);
          el.remove();
          return;
        }

        // Remove any other element not marked as trusted
        if (node.nodeType === Node.ELEMENT_NODE && !isTrusted(node)) {
          console.warn(`🚫 Removed untrusted element: <${el.tagName.toLowerCase()}>`, el);
          el.remove();
        }
      });
    }
  });

  // Observe the entire document, including attributes to detect mutations across all elements
  domObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  // 🔐 Block high-risk JS APIs
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

  // 👀 Detect browser extensions/devtools
  if (
    document.querySelector('[id^="crx"]') ||
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  ) {
    console.warn('👀 Suspicious extension or DevTools hook detected');
  }

  console.log('%c[DOM Guard] Trusted mode active ⚔️', 'color: #10b981; font-weight: bold');     
});