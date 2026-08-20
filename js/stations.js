// Station circles: sizing by traffic, color by departure ratio, map-synced positions.

const MAX_R_ALL = 25;    // radius ceiling, whole-day view
const MAX_R_WINDOW = 50; // radius ceiling, filtered view
const MIN_R_WINDOW = 3;

const flowScale = d3.scaleQuantize().domain([0, 1]).range([0, 0.5, 1]);

export function createStations(map, stations, { onHover, onLeave, onClick }) {
  const svg = d3.select('#map').select('svg');

  const circles = svg
    .selectAll('circle')
    .data(stations)
    .enter()
    .append('circle')
    .attr('data-i', (_, i) => i)
    .on('mouseenter', function (event) {
      onHover(Number(this.dataset.i), event);
    })
    .on('mousemove', function (event) {
      onHover(Number(this.dataset.i), event);
    })
    .on('mouseleave', () => onLeave())
    .on('click', function (event) {
      event.stopPropagation();
      onClick(Number(this.dataset.i), event);
    });

  function positions() {
    circles
      .attr('cx', (d) => map.project([+d.lon, +d.lat]).x)
      .attr('cy', (d) => map.project([+d.lon, +d.lat]).y);
  }

  ['move', 'zoom', 'resize', 'moveend'].forEach((ev) => map.on(ev, positions));
  positions();

  function update(traffic, anyTime) {
    const maxTotal = d3.max(traffic, (t) => t.total) || 1;
    const r = d3
      .scaleSqrt()
      .domain([0, maxTotal])
      .range(anyTime ? [0, MAX_R_ALL] : [MIN_R_WINDOW, MAX_R_WINDOW]);

    circles
      .attr('r', (_, i) => r(traffic[i].total))
      .style('--departure-ratio', (_, i) => {
        const t = traffic[i];
        return t.total === 0 ? 0.5 : flowScale(t.departures / t.total);
      });
  }

  return { update };
}
