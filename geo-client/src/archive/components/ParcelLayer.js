import { GeoJSON } from "react-leaflet";
import { getColorByDecile } from "../utils/colorUtils";

export default function ParcelLayer({ geoData, selectedMunicipality, selectedCounty }) {
  if (!geoData) return null;

  return (
    <GeoJSON
      key={`${selectedMunicipality || selectedCounty}-${geoData?.features?.length || 0}`}
      data={geoData}
      style={(feature) => {
        const decile = feature.properties.vpa_decile;
        const defaultColor = "#3388ff";

        const color =
          selectedMunicipality && decile > 0 ? getColorByDecile(decile) : defaultColor;

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
  );
}