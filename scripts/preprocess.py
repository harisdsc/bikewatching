#!/usr/bin/env python3
"""One-time shrink of the Bluebikes trips CSV.

Input:  bluebikes-traffic-2024-03.csv (repo root) + data/stations.json
Output: data/trips.min.csv with columns s,e,sm,em
        s/e  = station index into data.stations order
        sm/em = start/end minute of day (0-1439)
Trips referencing unknown stations are dropped (count reported).
Prints per-station total (arrivals+departures) checksum from both the
original CSV and the compact output so they can be verified equal.
"""
import csv, json, sys
from datetime import datetime

def minute_of_day(ts: str) -> int:
    dt = datetime.strptime(ts, "%Y-%m-%d %H:%M:%S")
    return dt.hour * 60 + dt.minute

def main():
    stations = json.load(open("data/stations.json"))["data"]["stations"]
    index = {s["short_name"]: i for i, s in enumerate(stations)}
    n = len(stations)

    orig_totals = [0] * n   # arrivals+departures per station, from original rows kept
    out_rows, dropped = [], 0

    with open("bluebikes-traffic-2024-03.csv", newline="") as f:
        for row in csv.DictReader(f):
            s = index.get(row["start_station_id"])
            e = index.get(row["end_station_id"])
            if s is None or e is None:
                dropped += 1
                continue
            sm = minute_of_day(row["started_at"])
            em = minute_of_day(row["ended_at"])
            out_rows.append((s, e, sm, em))
            orig_totals[s] += 1
            orig_totals[e] += 1

    with open("data/trips.min.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["s", "e", "sm", "em"])
        w.writerows(out_rows)

    # Re-read output and recompute totals independently
    new_totals = [0] * n
    with open("data/trips.min.csv", newline="") as f:
        for row in csv.DictReader(f):
            new_totals[int(row["s"])] += 1
            new_totals[int(row["e"])] += 1

    ok = orig_totals == new_totals
    print(f"trips written: {len(out_rows)}, dropped (unknown station): {dropped}")
    print(f"grand total (arr+dep): orig={sum(orig_totals)} new={sum(new_totals)}")
    print("per-station totals match:", ok)
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
