// Service Worker for Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Agendia", body: event.data.text() };
  }

  const options = {
    body: data.body || "",
    icon: "/next.svg",
    badge: "/next.svg",
    tag: data.tag || "agendia-notification",
    data: { url: data.url || "/dashboard" },
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Agendia", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
