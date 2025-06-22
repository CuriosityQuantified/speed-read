import { SavedText } from '../types'
import { ErrorHandler } from './errorHandler'

const STORAGE_KEY = 'rsvp-saved-texts'
const MAX_SAVED_TEXTS = 20

export class StorageManager {
  private static getAll(): SavedText[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      ErrorHandler.handleError(ErrorHandler.handleStorageError(error))
      return []
    }
  }

  private static setAll(texts: SavedText[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(texts))
    } catch (error: any) {
      const appError = ErrorHandler.handleStorageError(error)
      ErrorHandler.handleError(appError)
      
      // Handle quota exceeded error by removing oldest
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        if (texts.length > 1) {
          const sortedTexts = texts.sort((a, b) => b.updatedAt - a.updatedAt)
          sortedTexts.pop()
          this.setAll(sortedTexts)
        }
      } else {
        throw error // Re-throw for non-recoverable errors
      }
    }
  }

  static save(text: Omit<SavedText, 'id' | 'createdAt' | 'updatedAt'>): SavedText {
    const texts = this.getAll()
    
    const newText: SavedText = {
      ...text,
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // Add new text to beginning
    texts.unshift(newText)

    // Enforce max limit (FIFO eviction)
    if (texts.length > MAX_SAVED_TEXTS) {
      texts.splice(MAX_SAVED_TEXTS)
    }

    this.setAll(texts)
    return newText
  }

  static update(id: string, updates: Partial<SavedText>): SavedText | null {
    const texts = this.getAll()
    const index = texts.findIndex(t => t.id === id)
    
    if (index === -1) return null

    texts[index] = {
      ...texts[index],
      ...updates,
      updatedAt: Date.now()
    }

    this.setAll(texts)
    return texts[index]
  }

  static delete(id: string): boolean {
    const texts = this.getAll()
    const filteredTexts = texts.filter(t => t.id !== id)
    
    if (filteredTexts.length === texts.length) return false
    
    this.setAll(filteredTexts)
    return true
  }

  static get(id: string): SavedText | null {
    const texts = this.getAll()
    return texts.find(t => t.id === id) || null
  }

  static list(): SavedText[] {
    return this.getAll()
  }

  static updatePosition(id: string, position: number): void {
    this.update(id, { lastPosition: position })
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  static getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      // Estimate storage usage
      const texts = this.getAll()
      const dataSize = new Blob([JSON.stringify(texts)]).size
      const estimatedMax = 5 * 1024 * 1024 // 5MB estimate for localStorage
      
      return {
        used: dataSize,
        available: estimatedMax - dataSize,
        percentage: (dataSize / estimatedMax) * 100
      }
    } catch {
      return { used: 0, available: 0, percentage: 0 }
    }
  }
}

// Helper function to generate title from content
export function generateTitle(content: string, maxLength: number = 30): string {
  const firstLine = content.trim().split('\n')[0]
  const words = firstLine.split(/\s+/).filter(w => w.length > 0)
  
  if (words.length === 0) return 'Untitled'
  
  let title = ''
  for (const word of words) {
    if ((title + ' ' + word).length > maxLength) break
    title = title ? `${title} ${word}` : word
  }
  
  return title || 'Untitled'
}