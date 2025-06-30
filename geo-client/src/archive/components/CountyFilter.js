export default function CountyFilter({ countyData, selectedCounty, setSelectedCounty, setSelectedMunicipality, setGeoData }) {
  return (
    <label style={{ display: "block" }}>
      Filter by county:
      <select
        value={selectedCounty}
        onChange={(e) => {
          const county = e.target.value;
          setSelectedCounty(county);
          setSelectedMunicipality("");
          setGeoData(null);
        }}
        style={{ width: "100%", marginTop: "0.5em" }}
      >
        <option value="">All</option>
        {countyData &&
          countyData.features.map((f) => (
            <option key={f.properties.name} value={f.properties.name}>
              {f.properties.name}
            </option>
          ))}
      </select>
    </label>
  );
}