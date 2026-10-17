const CACHE_NAME = "wellnest-clinical-shell-v2";
const APP_ROOT = new URL("./", self.location);
const INDEX_URL = new URL("index.html", APP_ROOT).href;

async function cacheApplicationShell(cache) {
  const pageResponse = await fetch(INDEX_URL);
  if (!pageResponse.ok) throw new Error("Could not cache the application page.");
  const html = await pageResponse.clone().text();
  await cache.put(INDEX_URL, pageResponse);

  const assetUrls = new Set([APP_ROOT.href, INDEX_URL, new URL("service-worker.js", APP_ROOT).href]);
  const referencePattern = /(?:src|href)=["']([^"']+)["']/g;
  let match;
  while ((match = referencePattern.exec(html)) !== null) {
    const assetUrl = new URL(match[1], APP_ROOT);
    if (assetUrl.origin === self.location.origin) assetUrls.add(assetUrl.href);
  }

  const manifestUrl = new URL("manifest.webmanifest", APP_ROOT);
  const manifestResponse = await fetch(manifestUrl);
  if (!manifestResponse.ok) throw new Error("Could not cache the app manifest.");
  const manifest = await manifestResponse.clone().json();
  await cache.put(manifestUrl, manifestResponse);
  for (const icon of manifest.icons || []) assetUrls.add(new URL(icon.src, manifestUrl).href);

  for (const assetUrl of assetUrls) {
    const response = await fetch(assetUrl);
    if (!response.ok) throw new Error(`Could not cache app asset: ${assetUrl}`);
    await cache.put(assetUrl, response);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cacheApplicationShell)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("wellnest-clinical-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
      }
      return response;
    }).catch(async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) return cachedResponse;
      if (request.mode === "navigate") return caches.match(INDEX_URL);
      return Response.error();
    }),
  );
});