import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './style.css'

import lightStyle from '../styles/light.json'
import darkStyle from '../styles/dark.json'

const OSLO = {
  center: [10.7522, 59.9139],
  zoom: 11.2,
}

const styles = {
  light: lightStyle,
  dark: darkStyle,
}

let mode = 'light'

const map = new maplibregl.Map({
  container: 'map',
  style: styles.light,
  center: OSLO.center,
  zoom: OSLO.zoom,
  attributionControl: { compact: false },
  hash: false,
})

map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'bottom-right')
map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

const toggle = document.getElementById('theme-toggle')
const zoomDisplay = document.getElementById('zoom-display')
const themeMeta = document.querySelector('meta[name="theme-color"]')

function updateZoom() {
  zoomDisplay.textContent = `z ${map.getZoom().toFixed(1)}`
}

function applyThemeChrome() {
  document.documentElement.dataset.theme = mode
  toggle.textContent = mode === 'light' ? 'Mørk' : 'Lys'
  toggle.setAttribute('aria-pressed', mode === 'dark' ? 'true' : 'false')
  themeMeta.setAttribute('content', mode === 'light' ? '#F3F4F5' : '#1C1B1A')
}

function switchTheme() {
  // MapLibre setStyle preserves camera; avoid jumpTo on style.load
  // (style.load can fire before a once-handler is attached, leaving a stale jump).
  mode = mode === 'light' ? 'dark' : 'light'
  applyThemeChrome()
  map.setStyle(styles[mode])
}

toggle.addEventListener('click', switchTheme)
map.on('zoom', updateZoom)
map.on('move', updateZoom)
map.on('load', () => {
  updateZoom()
  applyThemeChrome()
})

map.on('error', (e) => {
  console.error('[map]', e.error || e)
})

// Optional hook for automated visual checks
window.__map = map
window.__setTheme = (next) => {
  if (next !== 'light' && next !== 'dark') return
  if (next === mode) return
  switchTheme()
}
