import { debounce } from '../utils/performance'

export interface UrlInputCallbacks {
  onExtract: (url: string) => Promise<void>
  onCancel?: () => void
}

export interface UrlInputConfig {
  placeholder?: string
  websocketUrl?: string
}

export class UrlInput {
  private container: HTMLElement
  private callbacks: UrlInputCallbacks
  private config: UrlInputConfig
  private elements: {
    wrapper: HTMLDivElement | null
    input: HTMLInputElement | null
    extractBtn: HTMLButtonElement | null
    cancelBtn: HTMLButtonElement | null
    status: HTMLDivElement | null
  }
  private isExtracting: boolean = false
  private ws: WebSocket | null = null

  constructor(container: HTMLElement, config: UrlInputConfig, callbacks: UrlInputCallbacks) {
    this.container = container
    this.config = {
      placeholder: 'Enter a URL to extract content...',
      websocketUrl: this.getWebSocketUrl(),
      ...config
    }
    this.callbacks = callbacks
    this.elements = {
      wrapper: null,
      input: null,
      extractBtn: null,
      cancelBtn: null,
      status: null
    }
    
    this.render()
    this.attachEventListeners()
    this.connectWebSocket()
  }

  private render() {
    this.container.innerHTML = `
      <div class="url-input-wrapper">
        <div class="url-input-controls">
          <input 
            type="url" 
            id="url-input" 
            class="url-input-field" 
            placeholder="${this.config.placeholder}"
            autocomplete="url"
          />
          <button id="extract-btn" class="url-extract-btn">
            Extract
          </button>
          <button id="cancel-btn" class="url-cancel-btn" style="display: none;">
            Cancel
          </button>
        </div>
        <div id="url-status" class="url-status"></div>
      </div>
    `

    // Get element references
    this.elements.wrapper = this.container.querySelector('.url-input-wrapper')
    this.elements.input = this.container.querySelector('#url-input')
    this.elements.extractBtn = this.container.querySelector('#extract-btn')
    this.elements.cancelBtn = this.container.querySelector('#cancel-btn')
    this.elements.status = this.container.querySelector('#url-status')

    this.addStyles()
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/ws/agui`
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .url-input-wrapper {
        width: 100%;
        margin-bottom: 20px;
      }

      .url-input-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .url-input-field {
        flex: 1;
        padding: 10px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        font-family: inherit;
        transition: border-color 0.2s ease;
      }

      .url-input-field:focus {
        outline: none;
        border-color: #2196F3;
      }

      .url-input-field:invalid {
        border-color: #f44336;
      }

      .url-extract-btn,
      .url-cancel-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .url-extract-btn {
        background: #2196F3;
        color: white;
      }

      .url-extract-btn:hover:not(:disabled) {
        background: #1976D2;
      }

      .url-extract-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .url-cancel-btn {
        background: #f44336;
        color: white;
      }

      .url-cancel-btn:hover {
        background: #d32f2f;
      }

      .url-status {
        margin-top: 10px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: none;
      }

      .url-status.info {
        background: #e3f2fd;
        color: #1976D2;
        display: block;
      }

      .url-status.success {
        background: #e8f5e9;
        color: #388e3c;
        display: block;
      }

      .url-status.error {
        background: #ffebee;
        color: #c62828;
        display: block;
      }

      .url-status.extracting {
        background: #fff3e0;
        color: #f57c00;
        display: block;
        position: relative;
      }

      .url-status.extracting::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: #f57c00;
        animation: progress 2s linear infinite;
      }

      @keyframes progress {
        from { width: 0; }
        to { width: 100%; }
      }

      /* Loading spinner */
      .extracting-spinner {
        display: inline-block;
        width: 12px;
        height: 12px;
        border: 2px solid #f57c00;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Mobile adjustments */
      @media (max-width: 600px) {
        .url-input-controls {
          flex-wrap: wrap;
        }

        .url-input-field {
          width: 100%;
          font-size: 16px; /* Prevent zoom on iOS */
        }

        .url-extract-btn,
        .url-cancel-btn {
          flex: 1;
        }
      }

      /* Small window adjustments */
      @media (max-width: 400px) {
        .url-input-field {
          padding: 8px 10px;
          font-size: 14px;
        }

        .url-extract-btn,
        .url-cancel-btn {
          padding: 8px 16px;
          font-size: 13px;
        }

        .url-status {
          font-size: 11px;
          padding: 6px 10px;
        }
      }
    `

    if (!document.querySelector('#url-input-styles')) {
      style.id = 'url-input-styles'
      document.head.appendChild(style)
    }
  }

  private attachEventListeners() {
    // Extract button
    this.elements.extractBtn?.addEventListener('click', () => {
      this.handleExtract()
    })

    // Cancel button
    this.elements.cancelBtn?.addEventListener('click', () => {
      this.cancelExtraction()
    })

    // Enter key on input
    this.elements.input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.isExtracting) {
        this.handleExtract()
      }
    })

    // URL validation
    this.elements.input?.addEventListener('input', () => {
      this.validateUrl()
    })
  }

  private connectWebSocket() {
    try {
      this.ws = new WebSocket(this.config.websocketUrl!)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
      }

      this.ws.onmessage = (event) => {
        this.handleWebSocketMessage(event.data)
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.showStatus('WebSocket connection error', 'error')
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        // Attempt reconnection after 5 seconds
        setTimeout(() => this.connectWebSocket(), 5000)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  private async handleExtract() {
    const url = this.elements.input?.value.trim()
    if (!url || !this.isValidUrl(url)) {
      this.showStatus('Please enter a valid URL', 'error')
      return
    }

    this.setExtracting(true)
    this.showStatus('<span class="extracting-spinner"></span>Extracting content from URL...', 'extracting')

    try {
      // If WebSocket is connected, use it
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'request',
          action: 'extract_and_prepare',
          data: { url },
          id: Date.now().toString()
        }))
      } else {
        // Fallback to REST API
        await this.extractViaRest(url)
      }
    } catch (error) {
      this.showStatus(`Extraction failed: ${error}`, 'error')
      this.setExtracting(false)
    }
  }

  private async extractViaRest(url: string) {
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      })

      const result = await response.json()
      
      if (result.success) {
        this.handleExtractionSuccess(result)
      } else {
        throw new Error(result.error || 'Extraction failed')
      }
    } catch (error) {
      throw error
    }
  }

  private handleWebSocketMessage(data: string) {
    try {
      const message = JSON.parse(data)
      
      if (message.type === 'response' && message.action === 'extract_and_prepare') {
        if (message.success) {
          this.handleExtractionSuccess(message.data)
        } else {
          this.showStatus(`Extraction failed: ${message.error}`, 'error')
          this.setExtracting(false)
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
    }
  }

  private handleExtractionSuccess(data: any) {
    this.showStatus(
      `Successfully extracted ${data.word_count} words from "${data.title}"`, 
      'success'
    )
    this.setExtracting(false)
    
    // Clear input
    if (this.elements.input) {
      this.elements.input.value = ''
    }

    // Call the callback with the cleaned content
    this.callbacks.onExtract(data.content)
  }

  private cancelExtraction() {
    this.setExtracting(false)
    this.showStatus('Extraction cancelled', 'info')
    this.callbacks.onCancel?.()
  }

  private setExtracting(extracting: boolean) {
    this.isExtracting = extracting
    
    if (this.elements.extractBtn) {
      this.elements.extractBtn.disabled = extracting
      this.elements.extractBtn.textContent = extracting ? 'Extracting...' : 'Extract'
    }

    if (this.elements.cancelBtn) {
      this.elements.cancelBtn.style.display = extracting ? 'block' : 'none'
    }

    if (this.elements.input) {
      this.elements.input.disabled = extracting
    }
  }

  private validateUrl(): boolean {
    const url = this.elements.input?.value.trim() || ''
    const isValid = this.isValidUrl(url)
    
    if (this.elements.extractBtn) {
      this.elements.extractBtn.disabled = !isValid || this.isExtracting
    }

    return isValid
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  private showStatus(message: string, type: 'info' | 'success' | 'error' | 'extracting') {
    if (!this.elements.status) return

    this.elements.status.innerHTML = message
    this.elements.status.className = `url-status ${type}`

    // Auto-hide after 5 seconds for non-extracting messages
    if (type !== 'extracting') {
      setTimeout(() => {
        if (this.elements.status) {
          this.elements.status.style.display = 'none'
        }
      }, 5000)
    }
  }

  public setUrl(url: string) {
    if (this.elements.input) {
      this.elements.input.value = url
      this.validateUrl()
    }
  }

  public focus() {
    this.elements.input?.focus()
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}