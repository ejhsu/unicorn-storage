import { deleteDoc, doc, setDoc } from "firebase/firestore";

import { db } from "./firebase";

const itemsPath = '/storage/1/items';

export const upsertItem = async (docId, item) => {
  await setDoc(doc(db, itemsPath, docId), item);
};

export const deleteItem = async (docId) => {
  await deleteDoc(doc(db, itemsPath, docId));
};

export const duplicateItem = async (item) => {
  const now = new Date();
  const docId = now.valueOf().toString();
  await upsertItem(docId, {...item, docId, created: now.valueOf(), updated: now.valueOf()});
};