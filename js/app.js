// Leeds Platform Indicator
// Shows Next + Following only. Following cycles every ~15 seconds.

const OPERATOR_COLOURS = {
  NT: '#1e3a5f',
  TP: '#e30613',
  GR: '#c8102e',
  XC: '#8b1d2c'
};

let allServices = [];
let followingIndex = 1; // starts at the second service
let cycleTimer = null;

function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const el = document.getElementById('clock');
  if (el) el.textContent = timeString;
}

function getDelayMinutes(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const val = Math.abs(hash) % 100;
  if (val < 70) return 0;
  if (val < 87) return (val % 7) + 3;
  if (val < 96) return (val % 11) + 8;
  return -1; // cancelled
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

function getStatus(std, delay) {
  if (delay === -1) {
    return { text: 'Cancelled', className: 'status-cancelled', expectedMins: timeToMinutes(std) };
  }
  const expectedMins = timeToMinutes(std) + delay;
  if (delay === 0) {
    return { text: 'On time', className: 'status-on-time', expectedMins };
  }
  return {
    text: `Exp. ${minutesToTime(expectedMins)}`,
    className: 'status-delayed',
    expectedMins
  };
}

function processServices(raw) {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  return raw
    .map(dep => {
      const delay = getDelayMinutes(dep.id);
      const status = getStatus(dep.std, delay);
      return { ...dep, delay, status };
    })
    .filter(dep => {
      if (dep.delay === -1) {
        return timeToMinutes(dep.std) >= currentMins - 1;
      }
      return dep.status.expectedMins >= currentMins - 2;
    })
    .sort((a, b) => a.status.expectedMins - b.status.expectedMins);
}

function renderService(dep) {
  if (!dep) {
    return `<div class="no-service">No more services</div>`;
  }

  const opColour = OPERATOR_COLOURS[dep.operatorCode] || '#444';
  const viaText = dep.via ? `Calling at: ${dep.via}` : 'Direct service';

  return `
    <div class="service">
      <div class="service-main">
        <div class="service-time">${dep.std}</div>
        <div class="service-dest">${dep.destination}</div>
      </div>
      <div class="service-meta">
        <span class="service-platform">Plat. ${dep.platform || '—'}</span>
        <span class="service-status ${dep.status.className}">${dep.status.text}</span>
        <span class="op-badge" style="background:${opColour}">${dep.operatorCode}</span>
      </div>
      <div class="calling-points">
        <span>${viaText}</span>
      </div>
    </div>
  `;
}

function updateDisplay() {
  const nextEl = document.getElementById('next-content');
  const followingEl = document.getElementById('following-content');

  if (!allServices.length) {
    nextEl.innerHTML = `<div class="no-service">No more departures today</div>`;
    followingEl.innerHTML = '';
    return;
  }

  // Next is always the first upcoming service
  const next = allServices[0];
  nextEl.innerHTML = renderService(next);

  // Following cycles through the rest
  if (allServices.length < 2) {
    followingEl.innerHTML = `<div class="no-service">No following service</div>`;
    return;
  }

  // Keep followingIndex in range (starts from 1)
  if (followingIndex >= allServices.length) {
    followingIndex = 1;
  }

  const following = allServices[followingIndex];
  followingEl.innerHTML = renderService(following);
}

function startCycling() {
  if (cycleTimer) clearInterval(cycleTimer);

  // Cycle the Following slot every 15 seconds
  cycleTimer = setInterval(() => {
    if (allServices.length < 3) return; // nothing to cycle

    followingIndex++;
    if (followingIndex >= allServices.length) {
      followingIndex = 1;
    }
    updateDisplay();
  }, 15000);
}

async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  try {
    const res = await fetch('data/departures.json');
    const data = await res.json();

    allServices = processServices(data.departures);
    followingIndex = 1;

    updateDisplay();
    startCycling();

    // Refresh the service list every 30s so departed trains drop off
    setInterval(() => {
      allServices = processServices(data.departures);
      if (followingIndex >= allServices.length) followingIndex = 1;
      updateDisplay();
    }, 30000);

  } catch (err) {
    console.error(err);
    document.getElementById('next-content').innerHTML =
      `<div class="no-service">Unable to load services</div>`;
  }
}

init();
