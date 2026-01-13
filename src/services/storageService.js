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
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncToCloud()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // ==================== IndexedDB Setup ====================
  async init() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      
      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized')
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
            console.log(`💾 Data saved to IndexedDB (needsSync: ${markAsNeedsSync})`)
            resolve(dataToSave)
            
            // Attempt background sync if online and needs sync
            if (this.isOnline && !this.syncInProgress && markAsNeedsSync) {
              // Don't await - let it run in background
              this.syncToCloud().catch(err => {
                console.log('Background sync failed, will retry later:', err)
              })
            }
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
          console.log('📖 Data loaded from IndexedDB')
          resolve(request.result.data)
        } else {
          resolve(null)
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  }

  async checkNeedsSync() {
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
  }

  async markAsSynced() {
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
  }

  // ==================== Smart Merge Logic ====================
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
        // Only exists locally - keep local
        merged[key] = local
      } else if (!local) {
        // Only exists in cloud - use cloud
        merged[key] = cloud
      } else {
        // Both exist - merge field by field
        merged[key] = {
          id: key,
          name: cloud.name,
          icon: cloud.icon,
          
          // Use most recent values based on last_modified from cloud
          goal: local.goal || cloud.goal,
          progress: Math.max(local.progress || 0, cloud.progress || 0), // Take highest progress
          timeSpent: Math.max(local.timeSpent || 0, cloud.timeSpent || 0), // Take highest time
          milestones: Math.max(local.milestones || 0, cloud.milestones || 0),
          streak: Math.max(local.streak || 0, cloud.streak || 0),
          
          // Merge nextSteps - combine both and deduplicate
          nextSteps: this.mergeNextSteps(local.nextSteps || [], cloud.nextSteps || [])
        }
      }
    }
    
    return merged
  }

  mergeNextSteps(localSteps, cloudSteps) {
    console.log('🔀 [MERGE] Merging steps:', {
        local: localSteps.length,
        cloud: cloudSteps.length
    })

    const stepMap = new Map()
    
    // Add cloud steps first (older) - ALWAYS use their ID
    cloudSteps.forEach(step => {
        const stepObj = typeof step === 'string' 
            ? { text: step, subtasks: [], completed: false, id: `temp-${Date.now()}-${Math.random()}` }
            : step
        
        // ALWAYS use the ID - don't fall back to text
        const key = stepObj.id
        
        if (!key) {
            console.warn('⚠️ Cloud step without ID:', stepObj)
            return
        }
        
        console.log('  Adding cloud step:', key, stepObj.text)
        stepMap.set(key, stepObj)
    })

    console.log('🔀 [MERGE] After cloud steps, map size:', stepMap.size)
    
    // Override/add with local steps (newer)
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
            // Merge: if local is completed or has more subtasks, prefer local
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
    
    const result = Array.from(stepMap.values())
    console.log('🔀 [MERGE] Final merged steps:', result.length)
    return result
}

  // ==================== Cloud Sync Operations ====================
  async syncToCloud() {
    if (this.syncInProgress) {
      console.log('⏳ [SYNC] Sync already in progress, skipping...')
      return { success: false, reason: 'sync_in_progress' }
    }

    // Set a timeout to force-reset syncInProgress if sync hangs
    const syncTimeout = setTimeout(() => {
      console.error('⚠️ [SYNC] Sync timed out after 30s, resetting...')
      this.syncInProgress = false
    }, 30000) // 30 second timeout

    try {
      this.syncInProgress = true
      console.log('🚀 [SYNC] Starting sync process...')
      
      // Step 1: Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('👤 [SYNC] Auth check:', { user: user?.id, error: authError })
      
      if (authError) {
        console.error('❌ [SYNC] Auth error:', authError)
        return { success: false, reason: 'auth_error', error: authError }
      }
      
      if (!user) {
        console.log('❌ [SYNC] No user authenticated')
        return { success: false, reason: 'no_user' }
      }

      // Step 2: Load local data
      const localData = await this.loadData()
      console.log('📦 [SYNC] Local data loaded:', Object.keys(localData || {}))
      
      if (!localData) {
        console.log('❌ [SYNC] No local data to sync')
        return { success: false, reason: 'no_local_data' }
      }

      // Step 3: Load cloud data
      console.log('☁️ [SYNC] Loading cloud data...')
      const cloudData = await this.loadFromCloud()
      console.log('☁️ [SYNC] Cloud data loaded:', Object.keys(cloudData || {}))
      
      // Step 4: Merge data
      const mergedData = cloudData 
        ? await this.mergeWithCloudData(localData, cloudData)
        : localData
      
      console.log('🔄 [SYNC] Data merged, syncing to cloud...')

      // Step 5: Sync each area
      let syncedCount = 0
      let errorCount = 0
      
      for (const [key, areaData] of Object.entries(mergedData)) {
        if (key === 'overall') continue

        try {
          console.log(`📝 [SYNC] Syncing area: ${key}`)
          
          // Check if area exists
          const { data: existingArea, error: selectError } = await supabase
            .from('areas')
            .select('id, progress, time_spent, milestones, streak, last_activity')
            .eq('user_id', user.id)
            .eq('area_type', key)
            .maybeSingle()

          if (selectError) {
            console.error(`❌ [SYNC] Error checking area ${key}:`, selectError)
            errorCount++
            continue
          }

          if (existingArea) {
            // Update existing area
            const updates = {
              name: areaData.name,
              icon: areaData.icon,
              goal: areaData.goal,
              progress: Math.max(areaData.progress || 0, existingArea.progress || 0),
              time_spent: Math.max(areaData.timeSpent || 0, existingArea.time_spent || 0),
              milestones: Math.max(areaData.milestones || 0, existingArea.milestones || 0),
              streak: Math.max(areaData.streak || 0, existingArea.streak || 0),
              last_activity: new Date().toISOString()
            }
            
            console.log(`✏️ [SYNC] Updating area ${key}:`, updates)
            
            const { error: updateError } = await supabase
              .from('areas')
              .update(updates)
              .eq('id', existingArea.id)

            if (updateError) {
              console.error(`❌ [SYNC] Error updating area ${key}:`, updateError)
              errorCount++
              continue
            }

            // Sync next steps
            console.log(`📋 [SYNC] Syncing ${areaData.nextSteps?.length || 0} steps for ${key}`)
            await this.syncNextSteps(existingArea.id, user.id, areaData.nextSteps || [])
            
            syncedCount++
            console.log(`✅ [SYNC] Successfully synced area: ${key}`)
          } else {
            // Create new area
            console.log(`➕ [SYNC] Creating new area: ${key}`)
            
            const { data: newArea, error: insertError } = await supabase
              .from('areas')
              .insert({
                user_id: user.id,
                area_type: key,
                name: areaData.name,
                icon: areaData.icon,
                goal: areaData.goal,
                progress: areaData.progress || 0,
                time_spent: areaData.timeSpent || 0,
                milestones: areaData.milestones || 0,
                streak: areaData.streak || 0,
                last_activity: new Date().toISOString()
              })
              .select()
              .single()

            if (insertError) {
              console.error(`❌ [SYNC] Error creating area ${key}:`, insertError)
              errorCount++
              continue
            }

            if (newArea) {
              console.log(`📋 [SYNC] Syncing ${areaData.nextSteps?.length || 0} steps for new area ${key}`)
              await this.syncNextSteps(newArea.id, user.id, areaData.nextSteps || [])
            }
            
            syncedCount++
            console.log(`✅ [SYNC] Successfully created area: ${key}`)
          }
        } catch (areaError) {
          console.error(`❌ [SYNC] Exception syncing area ${key}:`, areaError)
          errorCount++
        }
      }

      console.log(`📊 [SYNC] Sync summary: ${syncedCount} succeeded, ${errorCount} failed`)

      // Step 6: Save merged data locally and mark as synced
      if (errorCount === 0) {
        console.log('💾 [SYNC] Saving merged data locally...')
        // Don't mark as needs sync when saving after successful sync
        await this.saveData(mergedData, false)
        
        console.log('✅ [SYNC] Marking as synced...')
        await this.markAsSynced()
        
        console.log('🧹 [SYNC] Clearing pending changes...')
        await this.clearPendingChanges()
        
        console.log('🎉 [SYNC] Smart sync complete - SUCCESS')
        return { success: true, syncedCount, errorCount: 0 }
      } else {
        console.log('⚠️ [SYNC] Sync completed with errors - NOT marking as synced')
        return { success: false, reason: 'partial_sync', syncedCount, errorCount }
      }
      
    } catch (error) {
      console.error('❌ [SYNC] Fatal sync error:', error)
      console.error('❌ [SYNC] Error stack:', error.stack)
      return { success: false, reason: 'fatal_error', error }
    } finally {
      clearTimeout(syncTimeout) // Clear the timeout
      this.syncInProgress = false
      console.log('🏁 [SYNC] Sync process ended')
    }
  }

  async syncNextSteps(areaId, userId, nextSteps) {
    try {
      console.log(`  📋 [SYNC-STEPS] Starting sync for area ${areaId}, ${nextSteps.length} steps`)
      
      // Get existing steps from cloud
      const { data: existingSteps, error: selectError } = await supabase
        .from('next_steps')
        .select('id, content, completed, subtasks, order_index')
        .eq('area_id', areaId)

      if (selectError) {
        console.error('  ❌ [SYNC-STEPS] Error fetching existing steps:', selectError)
        throw selectError
      }

      console.log(`  📋 [SYNC-STEPS] Found ${existingSteps?.length || 0} existing steps`)

      const existingMap = new Map()
      if (existingSteps) {
        existingSteps.forEach(step => {
          existingMap.set(step.content, step)
        })
      }

      const stepsToUpdate = []
      const stepsToInsert = []
      const processedContents = new Set()

      // Process new/updated steps
      nextSteps.forEach((step, index) => {
        const stepObj = typeof step === 'string' 
          ? { text: step, subtasks: [], completed: false }
          : step

        const content = stepObj.text || step
        processedContents.add(content)

        const existing = existingMap.get(content)
        if (existing) {
          stepsToUpdate.push({
            id: existing.id,
            content: content,
            completed: stepObj.completed || existing.completed,
            subtasks: stepObj.subtasks?.length > (existing.subtasks?.length || 0)
              ? stepObj.subtasks
              : existing.subtasks,
            order_index: index
          })
        } else {
          stepsToInsert.push({
            area_id: areaId,
            user_id: userId,
            content: content,
            completed: stepObj.completed || false,
            subtasks: stepObj.subtasks || [],
            order_index: index
          })
        }
      })

      // Delete removed steps
      const stepsToDelete = []
      existingMap.forEach((step, content) => {
        if (!processedContents.has(content)) {
          stepsToDelete.push(step.id)
        }
      })

      console.log(`  📊 [SYNC-STEPS] Plan: ${stepsToUpdate.length} updates, ${stepsToInsert.length} inserts, ${stepsToDelete.length} deletes`)

      if (stepsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('next_steps')
          .delete()
          .in('id', stepsToDelete)
        
        if (deleteError) {
          console.error('  ❌ [SYNC-STEPS] Delete error:', deleteError)
          throw deleteError
        }
        console.log(`  ✅ [SYNC-STEPS] Deleted ${stepsToDelete.length} steps`)
      }

      // Update existing steps
      for (const step of stepsToUpdate) {
        const { error: updateError } = await supabase
          .from('next_steps')
          .update({
            content: step.content,
            completed: step.completed,
            subtasks: step.subtasks,
            order_index: step.order_index
          })
          .eq('id', step.id)
        
        if (updateError) {
          console.error('  ❌ [SYNC-STEPS] Update error:', updateError)
          throw updateError
        }
      }
      
      if (stepsToUpdate.length > 0) {
        console.log(`  ✅ [SYNC-STEPS] Updated ${stepsToUpdate.length} steps`)
      }

      // Insert new steps
      if (stepsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('next_steps')
          .insert(stepsToInsert)
        
        if (insertError) {
          console.error('  ❌ [SYNC-STEPS] Insert error:', insertError)
          throw insertError
        }
        console.log(`  ✅ [SYNC-STEPS] Inserted ${stepsToInsert.length} steps`)
      }
      
      console.log(`  ✅ [SYNC-STEPS] Steps sync complete for area ${areaId}`)
    } catch (error) {
      console.error('  ❌ [SYNC-STEPS] Fatal error syncing steps:', error)
      throw error
    }
  }

  async loadFromCloud() {
    try {
      console.log('☁️ [LOAD] Loading data from Supabase...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ [LOAD] No user')
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

      if (error) {
        console.error('❌ [LOAD] Error loading from cloud:', error)
        return null
      }
      
      if (!areas) {
        console.log('❌ [LOAD] No areas found')
        return null
      }

      console.log(`☁️ [LOAD] Loaded ${areas.length} areas from cloud`)

      // Convert to local format
      const convertedData = {}
      
      areas.forEach(area => {
        const stepCount = area.next_steps?.length || 0
        console.log(`  📋 [LOAD] Area ${area.area_type}: ${stepCount} steps`)
        
        // Log first and last step to verify
        if (area.next_steps && area.next_steps.length > 0) {
          console.log(`    First step:`, area.next_steps[0].content)
          console.log(`    Last step:`, area.next_steps[area.next_steps.length - 1].content)
        }
        
        convertedData[area.area_type] = {
          id: area.area_type,
          name: area.name,
          icon: area.icon,
          goal: area.goal,
          progress: area.progress,
          timeSpent: area.time_spent,
          milestones: area.milestones,
          streak: area.streak,
          nextSteps: area.next_steps
            .sort((a, b) => a.order_index - b.order_index)
            .map(step => {
                console.log('Processing step:', step);
                return {
                id: step.id, // This should be the Supabase database ID (number)
                text: step.content,
                subtasks: Array.isArray(step.subtasks) ? step.subtasks : [],
                completed: step.completed || false
                };
            })
        }
        
        console.log(`  ✅ Converted ${area.area_type}:`, convertedData[area.area_type].nextSteps.length, 'steps')
      })

      // Add overall
      convertedData.overall = {
        id: 'overall',
        name: 'Overall',
        icon: '🎯',
        goal: 'Become the best version of myself',
        progress: 0,
        timeSpent: 0,
        milestones: 0,
        streak: 0,
        nextSteps: []
      }

      console.log('✅ [LOAD] Cloud data converted successfully')
      return convertedData
    } catch (error) {
      console.error('❌ [LOAD] Fatal error loading from cloud:', error)
      return null
    }
  }

  // ==================== Initialization ====================
  async initialize() {
    try {
      await this.init()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('👤 User authenticated')
        
        if (this.isOnline) {
          console.log('🌐 Online - loading from cloud first')
          
          // Load from cloud first
          const cloudData = await this.loadFromCloud()
          
          if (cloudData) {
            // Check if we have local data
            const localData = await this.loadData()
            
            if (localData) {
              // Check if local has unsaved changes
              const needsSync = await this.checkNeedsSync()
              
              if (needsSync) {
                console.log('⚠️ Local has unsaved changes, merging with cloud')
                // Merge local changes with cloud data
                const mergedData = await this.mergeWithCloudData(localData, cloudData)
                
                // Save merged data (still needs sync since local had changes)
                await this.saveData(mergedData, true)
                
                // Keep needsSync true since we have local changes
                return mergedData
              } else {
                console.log('✅ Local is synced, using cloud data')
                // Local is synced, use cloud as source of truth
                await this.saveData(cloudData, false)
                await this.markAsSynced()
                return cloudData
              }
            } else {
              console.log('📥 No local data, using cloud data')
              // No local data, use cloud
              await this.saveData(cloudData, false)
              await this.markAsSynced()
              return cloudData
            }
          } else {
            console.log('❌ Failed to load from cloud, checking local')
            // Cloud load failed, fall back to local
            const localData = await this.loadData()
            if (localData) {
              return localData
            } else {
              console.log('🆕 No data anywhere, creating defaults')
              const defaults = this.getDefaultData()
              await this.saveData(defaults, false)
              return defaults
            }
          }
        } else {
          console.log('📴 Offline - using local data only')
          // Offline, use local data
          const localData = await this.loadData()
          if (localData) {
            return localData
          } else {
            const defaults = this.getDefaultData()
            await this.saveData(defaults, false)
            return defaults
          }
        }
      } else {
        console.log('👤 No user, using local data')
        
        const localData = await this.loadData()
        if (!localData) {
          const defaults = this.getDefaultData()
          await this.saveData(defaults, false)
          return defaults
        }
        return localData
      }
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
        icon: '�',
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