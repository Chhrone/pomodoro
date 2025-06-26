/**
 * Timer Worker Manager
 * Manages Web Worker for precise timer functionality
 * Provides fallback to regular timer if Web Workers not supported
 */

import { EventEmitter } from './EventEmitter.js'

export class TimerWorkerManager extends EventEmitter {
  constructor() {
    super()
    this.worker = null
    this.fallbackInterval = null
    this.fallbackState = {
      isRunning: false,
      startTime: null,
      pausedTime: 0,
      totalDuration: 0
    }
    this.supportsWorkers = typeof Worker !== 'undefined'
    
    this.initializeWorker()
  }

  initializeWorker() {
    if (!this.supportsWorkers) {
      console.warn('Web Workers not supported, using fallback timer')
      return
    }

    try {
      // Create worker from the timer-worker.js file
      this.worker = new Worker(new URL('../workers/timer-worker.js', import.meta.url))
      this.setupWorkerListeners()
      console.log('Timer Web Worker initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Web Worker, using fallback:', error)
      this.supportsWorkers = false
      this.worker = null
    }
  }

  setupWorkerListeners() {
    if (!this.worker) return

    this.worker.addEventListener('message', (event) => {
      const { type, data } = event.data
      
      switch (type) {
        case 'TIMER_STARTED':
          this.emit('started', data)
          break
        case 'TIMER_PAUSED':
          this.emit('paused', data)
          break
        case 'TIMER_RESUMED':
          this.emit('resumed', data)
          break
        case 'TIMER_STOPPED':
          this.emit('stopped', data)
          break
        case 'TIMER_TICK':
          this.emit('tick', data)
          break
        case 'TIMER_COMPLETED':
          this.emit('completed', data)
          break
        case 'TIMER_STATE':
          this.emit('state', data)
          break
        default:
          console.warn('Unknown worker message type:', type)
      }
    })

    this.worker.addEventListener('error', (error) => {
      console.error('Timer Worker error:', error)
      this.fallbackToRegularTimer()
    })
  }

  startTimer(durationInSeconds) {
    if (this.worker) {
      this.worker.postMessage({
        type: 'START_TIMER',
        data: { duration: durationInSeconds }
      })
    } else {
      this.startFallbackTimer(durationInSeconds)
    }
  }

  pauseTimer() {
    if (this.worker) {
      this.worker.postMessage({ type: 'PAUSE_TIMER' })
    } else {
      this.pauseFallbackTimer()
    }
  }

  resumeTimer() {
    if (this.worker) {
      this.worker.postMessage({ type: 'RESUME_TIMER' })
    } else {
      this.resumeFallbackTimer()
    }
  }

  stopTimer() {
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_TIMER' })
    } else {
      this.stopFallbackTimer()
    }
  }

  getState() {
    if (this.worker) {
      this.worker.postMessage({ type: 'GET_STATE' })
    } else {
      this.emitFallbackState()
    }
  }

  // Fallback timer implementation
  startFallbackTimer(durationInSeconds) {
    if (this.fallbackState.isRunning) return

    this.fallbackState.isRunning = true
    this.fallbackState.startTime = Date.now()
    this.fallbackState.pausedTime = 0
    this.fallbackState.totalDuration = durationInSeconds * 1000

    this.fallbackInterval = setInterval(() => {
      this.fallbackTick()
    }, 1000)

    this.emit('started', {
      duration: durationInSeconds,
      timestamp: this.fallbackState.startTime
    })
  }

  pauseFallbackTimer() {
    if (!this.fallbackState.isRunning) return

    this.fallbackState.isRunning = false
    this.fallbackState.pausedTime += Date.now() - this.fallbackState.startTime
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }

    this.emit('paused', {
      pausedTime: this.fallbackState.pausedTime,
      timestamp: Date.now()
    })
  }

  resumeFallbackTimer() {
    if (this.fallbackState.isRunning) return

    this.fallbackState.isRunning = true
    this.fallbackState.startTime = Date.now() - this.fallbackState.pausedTime

    this.fallbackInterval = setInterval(() => {
      this.fallbackTick()
    }, 1000)

    this.emit('resumed', { timestamp: Date.now() })
  }

  stopFallbackTimer() {
    this.fallbackState.isRunning = false
    this.fallbackState.startTime = null
    this.fallbackState.pausedTime = 0
    this.fallbackState.totalDuration = 0

    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }

    this.emit('stopped', { timestamp: Date.now() })
  }

  fallbackTick() {
    if (!this.fallbackState.isRunning) return

    const now = Date.now()
    const elapsed = now - this.fallbackState.startTime
    const remaining = Math.max(0, this.fallbackState.totalDuration - elapsed)
    const remainingSeconds = Math.ceil(remaining / 1000)

    this.emit('tick', {
      timeRemaining: remainingSeconds,
      totalTime: Math.ceil(this.fallbackState.totalDuration / 1000),
      progress: elapsed / this.fallbackState.totalDuration,
      timestamp: now,
      elapsed: Math.floor(elapsed / 1000)
    })

    if (remaining <= 0) {
      this.stopFallbackTimer()
      this.emit('completed', { timestamp: now })
    }
  }

  emitFallbackState() {
    const now = Date.now()
    let timeRemaining = 0
    let progress = 0

    if (this.fallbackState.totalDuration > 0) {
      const elapsed = this.fallbackState.isRunning 
        ? now - this.fallbackState.startTime
        : this.fallbackState.pausedTime
      timeRemaining = Math.max(0, Math.ceil((this.fallbackState.totalDuration - elapsed) / 1000))
      progress = elapsed / this.fallbackState.totalDuration
    }

    this.emit('state', {
      isRunning: this.fallbackState.isRunning,
      timeRemaining,
      totalTime: Math.ceil(this.fallbackState.totalDuration / 1000),
      progress,
      timestamp: now
    })
  }

  fallbackToRegularTimer() {
    console.warn('Falling back to regular timer due to Web Worker issues')
    this.supportsWorkers = false
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  destroy() {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }
    
    this.removeAllListeners()
  }
}
