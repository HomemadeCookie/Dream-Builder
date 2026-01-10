// Create a new file: src/services/offlineService.js

class OfflineService {
  constructor() {
    this.dbName = 'DreamBuilderDB';
    this.version = 2; // Increment version to trigger upgrade
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Clear old stores if they exist
        const storeNames = ['fields', 'areas', 'nextSteps', 'syncQueue'];
        storeNames.forEach(name => {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
          }
        });

        // Create areas store
        const areasStore = db.createObjectStore('areas', { keyPath: 'id', autoIncrement: true });
        areasStore.createIndex('user_id', 'user_id', { unique: false });
        areasStore.createIndex('area_type', 'area_type', { unique: false });
        areasStore.createIndex('synced', 'synced', { unique: false });

        // Create next_steps store
        const stepsStore = db.createObjectStore('nextSteps', { keyPath: 'id', autoIncrement: true });
        stepsStore.createIndex('area_id', 'area_id', { unique: false });
        stepsStore.createIndex('user_id', 'user_id', { unique: false });

        // Create sync queue for offline changes
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('synced', 'synced', { unique: false });

        console.log('IndexedDB upgraded to version', this.version);
      };
    });
  }

  async saveArea(areaData) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['areas'], 'readwrite');
        const store = transaction.objectStore('areas');
        
        const data = {
          ...areaData,
          synced: false,
          lastModified: new Date().toISOString()
        };
        
        const request = store.put(data);
        request.onsuccess = () => resolve(data);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving area:', error);
      throw error;
    }
  }

  async getArea(areaId) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['areas'], 'readonly');
        const store = transaction.objectStore('areas');
        const request = store.get(areaId);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting area:', error);
      return null;
    }
  }

  async getAllAreas(userId) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['areas'], 'readonly');
        const store = transaction.objectStore('areas');
        const index = store.index('user_id');
        const request = index.getAll(userId);
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting all areas:', error);
      return [];
    }
  }

  async getAreaByType(userId, areaType) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['areas'], 'readonly');
        const store = transaction.objectStore('areas');
        const request = store.getAll();
        
        request.onsuccess = () => {
          const areas = request.result || [];
          const area = areas.find(a => a.user_id === userId && a.area_type === areaType);
          resolve(area);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting area by type:', error);
      return null;
    }
  }

  async saveNextStep(stepData) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['nextSteps'], 'readwrite');
        const store = transaction.objectStore('nextSteps');
        
        const request = store.put(stepData);
        request.onsuccess = () => resolve(stepData);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving next step:', error);
      throw error;
    }
  }

  async getNextSteps(areaId) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['nextSteps'], 'readonly');
        const store = transaction.objectStore('nextSteps');
        const index = store.index('area_id');
        const request = index.getAll(areaId);
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting next steps:', error);
      return [];
    }
  }

  async addToSyncQueue(operation) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        
        const data = {
          ...operation,
          timestamp: new Date().toISOString(),
          synced: false
        };
        
        const request = store.add(data);
        request.onsuccess = () => resolve(data);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async getUnsyncedOperations() {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['syncQueue'], 'readonly');
        const store = transaction.objectStore('syncQueue');
        const index = store.index('synced');
        const request = index.getAll(0);
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error getting unsynced operations:', error);
      return [];
    }
  }

  async markAsSynced(operationId) {
    try {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['syncQueue'], 'readwrite');
        const store = transaction.objectStore('syncQueue');
        const request = store.get(operationId);
        
        request.onsuccess = () => {
          const data = request.result;
          if (data) {
            data.synced = true;
            const updateRequest = store.put(data);
            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = () => reject(updateRequest.error);
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  }

  async clearDatabase() {
    try {
      await this.init();
      const stores = ['areas', 'nextSteps', 'syncQueue'];
      
      return Promise.all(stores.map(storeName => {
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }));
    } catch (error) {
      console.error('Error clearing database:', error);
    }
  }
}

export const offlineService = new OfflineService();