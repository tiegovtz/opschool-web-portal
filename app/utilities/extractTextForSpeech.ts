/**
 * Extracts plain text from markdown/HTML content for text-to-speech
 * Removes all formatting, HTML tags, and markdown syntax
 * 
 * @param content - The markdown or HTML content to extract text from
 * @returns Plain text suitable for speech synthesis
 */
export const extractTextForSpeech = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  let text = content;

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove code blocks (markdown and HTML)
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`[^`]+`/g, '');
  text = text.replace(/<pre[\s\S]*?<\/pre>/gi, '');
  text = text.replace(/<code[\s\S]*?<\/code>/gi, '');

  // Remove script and style tags with their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove MathJax/math formulas (they can't be spoken naturally)
  text = text.replace(/\$\$[\s\S]*?\$\$/g, '');
  text = text.replace(/\\\[[\s\S]*?\\\]/g, '');
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, '');
  text = text.replace(/\\\([^)]+?\\\)/g, '');

  // Remove HTML tags but preserve text content
  text = text.replace(/<[^>]+>/g, ' ');

  // Remove markdown formatting
  // Headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Bold/Italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1');
  text = text.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1');
  // Strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');
  // Links - extract text only
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Blockquotes
  text = text.replace(/^>\s+/gm, '');
  // Lists
  text = text.replace(/^[-*+]\s+/gm, '');
  text = text.replace(/^\d+\.\s+/gm, '');
  // Horizontal rules
  text = text.replace(/^[-*_]{3,}$/gm, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Clean up whitespace - multiple spaces, newlines, tabs to single space
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};




















