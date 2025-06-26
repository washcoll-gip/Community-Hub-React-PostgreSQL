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
  const [countyData, setCountyData] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/counties")
      .then((res) => res.json())
      .then((data) => setCountyData(data))
      .catch((err) => console.error("Error fetching counties:", err));
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      fetch(`http://localhost:5000/api/municipalities?county=${selectedCounty}`)
        .then((res) => res.json())
        .then((data) => setMunicipalities(data));
    } else {
      setMunicipalities([]);
      setSelectedMunicipality("");
    }
  }, [selectedCounty]);

  const fetchData = () => {
    if (selectedMunicipality) {
      fetch(`http://localhost:5000/api/parcels?municipality=${selectedMunicipality}`)
        .then((res) => res.json())
        .then((data) => setGeoData(data));
    } else if (selectedCounty) {
      fetch(`http://localhost:5000/api/parcels?county=${selectedCounty}`)
        .then((res) => res.json())
        .then((data) => setGeoData(data));
    } else {
      setGeoData(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCounty, selectedMunicipality]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

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

      if (selectedCounty) {
        fetch(`http://localhost:5000/api/municipalities?county=${selectedCounty}`)
          .then((res) => res.json())
          .then((data) => setMunicipalities(data));
      }

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
          Filter by county:
          <select
            value={selectedCounty}
            onChange={(e) => {
              const county = e.target.value;
              setSelectedCounty(county);

              if (county === "") {
                setSelectedMunicipality("");
                setGeoData(null);
              }
            }}
          >
            <option value="">All</option>
            {countyData &&
              countyData.features.map((f) => {
                const name = f.properties.name;
                return (
                  <option key={name} value={name}>
                    {name}
                  </option>
                );
              })}
          </select>
        </label>

        <label>
          Filter by municipality:
          <select
            value={selectedMunicipality}
            onChange={(e) => setSelectedMunicipality(e.target.value)}
            disabled={!selectedCounty}
          >
            {!selectedCounty ? (
              <option value="">-</option>
            ) : (
              <>
                <option value="">All</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </>
            )}
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
          attribution="&copy; OpenStreetMap contributors"
        />
        {countyData && (
          <GeoJSON
            key={`county-layer-${selectedCounty || "all"}`}
            data={{
              ...countyData,
              features: selectedCounty
                ? countyData.features.filter(
                    (f) => f.properties.name === selectedCounty
                  )
                : countyData.features,
            }}
            style={{
              color: "#000000",
              weight: 1.5,
              fillOpacity: 0,
              dashArray: "4",
            }}
            interactive={false}
            onEachFeature={(feature, layer) => {
              const countyName = feature.properties.name;
              layer.bindTooltip(`County: ${countyName}`, { permanent: false });
            }}
          />
        )}
        {geoData && (
          <GeoJSON
            key={`${selectedMunicipality || selectedCounty}-${geoData?.features?.length || 0}`}
            data={geoData}
            style={(feature) => {
              const decile = feature.properties.vpa_decile;
              const defaultColor = "#3388ff";

              const color =
                selectedMunicipality && decile > 0
                  ? getColorByDecile(decile)
                  : defaultColor;

              return {
                color,
                weight: 2,
                fillColor: color,
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