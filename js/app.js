// Leeds – UK CIS style departure board

const OPERATOR_COLOURS = {
  NT: '#1e3a5f',
  TP: '#e30613',
  GR: '#c8102e',
  XC: '#8b1d2c'
};

// Simple calling points lookup (can be expanded later)
const CALLING_POINTS = {
  'London Kings Cross': ['Wakefield Westgate', 'Doncaster', 'Newark North Gate', 'Peterborough', 'London Kings Cross'],
  'Manchester Airport': ['Huddersfield', 'Manchester Piccadilly', 'Manchester Airport'],
  'Manchester Piccadilly': ['Huddersfield', 'Manchester Piccadilly'],
  'Liverpool Lime Street': ['Huddersfield', 'Manchester Victoria', 'Liverpool Lime Street'],
  'Newcastle': ['York', 'Darlington', 'Durham', 'Newcastle'],
  'Edinburgh': ['York', 'Darlington', 'Durham', 'Newcastle', 'Edinburgh'],
  'Hull': ['Selby', 'Hull'],
  'Scarborough': ['York', 'Malton', 'Seamer', 'Scarborough'],
  'Sheffield': ['Wakefield Westgate', 'Sheffield'],
  'Plymouth': ['Sheffield', 'Derby', 'Birmingham New Street', 'Bristol Temple Meads', 'Plymouth'],
  'Birmingham New Street': ['Sheffield', 'Derby', 'Birmingham New Street'],
  'York': ['York'],
  'Skipton': ['Shipley', 'Keighley', 'Skipton'],
  'Ilkley': ['Guiseley', 'Ilkley'],
  'Bradford Forster Square': ['Bradford Forster Square'],
  'Halifax': ['Bradford Interchange', 'Halifax'],
  'Chester': ['Manchester Victoria', 'Warrington Bank Quay', 'Chester'],
  'Wigan Wallgate': ['Bradford Interchange', 'Halifax', 'Hebden Bridge', 'Manchester Victoria', 'Wigan Wallgate'],
  'Knottingley': ['Wakefield Westgate', 'Pontefract Monkhill', 'Knottingley'],
  'Dewsbury': ['Dewsbury'],
  'Redcar Central': ['York', 'Middlesbrough', 'Redcar Central'],
  'Nottingham': ['Sheffield', 'Chesterfield', 'Nottingham'],
  'Manchester Victoria': ['Huddersfield', 'Manchester Victoria']
};

function updateClockAndDate() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const dateString = now.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  if (clockEl) clockEl.textContent = timeString;
  if (dateEl) dateEl.textContent = dateString;
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
  return -1;
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

function getMinutesAway(expectedMins) {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const diff = expectedMins - current;
  if (diff <= 0) return 'Due';
  if (diff === 1) return '1 min';
  return `${diff} mins`;
}

function getCallingPoints(dest, via) {
  // Prefer known full list, otherwise build a simple one
  if (CALLING_POINTS[dest]) {
    return CALLING_POINTS[dest];
  }
  if (via) {
    return via.split(/,| & /).map(s => s.trim()).concat(dest);
  }
  return [dest];
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
      if (dep.delay === -1) return timeToMinutes(dep.std) >= currentMins - 1;
      return dep.status.expectedMins >= currentMins - 1;
    })
    .sort((a, b) => a.status.expectedMins - b.status.expectedMins);
}

function renderService(dep) {
  if (!dep) return `<div class="no-service">No service</div>`;

  const opColour = OPERATOR_COLOURS[dep.operatorCode] || '#444';
  const stops = getCallingPoints(dep.destination, dep.via);
  const viaLine = dep.via ? `via ${dep.via}` : '';

  const stopsHtml = stops.map(s => `<li>${s}</li>`).join('');

  return `
    <div class="service">
      <div class="service-header">
        <div class="service-time">${dep.std}</div>
        <div class="service-dest">${dep.destination}</div>
      </div>
      ${viaLine ? `<div class="service-via">${viaLine}</div>` : ''}
      <div class="service-status-row">
        <span class="status ${dep.status.className}">${dep.status.text}</span>
        <span class="platform">Plat. ${dep.platform || '—'}</span>
        <span class="op-badge" style="background:${opColour}">${dep.operatorCode}</span>
      </div>
      <div class="calling-points">
        <div class="calling-label">Calling at</div>
        <ul class="stops">${stopsHtml}</ul>
      </div>
    </div>
  `;
}

function updateBoard(services) {
  const first = services[0] || null;
  const second = services[1] || null;

  document.getElementById('first-body').innerHTML = renderService(first);
  document.getElementById('second-body').innerHTML = renderService(second);

  document.getElementById('first-mins').textContent = first
    ? getMinutesAway(first.status.expectedMins)
    : '';
  document.getElementById('second-mins').textContent = second
    ? getMinutesAway(second.status.expectedMins)
    : '';
}

async function init() {
  updateClockAndDate();
  setInterval(updateClockAndDate, 1000);

  try {
    const res = await fetch('data/departures.json');
    const data = await res.json();

    let services = processServices(data.departures);
    updateBoard(services);

    // Refresh list every 20 seconds
    setInterval(() => {
      services = processServices(data.departures);
      updateBoard(services);
    }, 20000);

  } catch (err) {
    console.error(err);
    document.getElementById('first-body').innerHTML =
      `<div class="no-service">Unable to load services</div>`;
  }
}

init();
