/*
 * Persistance du pack importé (un seul à la fois) dans IndexedDB — adapté aux
 * data URLs d'images, potentiellement volumineuses (au-delà du quota localStorage).
 */
const DB_NAME = 'oneblock-loottable';
const STORE = 'pack';
const KEY = 'current';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponible'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePack(pack) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(pack, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPack() {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function clearPack() {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
