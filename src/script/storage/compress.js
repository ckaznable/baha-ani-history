export class CompressedStorage {
  constructor() {
    this.CHUNK_SIZE_LIMIT = 1024 * 7
    this.cache = new Map()
    this.cacheTimeout = 5000

    // 根據環境變數決定使用的 storage 類型
    this.storage = process.env.NODE_ENV === "development" 
      ? chrome.storage.local 
      : chrome.storage.sync
  }

  getStorageKey(baseKey, chunk) {
    return `${baseKey}:${chunk}`
  }

  compressNumbers(numbers) {
    if (!numbers.length) {
      return ""
    }
    
    numbers.sort((a, b) => a - b)
    const ranges = []
    let start = numbers[0]
    let prev = numbers[0]
    
    for (let i = 1; i <= numbers.length; i++) {
      if (i === numbers.length || numbers[i] !== prev + 1) {
        ranges.push(start === prev ? start.toString() : `${start}-${prev}`)
        if (i < numbers.length) {
          start = numbers[i]
          prev = numbers[i]
        }
      } else {
        prev = numbers[i]
      }
    }
    
    return ranges.join(",")
  }

  decompressNumbers(compressed) {
    if (!compressed) {
      return []
    }
    
    return compressed.split(",").reduce((numbers, range) => {
      const [start, end] = range.split("-").map(Number)
      if (!end) {
        numbers.push(start)
      } else {
        for (let i = start; i <= end; i++) {
          numbers.push(i)
        }
      }
      return numbers
    }, [])
  }

  getAllChunks(baseKey) {
    const now = Date.now()
    const cached = this.cache.get(baseKey)
    
    if (cached && (now - cached.timestamp < this.cacheTimeout)) {
      return Promise.resolve(cached.data)
    }

    return new Promise((resolve) => {
      this.storage.get(null, (result) => {
        const chunks = {}
        for (const key in result) {
          if (key.startsWith(`${baseKey}:`)) {
            chunks[key] = result[key]
          }
        }
        
        this.cache.set(baseKey, {
          data: chunks,
          timestamp: now
        })
        
        resolve(chunks)
      })
    })
  }

  async reorganizeChunks(baseKey, numbers) {
    const compressed = this.compressNumbers(numbers)
    
    const chunks = {}
    let currentChunk = ""
    let chunkIndex = 0
    
    for (const range of compressed.split(",")) {
      const testChunk = currentChunk ? `${currentChunk},${range}` : range
      
      if (testChunk.length > this.CHUNK_SIZE_LIMIT) {
        if (currentChunk) {
          chunks[this.getStorageKey(baseKey, chunkIndex)] = currentChunk
          chunkIndex++
          currentChunk = range
        } else {
          chunks[this.getStorageKey(baseKey, chunkIndex)] = range
          chunkIndex++
        }
      } else {
        currentChunk = testChunk
      }
    }
    
    if (currentChunk) {
      chunks[this.getStorageKey(baseKey, chunkIndex)] = currentChunk
    }

    // 刪除舊的 chunks
    const oldChunks = await this.getAllChunks(baseKey)
    const oldKeys = Object.keys(oldChunks)
    if (oldKeys.length > 0) {
      await new Promise(resolve => {
        this.storage.remove(oldKeys, () => resolve())
      })
    }

    // 儲存新的 chunks
    if (Object.keys(chunks).length > 0) {
      await new Promise(resolve => {
        this.storage.set(chunks, () => resolve())
      })
    }

    // 更新快取
    this.cache.set(baseKey, {
      data: chunks,
      timestamp: Date.now()
    })
  }

  async includes(baseKey, id) {
    const chunks = await this.getAllChunks(baseKey)
    
    return Object.values(chunks).some(chunk => {
      return chunk.split(',').some(range => {
        const [start, end] = range.split('-').map(Number)
        if (!end) {
          return start === id
        }
        return id >= start && id <= end
      })
    })
  }

  async set(baseKey, id) {
    const chunks = await this.getAllChunks(baseKey)
    const numbers = Object.values(chunks).flatMap(chunk => this.decompressNumbers(chunk))
    
    if (!numbers.includes(id)) {
      numbers.push(id)
      await this.reorganizeChunks(baseKey, numbers)
    }
  }

  async delete(baseKey, id) {
    const chunks = await this.getAllChunks(baseKey)
    const numbers = Object.values(chunks).flatMap(chunk => this.decompressNumbers(chunk))
    
    const index = numbers.indexOf(id)
    if (index !== -1) {
      numbers.splice(index, 1)
      if (numbers.length > 0) {
        await this.reorganizeChunks(baseKey, numbers)
      } else {
        const keys = Object.keys(chunks)
        if (keys.length > 0) {
          await new Promise(resolve => {
            this.storage.remove(keys, () => resolve())
          })
        }
      }
    }
  }

  async getAll(baseKey) {
    const chunks = await this.getAllChunks(baseKey)
    return Object.values(chunks)
      .flatMap(chunk => this.decompressNumbers(chunk))
      .sort((a, b) => a - b)
  }

  async getDebugInfo(baseKey) {
    const chunks = await this.getAllChunks(baseKey)
    const totalSize = Object.values(chunks)
      .reduce((sum, chunk) => sum + chunk.length, 0)
    const numberCount = Object.values(chunks)
      .flatMap(chunk => this.decompressNumbers(chunk))
      .length

    return {
      chunks,
      totalSize,
      numberCount
    }
  }

  clearCache(baseKey) {
    this.cache.delete(baseKey)
  }

  clearAllCache() {
    this.cache.clear()
  }

  /**
   * 將字串陣列轉換為壓縮格式並儲存
   * @param {string} baseKey - 儲存的基礎鍵值
   * @param {string[]} items - 要遷移的數字字串陣列
   * @returns {Promise<void>}
   */
  async migrate(baseKey, items) {
    if (!Array.isArray(items)) {
      throw new Error('輸入必須是陣列')
    }

    // 將字串轉換為數字並過濾掉無效值
    const numbers = items
      .map(item => parseInt(item, 10))
      .filter(num => !isNaN(num))
    
    // 使用現有的 reorganizeChunks 方法來儲存
    await this.reorganizeChunks(baseKey, numbers)
  }
}