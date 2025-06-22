export interface LoadingStateConfig {
  message?: string
  showSpinner?: boolean
  overlay?: boolean
  minDuration?: number
}

export class LoadingStates {
  private static instances: Map<string, LoadingStates> = new Map()
  private container: HTMLElement
  private config: LoadingStateConfig
  private element: HTMLDivElement | null = null
  private startTime: number = 0

  constructor(container: HTMLElement, config: LoadingStateConfig = {}) {
    this.container = container
    this.config = {
      message: 'Loading...',
      showSpinner: true,
      overlay: false,
      minDuration: 300,
      ...config
    }
    this.addStyles()
  }

  static create(containerId: string, config?: LoadingStateConfig): LoadingStates {
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`)
    }

    const instance = new LoadingStates(container, config)
    this.instances.set(containerId, instance)
    return instance
  }

  static get(containerId: string): LoadingStates | undefined {
    return this.instances.get(containerId)
  }

  show(message?: string) {
    if (this.element) return // Already showing

    this.startTime = Date.now()
    
    this.element = document.createElement('div')
    this.element.className = `loading-state ${this.config.overlay ? 'loading-overlay' : 'loading-inline'}`
    
    const content = []
    
    if (this.config.showSpinner) {
      content.push('<div class="loading-spinner"></div>')
    }
    
    if (message || this.config.message) {
      content.push(`<div class="loading-message">${message || this.config.message}</div>`)
    }
    
    this.element.innerHTML = content.join('')
    
    if (this.config.overlay) {
      this.container.style.position = 'relative'
    }
    
    this.container.appendChild(this.element)
  }

  async hide() {
    if (!this.element) return

    // Ensure minimum duration for better UX
    const elapsed = Date.now() - this.startTime
    const remaining = this.config.minDuration! - elapsed
    
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining))
    }

    this.element.classList.add('loading-fade-out')
    
    setTimeout(() => {
      if (this.element) {
        this.element.remove()
        this.element = null
      }
    }, 200)
  }

  updateMessage(message: string) {
    if (!this.element) return
    
    const messageElement = this.element.querySelector('.loading-message')
    if (messageElement) {
      messageElement.textContent = message
    }
  }

  private addStyles() {
    if (document.querySelector('#loading-states-styles')) return

    const style = document.createElement('style')
    style.id = 'loading-states-styles'
    style.textContent = `
      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        animation: fadeIn 0.2s ease;
      }

      .loading-inline {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 4px;
        margin: 8px 0;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        z-index: 100;
      }

      .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e0e0e0;
        border-top-color: #2196F3;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      .loading-message {
        font-size: 14px;
        color: #666;
      }

      .loading-fade-out {
        animation: fadeOut 0.2s ease forwards;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeOut {
        to {
          opacity: 0;
          transform: translateY(-4px);
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Small window adjustments */
      @media (max-width: 400px) {
        .loading-state {
          padding: 8px;
          gap: 6px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
        }

        .loading-message {
          font-size: 12px;
        }
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .loading-state {
          background: rgba(0, 0, 0, 0.9);
          color: white;
        }

        .loading-message {
          color: #ccc;
        }

        .loading-spinner {
          border-color: #333;
          border-top-color: #4CAF50;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// Helper function for async operations with loading state
export async function withLoadingState<T>(
  containerId: string,
  operation: () => Promise<T>,
  config?: LoadingStateConfig
): Promise<T> {
  const loading = LoadingStates.get(containerId) || LoadingStates.create(containerId, config)
  
  try {
    loading.show()
    const result = await operation()
    await loading.hide()
    return result
  } catch (error) {
    await loading.hide()
    throw error
  }
}