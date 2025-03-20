
export default defineNuxtPlugin(() => {
  return {
    provide: {
      renderMathJax: () => {
        if (window.MathJax) {
          window.MathJax.typesetPromise();
        }
      }
    }
  };
});
