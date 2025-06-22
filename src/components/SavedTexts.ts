import { SavedText } from '../types'
import { StorageManager } from '../utils/storage'
import { LoadingStates } from './LoadingStates'
import { debounce } from '../utils/performance'

export interface SavedTextsCallbacks {
  onSelect: (text: SavedText) => void
  onDelete?: (id: string) => void
  onNew?: () => void
}

export class SavedTexts {
  private container: HTMLElement
  private callbacks: SavedTextsCallbacks
  private elements: {
    newBtn: HTMLButtonElement | null
    listContainer: HTMLDivElement | null
  }
  private activeTextId: string | null = null
  private loadingState: LoadingStates | null = null

  constructor(container: HTMLElement, callbacks: SavedTextsCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.elements = {
      newBtn: null,
      listContainer: null
    }
    this.render()
    this.loadTexts()
  }

  private render() {
    this.container.innerHTML = `
      <div class="saved-texts-wrapper">
        <button id="new-text-btn" class="new-text-btn">
          <span>+ New</span>
        </button>
        <div id="saved-texts-list" class="saved-texts-list">
          <!-- Text cards will be inserted here -->
        </div>
      </div>
    `

    this.elements.newBtn = this.container.querySelector('#new-text-btn')
    this.elements.listContainer = this.container.querySelector('#saved-texts-list')

    // Initialize loading state for the list container
    if (this.elements.listContainer) {
      this.loadingState = new LoadingStates(this.elements.listContainer, {
        message: 'Loading saved texts...',
        showSpinner: true,
        overlay: true,
        minDuration: 200
      })
    }

    this.attachEventListeners()
    this.addStyles()
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .saved-texts-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        height: 100%;
        padding: 0 10px;
      }

      .new-text-btn {
        flex-shrink: 0;
        padding: 6px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .new-text-btn:hover {
        background: #f5f5f5;
        border-color: #999;
      }

      .saved-texts-list {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        overflow-y: hidden;
        flex: 1;
        padding: 2px 0;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }

      .saved-texts-list::-webkit-scrollbar {
        height: 4px;
      }

      .saved-texts-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 2px;
      }

      .saved-texts-list::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 2px;
      }

      .saved-texts-list::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      .text-card {
        flex-shrink: 0;
        position: relative;
        padding: 6px 12px;
        background: #f0f0f0;
        border: 1px solid transparent;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .text-card:hover {
        background: #e0e0e0;
        transform: translateY(-1px);
      }

      .text-card.active {
        background: #2196F3;
        color: white;
        border-color: #1976D2;
      }

      .text-card-title {
        font-weight: 500;
        margin-bottom: 2px;
        cursor: pointer;
        outline: none;
        border-radius: 2px;
        padding: 1px 2px;
        margin: -1px -2px;
        user-select: none;
        transition: background 0.2s ease;
      }

      .text-card-title:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      .text-card.active .text-card-title:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .text-card-title.editing {
        background: white;
        border: 1px solid #2196F3;
        cursor: text;
        user-select: text;
      }

      .text-card.active .text-card-title.editing {
        color: #333;
      }

      .text-card-meta {
        font-size: 10px;
        opacity: 0.7;
      }

      .text-card-delete {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 16px;
        height: 16px;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        font-size: 10px;
        line-height: 1;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .text-card:hover .text-card-delete {
        opacity: 1;
      }

      .text-card-delete:hover {
        background: #f44336;
        color: white;
      }

      .empty-state {
        color: #666;
        font-size: 12px;
        font-style: italic;
        padding: 6px 12px;
      }

      @media (max-width: 400px) {
        .saved-texts-wrapper {
          padding: 0 5px;
        }

        .new-text-btn {
          padding: 4px 8px;
          font-size: 11px;
        }

        .text-card {
          padding: 4px 8px;
          font-size: 11px;
          max-width: 120px;
        }

        .text-card-meta {
          display: none;
        }
      }
    `

    if (!document.querySelector('#saved-texts-styles')) {
      style.id = 'saved-texts-styles'
      document.head.appendChild(style)
    }
  }

  private attachEventListeners() {
    this.elements.newBtn?.addEventListener('click', () => {
      this.callbacks.onNew?.()
    })
  }

  private async loadTexts() {
    if (!this.elements.listContainer) return

    // Show loading state
    this.loadingState?.show()

    try {
      // Simulate async operation for better UX
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const texts = StorageManager.list()
      
      if (texts.length === 0) {
        this.elements.listContainer.innerHTML = '<div class="empty-state">No saved texts yet</div>'
        return
      }

      this.elements.listContainer.innerHTML = texts.map(text => this.createTextCard(text)).join('')
    
    // Attach event listeners to cards
    this.elements.listContainer.querySelectorAll('.text-card').forEach((card, index) => {
      const text = texts[index]
      
      card.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        if (!target.classList.contains('text-card-delete') && !target.classList.contains('text-card-title')) {
          this.selectText(text)
        }
      })

      const deleteBtn = card.querySelector('.text-card-delete')
      deleteBtn?.addEventListener('click', (e) => {
        e.stopPropagation()
        this.deleteText(text.id)
      })

      // Add title editing functionality
      const titleElement = card.querySelector('.text-card-title') as HTMLDivElement
      if (titleElement) {
        // Handle title click to select text (not edit)
        titleElement.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!titleElement.classList.contains('editing')) {
            this.selectText(text)
          }
        })

        // Handle double-click to edit
        titleElement.addEventListener('dblclick', (e) => {
          e.stopPropagation()
          titleElement.classList.add('editing')
          titleElement.focus()
          
          // Select all text
          const range = document.createRange()
          range.selectNodeContents(titleElement)
          const selection = window.getSelection()
          selection?.removeAllRanges()
          selection?.addRange(range)
        })

        // Handle blur to save
        titleElement.addEventListener('blur', () => {
          this.saveTitle(text.id, titleElement.textContent || 'Untitled')
          titleElement.classList.remove('editing')
        })

        // Handle enter key to save
        titleElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            titleElement.blur()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            titleElement.textContent = text.title
            titleElement.blur()
          }
        })

        // Prevent text selection on single click
        titleElement.addEventListener('mousedown', (e) => {
          if (!titleElement.classList.contains('editing')) {
            e.preventDefault()
          }
        })
      }
    })
    } finally {
      // Hide loading state
      await this.loadingState?.hide()
    }
  }

  private createTextCard(text: SavedText): string {
    const words = text.wordCount
    const position = text.lastPosition
    const progress = words > 0 ? Math.round((position / words) * 100) : 0
    const active = text.id === this.activeTextId ? 'active' : ''

    return `
      <div class="text-card ${active}" data-id="${text.id}">
        <button class="text-card-delete" aria-label="Delete">×</button>
        <div class="text-card-title" contenteditable="true" data-id="${text.id}">${text.title}</div>
        <div class="text-card-meta">${words} words • ${progress}%</div>
      </div>
    `
  }

  private selectText(text: SavedText) {
    this.activeTextId = text.id
    this.callbacks.onSelect(text)
    this.updateActiveState()
  }

  private deleteText(id: string) {
    if (confirm('Delete this saved text?')) {
      StorageManager.delete(id)
      this.callbacks.onDelete?.(id)
      this.loadTexts()
    }
  }

  private saveTitle(id: string, newTitle: string) {
    const trimmedTitle = newTitle.trim()
    if (trimmedTitle) {
      StorageManager.update(id, { title: trimmedTitle })
    }
  }

  private updateActiveState() {
    this.elements.listContainer?.querySelectorAll('.text-card').forEach(card => {
      const cardElement = card as HTMLElement
      if (cardElement.dataset.id === this.activeTextId) {
        cardElement.classList.add('active')
      } else {
        cardElement.classList.remove('active')
      }
    })
  }

  public refresh() {
    // Debounce refresh to avoid multiple rapid updates
    if (!this.refreshDebounced) {
      this.refreshDebounced = debounce(() => this.loadTexts(), 500)
    }
    this.refreshDebounced()
  }
  
  private refreshDebounced?: () => void

  public setActiveText(id: string | null) {
    this.activeTextId = id
    this.updateActiveState()
  }

  public addText(text: SavedText) {
    this.loadTexts()
    // Scroll to show the new text
    if (this.elements.listContainer) {
      this.elements.listContainer.scrollLeft = 0
    }
  }
}