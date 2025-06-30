export const colorsByDecile = [
  "#306322",
  "#559131",
  "#85bb4f",
  "#bbe08e",
  "#e7f4d2",
  "#fae0ee",
  "#ecb7d8",
  "#d778ac",
  "#bc1f7b",
  "#870551",
];

export function getColorByDecile(decile) {
  return colorsByDecile[decile - 1] || "#3388ff";
}