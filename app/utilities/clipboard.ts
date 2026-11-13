/** Convert HTML answers to readable text without copying markup or hidden content. */
export function htmlToCopyText(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("script, style, template, [hidden], [aria-hidden='true']")
    .forEach((element) => element.remove());

  const read = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    const element = node as HTMLElement;
    const text = Array.from(node.childNodes, read).join("");
    switch (element.tagName) {
      case "BR": return "\n";
      case "IMG": return element.getAttribute("alt") || "";
      case "LI": {
        const list = element.parentElement;
        const start = Number(list?.getAttribute("start") || 1);
        const index = list ? Array.from(list.children).indexOf(element) : 0;
        const marker = list?.tagName === "OL" ? `${start + index}.` : "•";
        return `\n${marker} ${text.trim()}\n`;
      }
      case "TD":
      case "TH": return `${text}\t`;
      case "A": {
        const href = element.getAttribute("href");
        return href && /^(https?:|mailto:)/i.test(href) && href !== text
          ? `${text} (${href})` : text;
      }
      case "P":
      case "DIV":
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6":
      case "UL":
      case "OL":
      case "BLOCKQUOTE":
      case "PRE":
      case "TR": return `\n${text}\n`;
      default: return text;
    }
  };

  return read(template.content).replace(/\n{3,}/g, "\n\n").trim();
}

/** Copy only after a user action, with a fallback for older/insecure browsers. */
export async function copyResponseText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some browsers deny Clipboard API access but still allow a copy command.
    }
  }

  const activeElement = document.activeElement as HTMLElement | null;
  const selection = window.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) => selection.getRangeAt(index).cloneRange())
    : [];
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.readOnly = true;
  textarea.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px;";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    if (!document.execCommand("copy")) throw new Error("Copy failed");
  } finally {
    textarea.remove();
    activeElement?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}
