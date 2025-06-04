
import { Project, AdminUser } from './types';

const DB_NAME = 'ZenTrackDB';
const DB_VERSION = 1; // Version remains 1, stores are created if not exist
const PROJECTS_STORE_NAME = 'projects_os';
const SETTINGS_STORE_NAME = 'settings_os';

const PROJECTS_KEY = 'allProjects';
const ADMIN_STATUS_KEY = 'adminStatus';
const CUSTOM_ADMIN_USER_KEY = 'customAdminUser'; // Key for custom admin credentials

let db: IDBDatabase | null = null;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(true);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const tempDb = (event.target as IDBOpenDBRequest).result;
      if (!tempDb.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
        tempDb.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id' });
      }
      if (!tempDb.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
        // Ensure keyPath is 'id' for consistency, even if we store single items
        tempDb.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      console.log('Database initialized successfully.');
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('Database error:', (event.target as IDBOpenDBRequest).error);
      reject(false);
    };
  });
};

export const saveProjectsToDB = (projects: Project[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try {
        await initDB();
      } catch (error) {
        reject('DB not initialized and failed to initialize');
        return;
      }
    }
    if (!db) { 
        reject('DB still not initialized after attempt.');
        return;
    }
    const transaction = db.transaction([PROJECTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PROJECTS_STORE_NAME);
    const request = store.put({ id: PROJECTS_KEY, data: projects });

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Error saving projects:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const getProjectsFromDB = (): Promise<Project[] | null> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try {
        await initDB();
      } catch (error) {
        reject('DB not initialized and failed to initialize');
        return;
      }
    }
     if (!db) { 
        reject('DB still not initialized after attempt.');
        return;
    }
    const transaction = db.transaction([PROJECTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(PROJECTS_STORE_NAME);
    const request = store.get(PROJECTS_KEY);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      if (result && result.data) {
        resolve(result.data as Project[]);
      } else {
        resolve(null); 
      }
    };
    request.onerror = (event) => {
      console.error('Error getting projects:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const saveAdminLoginStatusToDB = (isLoggedIn: boolean): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try {
        await initDB();
      } catch (error) {
        reject('DB not initialized and failed to initialize');
        return;
      }
    }
    if (!db) {
        reject('DB still not initialized after attempt.');
        return;
    }
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.put({ id: ADMIN_STATUS_KEY, loggedIn: isLoggedIn });

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Error saving admin status:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const getAdminLoginStatusFromDB = (): Promise<boolean | null> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
       try {
        await initDB();
      } catch (error) {
        reject('DB not initialized and failed to initialize');
        return;
      }
    }
    if (!db) {
        reject('DB still not initialized after attempt.');
        return;
    }
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.get(ADMIN_STATUS_KEY);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      if (result && typeof result.loggedIn === 'boolean') {
        resolve(result.loggedIn);
      } else {
        resolve(null); 
      }
    };
    request.onerror = (event) => {
      console.error('Error getting admin status:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

// --- Custom Admin User Functions ---
export const saveCustomAdminUserToDB = (user: AdminUser): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try { await initDB(); } catch (error) { reject('DB init failed'); return; }
    }
    if (!db) { reject('DB still not initialized'); return; }

    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.put({ id: CUSTOM_ADMIN_USER_KEY, user: user });

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Error saving custom admin user:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const getCustomAdminUserFromDB = (): Promise<AdminUser | null> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try { await initDB(); } catch (error) { reject('DB init failed'); return; }
    }
    if (!db) { reject('DB still not initialized'); return; }
    
    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.get(CUSTOM_ADMIN_USER_KEY);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result;
      if (result && result.user) {
        resolve(result.user as AdminUser);
      } else {
        resolve(null);
      }
    };
    request.onerror = (event) => {
      console.error('Error getting custom admin user:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};

export const deleteCustomAdminUserFromDB = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      try { await initDB(); } catch (error) { reject('DB init failed'); return; }
    }
    if (!db) { reject('DB still not initialized'); return; }

    const transaction = db.transaction([SETTINGS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(SETTINGS_STORE_NAME);
    const request = store.delete(CUSTOM_ADMIN_USER_KEY);

    request.onsuccess = () => resolve();
    request.onerror = (event) => {
      console.error('Error deleting custom admin user:', (event.target as IDBRequest).error);
      reject((event.target as IDBRequest).error);
    };
  });
};
