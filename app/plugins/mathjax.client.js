import { prepareUndelimitedMath } from "~/utilities/parsers/mathJaxText";

// nuxt-mathjax owns the single MathJax script and its global configuration.
// This bridge keeps the existing directive and dynamically loaded notes using
// the same renderer after the module's script has finished initializing.
export default defineNuxtPlugin((nuxtApp) => {
  window.mathJaxLoaded = new Promise((resolve, reject) => {
    const connect = (script) => {
      script.addEventListener("load", async () => {
        try {
          await window.MathJax?.startup?.promise;
          resolve();
        } catch (error) {
          reject(error);
        }
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
    };

    nuxtApp.hook("app:mounted", () => {
      const script = document.querySelector('script[src*="mathjax@3/es5/"]');
      if (script) connect(script);
      else reject(new Error("nuxt-mathjax did not load its script"));
    });
  });

  window.MathJaxRender = async (elements) => {
    await window.mathJaxLoaded;
    const mathJax = window.MathJax;
    if (!mathJax?.typesetPromise) return;
    const targets = Array.isArray(elements) && elements.length ? elements : undefined;
    for (const target of targets ?? [document.body]) prepareUndelimitedMath(target);
    if (targets) mathJax.typesetClear?.(targets);
    await mathJax.typesetPromise(targets);
  };
});
