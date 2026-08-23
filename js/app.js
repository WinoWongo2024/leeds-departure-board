// Leeds Departure Board – main application logic

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

// Start clock
updateClock();
setInterval(updateClock, 1000);

// Placeholder – data loading & rendering will go here
console.log('Leeds Departure Board initialised');
