// plugins/mathjax.client.js
export default function() {
    // Only run on client side
    if (import.meta.server) return;
  
    // MathJax configuration
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        packages: { '[+]': ['mhchem'] }
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
        renderActions: {
          // Add a custom action to render after page changes
          find_mathjax: [10, function (doc) {
            // console.log('MathJax rendering completed');
          }]
        }
      },
      loader: {
        load: ['[tex]/mhchem']
      },
      startup: {
        ready: () => {
          MathJax.startup.defaultReady();
          // Store render function for later use
          window.MathJaxRender = () => MathJax.typesetPromise();
        }
      }
    };
    
    // Create a promise to track when MathJax is loaded
    window.mathJaxLoaded = new Promise((resolve, reject) => {
      // Load MathJax from local source
      const script = document.createElement('script');
      script.src = '/mathjax/tex-mml-chtml.js'; // Path to your local MathJax file
      script.async = true;
      script.onload = resolve;
      script.onerror = (err) => {
        // console.error('Failed to load MathJax:', err);
        reject(err);
        
        // Fallback to CDN if local file fails
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js?config=tex-mhchem';
        fallbackScript.async = true;
        fallbackScript.onload = resolve;
        fallbackScript.onerror = reject;
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(script);
    });
  }