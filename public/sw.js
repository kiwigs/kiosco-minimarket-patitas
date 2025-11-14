self.addEventListener("install", () => {
  console.log("[SW] Installed");
  self.skipWaiting(); // fuerza al nuevo SW a activarse inmediatamente
});

self.addEventListener("activate", () => {
  console.log("[SW] Activated");
  self.clients.claim(); // toma control de todas las ventanas abiertas
});
