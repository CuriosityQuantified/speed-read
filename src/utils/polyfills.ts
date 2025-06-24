// Polyfills for browser compatibility

// RequestAnimationFrame polyfill
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return (window as any).webkitRequestAnimationFrame ||
           (window as any).mozRequestAnimationFrame ||
           (window as any).oRequestAnimationFrame ||
           (window as any).msRequestAnimationFrame ||
           function(callback: FrameRequestCallback) {
             return window.setTimeout(callback, 1000 / 60)
           }
  })()
}

// Performance.now polyfill
if (!window.performance || !window.performance.now) {
  window.performance = window.performance || {} as Performance
  window.performance.now = function() {
    return Date.now()
  }
}

// Array.from polyfill
if (!Array.from) {
  Array.from = function<T>(arrayLike: ArrayLike<T>): T[] {
    return Array.prototype.slice.call(arrayLike)
  }
}

// String.prototype.includes polyfill
if (!String.prototype.includes) {
  String.prototype.includes = function(search: string, start?: number) {
    'use strict'
    if (typeof start !== 'number') {
      start = 0
    }
    
    if (start + search.length > this.length) {
      return false
    } else {
      return this.indexOf(search, start) !== -1
    }
  }
}

// Object.assign polyfill
if (!Object.assign) {
  Object.assign = function(target: any, ...sources: any[]) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    const to = Object(target)

    for (let index = 0; index < sources.length; index++) {
      const nextSource = sources[index]

      if (nextSource != null) {
        for (const nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey]
          }
        }
      }
    }
    return to
  }
}

// Element.closest polyfill
if (!Element.prototype.closest) {
  Element.prototype.closest = function(selector: string) {
    let element: Element | null = this
    
    while (element && element.nodeType === 1) {
      if (element.matches(selector)) {
        return element
      }
      element = element.parentElement
    }
    
    return null
  }
}

// Element.matches polyfill
if (!Element.prototype.matches) {
  Element.prototype.matches = 
    (Element.prototype as any).matchesSelector ||
    (Element.prototype as any).mozMatchesSelector ||
    (Element.prototype as any).msMatchesSelector ||
    (Element.prototype as any).oMatchesSelector ||
    (Element.prototype as any).webkitMatchesSelector ||
    function(this: Element, s: string) {
      const matches = ((this as any).document || this.ownerDocument).querySelectorAll(s)
      let i = matches.length
      while (--i >= 0 && matches[i] !== this) {}
      return i > -1
    }
}

// CustomEvent polyfill for IE
if (typeof window.CustomEvent !== 'function') {
  function CustomEvent(event: string, params?: CustomEventInit) {
    params = params || { bubbles: false, cancelable: false, detail: null }
    const evt = document.createEvent('CustomEvent')
    evt.initCustomEvent(event, params.bubbles!, params.cancelable!, params.detail)
    return evt
  }
  
  CustomEvent.prototype = window.Event.prototype
  window.CustomEvent = CustomEvent as any
}

// Check for required features
export function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = []
  
  // Check for required APIs
  if (!window.localStorage) missing.push('localStorage')
  if (!window.sessionStorage) missing.push('sessionStorage')
  if (!window.IntersectionObserver) missing.push('IntersectionObserver')
  if (!window.MutationObserver) missing.push('MutationObserver')
  if (!document.querySelector) missing.push('querySelector')
  if (!window.addEventListener) missing.push('addEventListener')
  
  // Check for CSS support
  const testEl = document.createElement('div')
  if (!('flex' in testEl.style)) missing.push('CSS Flexbox')
  if (!('grid' in testEl.style)) missing.push('CSS Grid')
  
  return {
    supported: missing.length === 0,
    missing
  }
}

// Initialize polyfills
export function initializePolyfills() {
  const { supported, missing } = checkBrowserSupport()
  
  if (!supported) {
    console.warn('Browser missing features:', missing)
    
    // Show warning to user if critical features are missing
    if (missing.includes('localStorage') || missing.includes('querySelector')) {
      const warning = document.createElement('div')
      warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 9999;
      `
      warning.textContent = 'Your browser may not support all features. Please update to a modern browser for the best experience.'
      document.body.appendChild(warning)
    }
  }
}