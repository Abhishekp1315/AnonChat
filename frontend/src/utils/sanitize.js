/**
 * Strips HTML tags and trims whitespace from user input.
 * Prevents XSS when message text is rendered in the DOM.
 */
export function sanitize(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}
