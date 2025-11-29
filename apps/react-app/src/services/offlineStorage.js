/**
 * Offline-First Storage using IndexedDB
 * Enables offline reading of posts, communities, and user data
 */

class OfflineStorage {
  constructor() {
    this.dbName = 'cryb_offline_db'
    this.dbVersion = 1
    this.db = null
    this.isSupported = typeof indexedDB !== 'undefined'
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    if (!this.isSupported) {
      console.warn('IndexedDB not supported in this browser')
      return false
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => {
        console.error('Failed to open IndexedDB')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // Create object stores
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' })
          postsStore.createIndex('communityName', 'communityName', { unique: false })
          postsStore.createIndex('createdAt', 'createdAt', { unique: false })
        }

        if (!db.objectStoreNames.contains('communities')) {
          const communitiesStore = db.createObjectStore('communities', { keyPath: 'id' })
          communitiesStore.createIndex('name', 'name', { unique: true })
        }

        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' })
          commentsStore.createIndex('postId', 'postId', { unique: false })
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' })
        }
      }
    })
  }

  /**
   * Save posts to offline storage
   */
  async savePosts(posts) {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['posts'], 'readwrite')
      const store = transaction.objectStore('posts')

      posts.forEach(post => {
        store.put({
          ...post,
          _cachedAt: Date.now()
        })
      })

      transaction.oncomplete = () => {
        console.log(`Saved ${posts.length} posts to offline storage`)
        resolve(true)
      }

      transaction.onerror = () => {
        console.error('Failed to save posts to offline storage')
        reject(transaction.error)
      }
    })
  }

  /**
   * Get posts from offline storage
   */
  async getPosts(options = {}) {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['posts'], 'readonly')
      const store = transaction.objectStore('posts')

      let request

      if (options.communityName) {
        const index = store.index('communityName')
        request = index.getAll(options.communityName)
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => {
        let posts = request.result || []

        // Apply limit
        if (options.limit) {
          posts = posts.slice(0, options.limit)
        }

        console.log(`Retrieved ${posts.length} posts from offline storage`)
        resolve(posts)
      }

      request.onerror = () => {
        console.error('Failed to get posts from offline storage')
        reject(request.error)
      }
    })
  }

  /**
   * Save communities to offline storage
   */
  async saveCommunities(communities) {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['communities'], 'readwrite')
      const store = transaction.objectStore('communities')

      communities.forEach(community => {
        store.put({
          ...community,
          _cachedAt: Date.now()
        })
      })

      transaction.oncomplete = () => {
        console.log(`Saved ${communities.length} communities to offline storage`)
        resolve(true)
      }

      transaction.onerror = () => {
        console.error('Failed to save communities to offline storage')
        reject(transaction.error)
      }
    })
  }

  /**
   * Get communities from offline storage
   */
  async getCommunities() {
    if (!this.db) await this.init()
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['communities'], 'readonly')
      const store = transaction.objectStore('communities')
      const request = store.getAll()

      request.onsuccess = () => {
        const communities = request.result || []
        console.log(`Retrieved ${communities.length} communities from offline storage`)
        resolve(communities)
      }

      request.onerror = () => {
        console.error('Failed to get communities from offline storage')
        reject(request.error)
      }
    })
  }

  /**
   * Save single post
   */
  async savePost(post) {
    return this.savePosts([post])
  }

  /**
   * Get single post by ID
   */
  async getPost(id) {
    if (!this.db) await this.init()
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['posts'], 'readonly')
      const store = transaction.objectStore('posts')
      const request = store.get(id)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  /**
   * Clear all offline data
   */
  async clearAll() {
    if (!this.db) await this.init()
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        ['posts', 'communities', 'users', 'comments', 'metadata'],
        'readwrite'
      )

      const stores = ['posts', 'communities', 'users', 'comments', 'metadata']
      stores.forEach(storeName => {
        transaction.objectStore(storeName).clear()
      })

      transaction.oncomplete = () => {
        console.log('Cleared all offline storage')
        resolve(true)
      }

      transaction.onerror = () => {
        console.error('Failed to clear offline storage')
        reject(transaction.error)
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.db) await this.init()
    if (!this.db) return {}

    const stats = {}

    const stores = ['posts', 'communities', 'users', 'comments']

    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const count = await new Promise((resolve) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => resolve(0)
      })

      stats[storeName] = count
    }

    return stats
  }

  /**
   * Check if offline mode is active
   */
  isOffline() {
    return !navigator.onLine
  }
}

// Singleton instance
const offlineStorage = new OfflineStorage()

// Initialize on load
if (typeof window !== 'undefined') {
  offlineStorage.init().catch(console.error)
}

export default offlineStorage
