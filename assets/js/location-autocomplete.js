(() => {
  const endpoint = 'https://geocoding-api.open-meteo.com/v1/search';
  const formatPlace = place => [...new Set([place.name, place.admin1, place.country].filter(Boolean))].join(', ');
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-location-autocomplete]').forEach(input => {
      const list = document.getElementById(input.getAttribute('aria-controls'));
      if (!list) return;
      let timer;
      let requestNumber = 0;
      const close = () => { requestNumber += 1; list.hidden = true; input.setAttribute('aria-expanded', 'false'); };
      const showMessage = message => { list.replaceChildren(); const row = document.createElement('li'); row.className = 'suggestion-message'; row.textContent = message; row.setAttribute('role', 'presentation'); list.append(row); list.hidden = false; input.setAttribute('aria-expanded', 'true'); };
      const showResults = places => {
        list.replaceChildren();
        const uniquePlaces = [...new Set(places.map(formatPlace))];
        if (!uniquePlaces.length) { showMessage('No matching cities found. Try another spelling.'); return; }
        uniquePlaces.forEach(name => {
          const row = document.createElement('li'); row.setAttribute('role', 'option');
          const option = document.createElement('button'); option.type = 'button'; option.className = 'suggestion-option'; option.textContent = name;
          option.addEventListener('click', () => {
            input.value = name; close();
            input.dispatchEvent(new CustomEvent('locationselected', { bubbles: true, detail: { name } }));
          });
          row.append(option); list.append(row);
        });
        list.hidden = false; input.setAttribute('aria-expanded', 'true');
      };
      input.addEventListener('input', () => {
        clearTimeout(timer);
        const query = input.value.trim();
        if (query.length < 2) { close(); return; }
        timer = setTimeout(async () => {
          const request = ++requestNumber;
          showMessage('Finding matching cities…');
          try {
            const url = new URL(endpoint); url.search = new URLSearchParams({ name: query, count: '6', language: 'en', format: 'json' });
            const response = await fetch(url);
            if (!response.ok) throw new Error('Location search is unavailable.');
            const data = await response.json();
            if (request === requestNumber && input.value.trim() === query) showResults(data.results || []);
          } catch {
            if (request === requestNumber) showMessage('Suggestions are unavailable. You can still enter a city name.');
          }
        }, 250);
      });
      input.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
      document.addEventListener('click', event => { if (!event.target.closest('.location-search-wrap, .search-control')) close(); });
    });
  });
})();
