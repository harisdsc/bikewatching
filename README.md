# 🚴🏼‍♀️ Bikewatching

Interactive map of Bluebikes traffic in Boston & Cambridge (March 2024).
Station circles are sized by trip volume and colored by departure/arrival
balance. Filter by time of day with the slider, or press play to animate
a full day of traffic. Click any station for detailed stats and an
hourly traffic chart.

Built with Mapbox GL JS and D3 - no build step, plain ES modules.

## Run locally

    python -m http.server 8000
    # open http://localhost:8000

## Data

- Stations & trips: [Bluebikes system data](https://bluebikes.com/system-data)
- Bike lanes: Boston Open Data & Cambridge GIS (bundled in `data/`)

The 21MB raw trips CSV is preprocessed into a compact 4-column file
(`data/trips.min.csv`) by `scripts/preprocess.py`. At runtime, per-station
prefix-sum arrays make any time-window query O(1), which is what keeps
playback smooth.
