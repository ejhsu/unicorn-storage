import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from './firebase';

const itemsPath = '/storage/1/items';
const codePath = '/code/';

export const upsertItem = async (docId, item) => {
  await setDoc(doc(db, itemsPath, docId), item);
};

export const loadItem = async (id) => {
  return (await getDoc(doc(db, 'storage/1/items', id))).data();
};

export const deleteItem = async (docId) => {
  await deleteDoc(doc(db, itemsPath, docId));
};

export const duplicateItem = async (item) => {
  const now = new Date();
  const docId = now.valueOf().toString();
  await upsertItem(docId, { ...item, docId, created: now.valueOf(), updated: now.valueOf() });
};

export const setCode = async (code, name) => {
  await setDoc(doc(db, codePath, code), { id: code, name });
};

export const getCode = async (code) => {
  return (await getDoc(doc(db, codePath, code))).data();
};
