/**
 * ReportPresenter - Manages report functionality
 * Follows MVP pattern - connects ReportView with data
 */
import { ReportView } from '../views/ReportView.js'
import { EventEmitter } from '../utils/EventEmitter.js'

export class ReportPresenter extends EventEmitter {
  constructor() {
    super()
    this.reportView = new ReportView()
    this.reportBtn = document.getElementById('report-btn')
    
    this.setupEventListeners()
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
   * Show the report modal with current data
   */
  showReport() {
    // Request current stats from timer
    this.emit('requestStats')
  }
  
  /**
   * Update report with stats data
   */
  updateReport(stats) {
    this.reportView.updateReport(stats.focusTime, stats.completedSessions)
    this.reportView.show()
  }
}
