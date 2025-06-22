import { ReaderState } from '../types'
import { calculateReadingTime, formatReadingTime, calculateProgress } from '../utils/textProcessor'

export class Progress {
  private container: HTMLElement
  private elements: {
    progressBar: HTMLDivElement | null
    progressFill: HTMLDivElement | null
    stats: HTMLSpanElement | null
  }

  constructor(container: HTMLElement) {
    this.container = container
    this.elements = {
      progressBar: null,
      progressFill: null,
      stats: null
    }
    this.render()
  }

  private render() {
    // Create elements instead of using innerHTML to preserve event listeners
    const wrapper = document.createElement('div')
    wrapper.className = 'progress-wrapper'
    
    const progressBar = document.createElement('div')
    progressBar.id = 'progress-bar'
    progressBar.className = 'progress-bar'
    
    const progressFill = document.createElement('div')
    progressFill.id = 'progress-fill'
    progressFill.className = 'progress-fill'
    
    const stats = document.createElement('span')
    stats.id = 'stats'
    stats.className = 'stats'
    
    progressBar.appendChild(progressFill)
    wrapper.appendChild(progressBar)
    wrapper.appendChild(stats)
    
    this.container.appendChild(wrapper)
    
    // Get references
    this.elements.progressBar = progressBar
    this.elements.progressFill = progressFill
    this.elements.stats = stats

    this.addStyles()
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .progress-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        max-width: 300px;
      }

      .progress-bar {
        flex: 1;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        position: relative;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #4CAF50;
        border-radius: 2px;
        transition: width 0.3s ease;
        width: 0%;
      }

      .stats {
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        min-width: 100px;
        text-align: right;
      }

      @media (max-width: 600px) {
        .progress-wrapper {
          width: 100%;
          max-width: none;
          margin-top: 10px;
        }

        .stats {
          font-size: 11px;
          min-width: 80px;
        }
      }

      @media (max-width: 400px) {
        .progress-bar {
          height: 3px;
        }
      }
    `

    if (!document.querySelector('#progress-styles')) {
      style.id = 'progress-styles'
      document.head.appendChild(style)
    }
  }

  public update(state: ReaderState) {
    // Update progress bar
    const progress = calculateProgress(state.currentIndex, state.words.length)
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = `${progress}%`
    }

    // Update stats
    if (this.elements.stats) {
      const currentWord = Math.min(state.currentIndex + 1, state.words.length)
      const wordsRemaining = Math.max(0, state.words.length - state.currentIndex - 1)
      const { minutes, seconds } = calculateReadingTime(wordsRemaining, state.wpm)
      const timeStr = formatReadingTime(minutes, seconds)

      this.elements.stats.textContent = `${currentWord}/${state.words.length} • ${timeStr}`
    }
  }

  public reset() {
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = '0%'
    }
    if (this.elements.stats) {
      this.elements.stats.textContent = '0/0 • 0:00'
    }
  }
}