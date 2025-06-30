import { GeoJSON } from "react-leaflet";
import L from "leaflet";

export default function FoodPointsLayer({ foodPoints }) {
  if (!foodPoints) return null;
  return (
    <GeoJSON
      key={`food-${foodPoints.features?.length}-${Date.now()}`}
      data={foodPoints}
      pointToLayer={(feature, latlng) =>
        L.circleMarker(latlng, {
          radius: 6,
          fillColor: "#ff7800",
          color: "#000",
          weight: 1,
          fillOpacity: 0.8
        })
      }
      onEachFeature={(feature, layer) => {
        const props = feature.properties;
        let html = "<table>";
        Object.entries(props).forEach(([k, v]) => {
          html += `<tr><td><b>${k}</b></td><td>${v}</td></tr>`;
        });
        html += "</table>";
        layer.bindPopup(html);
      }}
    />
  );
}