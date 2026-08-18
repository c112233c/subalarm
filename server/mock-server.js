import http from 'node:http';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 3001;
const DIST_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8'
};

console.log();
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
  `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const LAST_UPDATE = stamp(now);

const stations = [
  { sub_code: 'BCA', region: 'NE1', alarm: 0, sub_name: 'BAN CHANG 1' },
  { sub_code: 'BDG', region: 'NE1', alarm: 0, sub_name: 'BAN DUNG 1' },
  { sub_code: 'BDH', region: 'NE1', alarm: 2, sub_name: 'BAN DUNG 2' },
  { sub_code: 'BPU', region: 'NE1', alarm: 12, sub_name: 'BAN PUE 1' },
  { sub_code: 'BUB', region: 'NE1', alarm: 0, sub_name: 'BUA BAN 1' },
  { sub_code: 'KKA', region: 'NE2', alarm: 4, sub_name: 'KHON KAEN A' },
  { sub_code: 'KKB', region: 'NE2', alarm: 0, sub_name: 'KHON KAEN B' },
  { sub_code: 'KKC', region: 'NE2', alarm: 7, sub_name: 'KHON KAEN C' },
  { sub_code: 'SEK', region: 'NE2', alarm: 7, sub_name: 'SEKA 1' }
];

const devices = [
  { device_name: 'BDH_115_LINE01', description: 'TRIP CCT. SUPERVISION TC1 (TRIP_CCT_TC1)', element: 'BDH_115_LINE01_TRIP_CCT_TC1' },
  { device_name: 'BDH_115_LINE01', description: 'TRIP CCT. SUPERVISION TC2 (TRIP_CCT_TC2)', element: 'BDH_115_LINE01_TRIP_CCT_TC2' },
  { device_name: 'BDH_115_LINE02', description: 'TRIP CCT. SUPERVISION TC1 (TRIP_CCT_TC1)', element: 'BDH_115_LINE02_TRIP_CCT_TC1' },
  { device_name: 'BDH_22_TR01', description: 'DIST. TRANSFORMER OIL TEMP HIGH', element: 'BDH_22_TR01_OIL_TEMP' },
  { device_name: 'BDH_115_BUS01', description: '115 KV BUS OVERVOLTAGE', element: 'BDH_115_BUS01_OV' },
  { device_name: 'BDH_22_LINE03', description: 'EARTH FAULT', element: 'BDH_22_LINE03_EF' }
];

const statuses = ['Fail', 'Active', 'Trip'];

function buildAlarms(count, sub) {
  const station = stations.find((s) => s.sub_code === sub);
  const list = [];
  const base = Date.now();
  for (let i = 0; i < count; i++) {
    const device = devices[Math.floor(Math.random() * devices.length)];
    const t = new Date(base - i * 3000 - Math.floor(Math.random() * 2000));
    list.push({
      p_time: `${stamp(t)}.${pad(t.getMilliseconds()).padEnd(6, '0')}`,
      f_time: `${stamp(t)}.${pad(t.getMilliseconds())}`,
      region: station.region,
      sub_name: station.sub_name,
      device_name: device.device_name,
      description: device.description,
      alarm_status: statuses[Math.floor(Math.random() * statuses.length)],
      element_name: device.element,
      rtu: sub,
      last_update: LAST_UPDATE
    });
  }
  return list.sort((a, b) => b.f_time.localeCompare(a.f_time));
}

async function serveStatic(res, pathname) {
  let filePath = path.join(DIST_DIR, pathname);
  if (pathname === '/' || pathname.endsWith('/')) {
    filePath = path.join(filePath, 'index.html');
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const data = await fs.readFile(filePath);
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.end(data);
  } catch {
    try {
      const data = await fs.readFile(path.join(DIST_DIR, 'index.html'));
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: 'Not found' }));
    }
  }
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/api/alarmsubsum' && req.method === 'GET') {
    res.end(
      JSON.stringify(
        stations.map((s) => ({
          sub_code: s.sub_code,
          region: s.region,
          alarm: s.alarm,
          sub_name: s.sub_name,
          update_at: LAST_UPDATE,
          last_update: LAST_UPDATE
        }))
      )
    );
    return;
  }

  const detailMatch = pathname.match(/^\/api\/alarmsub\/([^/]+)$/);
  if (detailMatch && req.method === 'GET') {
    const sub = decodeURIComponent(detailMatch[1]).toUpperCase();
    const station = stations.find((s) => s.sub_code === sub);
    if (!station) {
      res.statusCode = 404;
      res.end(JSON.stringify({ message: `Station ${sub} not found` }));
      return;
    }
    res.end(JSON.stringify(buildAlarms(station.alarm, sub)));
    return;
  }

  if (pathname.startsWith('/api/')) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not found' }));
    return;
  }

  serveStatic(res, pathname);
});

server.listen(PORT, () => {
  console.log(`Substation app running at http://localhost:${PORT}`);
});