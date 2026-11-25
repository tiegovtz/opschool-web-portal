// Uploaded notes sometimes contain one extra closing TeX brace. Remove only
// braces that have no matching opener inside a delimited expression; MathJax
// otherwise replaces the entire expression with an error message.
export function repairUnmatchedMathBraces(html: string): string {
  const repair = (expression: string): string => {
    let depth = 0;
    let result = "";
    for (let index = 0; index < expression.length; index += 1) {
      const character = expression[index];
      if (character === "\\" && index + 1 < expression.length) {
        result += character + expression[++index];
      } else if (character === "{") {
        depth += 1;
        result += character;
      } else if (character === "}") {
        if (depth > 0) {
          depth -= 1;
          result += character;
        }
      } else {
        result += character;
      }
    }
    return result;
  };

  return html
    .replace(/(\\\()([\s\S]*?)(\\\))/g, (_match, open, math, close) => open + repair(math) + close)
    .replace(/(\\\[)([\s\S]*?)(\\\])/g, (_match, open, math, close) => open + repair(math) + close)
    .replace(/(\$\$)([\s\S]*?)(\$\$)/g, (_match, open, math, close) => open + repair(math) + close)
    .replace(/(?<!\\)(\$)([^$]*?)(\$)/g, (_match, open, math, close) => open + repair(math) + close);
}

export function enhanceAccessibility(htmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(repairUnmatchedMathBraces(htmlString), "text/html");

  // Elements you want to make focusable
  const makeFocusable = [
    "img",
    "span",
    "em",
  ];

  // Loop through each target element
  makeFocusable.forEach(selector => {
    const elements = doc.querySelectorAll<HTMLElement>(selector);

    elements.forEach(el => {
      // If already focusable or explicitly unfocusable, skip
      const tabindex = el.getAttribute("tabindex");
      if (tabindex === "-1") return;

      // Make it keyboard-focusable
      el.setAttribute("tabindex", "0");

      // Improve screen reader labeling
      if (el.tagName.toLowerCase() === "img") {
        if (!el.hasAttribute("alt")) {
          el.setAttribute("alt", "Image");
        }
        if (!el.hasAttribute("loading")) {
          el.setAttribute("loading", "lazy");
        }
        if (!el.hasAttribute("decoding")) {
          el.setAttribute("decoding", "async");
        }
      }

      if (el.tagName.toLowerCase() === "table") {
        el.setAttribute("role", "table");
      }

      if (el.tagName.toLowerCase() === "p") {
        el.setAttribute("role", "article");
      }
    });
  });

  return doc.body.innerHTML;
}
