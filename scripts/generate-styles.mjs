/**
 * Generate Politiloggen Light & Dark MapLibre styles from shared tokens.
 * Structure follows OpenFreeMap Positron (OpenMapTiles schema) — verified sources:
 *   tiles:  https://tiles.openfreemap.org/planet
 *   sprite: https://tiles.openfreemap.org/sprites/ofm_f384/ofm
 *   glyphs: https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf
 *
 * Run: node scripts/generate-styles.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const stylesDir = join(root, 'styles')

/** Shared design tokens — one system, two modes */
const tokens = {
  fonts: {
    regular: ['Noto Sans Regular'],
    bold: ['Noto Sans Bold'],
    italic: ['Noto Sans Italic'],
  },
  // Reserved for future incident overlays — never used on basemap fills
  accent: {
    light: '#0B6BCB',
    dark: '#74A9FF',
  },
  light: {
    land: '#F3F4F5',
    landMuted: '#ECEDEF',
    residential: '#E8E9EB',
    park: '#C9D4C9',
    wood: '#C0CBC0',
    ice: '#E4EBF0',
    glacier: '#DEE6EC',
    water: '#A9B7C4',
    waterway: '#97A8B6',
    building: '#DDDFE1',
    buildingOutline: '#C8CBCE',
    pier: '#F3F4F5',
    path: '#D5D7D9',
    roadMinor: '#C5C8CC',
    roadMajorInner: '#FFFFFF',
    roadMajorCasing: '#AEB2B7',
    roadMajorSubtle: '#B8BCC0',
    motorwayInner: '#F7F8F9',
    motorwayCasing: '#9AA0A6',
    motorwaySubtle: '#A8ADB3',
    rail: '#B0B4B8',
    aeroway: '#C9CDD1',
    aerowayFill: '#D6D9DC',
    boundary: '#8A9198',
    boundaryDisputed: '#8A9198',
    labelPrimary: '#24272B',
    labelSecondary: '#555C64',
    labelMuted: '#727A82',
    labelWater: '#4F6270',
    halo: '#F3F4F5',
    shieldText: '#2A2D31',
    shieldHalo: '#FFFFFF',
  },
  dark: {
    land: '#1C1B1A',
    landMuted: '#222120',
    residential: '#232221',
    park: '#252B27',
    wood: '#222824',
    ice: '#2E3338',
    glacier: '#30363B',
    // Slightly lifted slate so fjords/lakes read against charcoal land
    water: '#2E3844',
    waterway: '#3A4654',
    building: '#302F2C',
    buildingOutline: '#43423E',
    pier: '#1C1B1A',
    path: '#3A3936',
    roadMinor: '#3E3D3A',
    roadMajorInner: '#4A4945',
    roadMajorCasing: '#2E2D2B',
    roadMajorSubtle: '#3A3936',
    motorwayInner: '#5A5955',
    motorwayCasing: '#333230',
    motorwaySubtle: '#454440',
    rail: '#454440',
    aeroway: '#454440',
    aerowayFill: '#333230',
    boundary: '#6A6763',
    boundaryDisputed: '#6A6763',
    labelPrimary: '#E6E1DF',
    labelSecondary: '#C4BFBC',
    labelMuted: '#A09A98',
    labelWater: '#A3B4C4',
    halo: 'rgba(28,27,26,0.9)',
    shieldText: '#E6E1DF',
    shieldHalo: 'rgba(28,27,26,0.95)',
  },
}

const SOURCE = 'openmaptiles'
const LINE = ['LineString', 'MultiLineString']
const POLY = ['Polygon', 'MultiPolygon']

const nameField = [
  'case',
  ['has', 'name:nonlatin'],
  ['concat', ['coalesce', ['get', 'name'], ['get', 'name:latin']], '\n', ['get', 'name:nonlatin']],
  ['coalesce', ['get', 'name'], ['get', 'name:latin'], ['get', 'name_en']],
]

function geom(...types) {
  return ['match', ['geometry-type'], types, true, false]
}

function buildLayers(p) {
  const roadWidth = (stops, base = 1.4) => [
    'interpolate',
    ['exponential', base],
    ['zoom'],
    ...stops,
  ]

  return [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': p.land },
    },
    {
      id: 'landuse_residential',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landuse',
      maxzoom: 16,
      filter: ['all', geom(...POLY), ['==', ['get', 'class'], 'residential']],
      paint: {
        'fill-color': p.residential,
        'fill-opacity': [
          'interpolate',
          ['exponential', 0.6],
          ['zoom'],
          8,
          0.55,
          12,
          0.35,
          15,
          0.15,
        ],
      },
    },
    {
      id: 'landcover_ice_shelf',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landcover',
      maxzoom: 8,
      filter: ['all', geom(...POLY), ['==', ['get', 'subclass'], 'ice_shelf']],
      paint: { 'fill-color': p.ice, 'fill-opacity': 0.7 },
    },
    {
      id: 'landcover_glacier',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landcover',
      maxzoom: 8,
      filter: ['all', geom(...POLY), ['==', ['get', 'subclass'], 'glacier']],
      paint: {
        'fill-color': p.glacier,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 0.45],
      },
    },
    {
      id: 'landcover_wood',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landcover',
      minzoom: 9,
      filter: ['all', geom(...POLY), ['==', ['get', 'class'], 'wood']],
      paint: {
        'fill-color': p.wood,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0.35, 14, 0.55],
      },
    },
    {
      id: 'park',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'park',
      filter: geom(...POLY),
      paint: {
        'fill-color': p.park,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 0.7],
      },
    },
    {
      id: 'landuse_park',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landuse',
      filter: [
        'all',
        geom(...POLY),
        ['match', ['get', 'class'], ['park', 'grass', 'cemetery', 'pitch'], true, false],
      ],
      paint: {
        'fill-color': p.park,
        'fill-opacity': 0.55,
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'water',
      filter: ['all', geom(...POLY), ['!=', ['get', 'brunnel'], 'tunnel']],
      paint: { 'fill-antialias': true, 'fill-color': p.water },
    },
    {
      id: 'waterway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'waterway',
      minzoom: 8,
      filter: geom(...LINE),
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.waterway,
        'line-width': roadWidth([8, 0.5, 16, 2.2], 1.2),
        'line-opacity': 0.85,
      },
    },
    {
      id: 'building',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-antialias': true,
        'fill-color': p.building,
        'fill-outline-color': p.buildingOutline,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.55, 15, 0.85, 17, 0.95],
      },
    },
    {
      id: 'aeroway-area',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'aeroway',
      minzoom: 10,
      filter: ['all', geom(...POLY), ['match', ['get', 'class'], ['runway', 'taxiway'], true, false]],
      paint: { 'fill-color': p.aerowayFill, 'fill-opacity': 0.7 },
    },
    {
      id: 'aeroway-taxiway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'aeroway',
      minzoom: 12,
      filter: ['all', geom(...LINE), ['==', ['get', 'class'], 'taxiway']],
      paint: {
        'line-color': p.aeroway,
        'line-width': roadWidth([12, 1, 17, 8], 1.4),
      },
    },
    {
      id: 'aeroway-runway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'aeroway',
      minzoom: 11,
      filter: ['all', geom(...LINE), ['==', ['get', 'class'], 'runway']],
      paint: {
        'line-color': p.aeroway,
        'line-width': roadWidth([11, 3, 17, 40], 1.4),
      },
    },
    {
      id: 'road_area_pier',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'transportation',
      filter: ['all', geom(...POLY), ['==', ['get', 'class'], 'pier']],
      paint: { 'fill-color': p.pier, 'fill-antialias': true },
    },
    {
      id: 'road_pier',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      filter: ['all', geom(...LINE), ['==', ['get', 'class'], 'pier']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.roadMinor,
        'line-width': roadWidth([14, 1.5, 18, 8], 1.2),
      },
    },
    {
      id: 'tunnel_motorway_casing',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['==', ['get', 'brunnel'], 'tunnel'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: {
        'line-color': p.motorwayCasing,
        'line-opacity': 0.45,
        'line-width': roadWidth([5.8, 0, 6, 3, 20, 36], 1.4),
        'line-dasharray': [0.5, 0.25],
      },
    },
    {
      id: 'tunnel_motorway_inner',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['==', ['get', 'brunnel'], 'tunnel'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.motorwayInner,
        'line-opacity': 0.45,
        'line-width': roadWidth([4, 1.5, 6, 1.2, 20, 28], 1.4),
      },
    },
    {
      id: 'highway_path',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 14,
      filter: ['all', geom(...LINE), ['==', ['get', 'class'], 'path']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.path,
        'line-opacity': 0.65,
        'line-width': roadWidth([14, 0.6, 20, 5], 1.2),
      },
    },
    {
      id: 'highway_minor',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 11,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.roadMinor,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 11, 0.7, 14, 1],
        'line-width': roadWidth([11, 0.8, 13, 1.8, 20, 18], 1.5),
      },
    },
    {
      id: 'highway_major_subtle',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      maxzoom: 11,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.roadMajorSubtle,
        'line-width': roadWidth([6, 1.0, 11, 2.6], 1.2),
        'line-opacity': 0.95,
      },
    },
    {
      id: 'highway_major_casing',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 11,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: {
        'line-color': p.roadMajorCasing,
        'line-width': roadWidth([10, 3.0, 20, 24], 1.3),
      },
    },
    {
      id: 'highway_major_inner',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 11,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.roadMajorInner,
        'line-width': roadWidth([10, 2.0, 20, 20], 1.3),
      },
    },
    {
      id: 'highway_motorway_subtle',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      maxzoom: 6,
      filter: ['all', geom(...LINE), ['==', ['get', 'class'], 'motorway']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.motorwaySubtle,
        'line-width': 1.2,
        'line-opacity': 0.75,
      },
    },
    {
      id: 'highway_motorway_casing',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: {
        'line-color': p.motorwayCasing,
        'line-width': roadWidth([5.8, 0, 6, 2.6, 20, 36], 1.4),
      },
    },
    {
      id: 'highway_motorway_inner',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.motorwayInner,
        'line-width': roadWidth([4, 1.4, 6, 1.3, 20, 28], 1.4),
      },
    },
    {
      id: 'railway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 13,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['rail', 'transit'], true, false],
        ['!=', ['get', 'brunnel'], 'tunnel'],
      ],
      paint: {
        'line-color': p.rail,
        'line-opacity': 0.55,
        'line-width': roadWidth([13, 0.6, 17, 1.4], 1.2),
      },
    },
    {
      id: 'railway_dashline',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 13,
      filter: [
        'all',
        geom(...LINE),
        ['match', ['get', 'class'], ['rail', 'transit'], true, false],
        ['!=', ['get', 'brunnel'], 'tunnel'],
      ],
      paint: {
        'line-color': p.land,
        'line-opacity': 0.45,
        'line-width': roadWidth([13, 0.25, 17, 0.6], 1.2),
        'line-dasharray': [3, 3],
      },
    },
    {
      id: 'highway_motorway_bridge_casing',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['==', ['get', 'brunnel'], 'bridge'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'butt', 'line-join': 'miter' },
      paint: {
        'line-color': p.motorwayCasing,
        'line-width': roadWidth([5.8, 0, 6, 3, 20, 38], 1.4),
      },
    },
    {
      id: 'highway_motorway_bridge_inner',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 6,
      filter: [
        'all',
        geom(...LINE),
        ['==', ['get', 'brunnel'], 'bridge'],
        ['==', ['get', 'class'], 'motorway'],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.motorwayInner,
        'line-width': roadWidth([4, 1.5, 6, 1.4, 20, 30], 1.4),
      },
    },
    {
      id: 'boundary_3',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      minzoom: 7,
      filter: [
        'all',
        ['>=', ['get', 'admin_level'], 3],
        ['<=', ['get', 'admin_level'], 4],
        ['!=', ['get', 'maritime'], 1],
      ],
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': p.boundary,
        'line-dasharray': [2, 1.5],
        'line-opacity': 0.35,
        'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.6, 12, 1.2],
      },
    },
    {
      id: 'boundary_2',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      filter: [
        'all',
        ['==', ['get', 'admin_level'], 2],
        ['!=', ['get', 'maritime'], 1],
        ['!=', ['get', 'disputed'], 1],
        ['!', ['has', 'claimed_by']],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.boundary,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.35, 4, 0.75],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 5, 1.1, 12, 2.2],
      },
    },
    {
      id: 'boundary_disputed',
      type: 'line',
      source: SOURCE,
      'source-layer': 'boundary',
      filter: [
        'all',
        ['==', ['get', 'admin_level'], 2],
        ['!=', ['get', 'maritime'], 1],
        ['==', ['get', 'disputed'], 1],
      ],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': p.boundaryDisputed,
        'line-dasharray': [2, 2],
        'line-opacity': 0.55,
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 12, 2],
      },
    },
    // Labels — hierarchy: country → state → city → town → village → suburb → streets
    {
      id: 'waterway_label',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'waterway',
      minzoom: 12,
      filter: ['all', geom(...LINE), ['match', ['get', 'class'], ['river', 'canal'], true, false]],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-field': nameField,
        'text-font': tokens.fonts.italic,
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 12],
        'text-max-angle': 30,
      },
      paint: {
        'text-color': p.labelWater,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
        'text-halo-blur': 0.5,
      },
    },
    {
      id: 'water_name_point',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'water_name',
      filter: geom('Point', 'MultiPoint'),
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.italic,
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 10, 14],
        'text-max-width': 6,
        'text-letter-spacing': 0.05,
      },
      paint: {
        'text-color': p.labelWater,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
        'text-halo-blur': 0.5,
      },
    },
    {
      id: 'water_name_line',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'water_name',
      filter: geom(...LINE),
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 500,
        'text-field': nameField,
        'text-font': tokens.fonts.italic,
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 12, 14],
      },
      paint: {
        'text-color': p.labelWater,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
        'text-halo-blur': 0.5,
      },
    },
    {
      id: 'highway_name_path',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 15.5,
      filter: ['==', ['get', 'class'], 'path'],
      layout: {
        'symbol-placement': 'line',
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': 10,
        'text-max-angle': 30,
      },
      paint: {
        'text-color': p.labelMuted,
        'text-halo-color': p.halo,
        'text-halo-width': 1,
      },
    },
    {
      id: 'highway_name_minor',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 14.5,
      filter: [
        'all',
        ['match', ['get', 'class'], ['minor', 'service', 'track'], true, false],
      ],
      layout: {
        'symbol-placement': 'line',
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 14.5, 10, 18, 12],
        'text-max-angle': 30,
      },
      paint: {
        'text-color': p.labelSecondary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
        'text-halo-blur': 0.4,
      },
    },
    {
      id: 'highway_name_major',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 12.5,
      filter: [
        'all',
        [
          'match',
          ['get', 'class'],
          ['primary', 'secondary', 'tertiary', 'trunk', 'motorway'],
          true,
          false,
        ],
      ],
      layout: {
        'symbol-placement': 'line',
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 12.5, 10, 18, 13],
        'text-max-angle': 30,
      },
      paint: {
        'text-color': p.labelPrimary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.3,
        'text-halo-blur': 0.4,
      },
    },
    {
      // Text-only refs — OFM road_* sprites read as opaque white boxes in dark mode
      id: 'highway_shield',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 10,
      filter: [
        'all',
        ['has', 'ref'],
        ['<=', ['coalesce', ['get', 'ref_length'], 99], 6],
        [
          '!',
          [
            'any',
            ['==', ['slice', ['coalesce', ['get', 'network'], ''], 0, 3], 'us-'],
            ['==', ['slice', ['coalesce', ['get', 'network'], ''], 0, 3], 'ca-'],
          ],
        ],
      ],
      layout: {
        'symbol-placement': 'line',
        'symbol-spacing': 400,
        'text-field': ['get', 'ref'],
        'text-font': tokens.fonts.bold,
        'text-rotation-alignment': 'viewport',
        'text-size': 10,
        'text-padding': 2,
        'text-letter-spacing': 0.02,
      },
      paint: {
        'text-color': p.shieldText,
        'text-halo-color': p.shieldHalo,
        'text-halo-width': 1.6,
        'text-halo-blur': 0.2,
      },
    },
    {
      id: 'airport_label',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'aerodrome_label',
      minzoom: 10,
      filter: ['has', 'iata'],
      layout: {
        'text-field': ['coalesce', ['get', 'iata'], ['get', 'name']],
        'text-font': tokens.fonts.bold,
        'text-size': 11,
        'text-optional': true,
      },
      paint: {
        'text-color': p.labelSecondary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'place_suburb',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 11,
      maxzoom: 16,
      filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 14, 13],
        'text-transform': 'none',
        'text-max-width': 8,
        'text-padding': 4,
      },
      paint: {
        'text-color': p.labelSecondary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.3,
        'text-halo-blur': 0.5,
      },
    },
    {
      id: 'place_village',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 9,
      maxzoom: 14,
      filter: ['==', ['get', 'class'], 'village'],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 9, 10, 12, 12],
        'text-max-width': 8,
      },
      paint: {
        'text-color': p.labelSecondary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.3,
      },
    },
    {
      id: 'place_town',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 7,
      maxzoom: 14,
      filter: ['==', ['get', 'class'], 'town'],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 11, 12, 14],
        'text-max-width': 8,
      },
      paint: {
        'text-color': p.labelPrimary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.4,
      },
    },
    {
      id: 'place_city',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 4,
      maxzoom: 13,
      filter: [
        'all',
        ['==', ['get', 'class'], 'city'],
        ['!=', ['coalesce', ['get', 'capital'], 0], 2],
      ],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 4, 11, 8, 14, 12, 16],
        'text-max-width': 8,
      },
      paint: {
        'text-color': p.labelPrimary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.5,
      },
    },
    {
      id: 'place_city_capital',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 3,
      maxzoom: 13,
      filter: [
        'all',
        ['==', ['get', 'class'], 'city'],
        ['==', ['coalesce', ['get', 'capital'], 0], 2],
      ],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.bold,
        'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 3, 12, 8, 15, 12, 17],
        'text-max-width': 8,
      },
      paint: {
        'text-color': p.labelPrimary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.6,
      },
    },
    {
      id: 'place_state',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      minzoom: 4,
      maxzoom: 8,
      filter: ['==', ['get', 'class'], 'state'],
      layout: {
        'text-field': [
          'coalesce',
          ['get', 'name:short'],
          ['get', 'name'],
          ['get', 'name:latin'],
        ],
        'text-font': tokens.fonts.bold,
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 7, 12],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.08,
        'text-max-width': 8,
      },
      paint: {
        'text-color': p.labelMuted,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'place_country_other',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      maxzoom: 8,
      filter: [
        'all',
        ['==', ['get', 'class'], 'country'],
        ['>=', ['coalesce', ['get', 'rank'], 99], 3],
        ['!', ['has', 'iso_a2']],
      ],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 13],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.06,
        'text-max-width': 6,
      },
      paint: {
        'text-color': p.labelMuted,
        'text-halo-color': p.halo,
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'place_country_minor',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      maxzoom: 8,
      filter: [
        'all',
        ['==', ['get', 'class'], 'country'],
        ['>=', ['coalesce', ['get', 'rank'], 99], 3],
        ['has', 'iso_a2'],
      ],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.regular,
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 10, 7, 14],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.06,
        'text-max-width': 6,
      },
      paint: {
        'text-color': p.labelSecondary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.3,
      },
    },
    {
      id: 'place_country_major',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      maxzoom: 6,
      filter: [
        'all',
        ['==', ['get', 'class'], 'country'],
        ['<=', ['coalesce', ['get', 'rank'], 99], 2],
      ],
      layout: {
        'text-field': nameField,
        'text-font': tokens.fonts.bold,
        'text-size': ['interpolate', ['linear'], ['zoom'], 1, 11, 4, 14, 5, 16],
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.08,
        'text-max-width': 6,
      },
      paint: {
        'text-color': p.labelPrimary,
        'text-halo-color': p.halo,
        'text-halo-width': 1.5,
      },
    },
  ]
}

function buildStyle(mode) {
  const p = tokens[mode]
  return {
    version: 8,
    name: mode === 'light' ? 'Politiloggen Light' : 'Politiloggen Dark',
    metadata: {
      'maputnik:renderer': 'mlgljs',
      'politiloggen:mode': mode,
      'politiloggen:accent-reserved': tokens.accent[mode],
      'politiloggen:notes':
        'Basemap only. Commercial POIs omitted. Accent blue reserved for incident overlays.',
    },
    sources: {
      openmaptiles: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
        attribution:
          '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
      },
    },
    sprite: 'https://tiles.openfreemap.org/sprites/ofm_f384/ofm',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    layers: buildLayers(p),
  }
}

mkdirSync(stylesDir, { recursive: true })
for (const mode of ['light', 'dark']) {
  const style = buildStyle(mode)
  const out = join(stylesDir, `${mode}.json`)
  writeFileSync(out, JSON.stringify(style, null, 2) + '\n')
  console.log(`Wrote ${out} (${style.layers.length} layers)`)
}

writeFileSync(
  join(root, 'src', 'tokens.json'),
  JSON.stringify(
    {
      description:
        'Shared Politiloggen basemap tokens. Accent is reserved for overlays and is not painted on the basemap.',
      ...tokens,
    },
    null,
    2,
  ) + '\n',
)
console.log('Wrote src/tokens.json')
