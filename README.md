# Politiloggen basemap

MapLibre Style Spec basemaps for **Politiloggen** — Light and Dark as one design system. Basemap only (no incident markers, filters, or search UI).

## Quick start

```bash
cd project/politiloggen-map
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Default view: Oslo. Use **Mørk / Lys** to toggle themes (center and zoom are preserved). Current zoom is shown in the chrome.

```bash
npm run build    # production bundle → dist/
npm run preview  # serve dist/
```

## Project layout

| Path | Purpose |
|------|---------|
| `styles/light.json` | Politiloggen Light (Maputnik-compatible) |
| `styles/dark.json` | Politiloggen Dark (Maputnik-compatible) |
| `src/tokens.json` | Shared palette tokens (reference) |
| `scripts/generate-styles.mjs` | Regenerates both styles from tokens |
| `src/main.js` | Minimal Vite preview (toggle + zoom) |
| `index.html` | Preview shell |

## Stack

- **MapLibre GL JS** renderer
- **OpenFreeMap** vector tiles (OpenMapTiles schema) — no API keys
- Verified endpoints:
  - Source TileJSON: `https://tiles.openfreemap.org/planet`
  - Sprites: `https://tiles.openfreemap.org/sprites/ofm_f384/ofm`
  - Glyphs: `https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`
- Fonts: Noto Sans Regular / Bold / Italic (hosted by OpenFreeMap)

## Design decisions

### Shared hierarchy

Both modes share the same layer order and zoom logic:

1. Land / landcover / parks  
2. Water & waterways  
3. Buildings (from z13, opacity ramps up)  
4. Paths → minor roads → major roads → motorways (subtle → cased)  
5. Rail (muted)  
6. Admin boundaries  
7. Labels: water → streets → suburb → village → town → city → country  

Dark is **not** an invert of light: land is warm charcoal (`#1C1B1A`); roads and buildings separate by **luminance**, not hue; labels are warm off-white (`#E6E1DF`).

### Palette tokens (summary)

| Role | Light | Dark |
|------|-------|------|
| Land | `#F3F4F5` | `#1C1B1A` |
| Water | `#A9B7C4` (desaturated blue-grey) | `#2E3844` (lifted slate) |
| Parks | `#D4DCD4` (muted green-grey) | `#252B27` |
| Buildings | `#DDDFE1` | `#2C2B29` |
| Minor roads | `#C5C8CC` | `#3E3D3A` |
| Labels | `#24272B` | `#E6E1DF` |

**Reserved accent** (not used on the basemap): Light `#0B6BCB`, Dark `#74A9FF` — for future incident overlays. See `src/tokens.json`.

### What is emphasized / hidden

- **Emphasized:** place hierarchy (country → city → neighbourhood), street network readability, calm water/land contrast suitable behind markers.
- **De-emphasized / omitted:** commercial **POIs** (no `poi` layers), paths until z14, buildings until z13, sprite road shields (text-only refs — OFM `road_*` sprites wash out in dark), railways muted, aerodrome icons omitted.
- Place labels prefer local `name` / `name:latin` over `name_en` (better for Norway).

## Edit in Maputnik

1. Open [https://maputnik.github.io/editor/](https://maputnik.github.io/editor/)
2. Open → upload `styles/light.json` or `styles/dark.json`
3. After edits, save JSON back into `styles/`
4. Or change colors in `scripts/generate-styles.mjs` / `src/tokens.json` and run:

```bash
npm run generate:styles
```

Styles are independently editable; regenerating overwrites them from the script.

## Attribution

Styles must preserve OpenFreeMap / OpenMapTiles / OpenStreetMap attribution (included on the `openmaptiles` source and shown by MapLibre’s attribution control).

## Preview checklist

Evaluate both modes at:

| View | Approx. center / zoom |
|------|------------------------|
| Norway overview | `[8.5, 64.0]` / z4.5 |
| Greater Oslo | `[10.75, 59.91]` / z9 |
| Oslo city | `[10.75, 59.91]` / z11–12 |
| Grünerløkka | `[10.76, 59.92]` / z14–15 |
| Rodeløkka | `[10.77, 59.93]` / z15–16 |
