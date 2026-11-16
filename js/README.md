# The app in parts (since 2.5.0)

Until 2.4.7 all logic was one file, `app.js`. Since 2.5.0 the same code is split into the parts below, loaded in this order by `index.html`. Nothing else changed: the parts were cut along the existing section headings, and all browser tests pass unchanged.

## How the parts fit together

- They are ordinary scripts (not ES modules) and **share one scope**: a name declared at the top of one part can be used in every part that loads **after** it, and inside functions in any part.
- **Order matters only for code that runs while the page loads** (top-level statements and functions they call). That code may only use names from the same or an earlier part. `dev/check_parts.mjs` checks this.
- Everything runs in strict mode (`'use strict'` at the top of each part).
- `22-init.js` starts the app and must stay last.
- Parts whose name starts with `svc-` hold the code that talks to an outside service (see the Dependencies tab in the improvement document). Since 2.6.0 every address lives in `SERVICE_DEFAULTS` (end of `01-core.js`) and is called through `svcFetch`, so a provider can be swapped or switched off in `config.js` (`SERVICES: { tiles: { url: "…" }, gbif: false }`) without changing code. The admin page has a Service check that tests them all.
- `sw.js` (next to `index.html`, since 2.6.0) lets the app open without a connection. It always tries the network first, so it never holds back an update.

## Rules when editing

1. Open the files in Notepad (right-click > Open with); never double-click a `.js` file.
2. A new part gets the next free number that puts it in the right place, a one-line description on line 1, and a `<script>` line in `index.html`.
3. The version: `APP_VERSION` in `01-core.js`, every `?v=` in `index.html`, and the number in `#appVer`. `dev/check_version.py` checks they match.
4. After changes run `node dev/check_parts.mjs site/js` (once: `cd dev && npm install acorn acorn-walk`) and the browser tests in `dev/`.

## Parts

| File | Contains | Lines |
|---|---|---|
| `01-core.js` | Helpers, option lists, field schema, lengths (cm/m), cultivars, app state, family/public setting, outside-service registry | 235 |
| `02-data.js` | Data layer (Supabase or in-memory demo), offline copy on the device, favourites, photos, merging entries | 176 |
| `03-artie-sources.js` | Outside sources pre-filled by Artie (the bot): labels and rules | 99 |
| `04-i18n.js` | Labels and language switching | 41 |
| `05-print.js` | Printable A5 sheet, QR codes and links to a species | 119 |
| `06-values.js` | Value text in the chosen language | 149 |
| `07-species.js` | Species card, overview, Add/Edit form and its draft, sheet view | 317 |
| `08-winter.js` | Winter survival records and sanity checks | 63 |
| `09-svc-gbif-names.js` | SERVICE: Latin name check while typing (GBIF name service) | 21 |
| `10-visuals.js` | Pictograms, layer diagram, year wheel, genus, grid, display, season, shields, bulk fill, admin extras | 238 |
| `11-svc-map.js` | SERVICE: map of planting records (Leaflet from vendor/leaflet, tiles from SERVICES.tiles) | 25 |
| `12-review-live.js` | Install on home screen; section marks, dismissed problems, live updates for admins | 142 |
| `13-svc-zones-soil.js` | SERVICE: Swedish zones and winter temperatures; soil permeability (SGU open data) | 63 |
| `14-review.js` | Verified marks, review flags, admin dashboard, service check, unused photo files | 176 |
| `15-exports.js` | Exports, picture-slot icons, completeness and gaps, links, near matches, renames, plant sources | 209 |
| `16-autofill.js` | Auto-fill requests (Artie) and my contributions | 146 |
| `17-planning.js` | Planning: compare (table and side by side), calendar, pick a plant, hardiness scale | 363 |
| `18-plantings.js` | Planting records and comments | 42 |
| `19-svc-climate.js` | SERVICE: winter climate of a map position (Open-Meteo archive, ERA5-Land) | 162 |
| `20-lists.js` | Shared lists, who and when, trash, display name, manual | 102 |
| `21-ui.js` | Home, navigation, events, sign-in, roles and realtime | 354 |
| `22-init.js` | Loading screen, start-up and the offline service worker (runs last) | 120 |
