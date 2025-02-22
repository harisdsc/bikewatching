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


  map.on('load', () => {
    // Load both stations and traffic data using Promise.all
    Promise.all([
        d3.json('https://dsc106.com/labs/lab07/data/bluebikes-stations.json'),
        d3.csv('https://dsc106.com/labs/lab07/data/bluebikes-traffic-2024-03.csv')
    ]).then(([jsonData, tripsData]) => {
        // Extract stations data
        stations = jsonData.data.stations;
        
        // Calculate arrivals and departures using d3.rollup
        const arrivals = d3.rollup(
            tripsData,
            v => v.length,
            d => d.end_station_id
        );

        const departures = d3.rollup(
            tripsData,
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
            .attr('r', d => radiusScale(d.totalTraffic))  // Use the scale here
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

    }).catch(error => {
        console.error('Error loading data:', error);
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
    timeFilter = Number(timeSlider.value);  // Convert slider value to number
    
    if (timeFilter === -1) {
        selectedTime.textContent = '';
        anyTimeLabel.style.display = 'inline';
    } else {
        selectedTime.textContent = formatTime(timeFilter);
        anyTimeLabel.style.display = 'none';
    }
    
    // We'll add filtering logic in the next step
    console.log('Time filter updated to:', timeFilter);
}

timeSlider.addEventListener('input', updateTimeDisplay);
updateTimeDisplay();
