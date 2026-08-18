export default function SubstationCard({ station }) {
  const hasAlarm = Number(station.alarm) > 0;

  return (
    <a
      className={`station-card ${hasAlarm ? 'alarm' : 'normal'}`}
      href={`/alarm/${encodeURIComponent(station.sub_code)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={station.sub_name || station.sub_code}
    >
      <span className="station-name">{station.sub_code}</span>
      {hasAlarm && <span className="station-count">({station.alarm})</span>}
    </a>
  );
}
