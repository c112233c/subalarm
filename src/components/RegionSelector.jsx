export default function RegionSelector({ regions, value, onChange }) {
  return (
    <div className="region-selector">
      <label htmlFor="region">Region:</label>
      <select
        id="region"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {regions.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
}
