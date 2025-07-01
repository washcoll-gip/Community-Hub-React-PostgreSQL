import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_URL = process.env.REACT_APP_API_URL;

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
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploadCounty, setUploadCounty] = useState("");
  const [uploadMunicipality, setUploadMunicipality] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [foodPoints, setFoodPoints] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/counties`)
      .then((res) => res.json())
      .then((data) => setCountyData(data))
      .catch((err) => console.error("Error fetching counties:", err));
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      fetch(`${API_URL}/api/municipalities?county=${selectedCounty}`)
        .then((res) => res.json())
        .then((data) => setMunicipalities(data));
    } else {
      setMunicipalities([]);
      setSelectedMunicipality("");
    }
  }, [selectedCounty]);

  const fetchData = useCallback(() => {
    if (selectedMunicipality) {
      fetch(`${API_URL}/api/parcels?municipality=${selectedMunicipality}`)
        .then((res) => res.json())
        .then((data) => setGeoData(data));
    } else if (selectedCounty) {
      fetch(`${API_URL}/api/parcels?county=${selectedCounty}`)
        .then((res) => res.json())
        .then((data) => setGeoData(data));
    } else {
      setGeoData(null);
    }

    fetch(`${API_URL}/api/foodaccesspoints`)
      .then((res) => res.json())
      .then((data) => setFoodPoints(data))
      .catch((err) => console.error("Error fetching food access points:", err));

    fetch(`${API_URL}/api/files`)
      .then((res) => res.json())
      .then((data) => setUploadedFiles(data))
      .catch((err) => console.error("Error fetching file list:", err));
  }, [selectedCounty, selectedMunicipality]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a .geojson file");
      return;
    }

    if (uploadType === "landvpa" && (!uploadCounty || !uploadMunicipality)) {
      alert("Please select both county and municipality");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    if (uploadType === "landvpa") {
      formData.append("municipality", uploadMunicipality);
      try {
        setUploading(true);
        await fetch(`${API_URL}/api/upload-landvpa`, {
          method: "POST",
          body: formData,
        });
        alert("LandVPA uploaded successfully");
        fetchData();
        setModalOpen(false);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Error uploading LandVPA");
      } finally {
        setUploading(false);
      }
    } else if (uploadType === "foodaccesspoints") {
      try {
        setUploading(true);
        await fetch(`${API_URL}/api/upload-foodaccesspoints`, {
          method: "POST",
          body: formData,
        });
        alert("Food Access Points uploaded successfully");
        fetchData();
        setModalOpen(false);
      } catch (err) {
        console.error("Upload error:", err);
        alert("Error uploading Food Access Points");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div style={{ height: "100vh", position: "relative" }}>
      <div style={{
        position: "absolute",
        top: "1em",
        right: "1em",
        zIndex: 1000,
        background: "white",
        padding: "1em",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: "1em",
        minWidth: "250px"
      }}>
        <label style={{ display: "block" }}>
          Filter by county:
          <select
            value={selectedCounty}
            onChange={(e) => {
              const county = e.target.value;
              setSelectedCounty(county);
              setSelectedMunicipality("");
              setGeoData(null);
            }}
            style={{ width: "100%", marginTop: "0.5em" }}
          >
            <option value="">All</option>
            {countyData &&
              countyData.features.map((f) => (
                <option key={f.properties.name} value={f.properties.name}>
                  {f.properties.name}
                </option>
              ))}
          </select>
        </label>

        <label style={{ display: "block" }}>
          Filter by municipality:
          <select
            value={selectedMunicipality}
            onChange={(e) => setSelectedMunicipality(e.target.value)}
            disabled={!selectedCounty}
            style={{ width: "100%", marginTop: "0.5em" }}
          >
            {!selectedCounty ? (
              <option value="">-</option>
            ) : (
              <>
                <option value="">All</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </>
            )}
          </select>
        </label>

        <button onClick={() => setModalOpen(true)}>Upload File</button>

        <button onClick={() => setDownloadOpen(prev => !prev)}>
          Open Download Files
        </button>
      </div>

      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 2000
        }}>
          <div style={{
            background: "white", padding: "2em", borderRadius: "8px",
            width: "400px", boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: "1em"
          }}>
            <h3>Upload GeoJSON</h3>

            <label>
              Type:
              <select
                value={uploadType}
                onChange={(e) => {
                  setUploadType(e.target.value);
                  setUploadCounty("");
                  setUploadMunicipality("");
                  setUploadFile(null);
                }}
                style={{ width: "100%", marginTop: "0.5em" }}
              >
                <option value="">Choose Type</option>
                <option value="landvpa">LandVPA</option>
                <option value="foodaccesspoints">Food Access Points</option>
              </select>
            </label>

            {uploadType && (
              <>
                {uploadType === "landvpa" && (
                  <>
                    {/* County */}
                    <label>
                      County:
                      <select
                        value={uploadCounty}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUploadCounty(val);
                          setUploadMunicipality("");
                          fetch(`${API_URL}/api/municipalities?county=${val}`)
                            .then((res) => res.json())
                            .then((data) => setMunicipalities(data));
                        }}
                        style={{ width: "100%", marginTop: "0.5em" }}
                      >
                        <option value="">Choose County</option>
                        {countyData &&
                          countyData.features.map((f) => (
                            <option key={f.properties.name} value={f.properties.name}>
                              {f.properties.name}
                            </option>
                          ))}
                      </select>
                    </label>

                    {/* Municipality */}
                    <label>
                      Municipality:
                      <select
                        value={uploadMunicipality}
                        onChange={(e) => setUploadMunicipality(e.target.value)}
                        disabled={!uploadCounty}
                        style={{ width: "100%", marginTop: "0.5em" }}
                      >
                        <option value="">Choose Municipality</option>
                        {municipalities.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </label>
                  </>
                )}

                {/* File Upload */}
                <label>
                  File (.geojson):
                  <input
                    type="file"
                    accept=".geojson"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    style={{ width: "100%", marginTop: "0.5em" }}
                  />
                </label>
              </>
            )}

            {/* Buttons */}
            <div style={{ marginTop: "1em", display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setUploadType("");
                  setUploadCounty("");
                  setUploadMunicipality("");
                  setUploadFile(null);
                }}
                style={{ background: "#ccc" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  uploading ||
                  !uploadType ||
                  (uploadType === "landvpa" && (!uploadCounty || !uploadMunicipality || !uploadFile)) ||
                  (uploadType === "foodaccesspoints" && !uploadFile)
                }
                onClick={handleUploadSubmit}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Download Files */}
      {downloadOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          justifyContent: "center", alignItems: "center", zIndex: 2000
        }}>
          <div style={{
            background: "white",
            padding: "1.5em",
            borderRadius: "8px",
            width: "300px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}>
            <h4>Download Files</h4>
            <ul style={{ listStyle: "none", padding: 0, maxHeight: "200px", overflowY: "auto" }}>
              {uploadedFiles && typeof uploadedFiles === "object" && (
                Object.entries(uploadedFiles).map(([type, files]) => (
                  <div key={type}>
                    <h3>{type}</h3>
                    {Array.isArray(files) && files.map(file => (
                      <div key={file.filename}>
                        <a href={`${API_URL}/api/files/download/${file.filename}`} download>
                          {file.filename}
                        </a>
                        <span> - {new Date(file.upload_date).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </ul>
            <button onClick={() => setDownloadOpen(false)} style={{ marginTop: "1em" }}>
              Close
            </button>
          </div>
        </div>
      )}

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
        {foodPoints && (
          <GeoJSON
            key={`foodpoints-${foodPoints.features?.length || 0}-${Date.now()}`}
            data={foodPoints}
            pointToLayer={(feature, latlng) =>
              L.circleMarker(latlng, {
                radius: 6,
                fillColor: "#ff7800",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              })
            }
            onEachFeature={(feature, layer) => {
              const props = feature.properties;
              let popupContent = "<table>";
              for (const key in props) {
                popupContent += `<tr><td><b>${key}</b></td><td>${props[key]}</td></tr>`;
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