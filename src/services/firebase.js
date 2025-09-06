import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import * as firebaseui from 'firebaseui';

import sw from './firebase-messaging-sw.js?worker&url';

const firebaseConfig = {
  apiKey: "AIzaSyBQxB9AeK1AMd8i4TIbfRMa9JI3SayA_r0",
  authDomain: "unicorn-storage.firebaseapp.com",
  projectId: "unicorn-storage",
  storageBucket: "unicorn-storage.firebasestorage.app",
  messagingSenderId: "297333036104",
  appId: "1:297333036104:web:914a33c4ca10242b5a747d"
};


const app = initializeApp(firebaseConfig);

const registerServiceWorker = async (onToken) => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.register(sw, {type: 'module'});

    const token = await getToken(messaging, {
      vapidKey: 'BDwmSQECA_R9XFgmyrCgH9XalGLsoLwlAYHLlvcIrfQR3hW7W5bUMDNRM6ROK9ZVEkyjHAebXmkMticWJO2THN4',
      serviceWorkerRegistration: registration,
    });
    onToken(token);
    onMessage(messaging, (noti) => {console.log(noti)})
  }
};

const messaging = getMessaging(app);
const db = getFirestore(app);
const auth = getAuth(app);
const ui = new firebaseui.auth.AuthUI(auth);

export { app, db, auth, ui, registerServiceWorker };