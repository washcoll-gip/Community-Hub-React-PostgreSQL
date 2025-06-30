import { GeoJSON } from "react-leaflet";

export default function CountyLayer({ countyData, selectedCounty }) {
  return (
    <>
      {countyData && (
        <GeoJSON
          key={`county-layer-${selectedCounty || "all"}`}
          data={{
            ...countyData,
            features: selectedCounty
              ? countyData.features.filter((f) => f.properties.name === selectedCounty)
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
    </>
  );
}