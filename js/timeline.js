// Time state: slider, formatted display, and rAF playback loop.

const STEP_PER_FRAME = 2; // simulated minutes per animation frame

export function createTimeline(onTimeChange) {
  const slider = document.getElementById('time-slider');
  const timeEl = document.getElementById('selected-time');
  const anyEl = document.getElementById('any-time');
  const playBtn = document.getElementById('play-btn');

  let minute = Number(slider.value);
  let playing = false;
  let rafId = null;

  function formatTime(mins) {
    const d = new Date(0, 0, 0, 0, mins);
    return d.toLocaleString('en-US', { timeStyle: 'short' });
  }

  function render() {
    if (minute === -1) {
      timeEl.textContent = '';
      anyEl.style.display = 'inline';
    } else {
      timeEl.textContent = formatTime(minute);
      anyEl.style.display = 'none';
    }
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  function setMinute(m, fromSlider = false) {
    minute = m;
    if (!fromSlider) slider.value = String(m);
    render();
    onTimeChange(minute);
  }

  function tick() {
    if (!playing) return;
    let next = minute === -1 ? 0 : minute + STEP_PER_FRAME;
    if (next > 1440) next = 0; // loop
    setMinute(next);
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    playing = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    render();
  }

  playBtn.addEventListener('click', () => {
    playing ? stop() : ((playing = true), tick());
  });

  slider.addEventListener('input', () => {
    stop(); // dragging takes over from playback
    setMinute(Number(slider.value), true);
  });

  render();
  return { getMinute: () => minute };
}
