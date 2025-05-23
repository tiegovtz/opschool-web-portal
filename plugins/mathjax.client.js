// plugins/mathjax.client.js
export default defineNuxtPlugin(() => {

  if (import.meta.server) return;

  // Configure MathJax
  window.MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: { '[+]': ['mhchem'] }
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style',],
      renderActions: {
        // addChemistry: [10, (doc) => {}],
        find_mathjax: [10, (doc) => {}],
      }
    },
    loader: {
      load: ['[tex]/mhchem']  // Load mhchem extension
    },
    startup: {
      ready: () => {
        MathJax.startup.defaultReady();
        // Allow manual rendering
        window.MathJaxRender = () => MathJax.typesetPromise();
      }
    }
  };

  // Load MathJax script from CDN (you can switch to local if confirmed compatible)
  window.mathJaxLoaded = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js?config=tex-mhchem';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}) 
