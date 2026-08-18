import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAlarmDetail } from '../api';
import { useAuth } from '../auth/AuthProvider';
import UserMenu from '../components/UserMenu';

export default function AlarmDetailPage() {
  const { sub } = useParams();
  const { token } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAlarmDetail(sub, token);
        if (cancelled) return;
        setAlarms(data);
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
  }, [sub, token]);

  const sorted = useMemo(() => {
    return [...alarms].sort((a, b) => {
      const ta = a.f_time || a.p_time || '';
      const tb = b.f_time || b.p_time || '';
      return sortDesc ? tb.localeCompare(ta) : ta.localeCompare(tb);
    });
  }, [alarms, sortDesc]);

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/" className="back-link">
          &larr; Overview
        </Link>
        <h1>{sub} - Alarm</h1>
        <p className="alarm-count">Total : {alarms.length}</p>
        <UserMenu />
      </header>

      <main className="content">
        {loading && <p className="notice">Loading...</p>}
        {!loading && error && <p className="notice error">{error}</p>}
        {!loading && !error && alarms.length === 0 && (
          <p className="notice">No alarms for {sub}.</p>
        )}
        {!loading && !error && alarms.length > 0 && (
          <>
            <div className="table-toolbar">
              <button
                type="button"
                className="sort-button"
                onClick={() => setSortDesc((prev) => !prev)}
              >
                Sort by Time: {sortDesc ? 'Newest → Oldest' : 'Oldest → Newest'}
              </button>
            </div>
            <div className="table-wrapper">
              <table className="alarm-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Alarm</th>
                    <th>Device</th>
                    <th>Description</th>
                    <th>Element</th>
                    <th>RTU</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((alarm, index) => (
                    <tr key={`${alarm.f_time}-${alarm.element_name}-${index}`}>
                      <td>{alarm.f_time || alarm.p_time}</td>
                      <td>{alarm.alarm_status}</td>
                      <td>{alarm.device_name}</td>
                      <td>{alarm.description}</td>
                      <td>{alarm.element_name}</td>
                      <td>{alarm.rtu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}