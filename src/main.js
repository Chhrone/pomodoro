import './style.css'
import { TimerPresenter } from './presenters/TimerPresenter.js'
import { MusicPresenter } from './presenters/MusicPresenter.js'
import { SettingsPresenter } from './presenters/SettingsPresenter.js'
import { ReportPresenter } from './presenters/ReportPresenter.js'
import { settingsManager } from './utils/SettingsManager.js'
import { SettingsTest } from './utils/SettingsTest.js'
// TODO: Task List feature
// import { TaskListPresenter } from './presenters/TaskListPresenter.js'
// import { TaskModel } from './models/TaskModel.js'
// import { TaskListView } from './views/TaskListView.js'

class PomodoroApp {
  constructor() {
    this.timerPresenter = new TimerPresenter()
    this.musicPresenter = new MusicPresenter()
    this.settingsPresenter = new SettingsPresenter()
    this.reportPresenter = new ReportPresenter()

    // TODO: Task list components
    // this.taskModel = new TaskModel()
    // this.taskListView = new TaskListView()
    // this.taskListPresenter = new TaskListPresenter(this.taskModel, this.taskListView)

    this.timerPresenter.setMusicPresenter(this.musicPresenter)
    this.init()
  }

  async init() {
    // Initialize centralized settings manager first
    settingsManager.init(this.settingsPresenter.model)

    // Initialize settings first to load saved theme
    this.settingsPresenter.init()
    this.reportPresenter.init()
    this.timerPresenter.init()

    // Wire up presenter dependencies
    this.timerPresenter.setSettingsPresenter(this.settingsPresenter)
    this.timerPresenter.setReportPresenter(this.reportPresenter)

    this.connectPresenters()
    await this.initializeMusicTracks()
    await this.requestNotificationPermission()

    console.log('Application initialized with centralized settings')
  }

  /**
   * Initialize music tracks
   */
  async initializeMusicTracks() {
    try {
      await this.musicPresenter.loadMusicTracks()
    } catch (error) {
      console.error('Failed to initialize music tracks:', error)
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    try {
      const timerModel = this.timerPresenter.model
      if (timerModel && timerModel.notificationManager) {
        const granted = await timerModel.notificationManager.requestPermission()
        if (granted) {
          console.log('✅ Notification permission granted')
        } else {
          console.log('⚠️ Notification permission denied - notifications will not be shown')
        }
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  connectPresenters() {
    // Music control based on session state
    this.timerPresenter.on('sessionStart', (sessionType) => {
      if (sessionType === 'work' && this.musicPresenter.isEnabled()) {
        this.musicPresenter.startMusic()
      } else {
        this.musicPresenter.stopMusic()
      }
    })

    this.timerPresenter.on('sessionEnd', (sessionType) => {
      this.musicPresenter.stopMusic()
    })

    this.timerPresenter.on('timerPause', () => {
      this.musicPresenter.pauseMusic()
    })

    this.timerPresenter.on('timerResume', () => {
      const currentSession = this.timerPresenter.getCurrentSessionType()
      if (currentSession === 'work' && this.musicPresenter.isEnabled()) {
        this.musicPresenter.resumeMusic()
      }
    })

    this.timerPresenter.on('settingsRequested', () => {
      this.settingsPresenter.showSettings()
    })

    // TODO: Task List connections
    // this.timerPresenter.on('taskListRequested', () => {
    //   this.taskListPresenter.showTaskList()
    // })

    this.settingsPresenter.on('settingsChanged', (settings) => {
      this.timerPresenter.updateSettings(settings)

      if (settings.musicEnabled !== undefined) {
        this.musicPresenter.updateConfig({ enabled: settings.musicEnabled })
      }
      if (settings.musicVolume !== undefined) {
        this.musicPresenter.updateConfig({ volume: settings.musicVolume / 100 })
      }
    })

    this.reportPresenter.on('requestStats', () => {
      const stats = this.timerPresenter.getStats()
      this.reportPresenter.updateReport(stats)
    })

    // Global shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.code) {
          case 'Comma':
            e.preventDefault()
            this.settingsPresenter.toggleSettings()
            break
          case 'KeyT': // TODO: Task List
            e.preventDefault()
            console.log('Task List feature is under development')
            break
        }
      }
    })

    // Background tab handling
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Resume music if conditions are met
        if (this.timerPresenter.isRunning() && this.musicPresenter.isEnabled() && !this.musicPresenter.isPlaying()) {
          this.musicPresenter.resumeMusic()
        }
      }
    })

    // Save incomplete sessions before page unload
    window.addEventListener('beforeunload', (e) => {
      this.saveIncompleteSession()
    })

    // Also save on page hide (for mobile browsers)
    document.addEventListener('pagehide', (e) => {
      this.saveIncompleteSession()
    })

    // TODO: Task list toggle
    // this.setupTaskListToggle()

    // Expose debug methods globally for troubleshooting
    window.debugSettings = () => this.settingsPresenter.debugPanelState()
    window.fixSettings = () => this.settingsPresenter.emergencyReset()

    // Expose settings testing utilities in development
    window.testSettings = () => SettingsTest.runTests()
    window.settingsManager = settingsManager
    window.SettingsTest = SettingsTest

    // Run settings validation in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('🔧 Development mode: Running settings validation...')
        this.settingsPresenter.validateSettingsIntegration()
      }, 1000)
    }
  }

  // TODO: Task list setup
  // setupTaskListToggle() {
  //   const taskListBtn = document.getElementById('task-list-btn')
  //   if (taskListBtn) {
  //     taskListBtn.addEventListener('click', () => {
  //       this.taskListPresenter.toggleTaskList()
  //     })
  //   }
  // }

  getState() {
    return {
      timer: this.timerPresenter.getCurrentState(),
      music: this.musicPresenter.getState(),
      settings: this.settingsPresenter.getSettings()
    }
  }

  exportData() {
    return {
      settings: this.settingsPresenter.getSettings(),
      stats: this.timerPresenter.getStats()
    }
  }

  /**
   * Save session data when user closes/reloads page during active session
   */
  saveIncompleteSession() {
    try {
      const timerState = this.timerPresenter.getCurrentState()

      // Save focus time and completed sessions data if timer is running
      if (timerState.isRunning && timerState.currentSession === 'work') {
        const currentSessionElapsed = timerState.totalTime - timerState.timeRemaining

        // Only save if there's meaningful progress (at least 1 minute)
        if (currentSessionElapsed >= 60) {
          const sessionData = {
            sessionNumber: timerState.sessionNumber,
            completedSessions: timerState.completedSessions,
            totalFocusTime: timerState.totalFocusTime + currentSessionElapsed,
            currentSessionElapsed: currentSessionElapsed,
            timestamp: new Date().toISOString()
          }

          // Save to daily reports to preserve focus time data
          if (this.reportPresenter) {
            this.reportPresenter.saveIncompleteSession(sessionData)
          }
        }
      }
    } catch (error) {
      console.error('PomodoroApp: Error saving session data:', error)
    }
  }


}

document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('loaded')

  // Clean up task list artifacts
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.classList.remove('task-list-hidden')
    appElement.style.paddingLeft = ''
  }

  window.pomodoroApp = new PomodoroApp()
})
