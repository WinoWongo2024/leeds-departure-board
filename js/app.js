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

/** Deterministic delay based on service id (stable across refreshes) */
function getDelayMinutes(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % 100;

  if (val < 70) return 0;            // ~70% on time
  if (val < 87) return (val % 7) + 3; // 3–9 min
  if (val < 96) return (val % 11) + 8; // 8–18 min
  return -1;                         // cancelled
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getServiceStatus(std, delay) {
  if (delay === -1) {
    return {
      text: 'Cancelled',
      className: 'status-cancelled',
      expectedMins: timeToMinutes(std) // use scheduled for filtering
    };
  }

  const stdMins = timeToMinutes(std);
  const expectedMins = stdMins + delay;

  if (delay === 0) {
    return {
      text: 'On time',
      className: 'status-on-time',
      expectedMins
    };
  }

  return {
    text: `Exp. ${minutesToTime(expectedMins)}`,
    className: 'status-delayed',
    delayText: `+${delay}`,
    expectedMins
  };
}

function renderDepartures(data) {
  const list = document.getElementById('departures-list');
  if (!list) return;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Realistic window:
  // - Show a service if its *expected* departure is still in the future
  // - Or it was due in the last 2 minutes (just departed)
  // - Cancelled services disappear once their scheduled time has passed
  const processed = data.departures
    .map(dep => {
      const delay = getDelayMinutes(dep.id);
      const status = getServiceStatus(dep.std, delay);
      return { ...dep, delay, status };
    })
    .filter(dep => {
      const expected = dep.status.expectedMins;

      if (dep.delay === -1) {
        // Cancelled: only show until scheduled time has passed
        return timeToMinutes(dep.std) >= currentMins - 1;
      }

      // Normal / delayed: show if expected time is still ahead or just gone
      return expected >= currentMins - 2;
    })
    .sort((a, b) => a.status.expectedMins - b.status.expectedMins)
    .slice(0, 14); // sensible number of rows for a real board

  if (processed.length === 0) {
    list.innerHTML = '<div class="loading">No more departures today</div>';
    return;
  }

  list.innerHTML = processed.map(dep => {
    const viaHtml = dep.via
      ? `<div class="via-marquee"><span>via ${dep.via}</span></div>`
      : '';

    const operatorColour = OPERATOR_COLOURS[dep.operatorCode] || '#444';

    return `
      <div class="departure-row">
        <div class="col-time">${dep.std}</div>
        <div class="col-destination">
          <div class="dest-name">${dep.destination}</div>
          ${viaHtml}
        </div>
        <div class="col-platform">${dep.platform || '—'}</div>
        <div class="col-expected ${dep.status.className}">
          ${dep.status.text}
          ${dep.status.delayText ? `<span class="delay-mins">${dep.status.delayText}</span>` : ''}
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

    // Re-evaluate every 20 seconds so the board advances naturally
    setInterval(() => renderDepartures(data), 20000);
  } catch (err) {
    console.error('Failed to load departures', err);
    document.getElementById('departures-list').innerHTML =
      '<div class="loading">Unable to load departures</div>';
  }
}

init();
