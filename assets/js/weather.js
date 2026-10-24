(() => {
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
  const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const STORAGE_KEY = 'wwy-saved-locations';
  const CURRENT_KEY = 'wwy-current-location';
  let activePlace = null;
  const codes = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
    45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'], 61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
    66: ['Freezing rain', '🌧️'], 67: ['Heavy freezing rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
    77: ['Snow grains', '🌨️'], 80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '⛈️'],
    85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '❄️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Severe thunderstorm with hail', '⛈️']
  };
  const condition = code => codes[code] || ['Conditions unavailable', '🌡️'];
  const readSaved = () => { try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value.filter(item => typeof item === 'string') : []; } catch { return []; } };
  const readCurrent = () => { try { return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null'); } catch { return null; } };
  const saveCurrent = place => { try { localStorage.setItem(CURRENT_KEY, JSON.stringify(place)); } catch {} };
  const placeName = place => [place.name, place.admin1, place.country].filter((part, index, all) => part && all.indexOf(part) === index).join(', ');
  async function geocode(query) {
    const url = new URL(GEOCODE_URL); url.search = new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json' });
    const response = await fetch(url); if (!response.ok) throw new Error('Location search is unavailable right now.');
    const data = await response.json(); if (!data.results?.length) throw new Error(`No matching place found for “${query}”.`);
    const result = data.results[0]; return { name: placeName(result), latitude: result.latitude, longitude: result.longitude, timezone: result.timezone || 'auto' };
  }
  async function getWeather(place) {
    const url = new URL(WEATHER_URL); url.search = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', forecast_days: '5', timezone: place.timezone || 'auto', temperature_unit: 'celsius', wind_speed_unit: 'kmh' });
    const response = await fetch(url); if (!response.ok) throw new Error('Weather could not be loaded. Please try again.'); return response.json();
  }
  const setText = (id, text) => { const element = document.getElementById(id); if (element) element.textContent = text; };
  function applyWeatherWindow(current) {
    const windowImage = document.getElementById('window-img');
    if (!windowImage) return;
    const weatherCode = Number(current.weather_code);
    const temperature = Number(current.temperature_2m);
    const theme = weatherCode >= 45 || temperature <= 10 ? 'blue' : temperature >= 25 ? 'red' : 'yellow';
    windowImage.src = `assets/images/${theme}Window.png`;
  }

  function renderHome(place, data) {
    const current = data.current; const [description] = condition(current.weather_code);
    applyWeatherWindow(current);
    setText('weather-location', place.name); setText('weather-temperature', `${Math.round(current.temperature_2m)} °C`); setText('weather-condition', description);
    const localDate = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: place.timezone || 'UTC' }).format(new Date(`${current.time}:00`));
    setText('current-date', localDate); setText('weather-status', `Feels like ${Math.round(current.apparent_temperature)}° · ${Math.round(current.relative_humidity_2m)}% humidity · wind ${Math.round(current.wind_speed_10m)} km/h`);
  }
  function renderForecast(place, data) {
    const current = data.current; const [description, emoji] = condition(current.weather_code);
    setText('forecast-location', place.name); setText('forecast-icon', emoji); setText('forecast-date', new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric', timeZone: place.timezone || 'UTC' }).format(new Date(`${current.time}:00`)).toUpperCase());
    setText('forecast-current', `${Math.round(current.temperature_2m)}°C · ${description}`);
    setText('forecast-summary', `Feels like ${Math.round(current.apparent_temperature)}°C · Humidity ${Math.round(current.relative_humidity_2m)}% · Wind ${Math.round(current.wind_speed_10m)} km/h · Rain now ${current.precipitation} mm`);
    const days = document.getElementById('forecast-days'); if (!days) return; days.replaceChildren();
    data.daily.time.forEach((date, index) => {
      const card = document.createElement('article'); card.className = 'forecast-day';
      const name = document.createElement('p'); name.className = 'forecast-day-name'; name.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: place.timezone || 'UTC' }).format(new Date(`${date}T12:00:00`));
      const icon = document.createElement('span'); icon.className = 'forecast-day-icon'; icon.textContent = condition(data.daily.weather_code[index])[1]; icon.setAttribute('aria-label', condition(data.daily.weather_code[index])[0]);
      const temps = document.createElement('p'); temps.className = 'forecast-day-temp'; temps.textContent = `${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°`;
      const rain = document.createElement('p'); rain.className = 'forecast-day-rain'; rain.textContent = `${data.daily.precipitation_probability_max[index] ?? 0}% rain`;
      card.append(name, icon, temps, rain); days.append(card);
    });
  }
  async function loadPlace(place) {
    activePlace = place;
    const status = document.getElementById('weather-status'); if (status) status.textContent = 'Loading live weather…';
    const forecastLocation = document.getElementById('forecast-location'); if (forecastLocation) forecastLocation.textContent = 'Loading live weather…';
    try {
      const data = await getWeather(place);
      const resolvedPlace = { ...place, timezone: place.timezone && place.timezone !== 'auto' ? place.timezone : data.timezone || 'UTC' };
      activePlace = resolvedPlace; saveCurrent(resolvedPlace); renderHome(resolvedPlace, data); renderForecast(resolvedPlace, data);
    } catch (error) { if (status) status.textContent = error.message; if (forecastLocation) forecastLocation.textContent = error.message; }
  }
  async function searchPlace(query) {
    const status = document.getElementById('weather-status'); if (status) status.textContent = 'Searching for the location…';
    try { const place = await geocode(query); await loadPlace(place); } catch (error) { if (status) status.textContent = error.message; const forecastLocation = document.getElementById('forecast-location'); if (forecastLocation) forecastLocation.textContent = error.message; }
  }
  async function locateUser() {
    if (!navigator.geolocation) return;
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 600000 }));
      const url = new URL(GEOCODE_URL); url.search = new URLSearchParams({ name: `${position.coords.latitude},${position.coords.longitude}`, count: '1', language: 'en', format: 'json' });
      const response = await fetch(url); if (!response.ok) throw new Error(); const result = (await response.json()).results?.[0];
      if (result) { const place = { name: 'Your location', latitude: position.coords.latitude, longitude: position.coords.longitude, timezone: 'auto' }; await loadPlace(place); }
    } catch { setText('weather-status', 'Search for a city to see its live weather.'); setText('forecast-location', 'Search a city on the home page to see its forecast.'); }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('location-search');
    const searchButton = document.getElementById('search-location');
    const saveButton = document.getElementById('save-location');
    const previous = document.getElementById('previous-location');
    const next = document.getElementById('next-location');
    let currentPlace = readCurrent();
    const saved = readSaved();
    let currentIndex = currentPlace ? saved.findIndex(name => name.toLowerCase() === currentPlace.name.toLowerCase()) : -1;
    const runSearch = () => { const query = search?.value.trim(); if (query) searchPlace(query); };
    searchButton?.addEventListener('click', runSearch);
    search?.addEventListener('locationselected', event => searchPlace(event.detail.name));
    search?.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runSearch(); } });
    saveButton?.addEventListener('click', () => {
      if (!activePlace || activePlace.name === 'Your location') { if (search?.value.trim()) runSearch(); else setText('weather-status', 'Search for a city first, then save it.'); return; }
      const places = readSaved(); if (!places.some(name => name.toLowerCase() === activePlace.name.toLowerCase())) places.push(activePlace.name);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(places)); currentIndex = places.indexOf(activePlace.name); setText('weather-status', 'Location saved.'); } catch { setText('weather-status', 'Could not save this location in your browser.'); }
    });
    const step = direction => { const places = readSaved(); if (!places.length) { setText('weather-status', 'Save a location to browse your places.'); return; } currentIndex = (currentIndex + direction + places.length) % places.length; if (search) search.value = places[currentIndex]; searchPlace(places[currentIndex]); };
    previous?.addEventListener('click', () => step(-1)); next?.addEventListener('click', () => step(1));
    const requestedLocation = new URLSearchParams(location.search).get('location');
    if (requestedLocation) { if (search) search.value = requestedLocation; searchPlace(requestedLocation); }
    else if (currentPlace) loadPlace(currentPlace);
    else locateUser();
  });
})();
