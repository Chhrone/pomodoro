/**
 * EventEmitter - Simple event system for MVP communication
 */
export class EventEmitter {
  constructor() {
    this.listeners = {}
  }
  
  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
    
    // Return unsubscribe function
    return () => this.off(event, callback)
  }
  
  /**
   * Add one-time event listener
   */
  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    return this.on(event, onceCallback)
  }
  
  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners[event]) return
    
    const index = this.listeners[event].indexOf(callback)
    if (index > -1) {
      this.listeners[event].splice(index, 1)
    }
    
    // Clean up empty arrays
    if (this.listeners[event].length === 0) {
      delete this.listeners[event]
    }
  }
  
  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    if (this.listeners[event]) {
      // Create a copy to avoid issues if listeners are modified during emission
      const listeners = [...this.listeners[event]]
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error)
        }
      })
    }
  }
  
  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event]
    } else {
      this.listeners = {}
    }
  }
  
  /**
   * Get list of events with listeners
   */
  getEvents() {
    return Object.keys(this.listeners)
  }
  
  /**
   * Get number of listeners for an event
   */
  getListenerCount(event) {
    return this.listeners[event] ? this.listeners[event].length : 0
  }
}
