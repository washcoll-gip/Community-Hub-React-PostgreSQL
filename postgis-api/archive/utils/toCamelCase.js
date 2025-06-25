export function toCamelCase(str) {
  return str
    .toLowerCase()
    .replace(/[_\s]+(.)/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}