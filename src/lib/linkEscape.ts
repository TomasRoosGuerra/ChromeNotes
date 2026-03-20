/** Escape text for use inside HTML text nodes (link label). */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape a string for use inside a double-quoted HTML attribute. */
export function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, "&#39;");
}
