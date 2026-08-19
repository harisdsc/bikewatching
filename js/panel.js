// Hover tooltip and pinned station panel with a 24h mini bar chart.

export function createPanel(stations, getHourly) {
  const tooltip = document.getElementById('tooltip');
  const panel = document.getElementById('station-panel');
  let pinned = -1;

  function statsHtml(i, traffic) {
    const t = traffic[i];
    return `
      <div class="stat"><span class="stat-num">${t.total}</span> trips</div>
      <div class="stat dep"><span class="stat-num">${t.departures}</span> departures</div>
      <div class="stat arr"><span class="stat-num">${t.arrivals}</span> arrivals</div>`;
  }

  function showTooltip(i, event, traffic) {
    if (pinned !== -1) return; // panel is authoritative while pinned
    tooltip.innerHTML = `<strong>${stations[i].name}</strong>${statsHtml(i, traffic)}`;
    tooltip.style.display = 'block';
    const pad = 12;
    tooltip.style.left = `${event.clientX + pad}px`;
    tooltip.style.top = `${event.clientY + pad}px`;
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  function chartSvg(hourly) {
    const w = 240, h = 60, bw = w / 24;
    const max = Math.max(...hourly, 1);
    const bars = hourly
      .map((v, hr) => {
        const bh = (v / max) * (h - 12);
        return `<rect x="${hr * bw + 1}" y="${h - bh}" width="${bw - 2}" height="${bh}" rx="1"></rect>`;
      })
      .join('');
    return `<svg class="mini-chart" viewBox="0 0 ${w} ${h + 14}" width="${w}">
      ${bars}
      <text x="0" y="${h + 12}">12am</text>
      <text x="${w / 2}" y="${h + 12}" text-anchor="middle">12pm</text>
      <text x="${w}" y="${h + 12}" text-anchor="end">11pm</text>
    </svg>`;
  }

  function renderPanel(traffic) {
    const s = stations[pinned];
    panel.innerHTML = `
      <button id="panel-close" aria-label="Close">×</button>
      <h2>${s.name}</h2>
      ${statsHtml(pinned, traffic)}
      <h3>Traffic by hour (full day)</h3>
      ${chartSvg(getHourly(pinned))}`;
    panel.querySelector('#panel-close').addEventListener('click', unpin);
  }

  function pin(i, traffic) {
    pinned = i;
    hideTooltip();
    renderPanel(traffic);
    panel.classList.add('open');
  }

  function refresh(traffic) {
    if (pinned !== -1) renderPanel(traffic);
  }

  function unpin() {
    pinned = -1;
    panel.classList.remove('open');
  }

  return { showTooltip, hideTooltip, pin, refresh, unpin };
}
