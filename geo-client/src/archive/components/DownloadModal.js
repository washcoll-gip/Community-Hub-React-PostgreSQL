export default function DownloadModal({ downloadOpen, setDownloadOpen, uploadedFiles }) {
  if (!downloadOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setDownloadOpen(false)}>
      <div className="modal-container modal-container-small" onClick={(e) => e.stopPropagation()}>
        <h4>Download Files</h4>
        <ul style={{ listStyle: "none", padding: 0, maxHeight: "200px", overflowY: "auto" }}>
          {uploadedFiles && typeof uploadedFiles === "object" && (
            Object.entries(uploadedFiles).map(([type, files]) => (
              <div key={type}>
                <h3>{type}</h3>
                {Array.isArray(files) && files.map(file => (
                  <div key={file.filename}>
                    <a href={`http://localhost:5000/api/files/download/${file.filename}`} download>
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
  );
}