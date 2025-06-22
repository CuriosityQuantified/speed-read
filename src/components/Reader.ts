import { ReaderState, ReaderDisplay } from '../types'
import { rafSchedule } from '../utils/performance'

export class Reader {
  private container: HTMLElement
  private elements: {
    prev2: HTMLSpanElement
    prev1: HTMLSpanElement
    current: HTMLSpanElement
    next1: HTMLSpanElement
    next2: HTMLSpanElement
  }
  private intervalId: number | null = null
  private onStateChange?: (state: Partial<ReaderState>) => void
  private rafUpdateDisplay: (state: ReaderState) => void

  constructor(container: HTMLElement) {
    this.container = container
    this.elements = this.createElements()
    this.render()
    
    // Create RAF-scheduled update function
    this.rafUpdateDisplay = rafSchedule((state: ReaderState) => {
      this.updateDisplayInternal(state)
    })
  }

  private createElements() {
    return {
      prev2: this.createElement('word-prev2'),
      prev1: this.createElement('word-prev1'),
      current: this.createElement('word-current'),
      next1: this.createElement('word-next1'),
      next2: this.createElement('word-next2')
    }
  }

  private createElement(className: string): HTMLSpanElement {
    const span = document.createElement('span')
    span.className = `word ${className}`
    return span
  }

  private render() {
    this.container.innerHTML = ''
    const wrapper = document.createElement('div')
    wrapper.id = 'word-display'
    
    wrapper.appendChild(this.elements.prev2)
    wrapper.appendChild(this.elements.prev1)
    wrapper.appendChild(this.elements.current)
    wrapper.appendChild(this.elements.next1)
    wrapper.appendChild(this.elements.next2)
    
    this.container.appendChild(wrapper)
    
    // Add styles
    this.addStyles()
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      #word-display {
        display: flex;
        gap: 15px;
        align-items: baseline;
        justify-content: center;
        flex-wrap: nowrap;
      }
      
      .word {
        transition: all 0.2s ease;
        text-align: center;
        flex: 0 0 auto;
      }
      
      .word-prev2, .word-prev1, .word-next1, .word-next2 {
        color: #666;
        font-weight: 400;
        font-size: 0.8em;
        min-width: 60px;
      }
      
      .word-current {
        color: #000;
        font-weight: 700;
        font-size: 1.5em;
        min-width: 100px;
        position: relative;
      }
      
      .word-current.animate {
        transform: scale(0.95);
      }
      
      @media (max-width: 400px) {
        #word-display {
          gap: 10px;
        }
        
        .word-prev2, .word-next2 {
          display: none;
        }
        
        .word-prev1, .word-next1 {
          font-size: 0.7em;
          min-width: 40px;
        }
        
        .word-current {
          font-size: 1.2em;
          min-width: 80px;
        }
      }
    `
    
    if (!document.querySelector('#reader-styles')) {
      style.id = 'reader-styles'
      document.head.appendChild(style)
    }
  }

  public updateDisplay(state: ReaderState): ReaderDisplay {
    // Use RAF-scheduled update for smooth rendering
    this.rafUpdateDisplay(state)
    return this.getDisplay(state)
  }
  
  private updateDisplayInternal(state: ReaderState): void {
    const display: ReaderDisplay = {
      current: state.words[state.currentIndex] || ''
    }

    // Update previous words
    if (state.currentIndex >= 2) {
      display.prev2 = state.words[state.currentIndex - 2]
      this.elements.prev2.textContent = display.prev2
      this.elements.prev2.style.visibility = 'visible'
    } else {
      this.elements.prev2.style.visibility = 'hidden'
    }

    if (state.currentIndex >= 1) {
      display.prev1 = state.words[state.currentIndex - 1]
      this.elements.prev1.textContent = display.prev1
      this.elements.prev1.style.visibility = 'visible'
    } else {
      this.elements.prev1.style.visibility = 'hidden'
    }

    // Update current word
    this.elements.current.textContent = display.current
    this.animateCurrentWord()

    // Update next words
    if (state.currentIndex < state.words.length - 1) {
      display.next1 = state.words[state.currentIndex + 1]
      this.elements.next1.textContent = display.next1
      this.elements.next1.style.visibility = 'visible'
    } else {
      this.elements.next1.style.visibility = 'hidden'
    }

    if (state.currentIndex < state.words.length - 2) {
      display.next2 = state.words[state.currentIndex + 2]
      this.elements.next2.textContent = display.next2
      this.elements.next2.style.visibility = 'visible'
    } else {
      this.elements.next2.style.visibility = 'hidden'
    }

    // Handle completion
    if (state.currentIndex >= state.words.length) {
      this.showCompletion()
    }
  }
  
  private getDisplay(state: ReaderState): ReaderDisplay {
    const display: ReaderDisplay = {
      current: state.words[state.currentIndex] || ''
    }
    
    if (state.currentIndex >= 2) {
      display.prev2 = state.words[state.currentIndex - 2]
    }
    if (state.currentIndex >= 1) {
      display.prev1 = state.words[state.currentIndex - 1]
    }
    if (state.currentIndex < state.words.length - 1) {
      display.next1 = state.words[state.currentIndex + 1]
    }
    if (state.currentIndex < state.words.length - 2) {
      display.next2 = state.words[state.currentIndex + 2]
    }
    
    return display
  }

  private animateCurrentWord() {
    this.elements.current.classList.add('animate')
    setTimeout(() => {
      this.elements.current.classList.remove('animate')
    }, 50)
  }

  private showCompletion() {
    this.elements.current.textContent = 'Complete!'
    this.elements.prev2.style.visibility = 'hidden'
    this.elements.prev1.style.visibility = 'hidden'
    this.elements.next1.style.visibility = 'hidden'
    this.elements.next2.style.visibility = 'hidden'
  }

  public play(state: ReaderState, onTick: () => void): void {
    if (this.intervalId) {
      this.stop()
    }

    const delay = 60000 / state.wpm

    this.intervalId = window.setInterval(() => {
      onTick()
    }, delay)
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  public isPlaying(): boolean {
    return this.intervalId !== null
  }

  public setOnStateChange(callback: (state: Partial<ReaderState>) => void): void {
    this.onStateChange = callback
  }
}