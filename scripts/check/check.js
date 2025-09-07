/* eslint-disable */
const { initializeApp } = require('firebase-admin/app');
const admin = require('firebase-admin');

const { toZonedTime, fromZonedTime, formatInTimeZone } = require('date-fns-tz');
const { addDays, endOfDay, getUnixTime, fromUnixTime, format, differenceInDays } = require('date-fns');

initializeApp();
const db = admin.firestore();

const timeZone = 'Asia/Taipei';

async function getAllItems() {
  try {
    const snapshot = await db.collection('storage/1/items').orderBy('expiry', 'asc').get();
    snapshot.forEach(doc => {
      console.log('Document ID:', doc.id);
      console.log('Document data:', doc.data());
      // const newExpiry = getUnixTime(fromZonedTime(endOfDay(new Date(doc.data().expiry)), timeZone))*1000;
      // db.collection('storage/1/items').doc(doc.id).update({
      //   expiry: newExpiry
      // });
      console.log('-------------------');
    });
  } catch (error) {
    console.error('Error getting documents:', error);
  }
}

// getAllItems();

// const now = new Date();
// const endOfDayDate = endOfDay(now);
// const fromZonedTimeEndOfDay = fromZonedTime(endOfDayDate, timeZone);

// console.log(now)
// // console.log(zonedDate)
// console.log(endOfDayDate)
// console.log(fromZonedTimeEndOfDay)
// console.log(getUnixTime(fromZonedTimeEndOfDay))

console.log(differenceInDays(1754323199000, fromZonedTime(endOfDay(new Date()), 'Asia/Taipei')))