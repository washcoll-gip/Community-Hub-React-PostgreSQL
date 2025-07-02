import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";

const MapView = ({ 
  countyData, 
  geoData, 
  foodPoints, 
  selectedCounty, 
  selectedMunicipality,
  getColorByDecile 
}) => {
  return (
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
      
      {/* County Boundaries Layer */}
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
      
      {/* Parcel Data Layer */}
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
            let popupContent = "<table style='font-size: 12px;'>";
            for (const key in props) {
              if (key !== "geom") {
                popupContent += `<tr><th style='text-align: left; padding: 2px 8px 2px 0;'>${key}</th><td style='padding: 2px;'>${props[key]}</td></tr>`;
              }
            }
            popupContent += "</table>";
            layer.bindPopup(popupContent);
          }}
        />
      )}
      
      {/* Food Access Points Layer */}
      {foodPoints && (
        <GeoJSON
          key={`foodpoints-${foodPoints.features?.length || 0}`}
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
            let popupContent = "<table style='font-size: 12px;'>";
            for (const key in props) {
              popupContent += `<tr><td style='font-weight: bold; text-align: left; padding: 2px 8px 2px 0;'>${key}</td><td style='padding: 2px;'>${props[key]}</td></tr>`;
            }
            popupContent += "</table>";
            layer.bindPopup(popupContent);
          }}
        />
      )}
    </MapContainer>
  );
};

export default MapView;
