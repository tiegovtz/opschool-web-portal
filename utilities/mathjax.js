// export const loadMathJax = async () => {
//   if (typeof window === "undefined") return; // Ensure it runs only on the client side

//   const MathJaxModule = await import("mathjax/es5/tex-mml-chtml.js");
//   window.MathJax = MathJaxModule.MathJax;

//   return new Promise((resolve) => {
//     window.MathJax.startup = {
//       ready: () => {
//         window.MathJax.startup.defaultReady();
//         resolve(true);
//       },
//     };
//   });
// };

// export const renderMath = () => {
//   if (typeof window !== "undefined" && window.MathJax) {
//     window.MathJax.typesetPromise();
//   }
// };
