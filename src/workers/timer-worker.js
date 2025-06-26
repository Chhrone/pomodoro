/**
 * Timer Web Worker
 * Handles precise timer logic in background thread
 * Prevents timer drift when browser tab is inactive
 */

class TimerWorker {
  constructor() {
    this.state = {
      isRunning: false,
      startTime: null,
      pausedTime: 0,
      totalDuration: 0,
      lastTickTime: null
    }
    
    this.interval = null
    this.setupMessageHandlers()
  }

  setupMessageHandlers() {
    self.addEventListener('message', (event) => {
      const { type, data } = event.data
      
      switch (type) {
        case 'START_TIMER':
          this.startTimer(data.duration)
          break
        case 'PAUSE_TIMER':
          this.pauseTimer()
          break
        case 'RESUME_TIMER':
          this.resumeTimer()
          break
        case 'STOP_TIMER':
          this.stopTimer()
          break
        case 'GET_STATE':
          this.sendState()
          break
        default:
          console.warn('Unknown message type:', type)
      }
    })
  }

  startTimer(duration) {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.state.startTime = Date.now()
    this.state.pausedTime = 0
    this.state.totalDuration = duration * 1000 // Convert to milliseconds
    this.state.lastTickTime = this.state.startTime

    this.startTicking()
    
    this.postMessage({
      type: 'TIMER_STARTED',
      data: {
        duration: duration,
        timestamp: this.state.startTime
      }
    })
  }

  pauseTimer() {
    if (!this.state.isRunning) return

    this.state.isRunning = false
    this.state.pausedTime += Date.now() - this.state.lastTickTime
    this.stopTicking()

    this.postMessage({
      type: 'TIMER_PAUSED',
      data: {
        pausedTime: this.state.pausedTime,
        timestamp: Date.now()
      }
    })
  }

  resumeTimer() {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.state.lastTickTime = Date.now()
    this.startTicking()

    this.postMessage({
      type: 'TIMER_RESUMED',
      data: {
        timestamp: Date.now()
      }
    })
  }

  stopTimer() {
    this.state.isRunning = false
    this.state.startTime = null
    this.state.pausedTime = 0
    this.state.totalDuration = 0
    this.state.lastTickTime = null
    this.stopTicking()

    this.postMessage({
      type: 'TIMER_STOPPED',
      data: {
        timestamp: Date.now()
      }
    })
  }

  startTicking() {
    this.stopTicking() // Clear any existing interval
    
    // Use high-frequency interval for accuracy
    this.interval = setInterval(() => {
      this.tick()
    }, 100) // 100ms for smooth updates
  }

  stopTicking() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  tick() {
    if (!this.state.isRunning) return

    const now = Date.now()
    const elapsed = now - this.state.startTime - this.state.pausedTime
    const remaining = Math.max(0, this.state.totalDuration - elapsed)
    
    // Send tick update every 100ms but only emit second changes
    const remainingSeconds = Math.ceil(remaining / 1000)
    const lastRemainingSeconds = Math.ceil((this.state.totalDuration - (this.state.lastTickTime - this.state.startTime - this.state.pausedTime)) / 1000)
    
    if (remainingSeconds !== lastRemainingSeconds || remaining === 0) {
      this.postMessage({
        type: 'TIMER_TICK',
        data: {
          timeRemaining: remainingSeconds,
          totalTime: Math.ceil(this.state.totalDuration / 1000),
          progress: elapsed / this.state.totalDuration,
          timestamp: now,
          elapsed: Math.floor(elapsed / 1000)
        }
      })
    }

    this.state.lastTickTime = now

    // Check if timer completed
    if (remaining <= 0) {
      this.completeTimer()
    }
  }

  completeTimer() {
    this.stopTimer()
    
    this.postMessage({
      type: 'TIMER_COMPLETED',
      data: {
        timestamp: Date.now()
      }
    })
  }

  sendState() {
    const now = Date.now()
    let timeRemaining = 0
    let progress = 0
    
    if (this.state.isRunning && this.state.startTime) {
      const elapsed = now - this.state.startTime - this.state.pausedTime
      timeRemaining = Math.max(0, Math.ceil((this.state.totalDuration - elapsed) / 1000))
      progress = elapsed / this.state.totalDuration
    } else if (this.state.totalDuration > 0) {
      const elapsed = this.state.pausedTime
      timeRemaining = Math.max(0, Math.ceil((this.state.totalDuration - elapsed) / 1000))
      progress = elapsed / this.state.totalDuration
    }

    this.postMessage({
      type: 'TIMER_STATE',
      data: {
        isRunning: this.state.isRunning,
        timeRemaining,
        totalTime: Math.ceil(this.state.totalDuration / 1000),
        progress,
        timestamp: now
      }
    })
  }

  postMessage(message) {
    self.postMessage(message)
  }
}

// Initialize worker
const timerWorker = new TimerWorker()
