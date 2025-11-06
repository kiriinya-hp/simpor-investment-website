self.addEventListener('push', event => {
    const data = event.data.json();
    console.log('Push received:', data);

    const title = data.title || 'Simpor E-commerce Update';
    const options = {
        body: data.body || 'You have an update regarding your order.',
        icon: 'simpor log.png', 
        badge: 'simpor log.png' 
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') 
    );
});