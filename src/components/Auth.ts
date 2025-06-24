export interface AuthCallbacks {
  onSuccess: () => void
  onError?: (message: string) => void
}

export class Auth {
  private container: HTMLElement
  private callbacks: AuthCallbacks
  private elements: {
    wrapper: HTMLDivElement | null
    form: HTMLFormElement | null
    input: HTMLInputElement | null
    button: HTMLButtonElement | null
    error: HTMLDivElement | null
  }
  
  private readonly CORRECT_PASSWORD = '5p33dr34d3r!'
  private readonly AUTH_KEY = 'speedReaderAuth'

  constructor(container: HTMLElement, callbacks: AuthCallbacks) {
    this.container = container
    this.callbacks = callbacks
    this.elements = {
      wrapper: null,
      form: null,
      input: null,
      button: null,
      error: null
    }
    
    this.render()
    this.attachEventListeners()
  }

  private render() {
    this.container.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-container">
          <h2 class="auth-title">Speed Reader Access</h2>
          <form class="auth-form" id="auth-form">
            <input 
              type="password" 
              class="auth-input" 
              id="password-input" 
              placeholder="Enter access key"
              autocomplete="off"
              autofocus
            />
            <button type="submit" class="auth-button">
              Access
            </button>
            <div class="auth-error" id="auth-error">
              Invalid access key. Please try again.
            </div>
          </form>
        </div>
      </div>
    `

    // Get element references
    this.elements.wrapper = this.container.querySelector('.auth-wrapper')
    this.elements.form = this.container.querySelector('#auth-form')
    this.elements.input = this.container.querySelector('#password-input')
    this.elements.button = this.container.querySelector('.auth-button')
    this.elements.error = this.container.querySelector('#auth-error')
  }

  private attachEventListeners() {
    this.elements.form?.addEventListener('submit', (e) => {
      e.preventDefault()
      this.handleSubmit()
    })

    // Auto-focus on mount
    setTimeout(() => {
      this.elements.input?.focus()
    }, 100)
  }

  private handleSubmit() {
    const password = this.elements.input?.value || ''
    
    if (password === this.CORRECT_PASSWORD) {
      // Store auth state
      sessionStorage.setItem(this.AUTH_KEY, 'true')
      
      // Clear input
      if (this.elements.input) {
        this.elements.input.value = ''
      }
      
      // Hide error
      if (this.elements.error) {
        this.elements.error.style.display = 'none'
      }
      
      // Call success callback
      this.callbacks.onSuccess()
    } else {
      // Show error
      if (this.elements.error) {
        this.elements.error.style.display = 'block'
      }
      
      // Clear and refocus input
      if (this.elements.input) {
        this.elements.input.value = ''
        this.elements.input.focus()
        
        // Shake animation
        this.elements.input.classList.add('shake')
        setTimeout(() => {
          this.elements.input?.classList.remove('shake')
        }, 500)
      }
      
      // Call error callback if provided
      this.callbacks.onError?.('Invalid access key')
    }
  }

  public static isAuthenticated(): boolean {
    return sessionStorage.getItem('speedReaderAuth') === 'true'
  }

  public static clearAuth(): void {
    sessionStorage.removeItem('speedReaderAuth')
  }

  public focus() {
    this.elements.input?.focus()
  }

  public destroy() {
    // Clean up event listeners if needed
    this.container.innerHTML = ''
  }
}