export default function UploadForm({
  countyData,
  municipalities,
  setMunicipalities,
  modalOpen,
  setModalOpen,
  uploadType,
  setUploadType,
  uploadCounty,
  setUploadCounty,
  uploadMunicipality,
  setUploadMunicipality,
  uploadFile,
  setUploadFile,
  uploading,
  setUploading,
  handleUploadSubmit,
}) {
  React.useEffect(() => {
    if (uploadCounty) {
      fetch(`http://localhost:5000/api/municipalities?county=${uploadCounty}`)
        .then((res) => res.json())
        .then((data) => setMunicipalities(data));
    } else {
      setMunicipalities([]);
      setUploadMunicipality("");
    }
  }, [uploadCounty]);

  if (!modalOpen) return null;

  return (
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
                <label>
                  County:
                  <select
                    value={uploadCounty}
                    onChange={(e) => setUploadCounty(e.target.value)}
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
  );
}
