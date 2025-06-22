export interface TouchGestureCallbacks {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
}

export class TouchGestureHandler {
  private element: HTMLElement
  private callbacks: TouchGestureCallbacks
  private touchStartX: number = 0
  private touchStartY: number = 0
  private touchStartTime: number = 0
  private minSwipeDistance: number = 50
  private maxTapDuration: number = 200

  constructor(element: HTMLElement, callbacks: TouchGestureCallbacks) {
    this.element = element
    this.callbacks = callbacks
    this.attachListeners()
  }

  private attachListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    
    // Prevent default touch behaviors
    this.element.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        e.preventDefault()
      }
    }, { passive: false })
  }

  private handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return
    
    this.touchStartX = e.touches[0].clientX
    this.touchStartY = e.touches[0].clientY
    this.touchStartTime = Date.now()
  }

  private handleTouchEnd(e: TouchEvent) {
    if (e.changedTouches.length !== 1) return
    
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const touchDuration = Date.now() - this.touchStartTime
    
    const deltaX = touchEndX - this.touchStartX
    const deltaY = touchEndY - this.touchStartY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // Check for tap
    if (absDeltaX < 10 && absDeltaY < 10 && touchDuration < this.maxTapDuration) {
      this.callbacks.onTap?.()
      e.preventDefault()
      return
    }
    
    // Check for swipe
    if (absDeltaX > this.minSwipeDistance || absDeltaY > this.minSwipeDistance) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.callbacks.onSwipeRight?.()
        } else {
          this.callbacks.onSwipeLeft?.()
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.callbacks.onSwipeDown?.()
        } else {
          this.callbacks.onSwipeUp?.()
        }
      }
      e.preventDefault()
    }
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
  }
}