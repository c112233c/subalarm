import { API_BASE_URL } from './config';

async function request(path, token) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export function getOverview(token) {
  return request('/api/alarmsubsum', token);
}

export function getAlarmDetail(sub, token) {
  return request(`/api/alarmsub/${encodeURIComponent(sub)}`, token);
}