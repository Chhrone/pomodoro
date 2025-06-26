/**
 * TimerView - Handles timer UI display and user interactions
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class TimerView {
  constructor() {
    // DOM elements
    this.elements = {
      container: null,
      sessionType: null,
      sessionCounter: null,
      timerMinutes: null,
      timerSeconds: null,
      // progressRing: null, // Not used in current design
      // sessionDots: null, // Not used in current design
      startPauseBtn: null,
      resetBtn: null,
      skipBtn: null,
      completedSessions: null,
      totalFocusTime: null,
      settingsBtn: null
    }

    // Event callbacks (set by presenter)
    this.callbacks = {}

    // Current session type for progress display
    this.currentSessionType = 'work'

    this.initializeElements()
    this.setupEventListeners()
  }


  
  /**
   * Initialize DOM elements
   */
  initializeElements() {
    console.log('TimerView: Initializing DOM elements...')

    this.elements.container = document.getElementById('timer-container')
    this.elements.sessionType = document.getElementById('session-type')
    this.elements.sessionCounter = document.getElementById('session-counter')
    this.elements.timerMinutes = document.getElementById('timer-minutes')
    this.elements.timerSeconds = document.getElementById('timer-seconds')
    this.elements.timerCircle = document.getElementById('timer-circle')
    // this.elements.sessionDots = document.getElementById('session-dots') // Not used in current design
    this.elements.startPauseBtn = document.getElementById('start-pause-btn')
    this.elements.resetBtn = document.getElementById('reset-btn')
    this.elements.skipBtn = document.getElementById('skip-btn')
    this.elements.completedSessions = document.getElementById('completed-sessions')
    this.elements.totalFocusTime = document.getElementById('total-focus-time')
    this.elements.settingsBtn = document.getElementById('settings-btn')
    this.elements.taskListBtn = document.getElementById('task-list-btn')

    // Log which elements were found
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.warn(`TimerView: Element '${key}' not found`)
      }
    })

    console.log('TimerView: DOM elements initialized')

    // Create rounded caps for progress ring
    this.createProgressCaps()
  }

  /**
   * Create rounded caps for progress ring
   */
  createProgressCaps() {
    if (!this.elements.timerCircle) return

    // Create start cap
    const startCap = document.createElement('div')
    startCap.className = 'progress-cap-start'
    this.elements.timerCircle.appendChild(startCap)

    // Create end cap
    const endCap = document.createElement('div')
    endCap.className = 'progress-cap-end'
    this.elements.timerCircle.appendChild(endCap)

    // Store references
    this.elements.progressCapStart = startCap
    this.elements.progressCapEnd = endCap
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Timer control buttons
    if (this.elements.startPauseBtn) {
      this.elements.startPauseBtn.addEventListener('click', () => {
        this.callbacks.onStartPause?.()
      })
    }
    
    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => {
        this.callbacks.onReset?.()
      })
    }
    
    if (this.elements.skipBtn) {
      this.elements.skipBtn.addEventListener('click', () => {
        this.callbacks.onSkip?.()
      })
    }
    
    if (this.elements.settingsBtn) {
      this.elements.settingsBtn.addEventListener('click', () => {
        this.callbacks.onSettings?.()
      })
    }

    if (this.elements.taskListBtn) {
      this.elements.taskListBtn.addEventListener('click', () => {
        this.callbacks.onTaskList?.()
      })
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when timer container is visible
      if (!this.isVisible()) return
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          this.callbacks.onStartPause?.()
          break
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            this.callbacks.onReset?.()
          }
          break
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            this.callbacks.onSkip?.()
          }
          break
        case 'Escape':
          this.callbacks.onSettings?.()
          break
      }
    })
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }



  /**
   * Set progress ring to completely empty state (for work sessions start)
   */
  setProgressRingEmpty() {
    if (!this.elements.timerCircle) return

    this.elements.timerCircle.style.setProperty('--progress-degrees', '0deg')
  }

  /**
   * Set progress ring to completely full state (for break sessions start)
   */
  setProgressRingFull() {
    if (!this.elements.timerCircle) return

    this.elements.timerCircle.style.setProperty('--progress-degrees', '360deg')
  }


  
  /**
   * Update timer display
   */
  updateTimer(minutes, seconds) {
    if (this.elements.timerMinutes) {
      this.elements.timerMinutes.textContent = minutes
    }
    if (this.elements.timerSeconds) {
      this.elements.timerSeconds.textContent = seconds
    }
  }
  


  /**
   * Update progress ring based on session type using conic-gradient on ::before pseudo-element
   */
  updateProgress(progress, sessionType = null) {
    if (!this.elements.timerCircle) return

    // Update session type if provided
    if (sessionType) {
      this.currentSessionType = sessionType
    }

    // Calculate degrees for conic-gradient (0-360)
    let progressDegrees

    if (this.currentSessionType === 'work') {
      // Work sessions: start empty, fill CCW from 12 o'clock
      progressDegrees = progress * 360
      this.elements.timerCircle.style.setProperty('--progress-direction', 'scaleX(-1)')
      this.elements.timerCircle.style.setProperty('--progress-start-angle', '0deg')
    } else {
      // Break sessions: start full, empty CW from 12 o'clock
      // Reverse progress so it empties as time progresses
      progressDegrees = (1 - progress) * 360
      this.elements.timerCircle.style.setProperty('--progress-direction', 'scaleX(1)')
      this.elements.timerCircle.style.setProperty('--progress-start-angle', '0deg')
    }

    // Update CSS custom property for the progress ring
    this.elements.timerCircle.style.setProperty('--progress-degrees', `${progressDegrees}deg`)

    // Update rounded caps visibility and position
    this.updateProgressCaps(progress, progressDegrees)
  }

  /**
   * Update progress caps visibility and position
   */
  updateProgressCaps(progress, progressDegrees) {
    if (!this.elements.progressCapStart || !this.elements.progressCapEnd) return

    // Show caps only when there's progress
    const showCaps = progress > 0 && progress < 1
    this.elements.timerCircle.style.setProperty('--cap-opacity', showCaps ? '1' : '0')

    // Update end cap rotation
    this.elements.timerCircle.style.setProperty('--progress-degrees', `${progressDegrees}deg`)
  }
  
  /**
   * Update session information
   */
  updateSessionInfo(sessionType, sessionNumber) {
    // Update current session type for progress direction
    const previousSessionType = this.currentSessionType
    this.currentSessionType = sessionType

    if (this.elements.sessionType) {
      const sessionNames = {
        work: 'Focus Time',
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
      }
      this.elements.sessionType.textContent = sessionNames[sessionType] || sessionType
    }

    if (this.elements.sessionCounter) {
      this.elements.sessionCounter.textContent = `Session ${sessionNumber}`
    }

    // Reset progress ring position when session type changes
    if (previousSessionType !== sessionType) {
      if (sessionType === 'work') {
        // Work sessions start empty
        this.setProgressRingEmpty()
      } else {
        // Break sessions start full
        this.setProgressRingFull()
      }
    }
  }
  
  /**
   * Update session dots
   */
  updateSessionDots(currentSession, completedSessions, sessionsUntilLongBreak) {
    if (!this.elements.sessionDots) return
    
    // Clear existing dots
    this.elements.sessionDots.innerHTML = ''
    
    // Create dots for sessions until long break
    for (let i = 1; i <= sessionsUntilLongBreak; i++) {
      const dot = document.createElement('div')
      dot.className = 'dot'
      
      if (i <= completedSessions) {
        dot.classList.add('completed')
      } else if (i === currentSession && currentSession <= sessionsUntilLongBreak) {
        dot.classList.add('active')
      }
      
      this.elements.sessionDots.appendChild(dot)
    }
    
    // Add long break dot
    const longBreakDot = document.createElement('div')
    longBreakDot.className = 'dot long-break'
    
    if (completedSessions >= sessionsUntilLongBreak) {
      longBreakDot.classList.add('completed')
    } else if (currentSession > sessionsUntilLongBreak) {
      longBreakDot.classList.add('active')
    }
    
    this.elements.sessionDots.appendChild(longBreakDot)
  }
  
  /**
   * Update start/pause button
   */
  updateStartPauseButton(isRunning, isPaused) {
    if (!this.elements.startPauseBtn) return
    
    if (isRunning && !isPaused) {
      this.elements.startPauseBtn.textContent = 'Pause'
      this.elements.startPauseBtn.classList.remove('primary')
      this.elements.startPauseBtn.classList.add('secondary')
    } else {
      this.elements.startPauseBtn.textContent = isPaused ? 'Resume' : 'Start'
      this.elements.startPauseBtn.classList.remove('secondary')
      this.elements.startPauseBtn.classList.add('primary')
    }
  }
  
  /**
   * Update statistics
   */
  updateStats(completedSessions, totalFocusTime) {
    if (this.elements.completedSessions) {
      this.elements.completedSessions.textContent = completedSessions
    }
    
    if (this.elements.totalFocusTime) {
      this.elements.totalFocusTime.textContent = totalFocusTime
    }
  }
  
  /**
   * Show timer container
   */
  show() {
    if (this.elements.container) {
      this.elements.container.classList.remove('hidden')
    }
  }

  /**
   * Show timer container with fade in animation
   */
  showWithFadeIn() {
    if (!this.elements.container) return

    // Show container
    this.elements.container.classList.remove('hidden')

    // Start with transparent
    this.elements.container.style.opacity = '0'

    // Animate in
    requestAnimationFrame(() => {
      this.elements.container.style.transition = 'opacity 0.4s ease-in-out'
      this.elements.container.style.opacity = '1'

      setTimeout(() => {
        this.elements.container.style.transition = ''
      }, 400)
    })
  }
  
  /**
   * Hide timer container
   */
  hide() {
    if (this.elements.container) {
      this.elements.container.classList.add('hidden')
    }
  }
  
  /**
   * Check if timer container is visible
   */
  isVisible() {
    return this.elements.container && !this.elements.container.classList.contains('hidden')
  }
  
  /**
   * Add visual feedback for timer state
   */
  setTimerState(state) {
    if (!this.elements.container) return
    
    // Remove all state classes
    this.elements.container.classList.remove('running', 'paused', 'completed')
    
    // Add current state class
    if (state) {
      this.elements.container.classList.add(state)
    }
  }
  
  /**
   * Animate timer completion
   */
  animateCompletion() {
    if (!this.elements.timerCircle) return

    // Add completion animation class
    this.elements.timerCircle.classList.add('completed')

    // Remove after animation
    setTimeout(() => {
      this.elements.timerCircle.classList.remove('completed')
    }, 1000)
  }

  /**
   * Animate fast completion for skip action
   */
  animateSkipCompletion(sessionType = null) {
    if (!this.elements.timerCircle) return

    // Update session type if provided
    if (sessionType) {
      this.currentSessionType = sessionType
    }

    // Add fast completion animation
    this.elements.timerCircle.style.transition = 'all 0.5s ease-out'

    if (this.currentSessionType === 'work') {
      // Work sessions: quickly fill to complete
      this.setProgressRingFull()
    } else {
      // Break sessions: quickly empty to complete
      this.setProgressRingEmpty()
    }

    // Restore normal transition speed after animation
    setTimeout(() => {
      this.elements.timerCircle.style.transition = ''
    }, 500)
  }
  
  /**
   * Show notification or visual feedback
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    
    // Add to container
    if (this.elements.container) {
      this.elements.container.appendChild(notification)
      
      // Animate in
      setTimeout(() => notification.classList.add('show'), 10)
      
      // Remove after delay
      setTimeout(() => {
        notification.classList.remove('show')
        setTimeout(() => notification.remove(), 300)
      }, 3000)
    }
  }
  
  /**
   * Enable/disable controls
   */
  setControlsEnabled(enabled) {
    const controls = [
      this.elements.startPauseBtn,
      this.elements.resetBtn,
      this.elements.skipBtn
    ]
    
    controls.forEach(control => {
      if (control) {
        control.disabled = !enabled
      }
    })
  }
  
  /**
   * Add pulse animation to timer
   */
  addPulseAnimation() {
    if (this.elements.timerCircle) {
      this.elements.timerCircle.classList.add('pulse')
    }
  }

  /**
   * Remove pulse animation from timer
   */
  removePulseAnimation() {
    if (this.elements.timerCircle) {
      this.elements.timerCircle.classList.remove('pulse')
    }
  }
  
  /**
   * Get DOM element for external access
   */
  getElement(name) {
    return this.elements[name]
  }
}
