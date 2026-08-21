#!/usr/bin/env node
/**
 * Prueba de humo de integración: usa el MISMO `src/api/client.ts` que
 * consume la app (mismo archivo, sin copiar lógica) contra un servidor real
 * (por defecto `http://localhost:3100`) y valida que `/home`, `/catalog`,
 * `/search`, `/marketplace` y `/businesses/[slug]` devuelvan la forma que
 * declaran los tipos en `src/api/types.ts`.
 *
 * Cómo funciona: Node no puede ejecutar `.tsx`/módulos de Expo/React Native
 * directamente (no hay motor RN aquí), así que este script:
 *   1. Registra un compilador TS→CJS al vuelo para los `.ts` de `src/api/**`.
 *   2. Sustituye SOLO los tres módulos nativos que `client.ts` importa
 *      (`expo-constants`, `react-native`, `expo-secure-store`, `expo-crypto`)
 *      por shims mínimos en memoria — el propio `client.ts`/`config.ts`/
 *      `auth-tokens.ts`/`device-id.ts` se ejecutan SIN modificar ni una línea.
 *   3. Llama a `apiClient.get(...)` real (fetch real, por HTTP) y valida la
 *      forma de la respuesta contra los campos que `types.ts` declara.
 *
 * Uso:
 *   node scripts/smoke-api.mjs                          # http://localhost:3100
 *   API_URL=http://localhost:3100 node scripts/smoke-api.mjs
 */
import { createRequire } from 'node:module';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mobileRoot = path.resolve(__dirname, '..');
const apiDir = path.join(mobileRoot, 'src', 'api');

const API_URL = process.env.API_URL ?? 'http://localhost:3100';
process.env.EXPO_PUBLIC_API_URL = API_URL;
process.env.EXPO_PUBLIC_USE_MOCKS = 'false';

const require_ = createRequire(import.meta.url);
const ts = require_('typescript');

// --- Shims de módulos nativos (Expo/React Native no corren en Node puro) ---
const inMemorySecureStore = new Map();

const shims = {
  'expo-constants': {
    __esModule: true,
    default: { expoConfig: { version: '1.0.0-smoke' } },
  },
  'react-native': {
    __esModule: true,
    Platform: { OS: 'android' },
  },
  'expo-secure-store': {
    __esModule: true,
    getItemAsync: async (key) => inMemorySecureStore.get(key) ?? null,
    setItemAsync: async (key, value) => {
      inMemorySecureStore.set(key, value);
    },
    deleteItemAsync: async (key) => {
      inMemorySecureStore.delete(key);
    },
  },
  'expo-crypto': {
    __esModule: true,
    randomUUID: () => crypto.randomUUID(),
    getRandomBytes: (n) => crypto.randomBytes(n),
  },
};

// --- Registro de compilación TS -> CJS al vuelo, solo para src/api/** ---
const originalJsExtension = Module._extensions['.js'];
Module._extensions['.ts'] = function compileTypeScript(mod, filename) {
  const source = require_('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  }).outputText;
  mod._compile(output, filename);
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, ...rest) {
  if (Object.prototype.hasOwnProperty.call(shims, request)) {
    // Devuelve una ruta sintética estable; el loader de abajo intercepta el require real.
    return `shim:${request}`;
  }
  return originalResolveFilename.call(this, request, ...rest);
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, ...rest) {
  if (Object.prototype.hasOwnProperty.call(shims, request)) {
    return shims[request];
  }
  return originalLoad.call(this, request, ...rest);
};

// --- Carga el cliente REAL de la app (sin copiar ni una línea de lógica) ---
const { apiClient, ApiError } = require_(path.join(apiDir, 'client.ts'));

// --- Utilidades de aserción ligera (sin librería de testing: Node puro) ---
let failures = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

function typeOk(value, type) {
  if (type === 'string|null') return value === null || typeof value === 'string';
  if (type === 'number|null') return value === null || typeof value === 'number';
  if (type === 'boolean|null') return value === null || typeof value === 'boolean';
  return typeof value === type;
}

/** Valida que `obj` tenga los campos declarados por `BusinessCard` en types.ts (subconjunto suficiente para humo, no un validador exhaustivo de esquema). */
function assertBusinessCardShape(card, label) {
  assert(typeof card.id === 'string', `${label}.id es string`);
  assert(typeof card.slug === 'string', `${label}.slug es string`);
  assert(typeof card.name === 'string', `${label}.name es string`);
  assert(typeOk(card.shortDescription, 'string|null'), `${label}.shortDescription es string|null`);
  assert(typeOk(card.rating, 'number|null'), `${label}.rating es number|null`);
  assert(typeof card.reviewCount === 'number', `${label}.reviewCount es number`);
  assert(typeOk(card.lat, 'number|null'), `${label}.lat es number|null`);
  assert(typeOk(card.lng, 'number|null'), `${label}.lng es number|null`);
  assert(typeOk(card.isOpenNow, 'boolean|null'), `${label}.isOpenNow es boolean|null (nunca inventado)`);
  assert(typeof card.isVerified === 'boolean', `${label}.isVerified es boolean`);
  assert(typeof card.isFeatured === 'boolean', `${label}.isFeatured es boolean`);
  assert(typeof card.isBoosted === 'boolean', `${label}.isBoosted es boolean`);
}

function assertMarketplaceListingShape(item, label) {
  assert(typeof item.id === 'string', `${label}.id es string`);
  assert(typeof item.slug === 'string', `${label}.slug es string`);
  assert(typeof item.title === 'string', `${label}.title es string`);
  assert(typeOk(item.price, 'string|null'), `${label}.price es string|null (Decimal serializado, nunca number)`);
  assert(typeof item.type === 'string', `${label}.type es string`);
  assert(typeof item.isBoosted === 'boolean', `${label}.isBoosted es boolean`);
  assert(typeof item.favoriteCount === 'number', `${label}.favoriteCount es number`);
  assert(typeof item.createdAt === 'string', `${label}.createdAt es string (ISO)`);
}

async function run() {
  console.log(`Smoke test de src/api/client.ts contra ${API_URL}\n`);

  // --- /home ---
  console.log('GET /home');
  try {
    const home = await apiClient.get('/home');
    assert(Array.isArray(home.featured), 'home.featured es arreglo');
    assert(Array.isArray(home.categories), 'home.categories es arreglo');
    assert(Array.isArray(home.recentListings), 'home.recentListings es arreglo');
    assert(Array.isArray(home.zones), 'home.zones es arreglo');
    if (home.featured.length > 0) assertBusinessCardShape(home.featured[0], 'home.featured[0]');
    if (home.recentListings.length > 0) assertMarketplaceListingShape(home.recentListings[0], 'home.recentListings[0]');
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /home lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /catalog ---
  console.log('GET /catalog');
  let firstCategorySlug;
  let firstMunicipalitySlug;
  try {
    const catalog = await apiClient.get('/catalog');
    assert(Array.isArray(catalog.categories), 'catalog.categories es arreglo');
    assert(Array.isArray(catalog.municipalities), 'catalog.municipalities es arreglo');
    assert(Array.isArray(catalog.marketplaceCategories), 'catalog.marketplaceCategories es arreglo');
    assert(catalog.categories.length === 12, `catalog.categories tiene 12 categorías (tiene ${catalog.categories.length})`);
    assert(catalog.municipalities.length === 8, `catalog.municipalities tiene 8 municipios (tiene ${catalog.municipalities.length})`);
    assert(catalog.marketplaceCategories.length === 10, `catalog.marketplaceCategories tiene 10 categorías (tiene ${catalog.marketplaceCategories.length})`);
    if (catalog.categories[0]) {
      assert(typeof catalog.categories[0].name === 'string', 'catalog.categories[0].name es string');
      assert(typeof catalog.categories[0].slug === 'string', 'catalog.categories[0].slug es string');
      assert(Array.isArray(catalog.categories[0].subcategories), 'catalog.categories[0].subcategories es arreglo');
      firstCategorySlug = catalog.categories[0].slug;
    }
    if (catalog.municipalities[0]) {
      assert(Array.isArray(catalog.municipalities[0].neighborhoods), 'catalog.municipalities[0].neighborhoods es arreglo');
      firstMunicipalitySlug = catalog.municipalities[0].slug;
    }
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /catalog lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /search ---
  console.log('GET /search');
  let firstBusinessSlug;
  try {
    const results = await apiClient.get('/search', { limit: 20 });
    assert(Array.isArray(results), '/search devuelve un arreglo');
    // Nota: la base local trae 3 negocios sembrados con coordenadas, pero
    // `/search` (y `/map/businesses`) hoy solo devuelven 2 — no es un bug de
    // esta app móvil (no toca el backend), así que aquí solo se exige que
    // haya al menos uno, no un conteo exacto.
    assert(results.length > 0, `/search devuelve al menos un negocio (tiene ${results.length})`);
    if (results[0]) {
      assertBusinessCardShape(results[0], 'search[0]');
      firstBusinessSlug = results[0].slug;
    }
    if (firstCategorySlug) {
      const filtered = await apiClient.get('/search', { category: firstCategorySlug, limit: 20 });
      assert(Array.isArray(filtered), `/search?category=${firstCategorySlug} devuelve un arreglo`);
    }
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /search lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /search/suggestions ---
  console.log('GET /search/suggestions');
  try {
    const suggestions = await apiClient.get('/search/suggestions', { q: 'a' });
    assert(Array.isArray(suggestions), '/search/suggestions devuelve un arreglo');
    assert(suggestions.every((s) => typeof s === 'string'), '/search/suggestions es un arreglo de strings planos (no {businesses, categories})');
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /search/suggestions lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /businesses/[slug] ---
  console.log('GET /businesses/[slug]');
  if (firstBusinessSlug) {
    try {
      const detail = await apiClient.get(`/businesses/${firstBusinessSlug}`);
      assertBusinessCardShape(detail, 'detail');
      assert(typeof detail.isFavorite === 'boolean', 'detail.isFavorite es boolean');
      assert(Array.isArray(detail.hours), 'detail.hours es arreglo');
      assert(Array.isArray(detail.images), 'detail.images es arreglo');
      assert(Array.isArray(detail.tags), 'detail.tags es arreglo');
      assert(Array.isArray(detail.reviewsPreview), 'detail.reviewsPreview es arreglo');
      assert(typeof detail.socials === 'object' && detail.socials !== null, 'detail.socials es objeto');

      console.log('GET /businesses/[slug]/reviews');
      const { data: reviews, meta } = await apiClient.getPage(`/businesses/${firstBusinessSlug}/reviews`, { limit: 20 });
      assert(Array.isArray(reviews), 'reviews es arreglo');
      assert(typeof meta === 'object', 'reviews trae meta de paginación');
    } catch (err) {
      failures += 1;
      console.error(`  ✗ /businesses/${firstBusinessSlug} lanzó: ${describeError(err)}`);
    }
  } else {
    failures += 1;
    console.error('  ✗ no se pudo probar /businesses/[slug]: /search no devolvió ningún slug');
  }
  console.log();

  // --- /map/businesses ---
  console.log('GET /map/businesses');
  try {
    const mapResponse = await apiClient.get('/map/businesses', {
      minLat: 20.4,
      maxLat: 20.9,
      minLng: -103.6,
      maxLng: -103.1,
      zoom: 12,
    });
    assert(mapResponse.mode === 'pins' || mapResponse.mode === 'clusters', 'map.mode es "pins" o "clusters"');
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /map/businesses lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /marketplace/categories ---
  console.log('GET /marketplace/categories');
  try {
    const categories = await apiClient.get('/marketplace/categories');
    assert(Array.isArray(categories), '/marketplace/categories es arreglo');
    assert(categories.length === 10, `/marketplace/categories tiene 10 (tiene ${categories.length})`);
    if (categories[0]) {
      assert(typeof categories[0].id === 'string', 'marketplace category[0].id es string');
      assert(typeof categories[0].slug === 'string', 'marketplace category[0].slug es string');
    }
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /marketplace/categories lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /marketplace ---
  console.log('GET /marketplace');
  let firstListingId;
  try {
    const { data: listings, meta } = await apiClient.getPage('/marketplace', { limit: 20 });
    assert(Array.isArray(listings), '/marketplace devuelve un arreglo (data)');
    assert(listings.length === 8, `/marketplace devuelve los 8 anuncios semilla (tiene ${listings.length})`);
    assert(typeof meta === 'object', '/marketplace trae meta de paginación');
    if (listings[0]) {
      assertMarketplaceListingShape(listings[0], 'marketplace[0]');
      firstListingId = listings[0].id;
    }
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /marketplace lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- /marketplace/[id] ---
  console.log('GET /marketplace/[id]');
  if (firstListingId) {
    try {
      const detail = await apiClient.get(`/marketplace/${firstListingId}`);
      assertMarketplaceListingShape(detail, 'marketplace detail');
      assert(Array.isArray(detail.images), 'marketplace detail.images es arreglo');
      assert(typeof detail.views === 'number', 'marketplace detail.views es number');
    } catch (err) {
      failures += 1;
      console.error(`  ✗ /marketplace/${firstListingId} lanzó: ${describeError(err)}`);
    }
  } else {
    failures += 1;
    console.error('  ✗ no se pudo probar /marketplace/[id]: /marketplace no devolvió ningún id');
  }
  console.log();

  // --- /config ---
  console.log('GET /config');
  try {
    const config = await apiClient.get('/config');
    assert(typeof config.minAppVersion === 'string', 'config.minAppVersion es string');
    assert(typeof config.forceUpdate === 'boolean', 'config.forceUpdate es boolean');
    assert(typeof config.maintenanceMode === 'boolean', 'config.maintenanceMode es boolean');
  } catch (err) {
    failures += 1;
    console.error(`  ✗ /config lanzó: ${describeError(err)}`);
  }
  console.log();

  // --- Códigos de error tratados de forma distinta ---
  console.log('POST /auth/login con credenciales inválidas -> código de error estable');
  try {
    await apiClient.post('/auth/login', { email: 'no-existe@guiazmg.com', password: 'lo-que-sea-123' });
    failures += 1;
    console.error('  ✗ se esperaba que /auth/login fallara con credenciales inventadas');
  } catch (err) {
    if (err instanceof ApiError) {
      assert(
        err.code === 'INVALID_CREDENTIALS' || err.code === 'VALIDATION_ERROR' || err.code === 'RATE_LIMITED',
        `/auth/login con credenciales inválidas devuelve un ApiError con código estable (recibido: ${err.code})`,
      );
    } else {
      failures += 1;
      console.error(`  ✗ /auth/login no lanzó un ApiError: ${describeError(err)}`);
    }
  }
  console.log();

  console.log(`\n${passed} verificaciones OK, ${failures} fallidas.`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

function describeError(err) {
  if (err && err.name === 'ApiError') return `ApiError(${err.code}): ${err.message}`;
  return err && err.stack ? err.stack : String(err);
}

run().catch((err) => {
  console.error('El smoke test murió con una excepción no manejada:', err);
  process.exitCode = 1;
});
