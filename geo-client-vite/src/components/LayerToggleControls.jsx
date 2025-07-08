import React, { useState } from "react";

const LayerToggleControls = ({
  showLandVPA,
  setShowLandVPA,
  showFoodAccess,
  setShowFoodAccess,
  uploadedFiles,
  API_URL,
  selectedCounty
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    landvpa: true,
    foodaccesspoints: true,
  });

  const onToggleCollapse = () => setIsCollapsed((prev) => !prev);

  const toggleSection = (type) => {
    setExpandedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "1em",
        left: "1em",
        zIndex: 1000,
        background: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        width: isCollapsed ? "90px" : "340px",
        maxHeight: "90vh",
        overflowY: "auto",
        transition: "width 0.3s ease",
        userSelect: "none",
      }}
    >
      {/* Header with toggle button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1em",
          borderBottom: isCollapsed ? "none" : "1px solid #eee",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#333",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title="Layer Visibility & Files"
        >
          {isCollapsed ? "🗂️" : "🗂️ Layer Visibility & Files"}
        </h3>
        <button
          onClick={onToggleCollapse}
          style={{
            background: "none",
            border: "none",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px",
            lineHeight: 1,
          }}
        >
          {isCollapsed ? "📋" : "➖"}
        </button>
      </div>

      {!isCollapsed && (
        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #e9ecef",
            borderRadius: "6px",
            background: "white",
            margin: "1em",
          }}
        >
          {uploadedFiles &&
          typeof uploadedFiles === "object" &&
          Object.keys(uploadedFiles).length > 0 ? (
            Object.entries(uploadedFiles).map(([type, files]) => {
              const isLand = type === "landvpa";
              const isFood = type === "foodaccesspoints";

              const isVisible = isLand
                ? showLandVPA
                : isFood
                ? showFoodAccess
                : null;

              const expanded = expandedSections[type];

              return (
                <div key={type} style={{ borderBottom: "1px solid #f1f3f4" }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "#f8f9fa",
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "#495057",
                      borderBottom: "1px solid #e9ecef",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {isLand
                        ? "🏘️ Land & Property Data"
                        : isFood
                        ? "🍎 Food Access Points"
                        : `📄 ${type}`}
                    </span>

                    <div style={{ display: "flex", gap: "0.5em" }}>
                      {(isLand || isFood) && (
                        <button
                          onClick={() => {
                            if (isLand) setShowLandVPA((prev) => !prev);
                            if (isFood) setShowFoodAccess((prev) => !prev);
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            background: isVisible ? "#007bff" : "#6c757d",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0
                          }}
                          title={isVisible ? "Hide Layer" : "Show Layer"}
                        >
                          {isVisible ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M15 12c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3Z"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12 5C7.52 5 3.73 7.94 2.46 12c1.27 4.06 5.06 7 9.54 7s8.27-2.94 9.54-7c-1.27-4.06-5.06-7-9.54-7Z"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M3 3l18 18M9.84 9.91A2.99 2.99 0 0 0 9 12c0 1.66 1.34 3 3 3 .82 0 1.57-.33 2.11-.87M6.5 6.65C4.6 7.9 3.15 9.78 2.46 12c1.27 4.06 5.06 7 9.54 7 1.99 0 3.84-.58 5.4-1.58M11 5.05c.33-.03.67-.05 1-.05 4.48 0 8.27 2.94 9.54 7-.28.9-.68 1.76-1.19 2.5"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => toggleSection(type)}
                        style={{
                          width: "32px",
                          height: "32px",
                          background: "#dee2e6",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                        title={expanded ? "Collapse files" : "Expand files"}
                      >
                        {expanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                  {expanded &&
                    Array.isArray(files) &&
                    files.map((file) => (
                      <div
                        key={file.filename}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #f1f3f4",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "14px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "500", color: "#333" }}>
                            {file.filename}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#6c757d",
                              marginTop: "2px",
                            }}
                          >
                            Uploaded:{" "}
                            {new Date(file.upload_date).toLocaleString()}
                          </div>
                        </div>
                        <a
                          href={`${API_URL}/api/files/download/${file.filename}`}
                          download
                          style={{
                            padding: "6px 12px",
                            background: "#007bff",
                            color: "white",
                            textDecoration: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          ⬇️
                        </a>
                      </div>
                    ))}
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "2em",
                textAlign: "center",
                color: "#6c757d",
                fontSize: "14px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "1em" }}>📭</div>
              <div>No files have been uploaded yet.</div>
              <div style={{ fontSize: "12px", marginTop: "0.5em" }}>
                Upload some GeoJSON files to see them here.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LayerToggleControls;