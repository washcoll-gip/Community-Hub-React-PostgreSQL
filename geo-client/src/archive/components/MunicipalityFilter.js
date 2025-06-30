export default function MunicipalityFilter({ municipalities, selectedMunicipality, setSelectedMunicipality, selectedCounty }) {
  return (
    <label style={{ display: "block" }}>
      Filter by municipality:
      <select
        value={selectedMunicipality}
        onChange={(e) => setSelectedMunicipality(e.target.value)}
        disabled={!selectedCounty}
        style={{ width: "100%", marginTop: "0.5em" }}
      >
        {!selectedCounty ? (
          <option value="">-</option>
        ) : (
          <>
            <option value="">All</option>
            {municipalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </>
        )}
      </select>
    </label>
  );
}