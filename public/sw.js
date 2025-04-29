
// self.addEventListener('install',   (e) => self.skipWaiting());
// self.addEventListener('activate',  (e) => e.waitUntil(self.clients.claim()));

// service-worker.js

self.addEventListener('push', event => {
  let data = { title: 'Reminder', body: '…' };
  if (event.data) data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/notification-icon.png',
      badge: '/notification-badge.png',
      tag: data.tag
    })
  );
});



// self.addEventListener('notificationclick', event => {
//   event.notification.close();
//   event.waitUntil(
//     clients.openWindow('/')  // or route to calendar view
//   );
// });
