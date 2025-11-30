export function enhanceAccessibility(htmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Elements you want to make focusable
  const makeFocusable = [
    "p",
    "img",
    "table",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6"
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
