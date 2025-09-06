const { initializeApp } = require('firebase-admin/app');
const admin = require('firebase-admin');

const app = initializeApp();
const db = admin.firestore();

const data = require('./firestore_items.json');

data.forEach(doc => {
  db.collection('/storage/1/items').doc(doc.docId).set(doc)
    .then(() => console.log(`Uploaded ${doc.name}`))
    .catch(console.error);
});