const timeElement = document.getElementById('time');
function updateTime() {
  const currentTime = new Date();
  const hours = (currentTime.getHours() % 12) || 12;
  const minutes = currentTime.getMinutes().toString().padStart(2, '0');
  timeElement.textContent = `${hours}:${minutes}`;
}
updateTime();
setInterval(updateTime, 1000);