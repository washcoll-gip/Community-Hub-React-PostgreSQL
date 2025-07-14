import React from "react";

export default function Legend({ municipalities, selectedMunicipality, getColorByDecile }) {
	const selectedMunicipalityData = municipalities.find(m => {
		if (typeof m === "string") return m.trim() === selectedMunicipality.trim();
		return m.name?.trim() === selectedMunicipality.trim();
	});

  if (!selectedMunicipalityData) {
    return null;
  }

  const vpaMaxDeciles = [
    selectedMunicipalityData.vpa_max_decile_1,
    selectedMunicipalityData.vpa_max_decile_2,
    selectedMunicipalityData.vpa_max_decile_3,
    selectedMunicipalityData.vpa_max_decile_4,
    selectedMunicipalityData.vpa_max_decile_5,
    selectedMunicipalityData.vpa_max_decile_6,
    selectedMunicipalityData.vpa_max_decile_7,
    selectedMunicipalityData.vpa_max_decile_8,
    selectedMunicipalityData.vpa_max_decile_9,
    selectedMunicipalityData.vpa_max_decile_10,
  ];

	const hasValidData = vpaMaxDeciles.some(val => val !== null && val !== undefined);
  if (!hasValidData) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: 348,
        background: "rgba(255, 255, 255, 0.9)",
        padding: "12px 16px",
        borderRadius: 6,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        fontSize: 14,
        zIndex: 1500,
        maxWidth: 260,
        userSelect: "none",
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: "bold", fontSize: 16, lineHeight: 1.2, maxWidth: "200px" }}>
        <div>Estimated Land Prices by VPA (Value Per Acre) for {selectedMunicipalityData.name} ($)</div>
      </div>
      <div style={{ marginTop: 8 }}>
        {/* Decile 10 to 1 */}
        {[...Array(10)].map((_, i) => {
          const decile = 10 - i; // 10, 9, ..., 1
          if (decile === 1) {
            return (
              <LegendRow
                key={decile}
                color={getColorByDecile(decile)}
                label={`> 0 - ${vpaMaxDeciles[0]}`}
                decile={decile}
              />
            );
          }
          return (
            <LegendRow
              key={decile}
              color={getColorByDecile(decile)}
              label={`> ${vpaMaxDeciles[decile - 2]} - ${vpaMaxDeciles[decile - 1]}`}
              decile={decile}
            />
          );
        })}
        {/* decile 0 = 0 */}
        <LegendRow
          key={0}
          color={getColorByDecile(0)}
          label="= 0"
          decile={0}
        />
      </div>
    </div>
  );
}

function LegendRow({ color, label, decile }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
      <div
        style={{
          width: 20,
          height: 20,
          backgroundColor: color,
          border: "1px solid #ccc",
          marginRight: 10,
          borderRadius: 3,
        }}
      />
      <span>{label}</span>
    </div>
  );
}