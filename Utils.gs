/**
 * Creates a map between header names and their column indexes.
 * Useful for dynamic column access based on header labels.
 *
 * @param {string[]} headers - Array of header names.
 * @returns {Map<string, number>} Header-to-column index map.
 */
function createHeaderMap(headers) {
  const map = new Map();

  headers.forEach((header, index) => {
    map.set(String(header || '').trim(), index);
  });

  return map;
}
