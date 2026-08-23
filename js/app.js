// Leeds Departure Board – main application logic

const OPERATOR_COLOURS = {
  NT: '#1e3a5f',   // Northern
  TP: '#e30613',   // TransPennine Express
  GR: '#c8102e',   // LNER
  XC: '#8b1d2c'    // CrossCountry
};

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = timeString;
}

/** Deterministic delay based on service id (same every refresh) */
function getDelayMinutes(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % 100;

  if (val < 72) return 0;           // ~72% on time
  if (val < 88) return (val % 8) + 3; // small delay 3-10 min
  if (val < 96) return (val % 12) + 8; // medium 8-19 min
  return -1;                        // cancelled
}

function formatExpected(std, delay) {
  if (delay === -1) return { text: 'Cancelled', className: 'status-cancelled' };
  if (delay === 0) return { text: 'On time', className: 'status-on-time' };

  // Calculate expected time
  const [h, m] = std.split(':').map(Number);
  const totalMins = h * 60 + m + delay;
  const eh = Math.floor(totalMins / 60) % 24;
  const em = totalMins % 60;
  const expected = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

  return {
    text: `Exp. ${expected}`,
    className: 'status-delayed',
    delayText: `+${delay}`
  };
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function renderDepartures(data) {
  const list = document.getElementById('departures-list');
  if (!list) return;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Show services from ~10 mins ago onwards (so recently departed still visible briefly)
  const windowStart = currentMins - 10;

  const upcoming = data.departures
    .map(dep => {
      const delay = getDelayMinutes(dep.id);
      const expected = formatExpected(dep.std, delay);
      return { ...dep, delay, expected };
    })
    .filter(dep => {
      const stdMins = timeToMinutes(dep.std);
      // Keep services that haven't long departed
      return stdMins + (dep.delay > 0 ? dep.delay : 0) >= windowStart;
    })
    .slice(0, 18); // limit visible rows

  if (upcoming.length === 0) {
    list.innerHTML = '<div class="loading">No more departures today</div>';
    return;
  }

  list.innerHTML = upcoming.map(dep => {
    const viaHtml = dep.via ? `<div class="via">via ${dep.via}</div>` : '';
    const operatorColour = OPERATOR_COLOURS[dep.operatorCode] || '#444';

    return `
      <div class="departure-row">
        <div class="col-time">${dep.std}</div>
        <div class="col-destination">
          <div class="dest-name">${dep.destination}</div>
          ${viaHtml}
        </div>
        <div class="col-platform">${dep.platform || '—'}</div>
        <div class="col-expected ${dep.expected.className}">
          ${dep.expected.text}
          ${dep.expected.delayText ? `<span class="delay-mins">${dep.expected.delayText}</span>` : ''}
        </div>
        <div class="col-operator">
          <span class="op-badge" style="background:${operatorColour}">${dep.operatorCode}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  try {
    const res = await fetch('data/departures.json');
    const data = await res.json();
    renderDepartures(data);

    // Re-render every 30 seconds so the list advances with time
    setInterval(() => renderDepartures(data), 30000);
  } catch (err) {
    console.error('Failed to load departures', err);
    document.getElementById('departures-list').innerHTML =
      '<div class="loading">Unable to load departures</div>';
  }
}

init();
