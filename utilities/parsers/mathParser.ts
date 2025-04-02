export const parseMathJax = (query: string): string => {
    // Regular expression to find all strings starting with $$$
    const regex = /\$\$\$(.*?)\$\$\$/g;
  
    // Replace matched strings with MathJax-ready expressions
    return query.replace(regex, (match, equation) => {
      return `<span class="mathjax">\\(${equation.trim()}\\)</span>`;
    });
  };
  