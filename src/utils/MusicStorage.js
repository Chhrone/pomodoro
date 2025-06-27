/**
 * MusicStorage - Efficient storage for user music files using IndexedDB
 * Avoids localStorage quota issues by storing large audio files in IndexedDB
 */

export class MusicStorage {
  constructor() {
    this.dbName = 'PomodoroMusicDB'
    this.dbVersion = 1
    this.storeName = 'musicFiles'
    this.db = null
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('MusicStorage: IndexedDB initialized successfully')
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object store for music files
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('addedDate', 'addedDate', { unique: false })
        }
      }
    })
  }

  /**
   * Store music file in IndexedDB
   */
  async storeFile(id, fileData, metadata) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const fileRecord = {
        id: id,
        data: fileData, // base64 or blob data
        metadata: metadata,
        storedAt: new Date().toISOString()
      }

      const request = store.put(fileRecord)

      request.onsuccess = () => {
        console.log(`MusicStorage: Stored file ${id} in IndexedDB`)
        resolve(id)
      }

      request.onerror = () => {
        console.error('Failed to store file in IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Retrieve music file from IndexedDB
   */
  async getFile(id) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        console.error('Failed to retrieve file from IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get all stored music files metadata
   */
  async getAllFiles() {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        console.error('Failed to get all files from IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Delete music file from IndexedDB
   */
  async deleteFile(id) {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log(`MusicStorage: Deleted file ${id} from IndexedDB`)
        resolve(true)
      }

      request.onerror = () => {
        console.error('Failed to delete file from IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Clear all stored music files
   */
  async clearAll() {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        console.log('MusicStorage: Cleared all files from IndexedDB')
        resolve(true)
      }

      request.onerror = () => {
        console.error('Failed to clear IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage
        }
      }
    } catch (error) {
      console.warn('Could not get storage estimate:', error)
    }
    
    return null
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported() {
    return 'indexedDB' in window
  }

  /**
   * Cleanup and close database connection
   */
  destroy() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
