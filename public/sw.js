self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'APE Marcel Béné';
  const options = {
    body: data.body || 'Nouvelle notification de l\'association',
    icon: '/logo.jpg',
    badge: '/logo.jpg'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});