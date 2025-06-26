// Timer coordination between model and views
import { TimerModel } from '../models/TimerModel.js'
import { TimerView } from '../views/TimerView.js'
import { BreakConfirmationView } from '../views/BreakConfirmationView.js'
import { EventEmitter } from '../utils/EventEmitter.js'

export class TimerPresenter extends EventEmitter {
  constructor() {
    super()

    this.model = new TimerModel()
    this.timerView = new TimerView()
    this.breakView = new BreakConfirmationView()

    this.currentView = 'timer'

    this.setupModelListeners()
    this.setupViewCallbacks()
    this.initializeUI()
  }

  init() {
    console.log('TimerPresenter: Initializing...')
    this.updateUI()

    // Set initial progress ring state
    const state = this.model.getState()
    if (state.currentSession === 'work') {
      this.timerView.setProgressRingEmpty()
    } else {
      this.timerView.setProgressRingFull()
    }

    this.timerView.show()
    console.log('TimerPresenter: Initialized and timer view shown')
  }

  setSettingsPresenter(settingsPresenter) {
    this.settingsPresenter = settingsPresenter

    // Listen for timer settings saved event
    this.settingsPresenter.on('timerSettingsSaved', (newSettings) => {
      this.handleTimerSettingsSaved(newSettings)
    })
  }

  /**
   * Set report presenter reference for session tracking
   */
  setReportPresenter(reportPresenter) {
    this.reportPresenter = reportPresenter
  }
  
  /**
   * Setup model event listeners
   */
  setupModelListeners() {
    // Timer events
    this.model.on('timerStarted', (data) => {
      this.timerView.updateStartPauseButton(true, false)
      this.timerView.setTimerState('running')
      this.emit('sessionStart', data.sessionType)

      // Show now playing if it's a work session
      if (data.sessionType === 'work' && this.musicPresenter) {
        this.musicPresenter.showNowPlaying()
      }
    })
    
    this.model.on('timerPaused', () => {
      this.timerView.updateStartPauseButton(true, true)
      this.timerView.setTimerState('paused')
      this.emit('timerPause')

      // Hide now playing when paused
      if (this.musicPresenter) {
        this.musicPresenter.hideNowPlaying()
      }
    })
    
    this.model.on('timerResumed', () => {
      this.timerView.updateStartPauseButton(true, false)
      this.timerView.setTimerState('running')
      this.emit('timerResume')

      // Show now playing when resumed if it's a work session
      const currentSession = this.model.getState().currentSession
      if (currentSession === 'work' && this.musicPresenter) {
        this.musicPresenter.showNowPlaying()
      }
    })
    
    this.model.on('timerReset', () => {
      this.timerView.updateStartPauseButton(false, false)
      this.timerView.setTimerState('')
      this.updateUI()

      // Hide now playing when reset
      if (this.musicPresenter) {
        this.musicPresenter.hideNowPlaying()
      }
    })
    
    this.model.on('timerTick', (data) => {
      this.updateTimerDisplay(data.timeRemaining)
      this.timerView.updateProgress(data.progress, this.model.getState().currentSession)
      // Update stats in real-time if totalFocusTime is provided
      if (data.totalFocusTime !== undefined) {
        this.timerView.updateStats(
          this.model.getState().completedSessions,
          this.model.formatTotalTime(data.totalFocusTime)
        )
      }

      // Update session progress for reporting
      if (this.reportPresenter) {
        const elapsedTime = data.totalTime - data.timeRemaining
        this.reportPresenter.updateSessionProgress(elapsedTime)
      }
    })
    
    // Session events
    this.model.on('sessionCompleted', (data) => {
      this.timerView.animateCompletion()
      this.timerView.updateStats(data.completedSessions, this.model.formatTotalTime(data.totalFocusTime))

      // Complete session tracking
      if (this.reportPresenter) {
        this.reportPresenter.completeSession()
      }

      this.emit('sessionEnd', data.sessionType)
    })
    
    this.model.on('sessionSkipped', (data) => {
      this.updateUI()

      // Cancel session tracking when skipped
      if (this.reportPresenter) {
        this.reportPresenter.cancelSession()
      }

      // Skip notification removed - just update UI silently
    })
    
    // Break confirmation events
    this.model.on('breakConfirmationStarted', (data) => {
      this.showBreakConfirmation(data.nextBreakType, data.breakDuration)
    })
    
    this.model.on('bonusTimeUpdated', (data) => {
      this.breakView.updateBonusTime(data.bonusTime)
    })
    
    this.model.on('breakConfirmed', (data) => {
      this.hideBreakConfirmation()
      this.updateUI()

      // Hide now playing during break
      if (this.musicPresenter) {
        this.musicPresenter.hideNowPlaying()
      }

      // Removed break started notification - just update UI silently
    })
    
    this.model.on('breakSkipped', (data) => {
      this.hideBreakConfirmation()
      this.updateUI()
      // Skip notification removed - just update UI silently
    })
    
    this.model.on('breakEnded', (data) => {
      this.updateUI()
      // Removed notification - just update UI silently

      // When starting work session, ensure progress ring starts empty
      if (data.nextSessionType === 'work') {
        this.timerView.setProgressRingEmpty()

        // Show now playing when starting work session after break
        if (this.musicPresenter) {
          this.musicPresenter.showNowPlaying()
        }
      }
    })
  }
  
  /**
   * Setup view callbacks
   */
  setupViewCallbacks() {
    // Timer view callbacks
    this.timerView.setCallbacks({
      onStartPause: () => this.handleStartPause(),
      onReset: () => this.handleReset(),
      onSkip: () => this.handleSkip(),
      onSettings: () => this.handleSettings(),
      onTaskList: () => this.handleTaskList()
    })
    
    // Break confirmation view callbacks
    this.breakView.setCallbacks({
      onStartBreak: () => this.handleStartBreak(),
      onSkipBreak: () => this.handleSkipBreak()
    })
  }
  
  /**
   * Initialize UI with current state
   */
  initializeUI() {
    this.updateUI()
  }
  
  /**
   * Update entire UI based on current model state
   */
  updateUI() {
    const state = this.model.getState()
    const config = this.model.getConfig()
    
    // Update timer display
    this.updateTimerDisplay(state.timeRemaining)
    
    // Update session info
    this.timerView.updateSessionInfo(state.currentSession, state.sessionNumber)
    
    // Update session dots
    this.timerView.updateSessionDots(
      state.sessionNumber,
      state.completedSessions,
      config.sessionsUntilLongBreak
    )
    
    // Update controls
    this.timerView.updateStartPauseButton(state.isRunning, state.isPaused)
    
    // Update stats
    this.timerView.updateStats(
      state.completedSessions,
      this.model.formatTotalTime(state.totalFocusTime)
    )
    
    // Update progress
    const progress = state.totalTime > 0 ? (state.totalTime - state.timeRemaining) / state.totalTime : 0

    // View will handle the difference between fill/empty based on session type
    this.timerView.updateProgress(progress, state.currentSession)
  }
  
  /**
   * Update timer display
   */
  updateTimerDisplay(timeRemaining) {
    const formatted = this.model.formatTime(timeRemaining)
    this.timerView.updateTimer(formatted.minutes, formatted.seconds)
  }
  
  /**
   * Handle start/pause button click
   */
  handleStartPause() {
    const state = this.model.getState()

    if (!state.isRunning) {
      this.model.start()

      // Start session tracking when timer starts
      if (this.reportPresenter) {
        const newState = this.model.getState()
        this.reportPresenter.startSession(newState.currentSession, newState.totalTime)
      }
    } else if (state.isPaused) {
      this.model.resume()
    } else {
      this.model.pause()
    }
  }
  
  /**
   * Handle reset button click
   */
  handleReset() {
    // Cancel session tracking when reset
    if (this.reportPresenter) {
      this.reportPresenter.cancelSession()
    }

    this.model.reset()
  }

  /**
   * Set music presenter reference for now playing control
   */
  setMusicPresenter(musicPresenter) {
    this.musicPresenter = musicPresenter
  }
  
  /**
   * Handle skip button click
   */
  handleSkip() {
    const state = this.model.getState()

    // Animate fast completion before skipping
    this.timerView.animateSkipCompletion(state.currentSession)

    // Skip after animation starts
    setTimeout(() => {
      this.model.skip()
    }, 100)
  }
  
  /**
   * Handle settings button click
   */
  handleSettings() {
    this.emit('settingsRequested')
  }

  /**
   * Handle task list button click
   */
  handleTaskList() {
    this.emit('taskListRequested')
  }
  
  /**
   * Handle start break button click
   */
  handleStartBreak() {
    // When starting break, ensure progress ring starts full
    this.timerView.setProgressRingFull()
    this.model.confirmBreak()
  }
  
  /**
   * Handle skip break button click
   */
  handleSkipBreak() {
    const state = this.model.getState()

    // Animate fast completion before skipping break
    this.timerView.animateSkipCompletion(state.currentSession)

    // Skip break after animation starts
    setTimeout(() => {
      this.model.skipBreak()
    }, 100)
  }
  
  /**
   * Show break confirmation
   */
  showBreakConfirmation(breakType, breakDuration) {
    this.currentView = 'break'
    this.timerView.hide()
    
    const state = this.model.getState()
    this.breakView.show(breakType, breakDuration, state.sessionNumber)
  }
  
  /**
   * Hide break confirmation
   */
  hideBreakConfirmation() {
    this.currentView = 'timer'

    // Hide break container instantly (no animation)
    this.breakView.hideInstant()

    // Show timer container with fade in
    this.timerView.showWithFadeIn()
  }
  
  /**
   * Update settings from external source
   */
  updateSettings(settings) {
    if (settings.timer) {
      this.model.updateConfig(settings.timer)
    }
  }
  
  /**
   * Get session display name
   */
  getSessionDisplayName(sessionType) {
    const names = {
      work: 'Focus Time',
      shortBreak: 'Short Break',
      longBreak: 'Long Break'
    }
    return names[sessionType] || sessionType
  }

  /**
   * Get current stats for reporting
   */
  getStats() {
    const state = this.model.getState()
    return {
      focusTime: this.model.formatTotalTime(state.totalFocusTime),
      completedSessions: state.completedSessions
    }
  }
  
  /**
   * Get current timer state for external access
   */
  getCurrentState() {
    return {
      ...this.model.getState(),
      currentView: this.currentView,
      breakState: this.model.getBreakState()
    }
  }
  
  /**
   * Force update UI (useful for external changes)
   */
  forceUpdate() {
    this.updateUI()
  }
  
  /**
   * Check if timer is currently running
   */
  isRunning() {
    return this.model.getState().isRunning
  }
  
  /**
   * Check if in break confirmation mode
   */
  isInBreakConfirmation() {
    return this.currentView === 'break'
  }

  /**
   * Handle timer settings saved event
   */
  handleTimerSettingsSaved(newSettings) {
    // Reset timer to apply new settings
    this.model.reset()

    // Update model configuration with new settings
    this.model.updateConfig(newSettings)

    // Update UI to reflect new settings
    this.updateUI()

    console.log('TimerPresenter: Timer settings updated and reset:', newSettings)
  }

  /**
   * Check if timer is running
   */
  isRunning() {
    return this.model.getState().isRunning
  }

  /**
   * Get current session type
   */
  getCurrentSessionType() {
    const state = this.model.getState()
    return state.sessionType
  }

}
