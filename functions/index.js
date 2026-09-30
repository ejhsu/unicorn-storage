/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const { setGlobalOptions } = require('firebase-functions/v2');

const { fromZonedTime } = require('date-fns-tz');
const { addDays, endOfDay, getUnixTime } = require('date-fns');

const timeZone = 'Asia/Taipei';

const app = admin.initializeApp();
const db = admin.firestore(app);
const messaging = admin.messaging(app);
setGlobalOptions({ region: 'asia-east1' });

exports.expirynotify = onSchedule({ schedule: '0 12 * * *', timeZone: 'Asia/Taipei' }, async () => {
  const now = new Date();
  const endOfDayDate = endOfDay(now);
  const epochEndOfToday = fromZonedTime(endOfDayDate, timeZone);
  const epoch7DaysAfter = addDays(epochEndOfToday, 7);
  const epochMillis7DaysAfter = getUnixTime(epoch7DaysAfter) * 1000;
  console.log('epoch7DaysAfter', epochMillis7DaysAfter);

  const snapshot = await db.collection('/storage/1/items').where('expiry', '<=', epochMillis7DaysAfter).get();
  const targetItems = [];
  snapshot.forEach((doc) => {
    targetItems.push(doc.data());
  });

  if (targetItems.length === 0) {
    logger.log(`No items expired or expiring soon. Skip notifications`);
    return;
  }

  const expired = targetItems.filter((item) => item.expiry <= epochEndOfToday);
  logger.log(`Target items: ${targetItems.length} (expired ${expired.length})`);

  const tokens = await db.collection('/fcm-tokens/1/user-tokens').get();
  const registrationTokens = [];
  tokens.forEach((doc) => {
    registrationTokens.push(...doc.data().tokens);
  });
  logger.log(`Users: ${tokens.size}, tokens: ${registrationTokens.length}`);
  const message = {
    data: { expired: `${expired.length}`, expiredSoon: `${targetItems.length - expired.length}` },
    tokens: registrationTokens,
  };

  const resp = await messaging.sendEachForMulticast(message);
  const errorCodes = {};
  resp.responses.forEach(({ error }) => {
    if (error) {
      errorCodes[error.code] = (errorCodes[error.code] || 0) + 1;
    }
  });
  logger.log(`sendEachForMulticast: success ${resp.successCount}, failure ${resp.failureCount}, errors ${JSON.stringify(errorCodes)}`);

  logger.log('expiry notifications proceeded');
});

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
