import { useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import { ThemeProvider, CssBaseline, IconButton, Box } from "@mui/material";
import theme from "./theme";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Components
import MapView from "./components/MapView.jsx";
import RightSidebar from "./components/RightSidebar.jsx";
import NotificationSystem from "./components/NotificationSystem.jsx";
import LeftSidebar from "./components/LeftSidebar.jsx";
import BasemapSwitcher, { BASEMAPS } from "./components/BasemapSwitcher.jsx";

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

  //Toggle layer visibility
  const [showLandVPA, setShowLandVPA] = useState(true);
  const [showFoodAccess, setShowFoodAccess] = useState(true);

  // Polygon drawing state
  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState(null);

  // Basemap state
  const [basemap, setBasemap] = useState(BASEMAPS[0].key);
  const selectedBasemap = BASEMAPS.find(b => b.key === basemap);

  // Sidebar collapse state
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // Handler to start drawing
  const handleDrawPolygon = () => setIsDrawingPolygon(true);
  // Handler when polygon is drawn
  const handlePolygonDrawn = (geojson) => {
    setDrawnPolygon(geojson);
    setIsDrawingPolygon(false);
  };
  // Handler to cancel drawing
  const handleDrawCancel = () => setIsDrawingPolygon(false);

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
      if (showLandVPA) {
        if (selectedMunicipality) {
          const data = await request(`/api/parcels?municipality=${selectedMunicipality}`);
          setGeoData(data);
        } else if (selectedCounty) {
          const data = await request(`/api/parcels?county=${selectedCounty}`);
          setGeoData(data);
        } else {
          setGeoData(null);
        }
      } else {
        setGeoData(null);
      }

      // Load food access points
      if (showFoodAccess) {
        try {
          const foodData = await request('/api/foodaccesspoints');
          setFoodPoints(foodData);
        } catch (err) {
          console.warn('Food access points not available:', err);
          setFoodPoints(null);
        }
      } else {
        setFoodPoints(null);
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
  }, [
    selectedCounty,
    selectedMunicipality,
    showLandVPA,
    showFoodAccess,
    request,
    addNotification
  ]);

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ height: "100vh", position: "relative", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {/* Basemap Switcher - left of right sidebar */}
        <div style={{ position: 'absolute', top: 72, right: rightSidebarCollapsed ? 24 : 404, zIndex: 3000 }}>
          <BasemapSwitcher basemap={basemap} setBasemap={setBasemap} minimal />
        </div>

        {/* Minimalistic Header with Login */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 44, background: '#f1f3f6', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1201, padding: '0 1.5em', fontSize: 15, fontWeight: 600, color: '#222', letterSpacing: 0.2
        }}>
          <span>Community Hub</span>
          <button style={{ background: 'none', border: 'none', color: '#1976d2', fontSize: 13, cursor: 'pointer', fontWeight: 500, padding: '4px 12px' }}>Login</button>
        </div>

        {/* Notification System */}
        <NotificationSystem 
          notifications={notifications}
          onDismiss={dismissNotification}
        />

        {/* Stack controls and modals on the left */}
        <div style={{ position: 'absolute', top: 44, left: 0, zIndex: 10, height: 'calc(100vh - 44px)', pointerEvents: 'auto' }}>
          <LeftSidebar
            showLandVPA={showLandVPA}
            setShowLandVPA={setShowLandVPA}
            showFoodAccess={showFoodAccess}
            setShowFoodAccess={setShowFoodAccess}
            uploadedFiles={uploadedFiles}
            API_URL={API_URL}
            selectedCounty={selectedCounty}
            countyData={countyData}
            municipalities={municipalities}
            selectedMunicipality={selectedMunicipality}
            onCountyChange={handleCountyChange}
            onMunicipalityChange={handleMunicipalityChange}
            onDrawPolygon={handleDrawPolygon}
            isDrawingPolygon={isDrawingPolygon}
            onClearPolygon={handleDrawCancel}
            onUploadClick={() => setModalOpen(true)}
            onDownloadClick={() => setDownloadOpen(true)}
            isCollapsed={controlsCollapsed}
            onToggleCollapse={() => setControlsCollapsed(!controlsCollapsed)}
          />
        </div>

        {/* Right Sidebar */}
        {!rightSidebarCollapsed && (
          <div style={{ pointerEvents: 'auto' }}>
            <RightSidebar
              API_URL={API_URL}
              modalOpen={modalOpen}
              handleUploadModalClose={handleUploadModalClose}
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
              downloadOpen={downloadOpen}
              setDownloadOpen={setDownloadOpen}
              uploadedFiles={uploadedFiles}
              selectedCounty={selectedCounty}
              selectedMunicipality={selectedMunicipality}
              rightSidebarCollapsed={rightSidebarCollapsed}
              setRightSidebarCollapsed={setRightSidebarCollapsed}
            />
          </div>
        )}
        {/* Expand handle when sidebar is collapsed */}
        {rightSidebarCollapsed && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              height: '100vh',
              width: 12,
              bgcolor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 1300,
            }}
            onClick={() => setRightSidebarCollapsed(false)}
            aria-label="Expand sidebar"
          >
            <Box sx={{
              width: 4,
              height: 32,
              bgcolor: '#d1d5db',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}>
              <ChevronRightIcon fontSize="small" sx={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#1976d2' }} />
            </Box>
          </Box>
        )}

        {/* Map View */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MapView
            countyData={countyData}
            geoData={geoData}
            foodPoints={foodPoints}
            selectedCounty={selectedCounty}
            selectedMunicipality={selectedMunicipality}
            getColorByDecile={getColorByDecile}
            isDrawingPolygon={isDrawingPolygon}
            onPolygonDrawn={handlePolygonDrawn}
            onDrawCancel={handleDrawCancel}
            drawnPolygon={drawnPolygon}
            basemap={basemap}
            selectedBasemap={selectedBasemap}
          />
        </div>

        {/* Minimalistic Footer */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, background: '#f1f3f6', borderTop: '1px solid #e0e0e0', textAlign: 'center', fontSize: 11, color: '#888', zIndex: 1201, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          &copy; {new Date().getFullYear()} Community Hub
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
