// Orchestration: load data, build map, wire timeline/stations/panel together.

import { loadData } from './data.js';
import { createMap } from './map.js';
import { createTimeline } from './timeline.js';
import { createStations } from './stations.js';
import { createPanel } from './panel.js';

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 6000);
}

async function init() {
  const loading = document.getElementById('loading');
  try {
    const [{ stations, getTraffic, getHourly }, map] = await Promise.all([
      loadData(),
      createMap(),
    ]);

    let traffic = getTraffic(-1);
    const panel = createPanel(stations, getHourly);

    const circles = createStations(map, stations, {
      onHover: (i, event) => panel.showTooltip(i, event, traffic),
      onLeave: () => panel.hideTooltip(),
      onClick: (i) => panel.pin(i, traffic),
    });

    createTimeline((minute) => {
      traffic = getTraffic(minute);
      circles.update(traffic, minute === -1);
      panel.refresh(traffic);
    });

    map.getCanvas().addEventListener('click', () => panel.unpin());

    circles.update(traffic, true);
  } catch (err) {
    console.error(err);
    toast(`Something went wrong loading the visualization: ${err.message}`);
  } finally {
    loading.classList.add('done');
  }
}

init();
