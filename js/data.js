// Data loading and O(1) time-window traffic queries via prefix sums.

const MINUTES = 1440;

// Pure: parse compact trips CSV into per-station prefix-sum arrays.
// P[m+1] = number of events at minutes <= m; P[0] = 0.
export function parseTrips(text, nStations) {
  const depPrefix = Array.from({ length: nStations }, () => new Uint32Array(MINUTES + 1));
  const arrPrefix = Array.from({ length: nStations }, () => new Uint32Array(MINUTES + 1));

  const lines = text.split('\n');
  for (let i = 1; i < lines.length; i++) {          // skip header
    const line = lines[i];
    if (!line) continue;
    const [s, e, sm, em] = line.split(',').map(Number);
    depPrefix[s][sm + 1]++;
    arrPrefix[e][em + 1]++;
  }
  for (const arrs of [depPrefix, arrPrefix]) {
    for (const p of arrs) {
      for (let m = 1; m <= MINUTES; m++) p[m] += p[m - 1];
    }
  }
  return { depPrefix, arrPrefix };
}

// Pure: events with |minute - t| <= 60, clamped to the day. t === -1 → whole day.
export function windowCounts(prefix, t) {
  if (t === -1) return prefix[MINUTES];
  const lo = Math.max(0, t - 60);
  const hi = Math.min(MINUTES - 1, t + 60);
  return prefix[hi + 1] - prefix[lo];
}

// Pure: 24 hourly buckets from one prefix array.
export function hourlyCounts(prefix) {
  const out = new Array(24);
  for (let h = 0; h < 24; h++) out[h] = prefix[(h + 1) * 60] - prefix[h * 60];
  return out;
}

export async function loadData() {
  const [stationsRes, tripsRes] = await Promise.all([
    fetch('data/stations.json'),
    fetch('data/trips.min.csv'),
  ]);
  if (!stationsRes.ok) throw new Error('Failed to load stations.json');
  if (!tripsRes.ok) throw new Error('Failed to load trips.min.csv');

  const stations = (await stationsRes.json()).data.stations;
  const { depPrefix, arrPrefix } = parseTrips(await tripsRes.text(), stations.length);

  function getTraffic(minute) {
    return stations.map((_, i) => {
      const departures = windowCounts(depPrefix[i], minute);
      const arrivals = windowCounts(arrPrefix[i], minute);
      return { departures, arrivals, total: departures + arrivals };
    });
  }

  function getHourly(i) {
    const d = hourlyCounts(depPrefix[i]);
    const a = hourlyCounts(arrPrefix[i]);
    return d.map((v, h) => v + a[h]);
  }

  return { stations, getTraffic, getHourly };
}
