import { useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";

// Components
import MapView from "./components/MapView.jsx";
import FilterControls from "./components/FilterControls.jsx";
import UploadModal from "./components/UploadModal.jsx";
import DownloadModal from "./components/DownloadModal.jsx";
import NotificationSystem from "./components/NotificationSystem.jsx";

// Hooks
import { useNotifications, useApiRequest } from "./hooks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
  // Core data state
  const [geoData, setGeoData] = useState(null);
  const [countyData, setCountyData] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [foodPoints, setFoodPoints] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Filter state
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  // Upload state
  const [uploadType, setUploadType] = useState("");
  const [uploadCounty, setUploadCounty] = useState("");
  const [uploadMunicipality, setUploadMunicipality] = useState("");
  const [uploadFile, setUploadFile] = useState(null);

  // Custom hooks
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const { loading: uploading, uploadFile: uploadFileRequest, request } = useApiRequest(API_URL);

  // Load initial data
  useEffect(() => {
    const loadCounties = async () => {
      try {
        const data = await request('/api/counties');
        setCountyData(data);
      } catch (err) {
        addNotification('Failed to load counties. Please refresh the page.', 'error');
      }
    };
    
    loadCounties();
  }, [request, addNotification]);

  // Load municipalities when county changes
  useEffect(() => {
    const loadMunicipalities = async () => {
      if (selectedCounty) {
        try {
          const data = await request(`/api/municipalities?county=${selectedCounty}`);
          setMunicipalities(data);
        } catch (err) {
          addNotification(`Failed to load municipalities for ${selectedCounty}`, 'error');
          setMunicipalities([]);
        }
      } else {
        setMunicipalities([]);
        setSelectedMunicipality("");
      }
    };

    loadMunicipalities();
  }, [selectedCounty, request, addNotification]);

  // Fetch map and file data
  const fetchData = useCallback(async () => {
    try {
      // Load parcel data based on selection
      if (selectedMunicipality) {
        const data = await request(`/api/parcels?municipality=${selectedMunicipality}`);
        setGeoData(data);
      } else if (selectedCounty) {
        const data = await request(`/api/parcels?county=${selectedCounty}`);
        setGeoData(data);
      } else {
        setGeoData(null);
      }

      // Load food access points
      try {
        const foodData = await request('/api/foodaccesspoints');
        setFoodPoints(foodData);
      } catch (err) {
        console.warn('Food access points not available:', err);
      }

      // Load uploaded files list
      try {
        const filesData = await request('/api/files');
        setUploadedFiles(filesData);
      } catch (err) {
        console.warn('File list not available:', err);
      }
    } catch (err) {
      addNotification('Failed to load map data', 'error');
    }
  }, [selectedCounty, selectedMunicipality, request, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Event handlers
  const handleCountyChange = useCallback((county) => {
    setSelectedCounty(county);
    setSelectedMunicipality("");
    setGeoData(null);
  }, []);

  const handleMunicipalityChange = useCallback((municipality) => {
    setSelectedMunicipality(municipality);
  }, []);

  const handleUploadModalClose = useCallback(() => {
    setModalOpen(false);
    setUploadType("");
    setUploadCounty("");
    setUploadMunicipality("");
    setUploadFile(null);
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    
    if (!uploadFile) {
      addNotification("Please select a .geojson file", 'warning');
      return;
    }

    if (uploadType === "landvpa" && (!uploadCounty || !uploadMunicipality)) {
      addNotification("Please select both county and municipality", 'warning');
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      if (uploadType === "landvpa") {
        formData.append("municipality", uploadMunicipality);
      }
      await uploadFileRequest(`/api/upload/${uploadType}`, formData);
      const labels = {
        landvpa: "LandVPA data",
        foodaccesspoints: "Food Access Points",
      };
      addNotification(`${labels[uploadType]} uploaded successfully!`, "success");
      fetchData();
      handleUploadModalClose();
    } catch (err) {
      addNotification(`Upload failed: ${err.message}`, "error");
    }
  };

  return (
    <div style={{ height: "100vh", position: "relative", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Filter Controls */}
      <FilterControls
        countyData={countyData}
        municipalities={municipalities}
        selectedCounty={selectedCounty}
        selectedMunicipality={selectedMunicipality}
        onCountyChange={handleCountyChange}
        onMunicipalityChange={handleMunicipalityChange}
        onUploadClick={() => setModalOpen(true)}
        onDownloadClick={() => setDownloadOpen(true)}
        isCollapsed={controlsCollapsed}
        onToggleCollapse={() => setControlsCollapsed(!controlsCollapsed)}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={modalOpen}
        onClose={handleUploadModalClose}
        uploadType={uploadType}
        setUploadType={setUploadType}
        uploadCounty={uploadCounty}
        setUploadCounty={setUploadCounty}
        uploadMunicipality={uploadMunicipality}
        setUploadMunicipality={setUploadMunicipality}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        uploading={uploading}
        onSubmit={handleUploadSubmit}
        countyData={countyData}
        municipalities={municipalities}
      />

      {/* Download Modal */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        uploadedFiles={uploadedFiles}
        selectedCounty={selectedCounty}
        selectedMunicipality={selectedMunicipality}
        API_URL={API_URL}
      />

      {/* Map View */}
      <MapView
        countyData={countyData}
        geoData={geoData}
        foodPoints={foodPoints}
        selectedCounty={selectedCounty}
        selectedMunicipality={selectedMunicipality}
        getColorByDecile={getColorByDecile}
      />
    </div>
  );
}

export default App;
