export function splitTextIntoWords(text: string): string[] {
  if (!text || !text.trim()) {
    return []
  }
  
  // Split by whitespace and filter out empty strings
  return text.split(/\s+/).filter(word => word.length > 0)
}

export function calculateReadingTime(wordCount: number, wpm: number): { minutes: number; seconds: number } {
  const totalSeconds = (wordCount / wpm) * 60
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  
  return { minutes, seconds }
}

export function formatReadingTime(minutes: number, seconds: number): string {
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function calculateProgress(currentIndex: number, totalWords: number): number {
  if (totalWords === 0) return 0
  return Math.min(100, (currentIndex / totalWords) * 100)
}

export function getSkipWordCount(totalWords: number, percentage: number = 0.05): number {
  return Math.max(1, Math.ceil(totalWords * percentage))
}

export function generateTextPreview(text: string, maxLength: number = 50): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }
  return trimmed.substring(0, maxLength - 3) + '...'
}

export function generateTextTitle(text: string): string {
  // Try to generate a title from the first sentence or line
  const firstLine = text.trim().split(/[\n.!?]/)[0].trim()
  
  if (firstLine.length > 0 && firstLine.length <= 50) {
    return firstLine
  }
  
  // If first line is too long, use first few words
  const words = firstLine.split(/\s+/)
  if (words.length > 5) {
    return words.slice(0, 5).join(' ') + '...'
  }
  
  return generateTextPreview(firstLine, 50)
}