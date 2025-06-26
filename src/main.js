import './style.css'
import { TimerPresenter } from './presenters/TimerPresenter.js'
import { MusicPresenter } from './presenters/MusicPresenter.js'
import { SettingsPresenter } from './presenters/SettingsPresenter.js'
import { ReportPresenter } from './presenters/ReportPresenter.js'

// Initialize the application
class PomodoroApp {
  constructor() {
    this.timerPresenter = new TimerPresenter()
    this.musicPresenter = new MusicPresenter()
    this.settingsPresenter = new SettingsPresenter()
    this.reportPresenter = new ReportPresenter()

    // Connect presenters
    this.timerPresenter.setMusicPresenter(this.musicPresenter)

    this.init()
  }

  init() {
    console.log('PomodoroApp: Initializing...')

    // Initialize all presenters
    console.log('PomodoroApp: Initializing presenters...')
    this.settingsPresenter.init()
    // Music presenter doesn't need init() method anymore
    this.reportPresenter.init()
    this.timerPresenter.init()

    // Set up presenter references
    this.timerPresenter.setSettingsPresenter(this.settingsPresenter)

    // Connect presenters for communication
    this.connectPresenters()

    console.log('PomodoroApp: Initialization complete!')
  }

  connectPresenters() {
    // Timer <-> Music connections
    this.timerPresenter.on('sessionStart', (sessionType) => {
      if (sessionType === 'work' && this.musicPresenter.isEnabled()) {
        this.musicPresenter.startMusic()
      } else {
        // Stop music for break sessions
        this.musicPresenter.stopMusic()
      }
    })

    this.timerPresenter.on('sessionEnd', (sessionType) => {
      // Always stop music when session ends
      this.musicPresenter.stopMusic()
    })

    this.timerPresenter.on('timerPause', () => {
      // Always stop music when timer is paused
      this.musicPresenter.stopMusic()
    })

    this.timerPresenter.on('timerResume', () => {
      // Only resume music if it's a work session and music is enabled
      const currentSession = this.timerPresenter.getCurrentSessionType()
      if (currentSession === 'work' && this.musicPresenter.isEnabled()) {
        this.musicPresenter.startMusic()
      }
    })

    // Timer <-> Settings connections
    this.timerPresenter.on('settingsRequested', () => {
      this.settingsPresenter.showSettings()
    })

    this.settingsPresenter.on('settingsChanged', (settings) => {
      // Update timer with new settings
      this.timerPresenter.updateSettings(settings)

      // Update music with new settings if needed
      if (settings.musicEnabled !== undefined) {
        this.musicPresenter.updateConfig({ enabled: settings.musicEnabled })
      }
      if (settings.musicVolume !== undefined) {
        this.musicPresenter.updateConfig({ volume: settings.musicVolume / 100 })
      }
    })

    // Report <-> Timer connections
    this.reportPresenter.on('requestStats', () => {
      const stats = this.timerPresenter.getStats()
      this.reportPresenter.updateReport(stats)
    })

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Global shortcuts that work anywhere
      if (e.ctrlKey || e.metaKey) {
        switch (e.code) {
          case 'Comma': // Ctrl/Cmd + ,
            e.preventDefault()
            this.settingsPresenter.toggleSettings()
            break
        }
      }
    })

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      // Timer and music should continue running in background
      // No action needed - let them run continuously
      if (!document.hidden) {
        // Tab is visible - ensure music is playing if timer is running and music is enabled
        if (this.timerPresenter.isRunning() && this.musicPresenter.isEnabled() && !this.musicPresenter.isPlaying()) {
          this.musicPresenter.resumeMusic()
        }
      }
    })
  }

  /**
   * Get current application state
   */
  getState() {
    return {
      timer: this.timerPresenter.getCurrentState(),
      music: this.musicPresenter.getState(),
      settings: this.settingsPresenter.getSettings()
    }
  }

  /**
   * Export application data
   */
  exportData() {
    return {
      settings: this.settingsPresenter.getSettings(),
      stats: this.timerPresenter.getStats()
    }
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Show content after CSS is loaded
  document.body.classList.add('loaded')

  // Initialize app
  window.pomodoroApp = new PomodoroApp()
})
