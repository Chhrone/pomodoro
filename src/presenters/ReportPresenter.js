/**
 * ReportPresenter - Manages report functionality
 * Follows MVP pattern - connects ReportView with SessionReportModel
 */
import { ReportView } from '../views/ReportView.js'
import { SessionReportModel } from '../models/SessionReportModel.js'
import { EventEmitter } from '../utils/EventEmitter.js'

export class ReportPresenter extends EventEmitter {
  constructor() {
    super()
    this.reportView = new ReportView()
    this.sessionReportModel = new SessionReportModel()
    this.reportBtn = document.getElementById('report-btn')

    // Current selected date
    this.selectedDate = new Date().toISOString().split('T')[0] // Today

    this.setupEventListeners()
    this.setupViewCallbacks()
  }
  
  /**
   * Initialize the presenter
   */
  init() {
    console.log('ReportPresenter: Initialized')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Report button click
    this.reportBtn.addEventListener('click', () => {
      this.showReport()
    })
  }

  /**
   * Setup view callbacks
   */
  setupViewCallbacks() {
    this.reportView.setCallbacks({
      onDateSelected: (date) => {
        this.selectedDate = date
        this.updateDailyReport()
      }
    })
  }

  /**
   * Show the report modal with current data
   */
  showReport() {
    // Load available dates and update date selector
    const availableDates = this.sessionReportModel.getAvailableDates()

    // If no dates available, add today
    if (availableDates.length === 0) {
      availableDates.push(this.selectedDate)
    }

    // Ensure selected date is in the list
    if (!availableDates.includes(this.selectedDate)) {
      this.selectedDate = availableDates[0] || new Date().toISOString().split('T')[0]
    }

    this.reportView.updateDateSelector(availableDates, this.selectedDate)
    this.updateDailyReport()

    // Also request current session stats for legacy display
    this.emit('requestStats')
  }

  /**
   * Update daily report for selected date
   */
  updateDailyReport() {
    const dailyReport = this.sessionReportModel.getDailyReport(this.selectedDate)
    this.reportView.updateDailyReport(dailyReport)

    // Update weekly chart with last 7 days data
    this.updateWeeklyChart()
  }

  /**
   * Update weekly chart with last 7 days data
   */
  updateWeeklyChart() {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 6) // Last 7 days including today

    const weeklyReports = this.sessionReportModel.getReportsInRange(startDate, endDate)
    this.reportView.updateWeeklyChart(weeklyReports)
  }

  /**
   * Update report with current session stats (legacy method)
   */
  updateReport(stats) {
    this.reportView.updateReport(stats.focusTime, stats.completedSessions)
    this.reportView.show()
  }

  /**
   * Start tracking a session
   */
  startSession(sessionType, duration) {
    this.sessionReportModel.startSession(sessionType, duration)
  }

  /**
   * Update session progress
   */
  updateSessionProgress(elapsedTime) {
    this.sessionReportModel.updateSessionProgress(elapsedTime)
  }

  /**
   * Complete current session
   */
  completeSession() {
    this.sessionReportModel.completeSession()
  }

  /**
   * Cancel current session
   */
  cancelSession() {
    this.sessionReportModel.cancelSession()
  }

  /**
   * Get session report model for external access
   */
  getSessionReportModel() {
    return this.sessionReportModel
  }
}
