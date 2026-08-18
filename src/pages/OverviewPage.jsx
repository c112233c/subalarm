import { useEffect, useState } from 'react';
import { getOverview } from '../api';
import { useAuth } from '../auth/AuthProvider';
import UserMenu from '../components/UserMenu';
import RegionSelector from '../components/RegionSelector';
import SubstationCard from '../components/SubstationCard';

export default function OverviewPage() {
  const { token } = useAuth();
  const [stations, setStations] = useState([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getOverview(token);
        if (cancelled) return;
        setStations(data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const regions = [...new Set(stations.map((s) => s.region))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const activeRegion = regions.includes(region) ? region : regions[0] || '';

  const visibleStations = activeRegion
    ? stations.filter((s) => s.region === activeRegion)
    : [];

  const update_at = stations.reduce((latest, s) => {
    if (s.update_at && (!latest || s.update_at > latest)) return s.update_at;
    return latest;
  }, '');

  return (
    <div className="page">
      <header className="page-header">
        <h1>Alarm Substation</h1>
        <UserMenu />
      </header>

      <header className="page-header">
        <p>แสดงผล alarm ระดับ high โดยแบ่งแยกตามสถานี (Demo)</p>
        <p className="last-updated">
          Updated At : {update_at || '-'}
        </p>
      </header>

      <RegionSelector
        regions={regions}
        value={activeRegion}
        onChange={setRegion}
      />

      <main className="content">
        {loading && <p className="notice">Loading...</p>}
        {!loading && error && <p className="notice error">{error}</p>}
        {!loading && !error && activeRegion && (
          <section className="region-group">
            <h2 className="region-header">[{activeRegion}]</h2>
            <div className="station-grid">
              {visibleStations.map((station) => (
                <SubstationCard key={station.sub_code} station={station} />
              ))}
            </div>
          </section>
        )}
        {!loading && !error && !activeRegion && (
          <p className="notice">No station data available.</p>
        )}
      </main>
    </div>
  );
}