import { ReaderState, ControlsConfig, PlaybackCommand } from '../types'

export interface ControlsCallbacks {
  onPlayPause: () => void
  onRestart: () => void
  onRewind: () => void
  onFastForward: () => void
  onSpeedChange: (wpm: number) => void
}

export class Controls {
  private container: HTMLElement
  private elements: {
    playPauseBtn: HTMLButtonElement | null
    restartBtn: HTMLButtonElement | null
    rewindBtn: HTMLButtonElement | null
    forwardBtn: HTMLButtonElement | null
    speedSlider: HTMLInputElement | null
    speedValue: HTMLSpanElement | null
  }
  private callbacks: ControlsCallbacks
  private config: ControlsConfig

  constructor(container: HTMLElement, config: ControlsConfig, callbacks: ControlsCallbacks) {
    this.container = container
    this.config = config
    this.callbacks = callbacks
    this.elements = {
      playPauseBtn: null,
      restartBtn: null,
      rewindBtn: null,
      forwardBtn: null,
      speedSlider: null,
      speedValue: null
    }
    this.render()
    this.attachEventListeners()
  }

  private render() {
    this.container.innerHTML = `
      <div class="controls-wrapper">
        <button id="play-pause-btn" class="control-btn play-btn">
          <span class="btn-icon">▶</span>
          <span class="btn-text">Play</span>
        </button>
        <button id="restart-btn" class="control-btn nav-btn" title="Restart from beginning">
          <span class="btn-icon">⏮</span>
        </button>
        <button id="rewind-btn" class="control-btn nav-btn" title="Rewind">
          <span class="btn-icon">◀◀</span>
        </button>
        <button id="forward-btn" class="control-btn nav-btn" title="Fast forward">
          <span class="btn-icon">▶▶</span>
        </button>
        <div class="speed-control">
          <input id="speed-slider" type="range" 
            min="${this.config.minWPM}" 
            max="${this.config.maxWPM}" 
            value="${this.config.defaultWPM}" 
            step="${this.config.wpmStep}">
          <span id="speed-value" class="speed-value">${this.config.defaultWPM} WPM</span>
        </div>
      </div>
    `

    // Get references to elements
    this.elements.playPauseBtn = this.container.querySelector('#play-pause-btn')
    this.elements.restartBtn = this.container.querySelector('#restart-btn')
    this.elements.rewindBtn = this.container.querySelector('#rewind-btn')
    this.elements.forwardBtn = this.container.querySelector('#forward-btn')
    this.elements.speedSlider = this.container.querySelector('#speed-slider')
    this.elements.speedValue = this.container.querySelector('#speed-value')

    this.addStyles()
  }

  private addStyles() {
    const style = document.createElement('style')
    style.textContent = `
      .controls-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
        width: 100%;
      }

      .control-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .control-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .control-btn:active {
        transform: translateY(0);
        box-shadow: none;
      }

      .play-btn {
        background: #4CAF50;
        color: white;
        min-width: 80px;
      }

      .pause-btn {
        background: #FF5722;
        color: white;
        min-width: 80px;
      }

      .nav-btn {
        background: #2196F3;
        color: white;
        padding: 8px 12px;
      }

      .btn-icon {
        font-size: 12px;
      }

      .btn-text {
        font-size: 14px;
      }

      .speed-control {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #speed-slider {
        width: 100px;
        height: 4px;
        -webkit-appearance: none;
        appearance: none;
        background: #e0e0e0;
        outline: none;
        border-radius: 2px;
      }

      #speed-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: #2196F3;
        cursor: pointer;
        border-radius: 50%;
      }

      #speed-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #2196F3;
        cursor: pointer;
        border-radius: 50%;
        border: none;
      }

      .speed-value {
        font-size: 14px;
        color: #666;
        min-width: 70px;
      }

      @media (max-width: 400px) {
        .controls-wrapper {
          gap: 5px;
        }

        .control-btn {
          padding: 6px 12px;
          font-size: 12px;
        }

        .btn-text {
          display: none;
        }

        .nav-btn {
          padding: 6px 10px;
        }

        #speed-slider {
          width: 80px;
        }

        .speed-value {
          font-size: 12px;
          min-width: 60px;
        }
      }

      @media (hover: none) {
        .control-btn:hover {
          transform: none;
          box-shadow: none;
        }

        .control-btn:active {
          opacity: 0.8;
        }
      }
    `

    if (!document.querySelector('#controls-styles')) {
      style.id = 'controls-styles'
      document.head.appendChild(style)
    }
  }

  private attachEventListeners() {
    this.elements.playPauseBtn?.addEventListener('click', () => {
      this.callbacks.onPlayPause()
    })

    this.elements.restartBtn?.addEventListener('click', () => {
      this.callbacks.onRestart()
    })

    this.elements.rewindBtn?.addEventListener('click', () => {
      this.callbacks.onRewind()
    })

    this.elements.forwardBtn?.addEventListener('click', () => {
      this.callbacks.onFastForward()
    })

    this.elements.speedSlider?.addEventListener('input', (e) => {
      const wpm = parseInt((e.target as HTMLInputElement).value)
      this.updateSpeedDisplay(wpm)
      this.callbacks.onSpeedChange(wpm)
    })
  }

  public updatePlayPauseButton(isPlaying: boolean) {
    if (!this.elements.playPauseBtn) return

    if (isPlaying) {
      this.elements.playPauseBtn.className = 'control-btn pause-btn'
      this.elements.playPauseBtn.innerHTML = `
        <span class="btn-icon">⏸</span>
        <span class="btn-text">Pause</span>
      `
    } else {
      this.elements.playPauseBtn.className = 'control-btn play-btn'
      this.elements.playPauseBtn.innerHTML = `
        <span class="btn-icon">▶</span>
        <span class="btn-text">Play</span>
      `
    }
  }

  public updateSpeed(wpm: number) {
    if (this.elements.speedSlider) {
      this.elements.speedSlider.value = wpm.toString()
    }
    this.updateSpeedDisplay(wpm)
  }

  private updateSpeedDisplay(wpm: number) {
    if (this.elements.speedValue) {
      this.elements.speedValue.textContent = `${wpm} WPM`
    }
  }

  public disable() {
    this.elements.playPauseBtn?.setAttribute('disabled', 'true')
    this.elements.restartBtn?.setAttribute('disabled', 'true')
    this.elements.rewindBtn?.setAttribute('disabled', 'true')
    this.elements.forwardBtn?.setAttribute('disabled', 'true')
    this.elements.speedSlider?.setAttribute('disabled', 'true')
  }

  public enable() {
    this.elements.playPauseBtn?.removeAttribute('disabled')
    this.elements.restartBtn?.removeAttribute('disabled')
    this.elements.rewindBtn?.removeAttribute('disabled')
    this.elements.forwardBtn?.removeAttribute('disabled')
    this.elements.speedSlider?.removeAttribute('disabled')
  }
}