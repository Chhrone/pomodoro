/**
 * TimerModel - Manages timer state, sessions, and tracking
 * Follows MVP pattern - no direct DOM interaction
 */
export class TimerModel {
  constructor() {
    // Timer configuration (in minutes)
    this.config = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 3
    }
    
    // Timer state
    this.state = {
      currentSession: 'work', // 'work', 'shortBreak', 'longBreak'
      sessionNumber: 1,
      completedSessions: 0,
      totalFocusTime: 0, // in seconds (changed from minutes for precision)
      isRunning: false,
      isPaused: false,
      timeRemaining: this.config.workDuration * 60, // in seconds
      totalTime: this.config.workDuration * 60
    }
    
    // Break confirmation state
    this.breakState = {
      isWaitingForConfirmation: false,
      sessionEndTime: null,
      gracePeriodsUsed: 0,
      bonusTime: 0 // in seconds
    }
    
    // Timer interval
    this.interval = null
    this.graceTimeout = null
    
    // Event listeners
    this.listeners = {}
  }
  
  /**
   * Event system for MVP communication
   */
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
  
  /**
   * Get current timer state
   */
  getState() {
    return { ...this.state }
  }
  
  /**
   * Get break confirmation state
   */
  getBreakState() {
    return { ...this.breakState }
  }
  
  /**
   * Get timer configuration
   */
  getConfig() {
    return { ...this.config }
  }
  
  /**
   * Update timer configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Update current session time if not running
    if (!this.state.isRunning) {
      this.resetCurrentSession()
    }
    
    this.emit('configUpdated', this.config)
  }
  
  /**
   * Start the timer
   */
  start() {
    if (this.state.isRunning) return
    
    this.state.isRunning = true
    this.state.isPaused = false
    
    this.interval = setInterval(() => {
      this.tick()
    }, 1000)
    
    this.emit('timerStarted', {
      sessionType: this.state.currentSession,
      timeRemaining: this.state.timeRemaining
    })
  }
  
  /**
   * Pause the timer
   */
  pause() {
    if (!this.state.isRunning || this.state.isPaused) return
    
    this.state.isPaused = true
    clearInterval(this.interval)
    this.interval = null
    
    this.emit('timerPaused', {
      timeRemaining: this.state.timeRemaining
    })
  }
  
  /**
   * Resume the timer
   */
  resume() {
    if (!this.state.isRunning || !this.state.isPaused) return
    
    this.state.isPaused = false
    
    this.interval = setInterval(() => {
      this.tick()
    }, 1000)
    
    this.emit('timerResumed', {
      timeRemaining: this.state.timeRemaining
    })
  }
  
  /**
   * Reset the current session
   */
  reset() {
    this.stop()
    this.resetCurrentSession()
    
    this.emit('timerReset', {
      sessionType: this.state.currentSession,
      timeRemaining: this.state.timeRemaining
    })
  }
  
  /**
   * Skip to next session
   */
  skip() {
    this.stop()

    // Increment completed sessions only for work sessions when skipped
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
  
  /**
   * Stop the timer
   */
  stop() {
    this.state.isRunning = false
    this.state.isPaused = false
    
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
    
    if (this.graceTimeout) {
      clearTimeout(this.graceTimeout)
      this.graceTimeout = null
    }
  }
  
  /**
   * Timer tick - called every second
   */
  tick() {
    if (this.state.timeRemaining <= 0) {
      this.sessionComplete()
      return
    }

    this.state.timeRemaining--

    // Update total focus time in real-time for work sessions only
    if (this.state.currentSession === 'work') {
      this.state.totalFocusTime += 1 // Add 1 second
    }

    this.emit('timerTick', {
      timeRemaining: this.state.timeRemaining,
      totalTime: this.state.totalTime,
      progress: (this.state.totalTime - this.state.timeRemaining) / this.state.totalTime,
      totalFocusTime: this.state.totalFocusTime
    })
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
    
    // Start break confirmation process for work sessions
    if (this.state.currentSession === 'work') {
      this.startBreakConfirmation()
    } else {
      // Auto-start next session for breaks
      this.nextSession()
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
