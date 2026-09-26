# Detectable Games on Discord

A simple page to browse the games Discord can detect, the ones that show up as "Playing ..." on your profile. It pulls the list straight from Discord's `applications/detectable` endpoint, so there's no backend or database, just HTML and a bit of JS.

Live: https://franpratama.github.io/Check-Discord-API-for-Games/

## What it does

You can search by game name or by exe name, filter by genre, and sort A-Z or Z-A. There's a dropdown to switch the API version too. v6 is the default, v9 and v10 should work as well, the older ones may or may not respond. The list loads 100 games at a time as you scroll, and there's a dark mode if you want it.

## Running it

Just open `index.html` in a browser. If the fetch fails because of CORS, run it from a local server instead (`npx serve`, VS Code Live Server, whatever you like).

Built with plain JS, Tailwind (CDN) and Font Awesome.

The date below is updated by a GitHub Action every time I push to main.

---
Updated 23 August 2026 09:15:40 WIB
