// src/services/storageService.js
import { supabase } from '../lib/supabase.js'

class StorageService {
  constructor() {
    this.dbName = 'DreamBuilderDB'
    this.version = 4
    this.db = null
    this.syncInProgress = false
    this.isOnline = navigator.onLine
    this.pendingSave = null // For debouncing saves
    
    // CLOUD SYNC DISABLED - Commenting out online/offline listeners
    /*
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncToCloud()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    */
  }

  // ==================== IndexedDB Setup ====================
  async init() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized (OFFLINE MODE)')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Clear old stores
        const storeNames = ['fields', 'areas', 'nextSteps', 'syncQueue', 'dreamData']
        storeNames.forEach(name => {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name)
          }
        })

        // Create store with field-level timestamps
        const dataStore = db.createObjectStore('dreamData', { keyPath: 'id' })
        dataStore.createIndex('needsSync', 'needsSync', { unique: false })
        
        // Store for tracking field-level changes
        const changesStore = db.createObjectStore('pendingChanges', { keyPath: 'id', autoIncrement: true })
        changesStore.createIndex('timestamp', 'timestamp', { unique: false })
        changesStore.createIndex('synced', 'synced', { unique: false })

        console.log('✅ IndexedDB stores created')
      }
    })
  }

  // ==================== Local Data Operations ====================
  async saveData(data, markAsNeedsSync = true) {
    await this.init()
    
    // Debounce saves to prevent rapid-fire updates
    if (this.pendingSave) {
      clearTimeout(this.pendingSave)
    }
    
    return new Promise((resolve) => {
      this.pendingSave = setTimeout(async () => {
        try {
          const transaction = this.db.transaction(['dreamData'], 'readwrite')
          const store = transaction.objectStore('dreamData')
          
          const dataToSave = {
            id: 'userData',
            data: data,
            lastModified: Date.now(),
            needsSync: markAsNeedsSync
          }
          
          const request = store.put(dataToSave)
          
          request.onsuccess = () => {
            console.log(`💾 Data saved to IndexedDB (OFFLINE MODE)`)
            resolve(dataToSave)
            
            // CLOUD SYNC DISABLED - Comment out background sync
            /*
            if (this.isOnline && !this.syncInProgress && markAsNeedsSync) {
              this.syncToCloud().catch(err => {
                console.log('Background sync failed, will retry later:', err)
              })
            }
            */
          }
          
          request.onerror = () => {
            console.error('Error saving data:', request.error)
            resolve({ error: request.error })
          }
        } catch (error) {
          console.error('Error in saveData:', error)
          resolve({ error })
        }
        
        this.pendingSave = null
      }, 300) // 300ms debounce
    })
  }

  // Track individual field changes with timestamps
  async trackChange(fieldId, fieldName, value) {
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingChanges'], 'readwrite')
      const store = transaction.objectStore('pendingChanges')
      
      const change = {
        fieldId: fieldId,
        fieldName: fieldName,
        value: value,
        timestamp: Date.now(),
        synced: false
      }
      
      const request = store.add(change)
      request.onsuccess = () => resolve(change)
      request.onerror = () => reject(request.error)
    })
  }

  async getPendingChanges() {
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingChanges'], 'readonly')
      const store = transaction.objectStore('pendingChanges')
      const index = store.index('synced')
      const request = index.getAll(false)
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async clearPendingChanges() {
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pendingChanges'], 'readwrite')
      const store = transaction.objectStore('pendingChanges')
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async loadData() {
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dreamData'], 'readonly')
      const store = transaction.objectStore('dreamData')
      const request = store.get('userData')
      
      request.onsuccess = () => {
        if (request.result) {
          console.log('📖 Data loaded from IndexedDB (OFFLINE MODE)')
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async checkNeedsSync() {
    // CLOUD SYNC DISABLED - Always return false
    return false
    
    /*
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dreamData'], 'readonly')
      const store = transaction.objectStore('dreamData')
      const request = store.get('userData')
      
      request.onsuccess = () => {
        resolve(request.result?.needsSync || false)
      }
      
      request.onerror = () => reject(request.error)
    })
    */
  }

  async markAsSynced() {
    // CLOUD SYNC DISABLED - No-op
    console.log('✅ Marked as synced (OFFLINE MODE - no cloud sync)')
    return
    
    /*
    await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['dreamData'], 'readwrite')
      const store = transaction.objectStore('dreamData')
      const getRequest = store.get('userData')
      
      getRequest.onsuccess = () => {
        const data = getRequest.result
        if (data) {
          data.needsSync = false
          const putRequest = store.put(data)
          putRequest.onsuccess = () => {
            console.log('✅ Marked as synced')
            resolve()
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      
      getRequest.onerror = () => reject(getRequest.error)
    })
    */
  }

  // ==================== Smart Merge Logic (DISABLED) ====================
  /*
  async mergeWithCloudData(localData, cloudData) {
    const merged = {}
    const allKeys = new Set([...Object.keys(localData), ...Object.keys(cloudData)])
    
    for (const key of allKeys) {
      if (key === 'overall') {
        merged[key] = localData[key] || cloudData[key]
        continue
      }
      
      const local = localData[key]
      const cloud = cloudData[key]
      
      if (!cloud) {
        merged[key] = local
      } else if (!local) {
        merged[key] = cloud
      } else {
        merged[key] = {
          id: key,
          name: cloud.name,
          icon: cloud.icon,
          goal: local.goal || cloud.goal,
          progress: Math.max(local.progress || 0, cloud.progress || 0),
          timeSpent: Math.max(local.timeSpent || 0, cloud.timeSpent || 0),
          milestones: Math.max(local.milestones || 0, cloud.milestones || 0),
          streak: Math.max(local.streak || 0, cloud.streak || 0),
          nextSteps: this.mergeNextSteps(local.nextSteps || [], cloud.nextSteps || [])
        }
      }
    }
    
    return merged
  }

  mergeNextSteps(localSteps, cloudSteps) {
    const stepMap = new Map()
    
    cloudSteps.forEach(step => {
      const stepObj = typeof step === 'string' 
        ? { text: step, subtasks: [], completed: false, id: `temp-${Date.now()}-${Math.random()}` }
        : step
      
      const key = stepObj.id
      
      if (!key) {
        console.warn('⚠️ Cloud step without ID:', stepObj)
        return
      }
      
      stepMap.set(key, stepObj)
    })
    
    localSteps.forEach(step => {
      const stepObj = typeof step === 'string'
        ? { text: step, subtasks: [], completed: false, id: `temp-${Date.now()}-${Math.random()}` }
        : step
      
      const key = stepObj.id
      
      if (!key) {
        console.warn('⚠️ Local step without ID:', stepObj)
        return
      }
      
      const existing = stepMap.get(key)
      if (existing) {
        stepMap.set(key, {
          ...existing,
          completed: stepObj.completed || existing.completed,
          subtasks: stepObj.subtasks?.length > existing.subtasks?.length 
            ? stepObj.subtasks 
            : existing.subtasks
        })
      } else {
        stepMap.set(key, stepObj)
      }
    })
    
    return Array.from(stepMap.values())
  }
  */

  // ==================== Cloud Sync Operations (DISABLED) ====================
  async syncToCloud() {
    console.log('🚫 Cloud sync is disabled (OFFLINE MODE)')
    return { success: false, reason: 'sync_disabled' }
    
    /*
    // ALL CLOUD SYNC CODE COMMENTED OUT
    if (this.syncInProgress) {
      console.log('⏳ [SYNC] Sync already in progress, skipping...')
      return { success: false, reason: 'sync_in_progress' }
    }

    const syncTimeout = setTimeout(() => {
      console.error('⚠️ [SYNC] Sync timed out after 30s, resetting...')
      this.syncInProgress = false
    }, 30000)

    try {
      this.syncInProgress = true
      console.log('🚀 [SYNC] Starting sync process...')
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, reason: 'auth_error' }
      }

      const localData = await this.loadData()
      
      if (!localData) {
        return { success: false, reason: 'no_local_data' }
      }

      // ... rest of sync code ...
      
    } catch (error) {
      console.error('❌ [SYNC] Fatal sync error:', error)
      return { success: false, reason: 'fatal_error', error }
    } finally {
      clearTimeout(syncTimeout)
      this.syncInProgress = false
    }
    */
  }

  async syncNextSteps(areaId, userId, nextSteps) {
    console.log('🚫 Next steps sync is disabled (OFFLINE MODE)')
    return
    
    /*
    // ALL NEXT STEPS SYNC CODE COMMENTED OUT
    try {
      console.log(`  📋 [SYNC-STEPS] Starting sync for area ${areaId}`)
      
      const { data: existingSteps, error: selectError } = await supabase
        .from('next_steps')
        .select('id, content, completed, subtasks, order_index')
        .eq('area_id', areaId)

      // ... rest of sync steps code ...
      
    } catch (error) {
      console.error('  ❌ [SYNC-STEPS] Fatal error syncing steps:', error)
      throw error
    }
    */
  }

  async loadFromCloud() {
    console.log('🚫 Cloud loading is disabled (OFFLINE MODE)')
    return null
    
    /*
    // ALL CLOUD LOADING CODE COMMENTED OUT
    try {
      console.log('☁️ [LOAD] Loading data from Supabase...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data: areas, error } = await supabase
        .from('areas')
        .select(`
          *,
          next_steps (
            id,
            content,
            order_index,
            completed,
            subtasks
          )
        `)
        .eq('user_id', user.id)
        .order('area_type')

      // ... rest of cloud loading code ...
      
    } catch (error) {
      console.error('❌ [LOAD] Fatal error loading from cloud:', error)
      return null
    }
    */
  }

  // ==================== Initialization ====================
  async initialize() {
    try {
      await this.init()
      
      console.log('📱 Initializing in OFFLINE MODE')
      
      // CLOUD SYNC DISABLED - Always use local data only
      const localData = await this.loadData()
      
      if (localData) {
        console.log('✅ Using existing local data')
        return localData
      } else {
        console.log('🆕 No local data, creating defaults')
        const defaults = this.getDefaultData()
        await this.saveData(defaults, false)
        return defaults
      }
      
      /*
      // ORIGINAL CLOUD-ENABLED CODE COMMENTED OUT
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('👤 User authenticated')
        
        if (this.isOnline) {
          console.log('🌐 Online - loading from cloud first')
          
          const cloudData = await this.loadFromCloud()
          
          // ... rest of cloud initialization ...
        } else {
          console.log('🔴 Offline - using local data only')
          const localData = await this.loadData()
          // ...
        }
      } else {
        console.log('👤 No user, using local data')
        // ...
      }
      */
      
    } catch (error) {
      console.error('❌ Initialization error:', error)
      const localData = await this.loadData()
      if (localData) {
        return localData
      }
      const defaults = this.getDefaultData()
      await this.saveData(defaults, false)
      return defaults
    }
  }

  getDefaultData() {
    return {
      overall: {
        id: 'overall',
        name: 'Overall',
        icon: '🎯',
        goal: 'Become the best version of myself',
        progress: 0,
        timeSpent: 0,
        milestones: 0,
        streak: 0,
        nextSteps: []
      },
      business: {
        id: 'business',
        name: 'Business',
        icon: '💼',
        goal: 'Make a $1,000,000',
        progress: 25,
        timeSpent: 120,
        milestones: 5,
        streak: 12,
        nextSteps: [
          { 
            id: 'biz-1',
            text: 'Get resort client', 
            subtasks: [
              { id: 'biz-1-sub-1', text: 'Research resort websites', completed: false },
              { id: 'biz-1-sub-2', text: 'Prepare pitch deck', completed: false }
            ], 
            completed: false 
          },
          { 
            id: 'biz-2',
            text: 'Find business thesis idea', 
            subtasks: [], 
            completed: false 
          }
        ]
      },
      tech: {
        id: 'tech',
        name: 'Tech',
        icon: '⚡',
        progress: 0,
        timeSpent: 0,
        goal: 'Master full-stack development',
        nextSteps: [
          { id: 'tech-1', text: 'Develop Fullstack App', subtasks: [], completed: false },
          { id: 'tech-2', text: 'Find Full-time Gig', subtasks: [], completed: false }
        ],
        milestones: 0,
        streak: 0
      },
      physical: {
        id: 'physical',
        name: 'Physical',
        icon: '💪',
        progress: 0,
        timeSpent: 0,
        goal: 'Run a half marathon',
        nextSteps: [
          { id: 'phys-1', text: 'Increase weekly mileage to 30km', subtasks: [], completed: false }
        ],
        milestones: 0,
        streak: 0
      },
      social: {
        id: 'social',
        name: 'Social',
        icon: '🤝',
        progress: 0,
        timeSpent: 0,
        goal: 'Build meaningful connections',
        nextSteps: [
          { id: 'soc-1', text: 'Attend networking events', subtasks: [], completed: false }
        ],
        milestones: 0,
        streak: 0
      },
      misc: {
        id: 'misc',
        name: 'Misc',
        icon: '✨',
        progress: 0,
        timeSpent: 0,
        goal: 'Creative expression',
        nextSteps: [
          { id: 'misc-1', text: 'Practice guitar', subtasks: [], completed: false }
        ],
        milestones: 0,
        streak: 0
      }
    }
  }
}

export const storageService = new StorageService()