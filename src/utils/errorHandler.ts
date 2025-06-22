export enum ErrorType {
  STORAGE_QUOTA = 'STORAGE_QUOTA',
  STORAGE_ACCESS = 'STORAGE_ACCESS',
  INVALID_TEXT = 'INVALID_TEXT',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  recoverable: boolean
}

export class ErrorHandler {
  private static errorCallbacks: ((error: AppError) => void)[] = []
  private static errorContainer: HTMLDivElement | null = null

  static initialize() {
    // Create error display container
    this.errorContainer = document.createElement('div')
    this.errorContainer.id = 'error-notifications'
    this.errorContainer.className = 'error-notifications'
    document.body.appendChild(this.errorContainer)
    
    // Add error styles
    this.addStyles()
    
    // Setup global error handlers
    window.addEventListener('error', (event) => {
      this.handleError({
        type: ErrorType.UNKNOWN,
        message: event.message,
        details: { 
          filename: event.filename,
          line: event.lineno,
          column: event.colno
        },
        recoverable: true
      })
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: ErrorType.UNKNOWN,
        message: 'Unhandled promise rejection',
        details: event.reason,
        recoverable: true
      })
    })
  }

  static handleError(error: AppError) {
    console.error('Application error:', error)
    
    // Notify all registered callbacks
    this.errorCallbacks.forEach(callback => callback(error))
    
    // Display error to user
    this.displayError(error)
  }

  static handleStorageError(error: any): AppError {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      return {
        type: ErrorType.STORAGE_QUOTA,
        message: 'Storage quota exceeded. Please delete some saved texts to continue.',
        details: error,
        recoverable: true
      }
    }
    
    return {
      type: ErrorType.STORAGE_ACCESS,
      message: 'Failed to access local storage. Please check your browser settings.',
      details: error,
      recoverable: false
    }
  }

  static handleTextError(error: any): AppError {
    return {
      type: ErrorType.INVALID_TEXT,
      message: 'Invalid text format. Please check your input.',
      details: error,
      recoverable: true
    }
  }

  static onError(callback: (error: AppError) => void) {
    this.errorCallbacks.push(callback)
  }

  static removeErrorListener(callback: (error: AppError) => void) {
    const index = this.errorCallbacks.indexOf(callback)
    if (index > -1) {
      this.errorCallbacks.splice(index, 1)
    }
  }

  private static displayError(error: AppError) {
    if (!this.errorContainer) return
    
    const notification = document.createElement('div')
    notification.className = `error-notification error-${error.type.toLowerCase()}`
    
    const icon = error.recoverable ? '⚠️' : '❌'
    
    notification.innerHTML = `
      <div class="error-content">
        <span class="error-icon">${icon}</span>
        <div class="error-text">
          <div class="error-message">${error.message}</div>
          ${error.recoverable ? '<div class="error-hint">Click to dismiss</div>' : ''}
        </div>
      </div>
    `
    
    if (error.recoverable) {
      notification.addEventListener('click', () => {
        notification.classList.add('error-fade-out')
        setTimeout(() => notification.remove(), 300)
      })
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.classList.add('error-fade-out')
          setTimeout(() => notification.remove(), 300)
        }
      }, 5000)
    }
    
    this.errorContainer.appendChild(notification)
  }

  private static addStyles() {
    if (document.querySelector('#error-handler-styles')) return
    
    const style = document.createElement('style')
    style.id = 'error-handler-styles'
    style.textContent = `
      .error-notifications {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 400px;
      }

      .error-notification {
        background: white;
        border: 1px solid #f44336;
        border-left-width: 4px;
        border-radius: 4px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .error-notification:hover {
        transform: translateX(-4px);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
      }

      .error-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .error-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .error-text {
        flex: 1;
      }

      .error-message {
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
      }

      .error-hint {
        font-size: 12px;
        color: #666;
        font-style: italic;
      }

      .error-storage_quota {
        border-left-color: #ff9800;
      }

      .error-invalid_text {
        border-left-color: #2196F3;
      }

      .error-fade-out {
        animation: fadeOut 0.3s ease forwards;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeOut {
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }

      /* Mobile adjustments */
      @media (max-width: 600px) {
        .error-notifications {
          top: 10px;
          right: 10px;
          left: 10px;
          max-width: none;
        }

        .error-notification {
          font-size: 12px;
          padding: 10px 12px;
        }

        .error-icon {
          font-size: 16px;
        }
      }

      /* Small window adjustments */
      @media (max-width: 400px) {
        .error-notifications {
          top: 5px;
          right: 5px;
          left: 5px;
        }

        .error-notification {
          padding: 8px 10px;
        }

        .error-message {
          font-size: 12px;
        }

        .error-hint {
          font-size: 10px;
        }
      }
    `
    document.head.appendChild(style)
  }
}

// Try-catch wrapper for async operations
export async function tryAsync<T>(
  operation: () => Promise<T>,
  errorHandler: (error: any) => AppError
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    ErrorHandler.handleError(errorHandler(error))
    return null
  }
}

// Try-catch wrapper for sync operations
export function trySync<T>(
  operation: () => T,
  errorHandler: (error: any) => AppError
): T | null {
  try {
    return operation()
  } catch (error) {
    ErrorHandler.handleError(errorHandler(error))
    return null
  }
}