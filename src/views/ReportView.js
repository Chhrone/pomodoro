/**
 * ReportView - Manages report modal display
 * Follows MVP pattern - only handles DOM manipulation
 */
export class ReportView {
  constructor() {
    this.modal = document.getElementById('report-modal')
    this.overlay = this.modal.querySelector('.modal-overlay')
    this.closeBtn = document.getElementById('close-report-btn')
    this.focusTimeElement = document.getElementById('report-focus-time')
    this.sessionsElement = document.getElementById('report-sessions')
    this.dateSelector = document.getElementById('report-date-selector')
    this.dailyReportContainer = document.getElementById('daily-report-container')
    this.weeklyChart = document.getElementById('weekly-chart')

    // Event callbacks (set by presenter)
    this.callbacks = {}

    this.setupEventListeners()
  }
  
  /**
   * Setup DOM event listeners
   */
  setupEventListeners() {
    // Close modal when clicking overlay or close button
    this.overlay.addEventListener('click', () => {
      this.hide()
    })

    this.closeBtn.addEventListener('click', () => {
      this.hide()
    })

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.hide()
      }
    })

    // Date selector change
    if (this.dateSelector) {
      this.dateSelector.addEventListener('change', (e) => {
        this.callbacks.onDateSelected?.(e.target.value)
      })
    }
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  
  /**
   * Show the report modal
   */
  show() {
    this.modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
  }
  
  /**
   * Hide the report modal
   */
  hide() {
    this.modal.classList.add('hidden')
    document.body.style.overflow = ''
  }
  
  /**
   * Update report data (legacy method for current session stats)
   */
  updateReport(focusTime, completedSessions) {
    this.focusTimeElement.textContent = focusTime
    this.sessionsElement.textContent = completedSessions
  }

  /**
   * Update date selector with available dates
   */
  updateDateSelector(dates, selectedDate) {
    if (!this.dateSelector) return

    this.dateSelector.innerHTML = ''

    if (dates.length === 0) {
      const option = document.createElement('option')
      option.value = ''
      option.textContent = 'No data available'
      option.disabled = true
      this.dateSelector.appendChild(option)
      return
    }

    dates.forEach(date => {
      const option = document.createElement('option')
      option.value = date
      option.textContent = this.formatDateForDisplay(date)

      if (date === selectedDate) {
        option.selected = true
      }

      this.dateSelector.appendChild(option)
    })
  }

  /**
   * Update daily report display
   */
  updateDailyReport(report) {
    if (!this.dailyReportContainer) return

    // Update daily stats
    const dailyFocusTime = document.getElementById('daily-focus-time')
    const dailySessions = document.getElementById('daily-sessions')

    if (dailyFocusTime) {
      dailyFocusTime.textContent = this.formatTime(report.totalFocusTime)
    }

    if (dailySessions) {
      dailySessions.textContent = report.totalSessions
    }
  }

  /**
   * Update weekly chart with data from last 7 days
   */
  updateWeeklyChart(weeklyData) {
    if (!this.weeklyChart) return

    this.weeklyChart.innerHTML = ''

    if (!weeklyData || weeklyData.length === 0) {
      const emptyMessage = document.createElement('div')
      emptyMessage.className = 'chart-empty'
      emptyMessage.textContent = 'No data available for the past week'
      this.weeklyChart.appendChild(emptyMessage)
      return
    }

    // Find max value for scaling
    const maxSessions = Math.max(...weeklyData.map(day => day.totalSessions), 1)

    weeklyData.forEach(dayData => {
      const barElement = this.createChartBar(dayData, maxSessions)
      this.weeklyChart.appendChild(barElement)
    })
  }

  /**
   * Create chart bar element
   */
  createChartBar(dayData, maxSessions) {
    const bar = document.createElement('div')
    bar.className = 'chart-bar'

    const dayLabel = document.createElement('div')
    dayLabel.className = 'chart-bar-day'
    dayLabel.textContent = this.formatDayLabel(dayData.date)

    const barContainer = document.createElement('div')
    barContainer.className = 'chart-bar-container'

    const barFill = document.createElement('div')
    barFill.className = 'chart-bar-fill'

    // Calculate height percentage (minimum 4px for visibility)
    const heightPercent = dayData.totalSessions > 0
      ? Math.max((dayData.totalSessions / maxSessions) * 100, 3)
      : 0

    barFill.style.height = `${heightPercent}%`

    // Add value tooltip
    const valueLabel = document.createElement('div')
    valueLabel.className = 'chart-bar-value'
    valueLabel.innerHTML = `${dayData.totalSessions} sessions<br>${this.formatTime(dayData.totalFocusTime)}`
    barFill.appendChild(valueLabel)

    barContainer.appendChild(barFill)

    const sessionLabel = document.createElement('div')
    sessionLabel.className = 'chart-bar-label'
    sessionLabel.textContent = `${dayData.totalSessions}`

    bar.appendChild(dayLabel)
    bar.appendChild(barContainer)
    bar.appendChild(sessionLabel)

    return bar
  }

  /**
   * Format day label for chart
   */
  formatDayLabel(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    }
  }

  // Removed updateSessionsList and related methods since we're using weekly chart instead

  /**
   * Format date for display
   */
  formatDateForDisplay(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateString === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateString === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  /**
   * Format time in seconds to readable format
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }
}
