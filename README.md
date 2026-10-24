# Weathering With You

A pixel-art weather dashboard with city search, live weather, saved locations, a five-day forecast, activity ideas, and a rain-themed loading screen.

**Live demo:** https://weathering-with-you.vercel.app

## Features

- Search for cities with matching location suggestions
- View current weather and a five-day forecast from Open-Meteo
- Save locations in this browser and cycle through them on the dashboard
- Read weather-based activity ideas
- Customize the dashboard window color
- No account required; saved locations remain in the current browser

## Project structure

- HTML pages are in the project root
- `assets/css/` contains the page stylesheets
- `assets/images/` contains the pixel-art images
- `assets/js/` contains the weather and city suggestion scripts

## Run locally

This is a static HTML/CSS/JavaScript site and has no build step or dependencies. Serve the project root with XAMPP Apache or VS Code Live Server, then open `http://localhost/wwy/` (or the local URL provided by Live Server). An internet connection is needed for weather and city search.

## Weather data

Weather and city search use Open-Meteo. Its free API is limited to non-commercial use. See [Open-Meteo's terms](https://open-meteo.com/en/terms).

## Deploy on Vercel

Use the project root as the Vercel Root Directory. The included `vercel.json` redirects `/` to the loading page; other HTML pages and files under `assets/` are served as static files.

## Author

Rhianna Gomez · [GitHub](https://github.com/rainmklla) · [LinkedIn](https://www.linkedin.com/in/rhianna-mikaella-gomez-715475353)
