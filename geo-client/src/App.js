import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const colorsByDecile = [
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

function getColorByDecile(decile) {
  return colorsByDecile[decile - 1] || "#3388ff";
}

function App() {
  const [geoData, setGeoData] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/municipalities")
      .then((res) => res.json())
      .then((data) => setMunicipalities(data));
  }, []);

  const fetchData = () => {
    const query = selectedMunicipality
      ? `?municipality=${selectedMunicipality.toLowerCase()}`
      : "";
    fetch(`http://localhost:5000/api/parcels${query}`)
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Error fetching GeoJSON:", err));
  };

  useEffect(() => {
    fetchData();
  }, [selectedMunicipality]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const fetchMunicipalities = () => {
    fetch("http://localhost:5000/api/municipalities")
      .then((res) => res.json())
      .then((data) => setMunicipalities(data));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      fetchData();
      fetchMunicipalities();
      alert("GeoJSON uploaded successfully!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error uploading GeoJSON.");
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <form
        onSubmit={handleUpload}
        style={{
          position: "absolute",
          top: "1em",
          right: "1em",
          zIndex: 1000,
          background: "white",
          padding: "1em",
          display: "flex",
          flexDirection: "column",
          gap: "0.5em",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          borderRadius: "8px",
          minWidth: "250px",
        }}
      >
        <label>
          Filter by municipality:
          <select
            value={selectedMunicipality}
            onChange={(e) => setSelectedMunicipality(e.target.value)}
          >
            <option value="">All</option>
            {municipalities.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Upload new file:
          <input type="file" accept=".geojson" onChange={handleFileChange} />
        </label>

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload GeoJSON"}
        </button>
      </form>

      <MapContainer
        bounds={[
          [37.8, -76.5],
          [39.8, -74.8],
        ]}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {geoData && (
          <GeoJSON
            key={JSON.stringify(geoData)}
            data={geoData}
            style={(feature) => {
              const defaultColor = "#3388ff";

              if (!selectedMunicipality) {
                return {
                  color: defaultColor,
                  weight: 2,
                  fillColor: defaultColor,
                  fillOpacity: 0.5,
                };
              }

              const decile = feature.properties.vpa_decile;
              const decileColor = getColorByDecile(decile);

              return {
                color: decileColor,
                weight: 2,
                fillColor: decileColor,
                fillOpacity: 0.5,
              };
            }}
            onEachFeature={(feature, layer) => {
              const props = feature.properties;
              let popupContent = "<table>";
              for (const key in props) {
                if (key !== "geom") {
                  popupContent += `<tr><th>${key}</th><td>${props[key]}</td></tr>`;
                }
              }
              popupContent += "</table>";
              layer.bindPopup(popupContent);
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default App;