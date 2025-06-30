export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export function fetchCounties() {
  return fetchJSON("/api/counties");
}
export function fetchMunicipalities(county) {
  return fetchJSON(`/api/municipalities?county=${county}`);
}
export function fetchParcels({ county, municipality }) {
  if (municipality) return fetchJSON(`/api/parcels?municipality=${municipality}`);
  if (county)       return fetchJSON(`/api/parcels?county=${county}`);
  return Promise.resolve(null);
}
export function fetchFoodPoints() {
  return fetchJSON("/api/foodaccesspoints");
}
export function fetchFiles() {
  return fetchJSON("/api/files");
}
export function uploadGeoJSON(type, file, extra = {}) {
  const form = new FormData();
  form.append("file", file);
  if (extra.municipality) form.append("municipality", extra.municipality);
  return fetch(`/api/upload-${type}`, {
    method: "POST",
    body: form,
  }).then(res => {
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  });
}