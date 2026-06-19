export function labelize(value) {
  return String(value || "").replaceAll("_", " ");
}
