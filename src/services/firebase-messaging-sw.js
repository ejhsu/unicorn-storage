import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

const firebaseConfig = {
  apiKey: 'AIzaSyBQxB9AeK1AMd8i4TIbfRMa9JI3SayA_r0',
  authDomain: 'unicorn-storage.firebaseapp.com',
  projectId: 'unicorn-storage',
  storageBucket: 'unicorn-storage.firebasestorage.app',
  messagingSenderId: '297333036104',
  appId: '1:297333036104:web:914a33c4ca10242b5a747d',
};

const app = initializeApp(firebaseConfig);

const messaging = getMessaging(app);
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const { data } = payload;
  const notificationTitle = 'Unicorn通知';
  const notificationOptions = {
    body: `${data.expired}個品項已到期\n${data.expiredSoon}個品項即將到期`,
    icon: 'https://unicorn-storage.web.app/logo.png',
    image: 'https://unicorn-storage.web.app/logo.png',
    iconUrl: 'https://unicorn-storage.web.app/logo.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(self.clients.openWindow('https://unicorn-storage.web.app/'));
});
