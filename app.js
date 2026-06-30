const canvas = document.getElementById("space");
const ctx = canvas.getContext("2d", { alpha: false });

const AU_IN_PC = 1 / 206265;
const LY_PER_PC = 3.26156;
const DEG = Math.PI / 180;
const MIN_SPEED = 0.001;
const MAX_SPEED = 500;
const GALACTIC_CENTER_DISTANCE_PC = 8178;
const LOCAL_FADE_START_PC = 120;
const LOCAL_FADE_END_PC = 1250;
const GALAXY_FADE_START_PC = 90;
const GALAXY_FADE_END_PC = 950;
const EQ_TO_GAL = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
];

const state = {
  camera: { x: 0, y: -7.5, z: 2.2 },
  yaw: 0,
  pitch: -0.16,
  roll: 0,
  fov: 72 * DEG,
  speed: 1,
  selected: null,
  layers: {
    solar: true,
    stars: true,
    exoplanets: true,
    galaxy: true,
  },
  animatePlanets: false,
  keys: new Set(),
  dragging: false,
  pointerMoved: false,
  lastMouse: { x: 0, y: 0 },
  hover: { x: 0, y: 0, obj: null },
  measure: { a: null, b: null, clickMode: false, nextSlot: "a" },
  labels: { mode: "more" },
  catalog: {
    tileSizePc: 20,
    activeRadiusTiles: 1,
    activeStarBudget: 20000,
    loadedTiles: new Map(),
    baseTileUrls: new Set(),
    loadingTiles: new Set(),
    activeTileIds: new Set(),
    tileIndex: new Map(),
    lastTileKey: "",
    status: "cataleg base",
    farGuideDistancePc: 160,
  },
};

const galaxyDust = buildMilkyWayDust();

const nearbyStars = [
  star("Sol", 0, 0, 0, "G2V", -26.74, "#fff4c2", "Estel del Sistema Solar"),
  star("Proxima Centauri", 217.4292, -62.6795, 1.301, "M5.5Ve", 11.13, "#ff9d71", "Estel mes proper al Sol; te planetes confirmats"),
  star("Alpha Centauri A", 219.9021, -60.8339, 1.338, "G2V", -0.01, "#fff1bd", "Component principal del sistema Alpha Centauri"),
  star("Alpha Centauri B", 219.8961, -60.8375, 1.338, "K1V", 1.33, "#ffd69b", "Company d'Alpha Centauri A"),
  star("Barnard's Star", 269.4521, 4.6934, 1.828, "M4V", 9.54, "#ff8f6b", "Nan vermell proper amb moviment propi molt alt"),
  star("Luhman 16", 162.3125, -53.3183, 1.998, "L/T dwarfs", 10.7, "#d69b72", "Sistema de nanes marrons proper"),
  star("Wolf 359", 164.1200, 7.0147, 2.386, "M6V", 13.54, "#ff7f66", "Nan vermell proper"),
  star("Lalande 21185", 165.8300, 35.9699, 2.547, "M2V", 7.47, "#ffa070", "Un dels estels mes propers visibles amb telescopi petit"),
  star("Sirius", 101.2872, -16.7161, 2.637, "A1V", -1.46, "#d7e9ff", "Estel mes brillant del cel nocturn"),
  star("Luyten 726-8", 25.3000, -17.9500, 2.70, "M dwarfs", 12.5, "#ff896b", "Sistema binari de nanes vermelles"),
  star("Ross 154", 280.6838, -23.8362, 2.97, "M3.5V", 10.44, "#ff9270", "Nan vermell proper"),
  star("Epsilon Eridani", 53.2327, -9.4583, 3.22, "K2V", 3.73, "#ffd19a", "Estel proper amb disc de deixalles i planeta candidat/confirmat segons catalegs"),
  star("Lacaille 9352", 346.4668, -35.8531, 3.29, "M0.5V", 7.34, "#ffa46e", "Nan vermell proper"),
  star("Ross 128", 176.9376, 0.7993, 3.37, "M4V", 11.13, "#ff8a6a", "Sistema proper amb planeta temperat confirmat"),
  star("EZ Aquarii", 338.9400, -15.3000, 3.50, "M dwarfs", 13.3, "#ff8266", "Sistema triple de nanes vermelles"),
  star("Procyon", 114.8255, 5.2250, 3.51, "F5IV-V", 0.34, "#fff6df", "Estel brillant proper"),
  star("61 Cygni A", 316.7249, 38.7494, 3.50, "K5V", 5.21, "#ffc27e", "Famos per la primera paral.laxi estel.lar fiable"),
  star("Groombridge 34", 2.6082, 43.1322, 3.57, "M dwarfs", 8.1, "#ff9a70", "Sistema proper"),
  star("Tau Ceti", 26.0170, -15.9375, 3.65, "G8V", 3.50, "#ffe0a3", "Estel semblant al Sol amb candidats planetaris"),
  star("Teegarden's Star", 43.2530, 16.8810, 3.83, "M7V", 15.1, "#ff755f", "Nan vermell proper amb planetes confirmats"),
  star("Kapteyn's Star", 77.9191, -45.0184, 3.91, "M1V", 8.85, "#ff9870", "Estel d'halo proper"),
  star("40 Eridani A", 63.8180, -7.6529, 4.98, "K1V", 4.43, "#ffd095", "Sistema proper; referencia cultural habitual"),
  star("TRAPPIST-1", 346.6224, -5.0414, 12.43, "M8V", 18.8, "#ff715c", "Sistema amb set planetes rocosos coneguts"),
  star("Kepler-186", 298.4700, 43.9550, 178, "M1V", 14.6, "#ff8d6b", "Sistema amb planeta de mida terrestre en zona habitable"),
  star("Kepler-452", 296.0037, 44.2776, 550, "G2V", 13.7, "#fff0bf", "Sistema llunya amb planeta famos de tipus super-Terra"),
  star("Vega", 279.2347, 38.7837, 7.68, "A0V", 0.03, "#dbeaff", "Estel brillant de la constel.lacio de la Lira"),
  star("Arcturus", 213.9153, 19.1824, 11.26, "K1.5III", -0.05, "#ffc07d", "Gegant taronja brillant"),
  star("Fomalhaut", 344.4128, -29.6222, 7.70, "A3V", 1.16, "#e8f2ff", "Estel brillant amb disc de deixalles"),
  star("Betelgeuse", 88.7929, 7.4071, 168, "M1-2Ia", 0.50, "#ff6f55", "Supergegant vermella d'Orio"),
  star("Rigel", 78.6345, -8.2016, 264, "B8Ia", 0.13, "#cfe5ff", "Supergegant blava d'Orio"),
  star("Polaris", 37.9546, 89.2641, 132, "F7Ib", 1.98, "#fff0cf", "Estel polar actual"),
];

const exoplanetSystems = new Map([
  ["Proxima Centauri", "Proxima b, Proxima d"],
  ["Epsilon Eridani", "Epsilon Eridani b"],
  ["Ross 128", "Ross 128 b"],
  ["Tau Ceti", "candidats planetaris"],
  ["Teegarden's Star", "Teegarden b, c"],
  ["TRAPPIST-1", "TRAPPIST-1 b, c, d, e, f, g, h"],
  ["Kepler-186", "Kepler-186 b-f"],
  ["Kepler-452", "Kepler-452 b"],
]);

const planets = [
  planet("Mercuri", 0.39, "#b9a48e"),
  planet("Venus", 0.72, "#e2c27c"),
  planet("Terra", 1.0, "#78b7ff"),
  planet("Mart", 1.52, "#d88768"),
  planet("Jupiter", 5.2, "#e2c29c"),
  planet("Saturn", 9.58, "#d8c17c"),
  planet("Ura", 19.2, "#91e0dc"),
  planet("Neptu", 30.05, "#789dff"),
];

const quickTargets = ["Sol", "Proxima Centauri", "Sirius", "TRAPPIST-1", "Tau Ceti", "Vega", "Centre galactic", "Vista Via Lactia"];

const galaxyMarkers = [
  { name: "Centre galactic", ...galacticToXYZ(0, 0, 8178), color: "#ffcf70", note: "Direccio aproximada a Sagittarius A*" },
  { name: "Pol nord galactic", ...galacticToXYZ(0, 90, 1000), color: "#75d6ff", note: "Referencia del pla galactic" },
  { name: "Pol sud galactic", ...galacticToXYZ(0, -90, 1000), color: "#75d6ff", note: "Referencia del pla galactic" },
];

const objects = [
  ...nearbyStars,
  ...galaxyMarkers.map((m) => ({ ...m, type: "galaxy", radius: 4, mag: 0 })),
];

state.selected = objects[0];

function starFromRecord(record, tileId) {
  const p = raDecToXYZ(record.ra, record.dec, record.distancePc);
  return {
    type: "star",
    tileId,
    name: record.name,
    ra: record.ra,
    dec: record.dec,
    distancePc: record.distancePc,
    spectral: record.spectral || "?",
    mag: record.mag ?? 8,
    color: record.color || colorFromBpRp(record.bpRp),
    note: record.note || "",
    exoplanets: record.exoplanets || "",
    ...p,
  };
}

function colorFromMagnitude() {
  return "#e8f2ff";
}

function colorFromBpRp(bpRp) {
  if (bpRp === undefined || bpRp === null) return "#eef5ff";
  if (bpRp < -0.1) return "#bfdcff";
  if (bpRp < 0.35) return "#dcecff";
  if (bpRp < 0.8) return "#fff2c8";
  if (bpRp < 1.3) return "#ffd08f";
  if (bpRp < 2.0) return "#ff9a68";
  return "#ff705c";
}

function currentTileKey() {
  const size = state.catalog.tileSizePc;
  return [
    Math.floor(state.camera.x / size),
    Math.floor(state.camera.y / size),
    Math.floor(state.camera.z / size),
  ].join("_");
}

async function loadCatalogManifest() {
  try {
    if (location.protocol === "file:") {
      state.catalog.status = "Obre l'app via http://127.0.0.1:8777/ per carregar les rajoles Gaia.";
      document.getElementById("fileWarning").style.display = "block";
      updateHud();
      return;
    }
    document.getElementById("fileWarning").style.display = "none";
    const response = await fetch("data/catalog-manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`manifest ${response.status}`);
    const manifest = await response.json();
    state.catalog.tileSizePc = manifest.tileSizePc || state.catalog.tileSizePc;
    state.catalog.activeRadiusTiles = manifest.activeRadiusTiles || state.catalog.activeRadiusTiles;
    state.catalog.activeStarBudget = manifest.activeStarBudget || state.catalog.activeStarBudget;
    state.catalog.farGuideDistancePc = manifest.farGuideDistancePc || state.catalog.farGuideDistancePc;
    state.catalog.tileIndex = new Map(Object.entries(manifest.tileIndex || {}));
    for (const url of manifest.baseTiles || []) {
      state.catalog.baseTileUrls.add(url);
      await loadStarTile(url);
    }
    updateTileWindow(true);
    state.catalog.status = "rajoles carregades";
  } catch (error) {
    state.catalog.status = `error cataleg: ${error.message}`;
    console.error(error);
  }
}

async function loadStarTile(url) {
  if (state.catalog.loadedTiles.has(url) || state.catalog.loadingTiles.has(url)) return;
  state.catalog.loadingTiles.add(url);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`tile ${response.status}`);
    const tile = await response.json();
    const existingNames = new Set(objects.map((obj) => obj.name));
    const stars = [];
    for (const record of tile.stars || []) {
      if (existingNames.has(record.name)) continue;
      const obj = starFromRecord(record, tile.id || url);
      obj.tileUrl = url;
      stars.push(obj);
      objects.push(obj);
      existingNames.add(obj.name);
      if (obj.exoplanets) exoplanetSystems.set(obj.name, obj.exoplanets);
      if (objects.filter((entry) => entry.type === "star").length >= state.catalog.activeStarBudget) break;
    }
    state.catalog.loadedTiles.set(url, { ...tile, stars });
  } catch (error) {
    state.catalog.status = "no s'ha pogut carregar una rajola";
  } finally {
    state.catalog.loadingTiles.delete(url);
  }
}

function updateTileWindow(force = false) {
  const key = currentTileKey();
  if (!force && key === state.catalog.lastTileKey) return;
  state.catalog.lastTileKey = key;
  const [cx, cy, cz] = key.split("_").map(Number);
  const solarDistance = distance(state.camera, { x: 0, y: 0, z: 0 });
  const radius = solarDistance > state.catalog.farGuideDistancePc ? 0 : state.catalog.activeRadiusTiles;
  const desired = new Set();
  for (let x = cx - radius; x <= cx + radius; x++) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let z = cz - radius; z <= cz + radius; z++) {
        const tileKey = `${x}_${y}_${z}`;
        const url = state.catalog.tileIndex.get(tileKey);
        if (!url) continue;
        desired.add(tileKey);
        loadStarTile(url);
      }
    }
  }
  state.catalog.activeTileIds = desired.size ? desired : state.catalog.activeTileIds;
  unloadDistantTiles(desired);
  state.catalog.status = `cub ${key}`;
}

function unloadDistantTiles(desiredKeys) {
  const desiredUrls = new Set([...desiredKeys].map((key) => state.catalog.tileIndex.get(key)).filter(Boolean));
  for (const [url, tile] of state.catalog.loadedTiles) {
    if (state.catalog.baseTileUrls.has(url) || desiredUrls.has(url)) continue;
    state.catalog.loadedTiles.delete(url);
    for (const star of tile.stars || []) {
      const index = objects.indexOf(star);
      if (index >= 0) objects.splice(index, 1);
      if (star.exoplanets) exoplanetSystems.delete(star.name);
    }
  }
}

function star(name, ra, dec, distancePc, spectral, mag, color, note) {
  const p = raDecToXYZ(ra, dec, distancePc);
  return { type: "star", name, ra, dec, distancePc, spectral, mag, color, note, ...p };
}

function planet(name, au, color) {
  return { type: "planet", name, au, color, phase: au * 1.73 };
}

function raDecToXYZ(raDeg, decDeg, d) {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  return {
    x: d * Math.cos(dec) * Math.cos(ra),
    y: d * Math.cos(dec) * Math.sin(ra),
    z: d * Math.sin(dec),
  };
}

function galacticToXYZ(lDeg, bDeg, d) {
  const l = lDeg * DEG;
  const b = bDeg * DEG;
  const gx = Math.cos(b) * Math.cos(l) * d;
  const gy = Math.cos(b) * Math.sin(l) * d;
  const gz = Math.sin(b) * d;
  return galacticVectorToXYZ(gx, gy, gz);
}

function galacticVectorToXYZ(gx, gy, gz) {
  return {
    x: EQ_TO_GAL[0][0] * gx + EQ_TO_GAL[1][0] * gy + EQ_TO_GAL[2][0] * gz,
    y: EQ_TO_GAL[0][1] * gx + EQ_TO_GAL[1][1] * gy + EQ_TO_GAL[2][1] * gz,
    z: EQ_TO_GAL[0][2] * gx + EQ_TO_GAL[1][2] * gy + EQ_TO_GAL[2][2] * gz,
  };
}

function buildMilkyWayDust() {
  const points = [];
  const armNames = ["Perseu", "Sagittarius-Carina", "Scutum-Centaurus", "Norma-Exterior"];
  const armColors = ["#dcecff", "#fff0bd", "#ffd39b", "#cfe7ff"];
  for (let arm = 0; arm < armNames.length; arm++) {
    const offset = (arm / armNames.length) * Math.PI * 2;
    for (let i = 0; i < 1350; i++) {
      const t = i / 1349;
      const radius = 2100 + t * 13500;
      const theta = offset + t * 4.7 + Math.sin(t * 8 + arm) * 0.08;
      const scatter = 130 + radius * 0.018;
      const xgc = Math.cos(theta) * radius + pseudoNoise(i, arm, 11) * scatter;
      const ygc = Math.sin(theta) * radius + pseudoNoise(i, arm, 23) * scatter;
      const gz = pseudoNoise(i, arm, 37) * (60 + radius * 0.009);
      const p = galacticVectorToXYZ(xgc + GALACTIC_CENTER_DISTANCE_PC, ygc, gz);
      points.push({
        ...p,
        arm: armNames[arm],
        color: armColors[(i + arm) % armColors.length],
        alpha: 0.12 + (1 - t) * 0.18 + ((i * 13) % 17) / 180,
      });
    }
  }
  for (let i = 0; i < 10500; i++) {
    const radius = Math.sqrt((i * 7919) % 10000 / 10000) * 15800;
    const theta = ((i * 104729) % 62831) / 10000;
    const xgc = Math.cos(theta) * radius + pseudoNoise(i, 5, 3) * 430;
    const ygc = Math.sin(theta) * radius + pseudoNoise(i, 7, 5) * 430;
    const gz = pseudoNoise(i, 9, 7) * (160 + radius * 0.017);
    const p = galacticVectorToXYZ(xgc + GALACTIC_CENTER_DISTANCE_PC, ygc, gz);
    points.push({
      ...p,
      arm: "disc entre bracos",
      color: i % 11 === 0 ? "#ffd79f" : i % 7 === 0 ? "#cfe7ff" : "#dfe9f4",
      alpha: 0.026 + ((i * 19) % 23) / 920,
      disk: true,
    });
  }
  for (let i = 0; i < 2600; i++) {
    const radius = 180 + Math.sqrt(((i * 3257) % 10000) / 10000) * 4200;
    const theta = ((i * 8171) % 62831) / 10000;
    const gx = Math.cos(theta) * radius + pseudoNoise(i, 13, 17) * 90;
    const gy = Math.sin(theta) * radius + pseudoNoise(i, 17, 19) * 90;
    const gz = pseudoNoise(i, 19, 23) * (35 + radius * 0.012);
    const p = galacticVectorToXYZ(gx, gy, gz);
    points.push({
      ...p,
      arm: "pont local",
      color: i % 6 === 0 ? "#ffd39b" : i % 5 === 0 ? "#cfe7ff" : "#f1e6c7",
      alpha: 0.1 + ((i * 29) % 31) / 210,
      bridge: true,
    });
  }
  for (let i = 0; i < 5200; i++) {
    const core = Math.sqrt(((i * 5851) % 10000) / 10000);
    const angle = ((i * 47431) % 62831) / 10000;
    const radius = core * 3300;
    const bar = pseudoNoise(i, 29, 31) * 0.3;
    const xgc = Math.cos(angle) * radius * (1.55 + bar) + pseudoNoise(i, 23, 29) * 190;
    const ygc = Math.sin(angle) * radius * (0.82 - bar * 0.18) + pseudoNoise(i, 31, 37) * 190;
    const gz = pseudoNoise(i, 37, 41) * (160 + (1 - core) * 330);
    const p = galacticVectorToXYZ(xgc + GALACTIC_CENTER_DISTANCE_PC, ygc, gz);
    points.push({
      ...p,
      arm: "bulb central",
      color: i % 7 === 0 ? "#fff0c8" : i % 4 === 0 ? "#ffd39b" : "#f2d8aa",
      alpha: 0.095 + (1 - core) * 0.24 + ((i * 17) % 19) / 260,
      core: true,
    });
  }
  return points;
}

function pseudoNoise(i, a, salt) {
  const value = Math.sin((i + 1) * 12.9898 + (a + 1) * 78.233 + salt * 37.719) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function forwardVector() {
  return {
    x: Math.cos(state.pitch) * Math.sin(state.yaw),
    y: Math.cos(state.pitch) * Math.cos(state.yaw),
    z: Math.sin(state.pitch),
  };
}

function cameraBasis() {
  const forward = forwardVector();
  const baseRight = { x: Math.cos(state.yaw), y: -Math.sin(state.yaw), z: 0 };
  const baseUp = cross(baseRight, forward);
  const cosR = Math.cos(state.roll);
  const sinR = Math.sin(state.roll);
  return {
    forward,
    right: normalize({
      x: baseRight.x * cosR + baseUp.x * sinR,
      y: baseRight.y * cosR + baseUp.y * sinR,
      z: baseRight.z * cosR + baseUp.z * sinR,
    }),
    up: normalize({
      x: baseUp.x * cosR - baseRight.x * sinR,
      y: baseUp.y * cosR - baseRight.y * sinR,
      z: baseUp.z * cosR - baseRight.z * sinR,
    }),
  };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(v) {
  const length = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / length, y: v.y / length, z: v.z / length };
}

function normalizeAngle(angle) {
  let result = angle % (Math.PI * 2);
  if (result <= -Math.PI) result += Math.PI * 2;
  if (result > Math.PI) result -= Math.PI * 2;
  return result;
}

function stabilizeNorthUp() {
  state.yaw = normalizeAngle(state.yaw);
  state.pitch = normalizeAngle(state.pitch);
  state.roll = 0;
  if (state.pitch > Math.PI / 2) {
    state.pitch = Math.PI - state.pitch;
    state.yaw = normalizeAngle(state.yaw + Math.PI);
  } else if (state.pitch < -Math.PI / 2) {
    state.pitch = -Math.PI - state.pitch;
    state.yaw = normalizeAngle(state.yaw + Math.PI);
  }
}

function update(dt) {
  const basis = cameraBasis();
  const c = state.camera;
  const step = state.speed * dt;
  if (state.keys.has("w") || state.keys.has("arrowup")) move(c, basis.forward, step);
  if (state.keys.has("s") || state.keys.has("arrowdown")) move(c, basis.forward, -step);
  if (state.keys.has("d")) move(c, basis.right, step);
  if (state.keys.has("a")) move(c, basis.right, -step);
  if (state.keys.has("e")) move(c, basis.up, step);
  if (state.keys.has("q")) move(c, basis.up, -step);
  if (state.keys.has("c")) state.roll = normalizeAngle(state.roll + dt * 1.4);
  if (state.keys.has("z")) state.roll = normalizeAngle(state.roll - dt * 1.4);
  updateTileWindow();
}

function move(target, vector, amount) {
  target.x += vector.x * amount;
  target.y += vector.y * amount;
  target.z += vector.z * amount;
}

function selectedTravelVector() {
  if (!state.selected) return null;
  const dx = state.selected.x - state.camera.x;
  const dy = state.selected.y - state.camera.y;
  const dz = state.selected.z - state.camera.z;
  const length = Math.hypot(dx, dy, dz);
  if (length < 0.0001) return null;
  return { x: dx / length, y: dy / length, z: dz / length };
}

function lookAt(target) {
  const dx = target.x - state.camera.x;
  const dy = target.y - state.camera.y;
  const dz = target.z - state.camera.z;
  const length = Math.hypot(dx, dy, dz);
  if (length < 0.0001) return;
  state.pitch = Math.asin(dz / length);
  state.yaw = Math.atan2(dx, dy);
}

function project(obj) {
  const rel = {
    x: obj.x - state.camera.x,
    y: obj.y - state.camera.y,
    z: obj.z - state.camera.z,
  };
  const basis = cameraBasis();
  const x1 = dot(rel, basis.right);
  const y2 = dot(rel, basis.up);
  const z2 = dot(rel, basis.forward);
  if (z2 <= 0.01) return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = h / (2 * Math.tan(state.fov / 2));
  return {
    x: w / 2 + (x1 / z2) * scale,
    y: h / 2 - (y2 / z2) * scale,
    depth: z2,
  };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function draw() {
  ctx.fillStyle = "#03050a";
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  const scale = scaleBlend();
  drawStarfield();
  if (state.layers.galaxy) drawGalaxyReferences(scale.galaxy);
  if (state.layers.galaxy) drawMilkyWayDust(scale.galaxy);
  if (state.layers.galaxy) drawGalacticCoreGlow(scale.galaxy);
  if (state.layers.stars || state.layers.exoplanets) drawObjects(scale.local, scale.galaxy);
  if (state.layers.solar) drawSolarSystem();
  drawMeasurementLine();
  drawSelectionLine();
  updateHover();
}

function scaleBlend() {
  const solarDistance = distance(state.camera, { x: 0, y: 0, z: 0 });
  return {
    distance: solarDistance,
    local: 1 - smoothstep(LOCAL_FADE_START_PC, LOCAL_FADE_END_PC, solarDistance),
    galaxy: smoothstep(GALAXY_FADE_START_PC, GALAXY_FADE_END_PC, solarDistance),
  };
}

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function drawStarfield() {
  ctx.save();
  for (let i = 0; i < 180; i++) {
    const x = (i * 997) % window.innerWidth;
    const y = (i * 577) % window.innerHeight;
    const a = 0.08 + ((i * 37) % 100) / 900;
    ctx.fillStyle = `rgba(230, 242, 255, ${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function drawGalaxyReferences(galaxyAlpha = 0) {
  ctx.save();
  ctx.strokeStyle = `rgba(117, 214, 255, ${0.24 - galaxyAlpha * 0.13})`;
  ctx.lineWidth = 1;
  for (let r = 50; r <= 300; r += 50) {
    drawGalacticCircle(r);
  }
  for (let r = 1000; r <= 16000; r += 3000) {
    drawGalacticCircle(r);
  }
  drawWorldLine(galacticToXYZ(0, 0, -260), galacticToXYZ(0, 0, 260), `rgba(255, 210, 125, ${0.24 - galaxyAlpha * 0.11})`);
  drawWorldLine(galacticToXYZ(90, 0, 260), galacticToXYZ(270, 0, 260), `rgba(148, 230, 184, ${0.22 - galaxyAlpha * 0.1})`);
  drawWorldLine(galacticToXYZ(0, -90, 120), galacticToXYZ(0, 90, 120), `rgba(117, 214, 255, ${0.22 - galaxyAlpha * 0.1})`);
  ctx.restore();
}

function drawMilkyWayDust(fade) {
  if (fade <= 0) return;
  const solarDistance = distance(state.camera, { x: 0, y: 0, z: 0 });
  const stride = solarDistance < 550 ? 3 : solarDistance < 2200 ? 2 : 1;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < galaxyDust.length; i += stride) {
    const star = galaxyDust[i];
    const p = project(star);
    if (!p) continue;
    const bridgeBoost = star.bridge ? Math.max(0.4, 1 - Math.min(1, solarDistance / 4500)) : 1;
    const coreBoost = star.core ? 0.68 : 1;
    const diskBoost = star.disk ? 0.5 : 1;
    const size = star.core ? 1.18 : star.bridge ? 1.25 : star.disk ? 1 : p.depth > 9000 ? 1.15 : 1.45;
    ctx.globalAlpha = Math.min(0.98, (0.12 + star.alpha * 2.8) * fade * bridgeBoost * coreBoost * diskBoost);
    ctx.fillStyle = star.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), size, size);
  }
  ctx.restore();
}

function drawGalacticCoreGlow(fade) {
  if (fade <= 0.05) return;
  const center = objects.find((obj) => obj.name === "Centre galactic");
  if (!center) return;
  const p = project(center);
  if (!p) return;
  const distanceToCenter = distance(state.camera, center);
  const radius = Math.max(18, Math.min(78, 520000 / Math.max(1, distanceToCenter)));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.38 * fade;
  const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
  glow.addColorStop(0, "rgba(255, 232, 166, 0.9)");
  glow.addColorStop(0.34, "rgba(255, 195, 106, 0.34)");
  glow.addColorStop(1, "rgba(255, 160, 70, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGalacticCircle(radius) {
  let started = false;
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const l = (i / 160) * 360;
    const p = project(galacticToXYZ(l, 0, radius));
    if (!p) {
      started = false;
      continue;
    }
    if (!started) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
    started = true;
  }
  ctx.stroke();
}

function drawWorldCircle(center, radius) {
  let started = false;
  ctx.beginPath();
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    const p = project({ x: center.x + Math.cos(a) * radius, y: center.y + Math.sin(a) * radius, z: center.z });
    if (!p) {
      started = false;
      continue;
    }
    if (!started) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
    started = true;
  }
  ctx.stroke();
}

function drawWorldLine(a, b, color) {
  const pa = project(a);
  const pb = project(b);
  if (!pa || !pb) return;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.stroke();
}

function drawObjects(localAlpha, galaxyAlpha) {
  const drawable = [];
  for (const obj of objects) {
    if (obj.type === "star" && !state.layers.stars && !exoplanetSystems.has(obj.name)) continue;
    if (obj.type === "star" && exoplanetSystems.has(obj.name) && !state.layers.exoplanets && !state.layers.stars) continue;
    if (obj.type === "galaxy" && !state.layers.galaxy) continue;
    const alpha = objectScaleAlpha(obj, localAlpha, galaxyAlpha);
    if (alpha <= 0.025) continue;
    const p = project(obj);
    if (!p) continue;
    drawable.push({ obj, p, alpha });
  }
  drawable.sort((a, b) => b.p.depth - a.p.depth);
  for (const item of drawable) drawObject(item.obj, item.p, item.alpha);
}

function objectScaleAlpha(obj, localAlpha, galaxyAlpha) {
  if (obj.type === "galaxy" && obj.name !== "Centre galactic") return Math.max(0.12, 0.42 - galaxyAlpha * 0.26);
  if (obj.type === "galaxy") return Math.max(0.5, galaxyAlpha);
  if (obj.name === "Sol") return Math.max(localAlpha, galaxyAlpha * 0.9);
  return localAlpha;
}

function drawObject(obj, p, alpha = 1) {
  const isExo = exoplanetSystems.has(obj.name);
  if (obj.type === "star" && isExo && !state.layers.exoplanets && !state.layers.stars) return;
  if (obj.type === "star" && !isExo && !state.layers.stars) return;
  const cameraDistance = distance(state.camera, obj);
  const isGaiaBulk = obj.spectral === "Gaia";
  const drawColor = obj.color || colorFromMagnitude(obj.mag);
  const apparent = isGaiaBulk
    ? Math.max(0.32, Math.min(0.95, 0.82 - (obj.mag || 10) * 0.025))
    : Math.max(0.45, Math.min(1.35, 1.18 - (obj.mag || 7) * 0.055));
  const nearby = obj.distancePc !== undefined && obj.distancePc < 4 ? (isGaiaBulk ? 0.08 : 0.22) : 0;
  const approach = obj.type === "star" ? Math.max(0, 1 - cameraDistance / 0.28) * 7 : 0;
  const isMeasured = obj === state.measure.a || obj === state.measure.b;
  const selectedBoost = obj === state.selected ? 1.8 : isMeasured ? 1.2 : 0;
  const exoBoost = isExo ? 0.28 : 0;
  const size = obj.type === "galaxy"
    ? obj.name === "Centre galactic" ? 7 : 3.6
    : Math.max(0.55, Math.min(10, apparent + nearby + approach + selectedBoost + exoBoost));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  if (isGaiaBulk && size < 0.9 && obj !== state.selected && !isExo) {
    ctx.globalAlpha = alpha * Math.max(0.46, Math.min(0.9, 0.98 - (obj.mag || 10) * 0.032));
    ctx.fillStyle = drawColor;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    ctx.restore();
    return;
  }
  if (size > 1.45 || obj === state.selected || isExo || obj.type === "galaxy") {
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5);
    glow.addColorStop(0, drawColor);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = drawColor;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
  ctx.fill();
  if (isExo) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "rgba(148, 230, 184, 0.85)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isMeasured) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = obj === state.measure.a ? "rgba(255, 210, 125, 0.95)" : "rgba(117, 214, 255, 0.95)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size + 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha;
  if (shouldDrawLabel(obj, p, alpha, isExo, isMeasured)) {
    ctx.fillStyle = obj === state.selected ? "#ffd27d" : "rgba(238, 245, 255, 0.82)";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText(obj.name, p.x + 9, p.y - 7);
  }
  ctx.restore();
}

function shouldDrawLabel(obj, p, alpha, isExo, isMeasured) {
  if (alpha <= 0.18) return false;
  if (obj.name === "Sol" || obj.name === "Centre galactic") return true;
  if (obj === state.selected || isMeasured) return true;
  if (obj.type === "galaxy") return true;
  if (obj.spectral === "Gaia" && !isExo) return false;
  if (state.labels.mode === "essential") {
    return isExo || (obj.mag !== undefined && obj.mag < 1.5 && p.depth < 80);
  }
  if (state.labels.mode === "more") {
    return isExo ||
      (obj.mag !== undefined && obj.mag < 4.8 && p.depth < 180) ||
      (obj.distancePc !== undefined && obj.distancePc < 8 && p.depth < 160);
  }
  return isExo ||
    obj.spectral !== "Gaia" ||
    (obj.mag !== undefined && obj.mag < 5.5 && p.depth < 120);
}

function drawSolarSystem() {
  const solarScreen = project({ x: 0, y: 0, z: 0 });
  if (!solarScreen) return;
  const cameraDistance = distance(state.camera, { x: 0, y: 0, z: 0 });
  if (cameraDistance > 0.18) return;
  const neptuneOrbitPc = 30.05 * AU_IN_PC;
  const fitRadiusPc = cameraDistance * Math.tan(state.fov / 2) * 0.55;
  const boost = Math.max(1, Math.min(1600, fitRadiusPc / neptuneOrbitPc));
  ctx.save();
  for (const p of planets) {
    const visualPc = p.au * AU_IN_PC * boost;
    drawWorldCircle({ x: 0, y: 0, z: 0 }, visualPc);
    const animation = state.animatePlanets ? performance.now() / 420000 : 0;
    const angle = (p.phase + animation / Math.sqrt(p.au)) % (Math.PI * 2);
    const pos = project({ x: Math.cos(angle) * visualPc, y: Math.sin(angle) * visualPc, z: 0 });
    if (!pos) continue;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(2.2, 5 / Math.sqrt(p.au)), 0, Math.PI * 2);
    ctx.fill();
    if (cameraDistance < 0.035 || p.au <= 1.6) {
      ctx.fillStyle = "rgba(238, 245, 255, 0.75)";
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillText(p.name, pos.x + 7, pos.y - 5);
    }
  }
  ctx.restore();
}

function drawSelectionLine() {
  if (!state.selected) return;
  const p = project(state.selected);
  if (!p) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 210, 125, 0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.restore();
}

function drawMeasurementLine() {
  const a = state.measure.a;
  const b = state.measure.b;
  if (!a || !b) return;
  const pa = project(a);
  const pb = project(b);
  if (!pa || !pb) return;
  const d = distance(a, b);
  ctx.save();
  ctx.strokeStyle = "rgba(255, 210, 125, 0.68)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 210, 125, 0.92)";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.fillText("A", pa.x + 8, pa.y + 12);
  ctx.fillStyle = "rgba(117, 214, 255, 0.92)";
  ctx.fillText("B", pb.x + 8, pb.y + 12);
  const midX = (pa.x + pb.x) / 2;
  const midY = (pa.y + pb.y) / 2;
  ctx.fillStyle = "rgba(238, 245, 255, 0.86)";
  ctx.fillText(`${formatDistance(d)} pc / ${formatDistance(d * LY_PER_PC)} anys llum`, midX + 8, midY - 8);
  ctx.restore();
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function formatDistance(value) {
  if (value >= 1000) return value.toFixed(0);
  if (value >= 100) return value.toFixed(1);
  if (value >= 10) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  return value.toExponential(2);
}

function jumpTo(name) {
  const lower = name.trim().toLowerCase();
  if (!lower) return;
  if (lower.includes("vista via lactia") || lower.includes("milky way")) {
    jumpToMilkyWayView();
    return;
  }
  const found = findObjectByName(lower);
  if (!found) {
    setSelectionHtml(`<strong>No trobat</strong><span>Prova amb Proxima, Sirius, TRAPPIST-1, Tau Ceti o Centre galactic.</span>`);
    return;
  }
  state.selected = found;
  const d = approachDistance(found);
  state.camera.x = found.x;
  state.camera.y = found.y - d;
  state.camera.z = found.z + d * 0.28;
  state.yaw = 0;
  state.pitch = -0.12;
  state.roll = 0;
  state.speed = found.name === "Sol" ? 0.004 : Math.max(0.004, Math.min(1, d * 0.7));
  updateSelection();
}

function findObjectByName(query) {
  const lower = query.trim().toLowerCase();
  if (!lower) return null;
  return objects.find((o) => o.name.toLowerCase() === lower) ||
    objects.find((o) => o.name.toLowerCase().includes(lower));
}

function jumpToMilkyWayView() {
  const center = objects.find((obj) => obj.name === "Centre galactic") || galacticToXYZ(0, 0, GALACTIC_CENTER_DISTANCE_PC);
  const camera = galacticVectorToXYZ(GALACTIC_CENTER_DISTANCE_PC, 0, 23500);
  state.camera.x = camera.x;
  state.camera.y = camera.y;
  state.camera.z = camera.z;
  state.selected = center;
  state.fov = 82 * DEG;
  state.speed = 420;
  lookAt(center);
  state.roll = 0;
  updateSelection();
}

function approachDistance(obj) {
  if (obj.name === "Sol") return 0.012;
  if (obj.type === "galaxy") return 80;
  const base = obj.distancePc || distance(obj, { x: 0, y: 0, z: 0 }) || 1;
  return Math.max(0.018, Math.min(2.5, base * 0.018));
}

function approachSelection() {
  if (!state.selected) return;
  const d = Math.max(0.006, approachDistance(state.selected) * 0.35);
  state.camera.x = state.selected.x;
  state.camera.y = state.selected.y - d;
  state.camera.z = state.selected.z + d * 0.2;
  state.yaw = 0;
  state.pitch = -0.08;
  state.roll = 0;
  state.speed = Math.max(0.001, Math.min(0.3, d * 0.8));
}

function resetView() {
  state.camera.x = 0;
  state.camera.y = -7.5;
  state.camera.z = 2.2;
  state.yaw = 0;
  state.pitch = -0.16;
  state.roll = 0;
  state.fov = 72 * DEG;
  state.speed = 1;
  state.selected = objects.find((obj) => obj.name === "Sol") || state.selected;
  updateSelection();
}

function markMeasurement(slot, obj = measurementCandidate()) {
  if (!obj || obj.type !== "star") return;
  state.selected = obj;
  state.measure[slot] = obj;
  state.measure.nextSlot = slot === "a" ? "b" : "a";
  updateSelection();
  updateMeasurement();
}

function measurementCandidate() {
  const typed = document.getElementById("searchInput")?.value || "";
  const fromSearch = findObjectByName(typed);
  if (fromSearch && fromSearch.type === "star") return fromSearch;
  if (state.selected && state.selected.type === "star") return state.selected;
  return null;
}

function clearMeasurement() {
  state.measure.a = null;
  state.measure.b = null;
  state.measure.nextSlot = "a";
  updateMeasurement();
}

function toggleMeasureClickMode() {
  state.measure.clickMode = !state.measure.clickMode;
  updateMeasurement();
}

function handleMeasureClick() {
  if (!state.measure.clickMode || !state.hover.obj || state.hover.obj.type !== "star") return;
  markMeasurement(state.measure.nextSlot, state.hover.obj);
}

function updateHud() {
  const c = state.camera;
  const scale = scaleBlend();
  document.getElementById("coordX").textContent = `${c.x.toFixed(3)} pc`;
  document.getElementById("coordY").textContent = `${c.y.toFixed(3)} pc`;
  document.getElementById("coordZ").textContent = `${c.z.toFixed(3)} pc`;
  document.getElementById("coordDist").textContent = `${distance(c, { x: 0, y: 0, z: 0 }).toFixed(3)} pc`;
  const gal = xyzToGalactic(c);
  document.getElementById("coordL").textContent = `${gal.l.toFixed(1)} deg`;
  document.getElementById("coordB").textContent = `${gal.b.toFixed(1)} deg`;
  document.getElementById("scaleMode").textContent = scaleModeLabel(scale);
  document.getElementById("speedReadout").textContent = `${formatSpeed(state.speed)} pc/s`;
  document.getElementById("speedInput").value = formatSpeed(state.speed);
  document.getElementById("speedSlider").value = Math.log10(state.speed).toFixed(3);
  document.getElementById("speedAlt").textContent = `${formatSpeed(state.speed * LY_PER_PC)} anys llum/s · ${formatSpeed(state.speed / AU_IN_PC)} UA/s`;
  document.getElementById("activeStars").textContent = `${objects.filter((obj) => obj.type === "star").length}`;
  document.getElementById("activeTiles").textContent = `${state.catalog.loadedTiles.size || 1}`;
  const far = distance(c, { x: 0, y: 0, z: 0 }) > 120 ? ` + guia Via Lactia ${galaxyDust.length}` : "";
  document.getElementById("catalogStatus").textContent = `${state.catalog.status}${far}`;
  updateMeasurement();
}

function scaleModeLabel(scale) {
  if (scale.local > 0.7) return "Gaia local";
  if (scale.galaxy > 0.8) return "Via Lactia";
  return "Transicio";
}

function setSpeed(value) {
  const next = Number(value);
  if (!Number.isFinite(next)) return;
  state.speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, next));
}

function speedFromSlider(value) {
  setSpeed(10 ** Number(value));
}

function formatSpeed(value) {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(3);
  return value.toExponential(2);
}

function xyzToGalactic(p) {
  const r = Math.hypot(p.x, p.y, p.z) || 1;
  const gx = EQ_TO_GAL[0][0] * p.x + EQ_TO_GAL[0][1] * p.y + EQ_TO_GAL[0][2] * p.z;
  const gy = EQ_TO_GAL[1][0] * p.x + EQ_TO_GAL[1][1] * p.y + EQ_TO_GAL[1][2] * p.z;
  const gz = EQ_TO_GAL[2][0] * p.x + EQ_TO_GAL[2][1] * p.y + EQ_TO_GAL[2][2] * p.z;
  let l = Math.atan2(gy, gx) / DEG;
  if (l < 0) l += 360;
  const b = Math.asin(gz / r) / DEG;
  return { l, b };
}

function updateSelection() {
  const o = state.selected;
  if (!o) return;
  const dist = distance(o, { x: 0, y: 0, z: 0 });
  const exo = exoplanetSystems.get(o.name);
  const lines = [
    `<strong>${o.name}</strong>`,
    `<span>Tipus: ${o.type === "galaxy" ? "referencia galactica" : o.spectral}</span>`,
    `<span>Distancia al Sol: ${dist.toFixed(3)} pc / ${(dist * LY_PER_PC).toFixed(2)} anys llum</span>`,
  ];
  if (o.ra !== undefined) lines.push(`<span>RA ${o.ra.toFixed(3)} deg, Dec ${o.dec.toFixed(3)} deg</span>`);
  if (exo) lines.push(`<span>Exoplanetes: ${exo}</span>`);
  if (o.note) lines.push(`<span>${o.note}</span>`);
  setSelectionHtml(lines.join(""));
}

function setSelectionHtml(html) {
  document.getElementById("selection").innerHTML = html;
}

function updateMeasurement() {
  const a = state.measure.a;
  const b = state.measure.b;
  const button = document.getElementById("measureClickButton");
  if (button) button.classList.toggle("active", state.measure.clickMode);
  const panel = document.getElementById("measurement");
  if (!panel) return;
  if (!a && !b) {
    panel.innerHTML = state.measure.clickMode
      ? `<span>Clica un estel per marcar A.</span>`
      : `<span>Tria dos estels per mesurar la distancia.</span>`;
    return;
  }
  const lines = [
    `<span>A: ${a ? a.name : "pendent"}</span>`,
    `<span>B: ${b ? b.name : "pendent"}</span>`,
  ];
  if (a && b) {
    const d = distance(a, b);
    lines.unshift(`<strong>${formatDistance(d)} pc</strong>`);
    lines.push(`<span>${formatDistance(d * LY_PER_PC)} anys llum</span>`);
    lines.push(`<span>${formatDistance(d / AU_IN_PC)} UA</span>`);
  } else if (state.measure.clickMode) {
    lines.push(`<span>Clica un estel per marcar ${state.measure.nextSlot.toUpperCase()}.</span>`);
  }
  panel.innerHTML = lines.join("");
}

function updateHover() {
  const card = document.getElementById("hoverCard");
  let nearest = null;
  let best = 12;
  for (const obj of objects) {
    if (!isHoverInteresting(obj)) continue;
    const p = project(obj);
    if (!p) continue;
    const d = Math.hypot(p.x - state.hover.x, p.y - state.hover.y);
    if (d < best) {
      best = d;
      nearest = obj;
    }
  }
  state.hover.obj = nearest;
  if (!nearest) {
    card.style.display = "none";
    card.setAttribute("aria-hidden", "true");
    return;
  }
  const exo = exoplanetSystems.get(nearest.name);
  const dist = distance(nearest, { x: 0, y: 0, z: 0 });
  card.innerHTML = [
    `<strong>${nearest.name}</strong>`,
    `<span>${nearest.spectral || nearest.type}</span>`,
    `<span>${dist.toFixed(3)} pc / ${(dist * LY_PER_PC).toFixed(2)} anys llum</span>`,
    nearest.mag !== undefined ? `<span>Magnitud G ${nearest.mag.toFixed ? nearest.mag.toFixed(2) : nearest.mag}</span>` : "",
    exo ? `<span class="exo">Exoplanetes: ${exo}</span>` : "",
  ].filter(Boolean).join("");
  card.style.display = "block";
  card.style.left = `${Math.min(window.innerWidth - 260, state.hover.x + 16)}px`;
  card.style.top = `${Math.min(window.innerHeight - 130, state.hover.y + 16)}px`;
  card.setAttribute("aria-hidden", "false");
}

function isHoverInteresting(obj) {
  if (obj.type === "galaxy") return true;
  if (exoplanetSystems.has(obj.name)) return true;
  if (obj.spectral !== "Gaia") return true;
  return obj.mag !== undefined && obj.mag < 6.2;
}

function setupUi() {
  document.getElementById("goButton").addEventListener("click", () => jumpTo(document.getElementById("searchInput").value));
  document.getElementById("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") jumpTo(event.currentTarget.value);
  });
  document.getElementById("speedDown").addEventListener("click", () => {
    setSpeed(state.speed / 1.6);
  });
  document.getElementById("speedUp").addEventListener("click", () => {
    setSpeed(state.speed * 1.6);
  });
  document.getElementById("speedSlider").addEventListener("input", (event) => {
    speedFromSlider(event.currentTarget.value);
  });
  document.getElementById("speedInput").addEventListener("change", (event) => {
    setSpeed(event.currentTarget.value);
  });
  document.getElementById("stabilizeButton").addEventListener("click", stabilizeNorthUp);
  document.getElementById("approachButton").addEventListener("click", approachSelection);
  document.getElementById("resetButton").addEventListener("click", resetView);
  document.getElementById("measureAButton").addEventListener("click", () => markMeasurement("a"));
  document.getElementById("measureBButton").addEventListener("click", () => markMeasurement("b"));
  document.getElementById("measureClickButton").addEventListener("click", toggleMeasureClickMode);
  document.getElementById("measureClearButton").addEventListener("click", clearMeasurement);
  for (const [id, layer] of [
    ["layerSolar", "solar"],
    ["layerStars", "stars"],
    ["layerExoplanets", "exoplanets"],
    ["layerGalaxy", "galaxy"],
  ]) {
    document.getElementById(id).addEventListener("change", (event) => {
      state.layers[layer] = event.currentTarget.checked;
    });
  }
  document.getElementById("animatePlanets").addEventListener("change", (event) => {
    state.animatePlanets = event.currentTarget.checked;
  });
  document.getElementById("labelMode").addEventListener("change", (event) => {
    state.labels.mode = event.currentTarget.value;
  });
  const quick = document.getElementById("quickTargets");
  for (const target of quickTargets) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = target;
    button.addEventListener("click", () => jumpTo(target));
    quick.appendChild(button);
  }
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === "r") resetView();
  state.keys.add(key);
});
window.addEventListener("keyup", (event) => state.keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointerdown", (event) => {
  state.dragging = true;
  state.pointerMoved = false;
  state.lastMouse.x = event.clientX;
  state.lastMouse.y = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointerup", () => {
  state.dragging = false;
});
canvas.addEventListener("pointermove", (event) => {
  state.hover.x = event.clientX;
  state.hover.y = event.clientY;
  if (!state.dragging) return;
  const dx = event.clientX - state.lastMouse.x;
  const dy = event.clientY - state.lastMouse.y;
  if (Math.hypot(dx, dy) > 3) state.pointerMoved = true;
  state.lastMouse.x = event.clientX;
  state.lastMouse.y = event.clientY;
  state.yaw -= dx * 0.004;
  state.pitch = normalizeAngle(state.pitch - dy * 0.003);
});
canvas.addEventListener("click", () => {
  if (!state.pointerMoved) handleMeasureClick();
});
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.fov = Math.max(8 * DEG, Math.min(105 * DEG, state.fov + event.deltaY * 0.0007));
}, { passive: false });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.06, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  updateHud();
  requestAnimationFrame(frame);
}

resize();
setupUi();
updateSelection();
updateMeasurement();
updateHud();
loadCatalogManifest();
requestAnimationFrame(frame);
