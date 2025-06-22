import { debounce } from '../utils/performance'

export interface TextInputCallbacks {
  onChange: (text: string) => void
  onSave: () => void
  onFocus?: () => void
  onBlur?: () => void
}

export interface TextInputConfig {
  placeholder?: string
  defaultText?: string
  minHeight?: number
  maxHeight?: number
  autoSaveDraft?: boolean
  autoSaveDelay?: number
}

export class TextInput {
  private container: HTMLElement
  private callbacks: TextInputCallbacks
  private config: TextInputConfig
  private elements: {
    wrapper: HTMLDivElement | null
    controls: HTMLDivElement | null
    collapseBtn: HTMLButtonElement | null
    saveBtn: HTMLButtonElement | null
    charCount: HTMLSpanElement | null
    wordCount: HTMLSpanElement | null
    textarea: HTMLTextAreaElement | null
    textareaContainer: HTMLDivElement | null
    resizeHandle: HTMLDivElement | null
  }
  private autoSaveTimer: number | null = null
  private isCollapsed: boolean = false
  private lastSavedDraft: string = ''
  private debouncedOnChange: (text: string) => void
  private debouncedSaveDraft: () => void

  constructor(container: HTMLElement, config: TextInputConfig, callbacks: TextInputCallbacks) {
    this.container = container
    this.config = {
      placeholder: 'Paste or type your text here...',
      minHeight: 100,
      maxHeight: 300,
      autoSaveDraft: true,
      autoSaveDelay: 2000,
      ...config
    }
    this.callbacks = callbacks
    this.elements = {
      wrapper: null,
      controls: null,
      collapseBtn: null,
      saveBtn: null,
      charCount: null,
      wordCount: null,
      textarea: null,
      textareaContainer: null,
      resizeHandle: null
    }
    
    // Create debounced functions
    this.debouncedOnChange = debounce((text: string) => {
      this.callbacks.onChange(text)
    }, 300) // 300ms delay for onChange
    
    this.debouncedSaveDraft = debounce(() => {
      this.saveDraft()
    }, this.config.autoSaveDelay!)
    
    this.render()
    this.attachEventListeners()
    this.loadDraft()
  }

  private render() {
    this.container.innerHTML = `
      <div class="text-input-wrapper">
        <div class="text-input-controls">
          <div class="text-input-controls-left">
            <button id="collapse-btn" class="text-input-btn collapse-btn">
              <span class="collapse-icon">↕</span>
              <span class="collapse-text">Collapse</span>
            </button>
            <div class="text-stats">
              <span id="word-count" class="stat-item">0 words</span>
              <span class="stat-separator">•</span>
              <span id="char-count" class="stat-item">0 chars</span>
            </div>
          </div>
          <button id="save-text-btn" class="text-input-btn save-btn">
            Save Text
          </button>
        </div>
        <div class="textarea-container">
          <textarea 
            id="text-input" 
            class="text-input-textarea" 
            placeholder="${this.config.placeholder}"
          >${this.config.defaultText || ''}</textarea>
          <div class="resize-handle"></div>
        </div>
      </div>
    `

    // Get element references
    this.elements.wrapper = this.container.querySelector('.text-input-wrapper')
    this.elements.controls = this.container.querySelector('.text-input-controls')
    this.elements.collapseBtn = this.container.querySelector('#collapse-btn')
    this.elements.saveBtn = this.container.querySelector('#save-text-btn')
    this.elements.charCount = this.container.querySelector('#char-count')
    this.elements.wordCount = this.container.querySelector('#word-count')
    this.elements.textarea = this.container.querySelector('#text-input')
    this.elements.textareaContainer = this.container.querySelector('.textarea-container')
    this.elements.resizeHandle = this.container.querySelector('.resize-handle')

    this.addStyles()
    this.updateStats()
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .text-input-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: all 0.3s ease;
      }

      .text-input-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        flex-shrink: 0;
      }

      .text-input-controls-left {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .text-input-btn {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #ccc;
        background: white;
      }

      .collapse-btn {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .collapse-icon {
        transition: transform 0.3s ease;
      }

      .text-input-wrapper.collapsed .collapse-icon {
        transform: rotate(90deg);
      }

      .save-btn {
        background: #4CAF50;
        color: white;
        border: none;
      }

      .save-btn:hover {
        background: #45a049;
      }

      .save-btn:active {
        transform: translateY(1px);
      }

      .save-btn.saving {
        background: #2196F3;
        pointer-events: none;
      }

      .save-btn.saved {
        background: #4CAF50;
        animation: pulse 0.3s ease;
      }

      .save-btn.error {
        background: #f44336;
        animation: shake 0.3s ease;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
      }

      .text-stats {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        color: #666;
      }

      .stat-separator {
        opacity: 0.5;
      }

      .textarea-container {
        flex: 1;
        position: relative;
        overflow: hidden;
        min-height: ${this.config.minHeight}px;
        max-height: ${this.config.maxHeight}px;
        transition: min-height 0.3s ease, max-height 0.3s ease;
        resize: none;
      }

      .text-input-wrapper.collapsed .textarea-container {
        min-height: 0 !important;
        max-height: 0 !important;
        height: 0 !important;
        margin: 0;
        overflow: hidden;
      }

      .text-input-textarea {
        width: 100%;
        height: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.5;
        resize: none;
        overflow-y: auto;
        transition: border-color 0.2s ease;
      }

      .text-input-textarea:focus {
        outline: none;
        border-color: #2196F3;
      }

      .text-input-textarea.draft-saved::placeholder {
        color: #4CAF50;
      }

      .resize-handle {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 8px;
        background: transparent;
        cursor: ns-resize;
        z-index: 10;
      }

      .resize-handle:hover {
        background: rgba(33, 150, 243, 0.1);
      }

      .resize-handle:active {
        background: rgba(33, 150, 243, 0.2);
      }

      .resize-handle::before {
        content: '';
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 4px;
        background: #ccc;
        border-radius: 2px;
        transition: background 0.2s ease;
      }

      .resize-handle:hover::before {
        background: #2196F3;
      }

      .text-input-wrapper.collapsed .resize-handle {
        display: none;
      }

      @media (max-width: 600px) {
        .text-input-controls {
          flex-wrap: wrap;
          gap: 10px;
        }

        .text-input-controls-left {
          flex: 1;
        }

        .text-stats {
          font-size: 10px;
        }
      }

      @media (max-width: 400px) {
        .collapse-text {
          display: none;
        }

        .text-input-btn {
          padding: 4px 8px;
          font-size: 11px;
        }
      }
    `

    if (!document.querySelector('#text-input-styles')) {
      style.id = 'text-input-styles'
      document.head.appendChild(style)
    }
  }

  private attachEventListeners() {
    // Collapse/expand
    this.elements.collapseBtn?.addEventListener('click', () => {
      this.toggleCollapse()
    })

    // Save button
    this.elements.saveBtn?.addEventListener('click', () => {
      this.save()
    })

    // Textarea events
    this.elements.textarea?.addEventListener('input', () => {
      this.handleInput()
    })

    this.elements.textarea?.addEventListener('focus', () => {
      this.callbacks.onFocus?.()
    })

    this.elements.textarea?.addEventListener('blur', () => {
      this.callbacks.onBlur?.()
    })

    // Keyboard shortcuts
    this.elements.textarea?.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        this.save()
      }
    })

    // Resize handle
    this.setupResizeHandle()
  }

  private handleInput() {
    const text = this.elements.textarea?.value || ''
    
    // Update stats immediately
    this.updateStats()
    
    // Notify callback with debouncing
    this.debouncedOnChange(text)
    
    // Auto-save draft with debouncing
    if (this.config.autoSaveDraft) {
      this.debouncedSaveDraft()
    }
  }

  private updateStats() {
    const text = this.elements.textarea?.value || ''
    const words = text.trim().split(/\s+/).filter(w => w.length > 0)
    const chars = text.length

    if (this.elements.wordCount) {
      this.elements.wordCount.textContent = `${words.length} words`
    }
    if (this.elements.charCount) {
      this.elements.charCount.textContent = `${chars} chars`
    }
  }

  private toggleCollapse() {
    this.isCollapsed = !this.isCollapsed
    
    if (this.elements.wrapper) {
      this.elements.wrapper.classList.toggle('collapsed', this.isCollapsed)
    }
    
    if (this.elements.collapseBtn) {
      const textSpan = this.elements.collapseBtn.querySelector('.collapse-text')
      if (textSpan) {
        textSpan.textContent = this.isCollapsed ? 'Expand' : 'Collapse'
      }
    }

    // Reset inline styles when collapsing to allow CSS to take over
    if (this.isCollapsed && this.elements.textareaContainer) {
      this.elements.textareaContainer.style.height = ''
      this.elements.textareaContainer.style.minHeight = ''
      this.elements.textareaContainer.style.maxHeight = ''
    } else if (!this.isCollapsed && this.elements.textareaContainer) {
      // Restore saved height when expanding
      const savedHeight = localStorage.getItem('rsvp-textarea-height')
      if (savedHeight) {
        const height = parseInt(savedHeight)
        if (!isNaN(height) && height >= this.config.minHeight! && height <= window.innerHeight * 0.7) {
          this.elements.textareaContainer.style.height = `${height}px`
          this.elements.textareaContainer.style.maxHeight = `${height}px`
          this.elements.textareaContainer.style.minHeight = `${height}px`
        }
      }
    }
  }

  private async save() {
    if (this.elements.saveBtn) {
      this.elements.saveBtn.classList.add('saving')
      this.elements.saveBtn.textContent = 'Saving...'
      this.elements.saveBtn.disabled = true
    }

    try {
      // Call the save callback
      await Promise.resolve(this.callbacks.onSave())
      
      // Show success state
      if (this.elements.saveBtn) {
        this.elements.saveBtn.classList.remove('saving')
        this.elements.saveBtn.classList.add('saved')
        this.elements.saveBtn.textContent = '✓ Saved'
      }
      
      // Reset button after a short delay
      setTimeout(() => {
        if (this.elements.saveBtn) {
          this.elements.saveBtn.classList.remove('saved')
          this.elements.saveBtn.textContent = 'Save Text'
          this.elements.saveBtn.disabled = false
        }
      }, 1500)
    } catch (error) {
      // Show error state
      if (this.elements.saveBtn) {
        this.elements.saveBtn.classList.remove('saving')
        this.elements.saveBtn.classList.add('error')
        this.elements.saveBtn.textContent = '✗ Failed'
        this.elements.saveBtn.disabled = false
      }
      
      setTimeout(() => {
        if (this.elements.saveBtn) {
          this.elements.saveBtn.classList.remove('error')
          this.elements.saveBtn.textContent = 'Save Text'
        }
      }, 2000)
      
      console.error('Failed to save text:', error)
    }
  }


  private saveDraft() {
    const text = this.elements.textarea?.value || ''
    if (text !== this.lastSavedDraft) {
      localStorage.setItem('rsvp-draft', text)
      this.lastSavedDraft = text
      
      // Visual feedback
      this.elements.textarea?.classList.add('draft-saved')
      setTimeout(() => {
        this.elements.textarea?.classList.remove('draft-saved')
      }, 1000)
    }
  }

  private loadDraft() {
    if (this.config.autoSaveDraft && !this.config.defaultText) {
      const draft = localStorage.getItem('rsvp-draft')
      if (draft && this.elements.textarea) {
        this.elements.textarea.value = draft
        this.lastSavedDraft = draft
        this.updateStats()
        this.callbacks.onChange(draft)
      }
    }
  }

  public getText(): string {
    return this.elements.textarea?.value || ''
  }

  public setText(text: string) {
    if (this.elements.textarea) {
      this.elements.textarea.value = text
      this.updateStats()
    }
  }

  public focus() {
    this.elements.textarea?.focus()
  }

  public expand() {
    if (this.isCollapsed) {
      this.toggleCollapse()
    }
  }

  public collapse() {
    if (!this.isCollapsed) {
      this.toggleCollapse()
    }
  }

  public clearDraft() {
    localStorage.removeItem('rsvp-draft')
    this.lastSavedDraft = ''
  }

  private setupResizeHandle() {
    if (!this.elements.resizeHandle || !this.elements.textareaContainer) return

    let startY = 0
    let startHeight = 0
    let isResizing = false

    const handleMouseDown = (e: MouseEvent) => {
      isResizing = true
      startY = e.clientY
      startHeight = this.elements.textareaContainer!.offsetHeight
      
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'
      
      e.preventDefault()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !this.elements.textareaContainer) return

      const deltaY = e.clientY - startY
      const newHeight = Math.max(
        this.config.minHeight!,
        Math.min(
          window.innerHeight * 0.7, // Max 70% of viewport
          startHeight + deltaY
        )
      )

      this.elements.textareaContainer.style.height = `${newHeight}px`
      this.elements.textareaContainer.style.maxHeight = `${newHeight}px`
      this.elements.textareaContainer.style.minHeight = `${newHeight}px`
    }

    const handleMouseUp = () => {
      if (!isResizing) return
      
      isResizing = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      // Save the new height preference
      if (this.elements.textareaContainer) {
        const currentHeight = this.elements.textareaContainer.offsetHeight
        localStorage.setItem('rsvp-textarea-height', currentHeight.toString())
      }
    }

    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      isResizing = true
      startY = touch.clientY
      startHeight = this.elements.textareaContainer!.offsetHeight
      e.preventDefault()
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing || !this.elements.textareaContainer) return

      const touch = e.touches[0]
      const deltaY = touch.clientY - startY
      const newHeight = Math.max(
        this.config.minHeight!,
        Math.min(
          window.innerHeight * 0.7,
          startHeight + deltaY
        )
      )

      this.elements.textareaContainer.style.height = `${newHeight}px`
      this.elements.textareaContainer.style.maxHeight = `${newHeight}px`
      this.elements.textareaContainer.style.minHeight = `${newHeight}px`
    }

    const handleTouchEnd = () => {
      if (!isResizing) return
      
      isResizing = false
      
      // Save the new height preference
      if (this.elements.textareaContainer) {
        const currentHeight = this.elements.textareaContainer.offsetHeight
        localStorage.setItem('rsvp-textarea-height', currentHeight.toString())
      }
    }

    // Mouse events
    this.elements.resizeHandle.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Touch events
    this.elements.resizeHandle.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    // Load saved height preference
    const savedHeight = localStorage.getItem('rsvp-textarea-height')
    if (savedHeight && this.elements.textareaContainer) {
      const height = parseInt(savedHeight)
      if (!isNaN(height) && height >= this.config.minHeight! && height <= window.innerHeight * 0.7) {
        this.elements.textareaContainer.style.height = `${height}px`
        this.elements.textareaContainer.style.maxHeight = `${height}px`
        this.elements.textareaContainer.style.minHeight = `${height}px`
      }
    }
  }
}