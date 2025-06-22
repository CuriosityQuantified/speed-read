// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    
    timeout = window.setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

// Throttle function for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  let lastArgs: Parameters<T> | null = null
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      
      setTimeout(() => {
        inThrottle = false
        if (lastArgs) {
          func(...lastArgs)
          lastArgs = null
        }
      }, limit)
    } else {
      lastArgs = args
    }
  }
}

// Lazy loading for components
export class LazyLoader<T> {
  private loader: () => Promise<T>
  private cache: T | null = null
  private loading: Promise<T> | null = null

  constructor(loader: () => Promise<T>) {
    this.loader = loader
  }

  async get(): Promise<T> {
    if (this.cache) return this.cache
    
    if (!this.loading) {
      this.loading = this.loader().then(result => {
        this.cache = result
        this.loading = null
        return result
      })
    }
    
    return this.loading
  }

  clear() {
    this.cache = null
    this.loading = null
  }
}

// Request animation frame wrapper for smooth animations
export function rafSchedule<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  return function scheduled(...args: Parameters<T>) {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          callback(...lastArgs)
        }
        rafId = null
      })
    }
  }
}

// Performance monitor
export class PerformanceMonitor {
  private static marks = new Map<string, number>()
  private static enabled = true

  static enable() {
    this.enabled = true
  }

  static disable() {
    this.enabled = false
  }

  static mark(name: string) {
    if (!this.enabled) return
    this.marks.set(name, performance.now())
  }

  static measure(name: string, startMark: string): number {
    if (!this.enabled) return 0
    
    const start = this.marks.get(startMark)
    if (!start) return 0
    
    const duration = performance.now() - start
    console.debug(`Performance [${name}]: ${duration.toFixed(2)}ms`)
    
    return duration
  }

  static async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) return operation()
    
    const start = performance.now()
    try {
      const result = await operation()
      const duration = performance.now() - start
      console.debug(`Performance [${name}]: ${duration.toFixed(2)}ms`)
      return result
    } catch (error) {
      const duration = performance.now() - start
      console.debug(`Performance [${name}] (failed): ${duration.toFixed(2)}ms`)
      throw error
    }
  }
}

// Memory usage monitor
export function getMemoryUsage(): { used: number; limit: number; percentage: number } | null {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    }
  }
  return null
}

// Intersection observer for lazy loading elements
export class LazyElementLoader {
  private observer: IntersectionObserver
  private callbacks = new Map<Element, () => void>()

  constructor(options?: IntersectionObserverInit) {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const callback = this.callbacks.get(entry.target)
          if (callback) {
            callback()
            this.unobserve(entry.target)
          }
        }
      })
    }, options)
  }

  observe(element: Element, callback: () => void) {
    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element) {
    this.callbacks.delete(element)
    this.observer.unobserve(element)
  }

  disconnect() {
    this.observer.disconnect()
    this.callbacks.clear()
  }
}