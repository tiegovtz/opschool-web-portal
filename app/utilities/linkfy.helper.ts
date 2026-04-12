/**
 * Converts URLs inside a text string into clickable HTML anchor tags.
 *
 * @param {string} text - The input text that may contain URLs.
 * @returns {string} The text with URLs replaced by HTML <a> tags.
 *
 * @example
 * linkify("Visit https://example.com")
 * // => 'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>'
 */
const linkify = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(
    urlRegex,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );
}

/**
 * Extracts all URLs from a text string and returns them as an HTML unordered list.
 *
 * @param {string} text - The input text that may contain URLs.
 * @returns {string} An HTML string containing a <ul> list of extracted links.
 *
 * @example
 * extractLinksToHtml("Docs: https://a.com and https://b.com")
 * // => '<ul><li><a href="https://a.com" target="_blank">https://a.com</a></li>...</ul>'
 */
const extractLinksToHtml = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = text.match(urlRegex) || [];

  return `
    <ul>
      ${links
        .map(
          (link) =>
            `<li><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></li>`
        )
        .join("")}
    </ul>
  `;
}

/**
 * Extracts URLs from a string and returns clean text + links separately.
 *
 * @param {string} input - Raw text that may contain URLs.
 * @returns {{ text: string; links: string[] }} Object containing cleaned text and extracted links
 *
 * @example
 * parseTextAndLinks("Check https://a.com and https://b.com now")
 * // {
 * //   text: "Check  and  now",
 * //   links: ["https://a.com", "https://b.com"]
 * // }
 */
const parseTextAndLinks = (input: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const links = input.match(urlRegex) || [];

  const text = input
    .replace(urlRegex, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { text, links };
}

/**
 * Generates an HTML suggestion block containing an explanation
 * and a list of extracted reference links.
 *
 * @param {string} explanation - Raw explanation text that may contain URLs.
 * @param {boolean} isCorrect - Indicates whether the answer is correct or not.
 * @returns {string} HTML string representing the suggestion block.
 *
 * @example
 * generateSuggestion(
 *   "Read more at https://example.com",
 *   true
 * )
 */
const generateSuggestion = (
  explanation: string,
  isCorrect: boolean
): string => {
  const { text, links } = parseTextAndLinks(explanation);
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 3h-6.75M21 3v6.75M21 3l-8.25 8.25M9.4 3c-2.24 0-3.36 0-4.216.436a4 4 0 0 0-1.748 1.748C3 6.04 3 7.16 3 9.4v5.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748C6.04 21 7.16 21 9.4 21h5.2c2.24 0 3.36 0 4.216-.436a4 4 0 0 0 1.748-1.748C21 17.96 21 16.84 21 14.6v-1.1"/></svg>`;

  const styles = isCorrect
    ? `
      background-color: rgba(34, 197, 94, 0.2);
      color: #005c1a;
      border: 1px solid #16a34a;
    `
    : `
      background-color: rgba(220, 38, 38, 0.2);
      color: #960000;
      border: 1px solid #dc2626;
    `;

  return `
    <p style="
      ${styles}
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.25rem;
    ">
      <b>Explanation:</b>
      <i>${text}</i>
    </p>

    ${
      links.length
        ? `
          <ul class="list-disc pl-5 space-y-1">
            ${links
              .map(
                (link) =>
                  `<li class="flex items-center gap-4 text-sm text-blue-600">
                ${icon}
                    <a href="${link}" target="_blank" rel="noopener noreferrer">
                      visit reference to learn more. 
                    </a>
                  </li>`
              )
              .join("")}
          </ul>
        `
        : ""
    }
  `;
};

export { linkify, extractLinksToHtml, parseTextAndLinks, generateSuggestion };
