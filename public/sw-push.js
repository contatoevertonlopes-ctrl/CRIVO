// Custom Push Notification Service Worker
// This file handles push events when the app is closed

self.addEventListener('push', function(event) {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Nova notificação',
      body: event.data.text(),
      icon: '/pwa-192x192.png',
    };
  }

  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'default',
    data: {
      url: data.url || data.link || '/',
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Club Finance Track', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if available
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('pushsubscriptionchange', function(event) {
  // Handle subscription expiration
  console.log('[SW] Push subscription changed');
});
