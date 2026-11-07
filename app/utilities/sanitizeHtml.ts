import DOMPurify from "dompurify";

/**
 * Sanitize AI-generated HTML (markdown-it output with html:true plus our own
 * image/math markup) before it goes into v-html. Scripts, event handler
 * attributes (onerror=...), javascript: URLs, iframes and forms are removed.
 */
export function sanitizeAiHtml(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || !DOMPurify.isSupported) {
    // No DOM during SSR: render as plain text rather than unsanitized HTML.
    return html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["loading", "data-shortcode"],
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "iframe", "object", "embed"],
  });
}

/**
 * The sanitizer strips inline onerror handlers, so broken images are hidden
 * with a capture-phase listener on the container instead.
 */
export function hideBrokenAiImage(event: Event) {
  const target = event.target as HTMLElement | null;
  if (target?.tagName === "IMG" && target.parentElement) {
    target.parentElement.style.display = "none";
  }
}
