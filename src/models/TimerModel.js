// Timer state management and session tracking
import { TimerWorkerManager } from '../utils/TimerWorkerManager.js'
import { NotificationManager } from '../utils/NotificationManager.js'
import { settingsManager } from '../utils/SettingsManager.js'

export class TimerModel {
  constructor() {
    // Initialize with default config (will be updated from settings)
    this.config = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 3
    }

    // Load config from settings when available
    this.initializeFromSettings()

    this.state = {
      currentSession: 'work',
      sessionNumber: 1,
      completedSessions: 0,
      totalFocusTime: 0, // seconds for precision
      isRunning: false,
      isPaused: false,
      timeRemaining: this.config.workDuration * 60,
      totalTime: this.config.workDuration * 60
    }

    // Break confirmation handling
    this.breakState = {
      isWaitingForConfirmation: false,
      sessionEndTime: null,
      gracePeriodsUsed: 0,
      bonusTime: 0
    }

    this.interval = null
    this.graceTimeout = null
    this.listeners = {}

    // Initialize Web Worker for precise timing
    this.timerWorker = new TimerWorkerManager()
    this.setupWorkerListeners()

    // Initialize notification system
    this.notificationManager = new NotificationManager()
  }

  /**
   * Setup Web Worker event listeners
   */
  setupWorkerListeners() {
    this.timerWorker.on('tick', (data) => {
      this.state.timeRemaining = data.timeRemaining

      // Track focus time in real-time for work sessions
      if (this.state.currentSession === 'work') {
        this.state.totalFocusTime += 1
      }

      this.emit('timerTick', {
        timeRemaining: data.timeRemaining,
        totalTime: data.totalTime,
        progress: data.progress,
        totalFocusTime: this.state.totalFocusTime
      })
    })

    this.timerWorker.on('completed', () => {
      this.sessionComplete()
    })

    this.timerWorker.on('started', () => {
      this.state.isRunning = true
      this.state.isPaused = false
    })

    this.timerWorker.on('paused', () => {
      this.state.isPaused = true
    })

    this.timerWorker.on('resumed', () => {
      this.state.isPaused = false
    })

    this.timerWorker.on('stopped', () => {
      this.state.isRunning = false
      this.state.isPaused = false
    })
  }

  /**
   * Initialize timer config from centralized settings
   */
  initializeFromSettings() {
    try {
      // Wait for settings manager to be initialized
      if (settingsManager.initialized) {
        this.loadConfigFromSettings()
      } else {
        // Listen for settings initialization
        setTimeout(() => this.initializeFromSettings(), 100)
      }
    } catch (error) {
      console.warn('Settings manager not ready, using default timer config:', error)
    }
  }

  /**
   * Load timer configuration from settings
   */
  loadConfigFromSettings() {
    try {
      const timerSettings = settingsManager.getTimerSettings()

      this.config = {
        workDuration: timerSettings.workDuration || 25,
        shortBreakDuration: timerSettings.shortBreakDuration || 5,
        longBreakDuration: timerSettings.longBreakDuration || 15,
        sessionsUntilLongBreak: timerSettings.sessionsUntilLongBreak || 3
      }

      // Reset current session with new config
      this.resetCurrentSession()

      console.log('Timer config loaded from settings:', this.config)
    } catch (error) {
      console.warn('Failed to load timer config from settings:', error)
    }
  }

  // Event system
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }

  getState() {
    return { ...this.state }
  }

  getBreakState() {
    return { ...this.breakState }
  }

  getConfig() {
    return { ...this.config }
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }

    // Reset session time if timer is stopped
    if (!this.state.isRunning) {
      this.resetCurrentSession()
    }

    this.emit('configUpdated', this.config)
  }

  start() {
    if (this.state.isRunning) return

    // Start Web Worker timer
    this.timerWorker.startTimer(Math.ceil(this.state.timeRemaining))

    // Show session start notification
    if (this.state.currentSession === 'work') {
      this.notificationManager.notifyWorkStart(this.state.sessionNumber)
    } else {
      // For break sessions, show break start notification
      const breakType = this.state.currentSession === 'shortBreak' ? 'shortBreak' : 'longBreak'
      const duration = this.state.currentSession === 'shortBreak'
        ? this.config.shortBreakDuration
        : this.config.longBreakDuration
      this.notificationManager.notifyBreakStart(breakType, duration)
    }

    this.emit('timerStarted', {
      sessionType: this.state.currentSession,
      timeRemaining: this.state.timeRemaining
    })
  }
  
  pause() {
    if (!this.state.isRunning || this.state.isPaused) return

    // Pause Web Worker timer
    this.timerWorker.pauseTimer()

    this.emit('timerPaused', {
      timeRemaining: this.state.timeRemaining
    })
  }

  resume() {
    if (!this.state.isRunning || !this.state.isPaused) return

    // Resume Web Worker timer
    this.timerWorker.resumeTimer()

    this.emit('timerResumed', {
      timeRemaining: this.state.timeRemaining
    })
  }

  reset() {
    this.stop()
    this.resetCurrentSession()

    this.emit('timerReset', {
      sessionType: this.state.currentSession,
      timeRemaining: this.state.timeRemaining
    })
  }
  
  skip() {
    this.stop()

    // Count work sessions when skipped
    if (this.state.currentSession === 'work') {
      this.state.completedSessions++
    }

    this.nextSession()

    this.emit('sessionSkipped', {
      sessionType: this.state.currentSession,
      sessionNumber: this.state.sessionNumber,
      completedSessions: this.state.completedSessions,
      totalFocusTime: this.state.totalFocusTime
    })
  }

  stop() {
    // Stop Web Worker timer
    this.timerWorker.stopTimer()

    if (this.graceTimeout) {
      clearTimeout(this.graceTimeout)
      this.graceTimeout = null
    }
  }


  
  /**
   * Handle session completion
   */
  sessionComplete() {
    this.stop()

    // Track completed work sessions
    if (this.state.currentSession === 'work') {
      this.state.completedSessions++
      // Note: totalFocusTime is already updated in real-time during tick()
    }

    this.emit('sessionCompleted', {
      sessionType: this.state.currentSession,
      completedSessions: this.state.completedSessions,
      totalFocusTime: this.state.totalFocusTime
    })

    // Handle break logic for work sessions
    if (this.state.currentSession === 'work') {
      const nextBreakType = this.getNextBreakType()

      // Show session completion notification
      this.notificationManager.notifySessionComplete(this.state.currentSession, nextBreakType)

      // Auto-start short breaks, only confirm long breaks
      if (nextBreakType === 'shortBreak') {
        this.nextSession()

        // Notify break start
        this.notificationManager.notifyBreakStart('shortBreak', this.config.shortBreakDuration)

        this.emit('shortBreakStarted', {
          sessionType: this.state.currentSession,
          timeRemaining: this.state.timeRemaining
        })
      } else {
        // Long break requires confirmation
        this.startBreakConfirmation()
      }
    } else {
      // Show break completion notification
      this.notificationManager.notifySessionComplete(this.state.currentSession)

      // Auto-start next session for breaks
      this.nextSession()

      // Notify work session start
      this.notificationManager.notifyWorkStart(this.state.sessionNumber)

      this.emit('breakEnded', {
        nextSessionType: this.state.currentSession
      })
    }
  }
  
  /**
   * Start break confirmation process
   */
  startBreakConfirmation() {
    this.breakState.isWaitingForConfirmation = true
    this.breakState.sessionEndTime = Date.now()
    this.breakState.bonusTime = 0
    
    // Start grace period (10 seconds invisible)
    this.graceTimeout = setTimeout(() => {
      this.startBonusTimeTracking()
    }, 10000) // 10 seconds grace period
    
    this.emit('breakConfirmationStarted', {
      nextBreakType: this.getNextBreakType(),
      breakDuration: this.getNextBreakDuration()
    })
  }
  
  /**
   * Start tracking bonus time after grace period
   */
  startBonusTimeTracking() {
    this.graceTimeout = null
    
    // Start tracking bonus time (max 10 minutes)
    const bonusInterval = setInterval(() => {
      if (!this.breakState.isWaitingForConfirmation) {
        clearInterval(bonusInterval)
        return
      }
      
      this.breakState.bonusTime++
      
      // Max 10 minutes bonus
      if (this.breakState.bonusTime >= 600) {
        clearInterval(bonusInterval)
      }
      
      this.emit('bonusTimeUpdated', {
        bonusTime: this.breakState.bonusTime
      })
    }, 1000)
  }
  
  /**
   * Confirm break start
   */
  confirmBreak() {
    if (!this.breakState.isWaitingForConfirmation) return
    
    this.breakState.isWaitingForConfirmation = false
    
    if (this.graceTimeout) {
      clearTimeout(this.graceTimeout)
      this.graceTimeout = null
    }
    
    // Move to next session and add bonus time
    this.nextSession()

    if (this.breakState.bonusTime > 0) {
      this.state.timeRemaining += this.breakState.bonusTime
      this.state.totalTime += this.breakState.bonusTime
    }

    // Notify long break start
    this.notificationManager.notifyBreakStart('longBreak', this.config.longBreakDuration)
    
    this.emit('breakConfirmed', {
      sessionType: this.state.currentSession,
      bonusTime: this.breakState.bonusTime,
      timeRemaining: this.state.timeRemaining
    })
    
    // Reset break state
    this.breakState.bonusTime = 0
    this.breakState.sessionEndTime = null
  }
  
  /**
   * Skip break confirmation
   */
  skipBreak() {
    if (!this.breakState.isWaitingForConfirmation) return
    
    this.breakState.isWaitingForConfirmation = false
    
    if (this.graceTimeout) {
      clearTimeout(this.graceTimeout)
      this.graceTimeout = null
    }
    
    // Skip break and go to next work session
    this.state.sessionNumber++
    this.state.currentSession = 'work'
    this.resetCurrentSession()
    
    this.emit('breakSkipped', {
      sessionType: this.state.currentSession,
      sessionNumber: this.state.sessionNumber
    })
    
    // Reset break state
    this.breakState.bonusTime = 0
    this.breakState.sessionEndTime = null
  }
  
  /**
   * Move to next session
   */
  nextSession() {
    if (this.state.currentSession === 'work') {
      // Determine break type
      if (this.state.sessionNumber % this.config.sessionsUntilLongBreak === 0) {
        this.state.currentSession = 'longBreak'
      } else {
        this.state.currentSession = 'shortBreak'
      }
    } else {
      // After any break, go to work
      this.state.currentSession = 'work'
      this.state.sessionNumber++
    }
    
    this.resetCurrentSession()
  }
  
  /**
   * Reset current session time
   */
  resetCurrentSession() {
    const duration = this.getCurrentSessionDuration()
    this.state.timeRemaining = duration * 60
    this.state.totalTime = duration * 60
  }
  
  /**
   * Get current session duration in minutes
   */
  getCurrentSessionDuration() {
    switch (this.state.currentSession) {
      case 'work':
        return this.config.workDuration
      case 'shortBreak':
        return this.config.shortBreakDuration
      case 'longBreak':
        return this.config.longBreakDuration
      default:
        return this.config.workDuration
    }
  }
  
  /**
   * Get next break type
   */
  getNextBreakType() {
    if (this.state.sessionNumber % this.config.sessionsUntilLongBreak === 0) {
      return 'longBreak'
    }
    return 'shortBreak'
  }
  
  /**
   * Get next break duration
   */
  getNextBreakDuration() {
    const breakType = this.getNextBreakType()
    return breakType === 'longBreak' 
      ? this.config.longBreakDuration 
      : this.config.shortBreakDuration
  }
  
  /**
   * Format time in MM:SS format
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: remainingSeconds.toString().padStart(2, '0')
    }
  }
  
  /**
   * Format total focus time in HH:MM:SS format
   */
  formatTotalTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
}
