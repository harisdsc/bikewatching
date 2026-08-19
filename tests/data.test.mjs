import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrips, windowCounts, hourlyCounts } from '../js/data.js';

// 2 stations; trips: 0→1 at 100→110, 1→0 at 700→705, 0→0 at 1439→1439
const csv = 's,e,sm,em\n0,1,100,110\n1,0,700,705\n0,0,1439,1439\n';

test('parseTrips builds correct prefix sums', () => {
  const { depPrefix, arrPrefix } = parseTrips(csv, 2);
  assert.equal(depPrefix.length, 2);
  assert.equal(depPrefix[0][1441 - 1], 2);      // station 0: 2 departures all day
  assert.equal(arrPrefix[0][1440], 2);           // station 0: 2 arrivals all day
  assert.equal(depPrefix[1][1440], 1);
  assert.equal(arrPrefix[1][1440], 1);
});

test('windowCounts clamps and windows correctly', () => {
  const { depPrefix } = parseTrips(csv, 2);
  assert.equal(windowCounts(depPrefix[0], -1), 2);     // whole day
  assert.equal(windowCounts(depPrefix[0], 100), 1);    // window [40,160] catches sm=100
  assert.equal(windowCounts(depPrefix[0], 161), 0);    // window [101,221] misses it
  assert.equal(windowCounts(depPrefix[0], 1439), 1);   // clamped end window catches sm=1439
  assert.equal(windowCounts(depPrefix[0], 0), 0);      // clamped start window, nothing early
});

test('hourlyCounts buckets by hour', () => {
  const { depPrefix } = parseTrips(csv, 2);
  const h = hourlyCounts(depPrefix[0]);
  assert.equal(h.length, 24);
  assert.equal(h[1], 1);   // sm=100 is hour 1
  assert.equal(h[23], 1);  // sm=1439 is hour 23
  assert.equal(h.reduce((a, b) => a + b, 0), 2);
});
