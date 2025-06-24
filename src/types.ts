export interface ReaderState {
  words: string[]
  currentIndex: number
  isPlaying: boolean
  wpm: number
  activeTextId?: string
  isAuthenticated: boolean
}

export interface SavedText {
  id: string
  title: string
  content: string
  wordCount: number
  lastPosition: number
  createdAt: number
  updatedAt: number
}

export interface ReaderDisplay {
  prev2?: string
  prev1?: string
  current: string
  next1?: string
  next2?: string
}

export interface ControlsConfig {
  minWPM: number
  maxWPM: number
  defaultWPM: number
  wpmStep: number
}

export type PlaybackCommand = 'play' | 'pause' | 'stop' | 'rewind' | 'fastForward'

export interface KeyboardShortcut {
  key: string
  action: () => void
  preventDefault?: boolean
}