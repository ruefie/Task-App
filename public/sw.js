// public/sw.js

self.addEventListener('install', e => {
  console.log('🛠 SW: install');
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  console.log('⚡️ SW: activate');
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  console.log('📬 SW: push event received', event);

  let data = { title: 'No payload', body: '' };
  if (event.data) {
    try {
      data = event.data.json();
      console.log('📬 SW: push data', data);
    } catch (err) {
      console.warn('⚠️ SW: could not parse push payload', err);
    }
  } else {
    console.warn('⚠️ SW: push event had no data');
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: data.tag,
      requireInteraction: true
    })
  );
});

self.addEventListener('notificationclick', event => {
  console.log('🔔 SW: notification click', event);
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});
