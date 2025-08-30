// utils/indexedDB.ts

export function openDB(dbName: string, storeName: string) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 3); // version bump to create all stores

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ✅ Create all stores that might be needed
      const stores = ['users', 'orders', 'presets', 'media'];
      
      stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "key" });
        }
      });
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function setItem(dbName: string, storeName: string, key: string, value: any) {
  try {
    const db = await openDB(dbName, storeName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.put({ key, value });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error(`Error setting item in ${storeName}:`, error);
    throw error;
  }
}

export async function getItem(dbName: string, storeName: string, key: string): Promise<any> {
  try {
    const db = await openDB(dbName, storeName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting item from ${storeName}:`, error);
    return null;
  }
}

export async function deleteItem(dbName: string, storeName: string, key: string) {
  try {
    const db = await openDB(dbName, storeName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error(`Error deleting item from ${storeName}:`, error);
    throw error;
  }
}

export async function clearDatabase(dbName: string) {
  try {
    const request = indexedDB.deleteDatabase(dbName);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log(`Database ${dbName} cleared successfully`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing database ${dbName}:`, error);
    throw error;
  }
}
  