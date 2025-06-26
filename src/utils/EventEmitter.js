// Simple event system for MVP communication
export class EventEmitter {
  constructor() {
    this.listeners = {}
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)

    return () => this.off(event, callback)
  }

  once(event, callback) {
    const onceCallback = (...args) => {
      callback(...args)
      this.off(event, onceCallback)
    }
    return this.on(event, onceCallback)
  }

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

  emit(event, data) {
    if (this.listeners[event]) {
      // Copy to avoid modification during emission
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

  removeAllListeners(event) {
    if (event) {
      delete this.listeners[event]
    } else {
      this.listeners = {}
    }
  }

  getEvents() {
    return Object.keys(this.listeners)
  }

  getListenerCount(event) {
    return this.listeners[event] ? this.listeners[event].length : 0
  }
}
