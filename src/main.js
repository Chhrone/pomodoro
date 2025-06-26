import './style.css'
import { TimerPresenter } from './presenters/TimerPresenter.js'
import { MusicPresenter } from './presenters/MusicPresenter.js'
import { SettingsPresenter } from './presenters/SettingsPresenter.js'
import { ReportPresenter } from './presenters/ReportPresenter.js'
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

  init() {
    console.log('PomodoroApp: Initializing...')

    this.settingsPresenter.init()
    this.reportPresenter.init()
    this.timerPresenter.init()

    // Wire up presenter dependencies
    this.timerPresenter.setSettingsPresenter(this.settingsPresenter)
    this.timerPresenter.setReportPresenter(this.reportPresenter)

    this.connectPresenters()
    this.initializeMusicTracks()

    console.log('PomodoroApp: Initialization complete!')
    console.log('📝 Note: Task List feature is currently under development and will be available in a future update!')
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
      this.musicPresenter.stopMusic()
    })

    this.timerPresenter.on('timerResume', () => {
      const currentSession = this.timerPresenter.getCurrentSessionType()
      if (currentSession === 'work' && this.musicPresenter.isEnabled()) {
        this.musicPresenter.startMusic()
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

    // TODO: Task list toggle
    // this.setupTaskListToggle()
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
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded')

  // Clean up task list artifacts
  const appElement = document.getElementById('app')
  if (appElement) {
    appElement.classList.remove('task-list-hidden')
    appElement.style.paddingLeft = ''
  }

  window.pomodoroApp = new PomodoroApp()
})
