// Mapbox map initialization and bike-lane layers (Boston + Cambridge).

const TOKEN =
  'pk.eyJ1IjoiaGFyaXNzYWlmIiwiYSI6ImNtN2ZxZDR4dzByenYybHB3bzRiOXViYXoifQ.zr6VbDf8WlgJ81wDTU4iUw';

const LANE_PAINT = {
  'line-color': '#32d400',
  'line-width': 3,
  'line-opacity': 0.5,
};

export function createMap() {
  mapboxgl.accessToken = TOKEN;
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-71.09415, 42.36027],
    zoom: 12,
    minZoom: 5,
    maxZoom: 18,
  });

  return new Promise((resolve) => {
    map.on('load', () => {
      addLanes(map, 'boston-lanes', 'data/boston-bike-network.geojson');
      addLanes(map, 'cambridge-lanes', 'data/cambridge-bike-facilities.geojson');
      resolve(map);
    });
  });
}

function addLanes(map, id, url) {
  map.addSource(id, { type: 'geojson', data: url });
  map.addLayer({ id, type: 'line', source: id, paint: LANE_PAINT });
}
