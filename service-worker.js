// Service Worker מינימלי — מטרתו בעיקר לאפשר "התקנה" של הדשבורד כאפליקציה.
// הוא שומר קאש רק לקבצי המעטפת של האתר עצמו (HTML/manifest/icons),
// ולא נוגע בכלל בבקשות ל-Google Drive / ה-CDN של XLSX — אלה תמיד ילכו
// לרשת כדי שהנתונים הפיננסיים יהיו תמיד עדכניים.

const CACHE_NAME = "finance-dashboard-shell-v1";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellFile = url.origin === self.location.origin;
  if (!isShellFile) return; // בקשות חיצוניות (Drive/CDN) - תמיד רשת, לא נוגעים

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
