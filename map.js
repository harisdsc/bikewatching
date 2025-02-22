// Set your Mapbox access token here
mapboxgl.accessToken = 'pk.eyJ1IjoiaGFyaXNzYWlmIiwiYSI6ImNtN2ZxZDR4dzByenYybHB3bzRiOXViYXoifQ.zr6VbDf8WlgJ81wDTU4iUw';

// Initialize the map
const map = new mapboxgl.Map({
container: 'map', // ID of the div where the map will render
style: 'mapbox://styles/mapbox/streets-v12', // Map style
center: [-71.09415, 42.36027], // [longitude, latitude]
zoom: 12, // Initial zoom level
minZoom: 5, // Minimum allowed zoom
maxZoom: 18 // Maximum allowed zoom
});


map.on('load', () => { 
map.addSource('boston_route', {
    type: 'geojson',
    data: 'https://bostonopendata-boston.opendata.arcgis.com/datasets/boston::existing-bike-network-2022.geojson?...'
    });
map.addSource('cambridge_route', {
    type: 'geojson',
    data: 'https://raw.githubusercontent.com/cambridgegis/cambridgegis_data/main/Recreation/Bike_Facilities/RECREATION_BikeFacilities.geojson'
    });
    map.addLayer({
    id: 'bike-lanes',
    type: 'line',
    source: 'boston_route',
    paint: {
        'line-color': '#32D400',  // A bright green using hex code
        'line-width': 4,          // Thicker lines
        'line-opacity': 0.6       // Slightly less transparent
    }
    });
    map.addLayer({
    id: 'cambridge-lanes',
    type: 'line',
    source: 'cambridge_route',
    paint: {
        'line-color': '#32D400',  // A bright green using hex code
        'line-width': 4,          // Thicker lines
        'line-opacity': 0.6       // Slightly less transparent
    }
    });
});

map.on('load', () => {
    // Load the nested JSON file
    const jsonurl = 'https://dsc106.com/labs/lab07/data/bluebikes-stations.json';
    d3.json(jsonurl).then(jsonData => {
      console.log('Loaded JSON Data:', jsonData);  // Log to verify structure
      const stations = jsonData.data.stations;
      console.log('Stations Array:', stations);
    }).catch(error => {
      console.error('Error loading JSON:', error);  // Handle errors if JSON loading fails
    });
  });

const svg = d3.select('#map').select('svg');
let stations = [];

function getCoords(station) {
    const point = new mapboxgl.LngLat(+station.lon, +station.lat);  // Convert lon/lat to Mapbox LngLat
    const { x, y } = map.project(point);  // Project to pixel coordinates
    return { cx: x, cy: y };  // Return as object for use in SVG attributes
  }

  let trips = []

  map.on('load', () => {
    d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json')
        .then(jsonData => {
            stations = jsonData.data.stations;
            
            d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv')
                .then(tripData => {
                    for (let trip of tripData) {
                        trip.started_at = new Date(trip.started_at);
                        trip.ended_at = new Date(trip.ended_at);
                    }
                    trips = tripData; 
                    // Calculate arrivals and departures using d3.rollup
                    const arrivals = d3.rollup(
                        tripData,
                        v => v.length,
                        d => d.end_station_id
                    );

                    const departures = d3.rollup(
                        tripData,
                        v => v.length,
                        d => d.start_station_id
                    );

                    // Add traffic data to stations
                    stations = stations.map(station => {
                        let id = station.short_name;
                        station.arrivals = arrivals.get(id) ?? 0;
                        station.departures = departures.get(id) ?? 0;
                        station.totalTraffic = station.arrivals + station.departures;
                        return station;
                    });

                    const radiusScale = d3.scaleSqrt()
                        .domain([0, d3.max(stations, d => d.totalTraffic)])
                        .range([0, 25]);

                    // Create the circles with the station data
                    const circles = svg.selectAll('circle')
                        .data(stations)
                        .enter()
                        .append('circle')
                        .attr('r', d => radiusScale(d.totalTraffic))
                        .attr('fill', 'steelblue')
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1)
                        .attr('fill-opacity', 0.6)
                        .each(function(d) {
                            d3.select(this)
                                .append('title')
                                .text(d => `${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
                        });

                    // Function to update circle positions
                    function updatePositions() {
                        circles
                            .attr('cx', d => getCoords(d).cx)
                            .attr('cy', d => getCoords(d).cy);
                    }

                    // Initial position update
                    updatePositions();

                    // Reposition markers on map interactions
                    map.on('move', updatePositions);
                    map.on('zoom', updatePositions);
                    map.on('resize', updatePositions);
                    map.on('moveend', updatePositions);
                })
                .catch(error => {
                    console.error('Error loading CSV data:', error);
                });
        })
        .catch(error => {
            console.error('Error loading JSON data:', error);
        });
});

let timeFilter = -1;
const timeSlider = document.getElementById('time-slider');
const selectedTime = document.getElementById('selected-time');
const anyTimeLabel = document.getElementById('any-time');
function formatTime(minutes) {
    const date = new Date(0, 0, 0, 0, minutes);  // Set hours & minutes
    return date.toLocaleString('en-US', { timeStyle: 'short' }); // Format as HH:MM AM/PM
  }

  function updateTimeDisplay() {
    timeFilter = Number(timeSlider.value);  // Get slider value
  
    if (timeFilter === -1) {
      selectedTime.textContent = '';  // Clear time display
      anyTimeLabel.style.display = 'block';  // Show "(any time)"
    } else {
      selectedTime.textContent = formatTime(timeFilter);  // Display formatted time
      anyTimeLabel.style.display = 'none';  // Hide "(any time)"
    }

  }

  timeSlider.addEventListener('input', () => {
    updateTimeDisplay();
    filterTripsbyTime();
});


let filteredTrips = [];
let filteredArrivals = new Map();
let filteredDepartures = new Map();
let filteredStations = [];

function minutesSinceMidnight(date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  function filterTripsbyTime() {
    filteredTrips = timeFilter === -1
        ? trips
        : trips.filter((trip) => {
            const startedMinutes = minutesSinceMidnight(trip.started_at);
            const endedMinutes = minutesSinceMidnight(trip.ended_at);
            return (
                Math.abs(startedMinutes - timeFilter) <= 60 ||
                Math.abs(endedMinutes - timeFilter) <= 60
            );
        });

    filteredArrivals = d3.rollup(
        filteredTrips,
        v => v.length,
        d => d.end_station_id
    );

    filteredDepartures = d3.rollup(
        filteredTrips,
        v => v.length,
        d => d.start_station_id
    );

    filteredStations = stations.map(station => {
        const stationClone = { ...station };
        const id = stationClone.short_name;
        stationClone.arrivals = filteredArrivals.get(id) ?? 0;
        stationClone.departures = filteredDepartures.get(id) ?? 0;
        stationClone.totalTraffic = stationClone.arrivals + stationClone.departures;
        return stationClone;
    });

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredStations, d => d.totalTraffic)])
        .range(timeFilter === -1 ? [0, 25] : [3, 50]);

    svg.selectAll('circle')
        .data(filteredStations)
        .attr('r', d => radiusScale(d.totalTraffic))
        .each(function(d) {
            d3.select(this).select('title')
                .text(`${d.totalTraffic} trips (${d.departures} departures, ${d.arrivals} arrivals)`);
        });
}
