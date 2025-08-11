export interface LocalModelEntry {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
}

const DB_NAME = 'local-models-db';
const STORE_NAME = 'models';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalModel(file: File): Promise<LocalModelEntry> {
  const db = await openDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const entry: LocalModelEntry = {
    id,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    createdAt: Date.now(),
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ ...entry, blob: file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  return entry;
}

export async function listLocalModels(): Promise<LocalModelEntry[]> {
  const db = await openDB();
  const items: LocalModelEntry[] = [];
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.openCursor();

    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null;

      if (cursor) {
        const value = cursor.value as any;
        items.push({ id: value.id, name: value.name, size: value.size, type: value.type, createdAt: value.createdAt });
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
  db.close();

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getLocalModelBlob(id: string): Promise<Blob | null> {
  const db = await openDB();
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      const val = req.result as any;
      resolve(val?.blob || null);
    };
    req.onerror = () => reject(req.error);
  });
  db.close();

  return blob;
}

export async function removeLocalModel(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
