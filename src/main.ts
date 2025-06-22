import { Reader } from './components/Reader'
import { Controls } from './components/Controls'
import { Progress } from './components/Progress'
import { SavedTexts } from './components/SavedTexts'
import { TextInput } from './components/TextInput'
import { UrlInput } from './components/UrlInput'
import { ReaderState, ControlsConfig, KeyboardShortcut, SavedText } from './types'
import { splitTextIntoWords, calculateReadingTime, formatReadingTime, calculateProgress, getSkipWordCount } from './utils/textProcessor'
import { TouchGestureHandler } from './utils/touchGestures'
import { StorageManager, generateTitle } from './utils/storage'
import { ErrorHandler, ErrorType } from './utils/errorHandler'
import { initializePolyfills } from './utils/polyfills'

// Initialize polyfills for older browsers
initializePolyfills()

// Global state
let state: ReaderState = {
  words: [],
  currentIndex: 0,
  isPlaying: false,
  wpm: 300
}

const controlsConfig: ControlsConfig = {
  minWPM: 100,
  maxWPM: 1000,
  defaultWPM: 300,
  wpmStep: 25
}

let reader: Reader | null = null
let controls: Controls | null = null
let progress: Progress | null = null
let savedTexts: SavedTexts | null = null
let textInput: TextInput | null = null
let urlInput: UrlInput | null = null
let readingInterval: number | null = null
let positionUpdateTimer: number | null = null

// Initialize app
function initializeApp() {
  // Initialize error handler
  ErrorHandler.initialize()
  
  // Get DOM elements
  const savedTextsBar = document.getElementById('saved-texts-bar')
  const readerDisplay = document.getElementById('reader-display')
  const controlsSection = document.getElementById('controls-section')
  const textInputSection = document.getElementById('text-input-section')

  if (!savedTextsBar || !readerDisplay || !controlsSection || !textInputSection) {
    ErrorHandler.handleError({
      type: ErrorType.UNKNOWN,
      message: 'Required DOM elements not found',
      details: null,
      recoverable: false
    })
    return
  }

  // Initialize Reader component
  reader = new Reader(readerDisplay)

  // Setup UI
  setupSavedTextsBar(savedTextsBar)
  setupControls(controlsSection)
  setupTextInput(textInputSection)

  // Setup keyboard shortcuts
  setupKeyboardShortcuts()

  // Setup touch gestures
  setupTouchGestures(readerDisplay)

  // Initial display update
  updateReader()
}

function setupSavedTextsBar(container: HTMLElement) {
  savedTexts = new SavedTexts(container, {
    onSelect: (text: SavedText) => {
      loadSavedText(text)
    },
    onDelete: (id: string) => {
      if (state.activeTextId === id) {
        state.activeTextId = undefined
        clearText()
      }
    },
    onNew: () => {
      createNewText()
    }
  })
}

function setupControls(container: HTMLElement) {
  // Initialize Controls component
  controls = new Controls(container, controlsConfig, {
    onPlayPause: togglePlayPause,
    onRestart: restart,
    onRewind: rewind,
    onFastForward: fastForward,
    onSpeedChange: (wpm) => {
      state.wpm = wpm
      updateStats()
      
      if (state.isPlaying) {
        pause()
        play()
      }
    }
  })

  // Initialize Progress component
  progress = new Progress(container)
  progress.update(state)
}

function setupTextInput(container: HTMLElement) {
  // Create a wrapper for both URL and text inputs
  const wrapper = document.createElement('div')
  wrapper.className = 'input-wrapper'
  container.appendChild(wrapper)
  
  // Create URL input container
  const urlContainer = document.createElement('div')
  urlContainer.id = 'url-input-container'
  wrapper.appendChild(urlContainer)
  
  // Setup URL input
  urlInput = new UrlInput(urlContainer, {
    placeholder: 'Enter a URL to extract and read content...',
    websocketUrl: 'ws://localhost:8001/ws/agui'
  }, {
    onExtract: async (content) => {
      // Set the extracted content in the text input
      if (textInput) {
        textInput.setText(content)
        textInput.expand()
        processTextFromInput(content)
      }
    }
  })
  
  // Add separator
  const separator = document.createElement('div')
  separator.className = 'input-separator'
  separator.innerHTML = '<span>OR</span>'
  wrapper.appendChild(separator)
  
  // Create text input container
  const textContainer = document.createElement('div')
  textContainer.id = 'text-input-container'
  wrapper.appendChild(textContainer)
  
  const defaultText = `Welcome to the RSVP Speed Reader! This innovative reading technique displays one word at a time in rapid succession, allowing you to read faster by eliminating eye movements. Simply paste your text, adjust the speed, and press play to begin your speed reading journey. You can pause, rewind, or fast forward at any time using the controls below.

This text area supports scrolling when you have longer content. Try pasting a long article or document here and you'll see the vertical scrollbar appear when needed. The interface is optimized for small windows, perfect for reading while multitasking.

The saved texts feature at the top allows you to store multiple documents and switch between them easily. Each saved text remembers your reading position, so you can pick up where you left off.`

  textInput = new TextInput(textContainer, {
    defaultText,
    placeholder: 'Paste or type your text here...',
    minHeight: 100,
    maxHeight: 300,
    autoSaveDraft: true,
    autoSaveDelay: 2000
  }, {
    onChange: (text) => {
      if (!state.isPlaying) {
        state.activeTextId = undefined
        savedTexts?.setActiveText(null)
        processTextFromInput(text)
      }
    },
    onSave: () => {
      saveCurrentText()
    }
  })

  // Process initial text
  processTextFromInput(defaultText)
}

function setupKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    { key: ' ', action: togglePlayPause, preventDefault: true },
    { key: 'Enter', action: togglePlayPause, preventDefault: true },
    { key: 'ArrowLeft', action: rewind, preventDefault: true },
    { key: 'ArrowRight', action: fastForward, preventDefault: true },
    { key: 'ArrowUp', action: increaseSpeed, preventDefault: true },
    { key: 'ArrowDown', action: decreaseSpeed, preventDefault: true }
  ]

  document.addEventListener('keydown', (e) => {
    // Check if the event target is inside a textarea
    const target = e.target as HTMLElement
    if (target.tagName === 'TEXTAREA') {
      return // TextInput component handles its own keyboard shortcuts
    }

    const shortcut = shortcuts.find(s => s.key === e.key)
    if (shortcut) {
      if (shortcut.preventDefault) e.preventDefault()
      shortcut.action()
    }
  })
}

function processText() {
  // Legacy function for compatibility
  if (textInput) {
    const text = textInput.getText()
    processTextFromInput(text)
  }
}

function processTextFromInput(text: string) {
  const trimmedText = text.trim()
  if (trimmedText) {
    state.words = splitTextIntoWords(trimmedText)
    state.currentIndex = 0
    updateReader()
    updateStats()
  }
}

function updateReader() {
  if (!reader) return
  reader.updateDisplay(state)
  progress?.update(state)
  
  // Update saved text position periodically
  updateSavedTextPosition()
}


function updateStats() {
  progress?.update(state)
}

function play() {
  if (state.words.length === 0) {
    processText()
  }

  if (state.words.length === 0) return

  if (state.currentIndex >= state.words.length) {
    state.currentIndex = 0
  }

  state.isPlaying = true
  updatePlayPauseButton()

  reader?.play(state, () => {
    state.currentIndex++
    if (state.currentIndex >= state.words.length) {
      stop()
    } else {
      updateReader()
      updateStats()
    }
  })
}

function pause() {
  state.isPlaying = false
  reader?.stop()
  updatePlayPauseButton()
}

function stop() {
  pause()
  if (state.currentIndex >= state.words.length) {
    state.currentIndex = state.words.length - 1
  }
  updateReader()
  updateStats()
  
  // Update final position when stopping
  updateSavedTextPosition()
}

function togglePlayPause() {
  if (state.isPlaying) {
    pause()
  } else {
    play()
  }
}

function restart() {
  state.currentIndex = 0
  updateReader()
  updateStats()

  if (state.isPlaying) {
    pause()
    play()
  }
}

function rewind() {
  const skipWords = getSkipWordCount(state.words.length)
  state.currentIndex = Math.max(0, state.currentIndex - skipWords)
  updateReader()
  updateStats()

  if (state.isPlaying) {
    pause()
    play()
  }
}

function fastForward() {
  const skipWords = getSkipWordCount(state.words.length)
  state.currentIndex = Math.min(state.words.length - 1, state.currentIndex + skipWords)
  updateReader()
  updateStats()

  if (state.isPlaying) {
    pause()
    play()
  }
}

function increaseSpeed() {
  state.wpm = Math.min(controlsConfig.maxWPM, state.wpm + controlsConfig.wpmStep)
  controls?.updateSpeed(state.wpm)
  updateStats()
  
  if (state.isPlaying) {
    pause()
    play()
  }
}

function decreaseSpeed() {
  state.wpm = Math.max(controlsConfig.minWPM, state.wpm - controlsConfig.wpmStep)
  controls?.updateSpeed(state.wpm)
  updateStats()
  
  if (state.isPlaying) {
    pause()
    play()
  }
}

function updatePlayPauseButton() {
  controls?.updatePlayPauseButton(state.isPlaying)
}

function setupTouchGestures(readerDisplay: HTMLElement) {
  // Add touch gestures to reader display area
  new TouchGestureHandler(readerDisplay, {
    onTap: togglePlayPause,
    onSwipeLeft: fastForward,
    onSwipeRight: rewind,
    onSwipeUp: increaseSpeed,
    onSwipeDown: decreaseSpeed
  })
}

// Saved text functions
function saveCurrentText() {
  if (!textInput) return

  const content = textInput.getText().trim()
  if (!content) {
    ErrorHandler.handleError({
      type: ErrorType.INVALID_TEXT,
      message: 'Please enter some text to save',
      details: null,
      recoverable: true
    })
    return
  }

  try {
    const title = generateTitle(content)
    const words = splitTextIntoWords(content)
    
    const savedText = StorageManager.save({
      title,
      content,
      wordCount: words.length,
      lastPosition: state.currentIndex
    })

    state.activeTextId = savedText.id
    savedTexts?.addText(savedText)
    savedTexts?.setActiveText(savedText.id)
    
    // Update state with the saved text
    state.words = words
    updateReader()
    updateStats()
    
    // Clear the draft since we've saved
    textInput.clearDraft()
  } catch (error) {
    // Storage error already handled by StorageManager
    throw error // Re-throw to let TextInput show error state
  }
}

function loadSavedText(text: SavedText) {
  if (!textInput) return

  // Update text input
  textInput.setText(text.content)
  
  // Update state
  state.words = splitTextIntoWords(text.content)
  state.currentIndex = text.lastPosition || 0
  state.activeTextId = text.id
  state.isPlaying = false
  
  // Update UI
  updateReader()
  updateStats()
  updatePlayPauseButton()
  
  // Update saved texts component
  savedTexts?.setActiveText(text.id)
  
  // Clear draft since we loaded a saved text
  textInput.clearDraft()
}

function createNewText() {
  if (!textInput) return
  
  textInput.setText('')
  clearText()
  textInput.focus()
  textInput.expand() // Ensure text input is visible
}

function clearText() {
  state.words = []
  state.currentIndex = 0
  state.activeTextId = undefined
  state.isPlaying = false
  
  updateReader()
  updateStats()
  updatePlayPauseButton()
  savedTexts?.setActiveText(null)
}

// Update position tracking
function updateSavedTextPosition() {
  if (state.activeTextId && state.words.length > 0) {
    // Throttle position updates to avoid excessive localStorage writes
    if (positionUpdateTimer) {
      clearTimeout(positionUpdateTimer)
    }
    
    positionUpdateTimer = window.setTimeout(() => {
      StorageManager.updatePosition(state.activeTextId!, state.currentIndex)
      // Also refresh the saved texts display to show updated progress
      savedTexts?.refresh()
    }, 1000) // Update after 1 second of no changes
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}