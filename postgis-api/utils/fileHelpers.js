import fs from "fs";

export function moveFileSync(src, dest) {
  fs.renameSync(src, dest);
}

export function cleanProperties(obj) {
  const cleaned = {};
  for (const key in obj) {
    cleaned[key] = obj[key] !== undefined ? obj[key] : null;
  }
  return cleaned;
}