/**
 * Escapes special characters for use in a regular expression.
 * Prevents ReDoS (Regular Expression Denial of Service) and syntax crashes
 * when user-controlled search queries contain characters like [, (, +, *, etc.
 */
export function escapeRegex(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

