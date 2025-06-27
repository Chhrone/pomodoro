/**
 * SessionReportModel - Manages daily session reports and statistics
 * Follows MVP pattern - handles data storage and retrieval for session tracking
 */
export class SessionReportModel {
  constructor() {
    this.storageKey = 'pomodoro-session-reports'

    // Event listeners
    this.listeners = {}

    // Current session data (for tracking ongoing session)
    this.currentSession = null
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
   * Start tracking a new session
   */
  startSession(sessionType, duration) {
    this.currentSession = {
      id: this.generateSessionId(),
      type: sessionType, // 'work', 'shortBreak', 'longBreak'
      startTime: new Date().toISOString(),
      startDate: this.getDateString(new Date()),
      duration: duration, // in seconds
      completed: false,
      focusTime: 0 // actual focus time (for work sessions)
    }
    
    console.log('SessionReportModel: Started tracking session:', this.currentSession)
  }
  
  /**
   * Update current session progress (called during timer tick)
   */
  updateSessionProgress(elapsedTime) {
    if (!this.currentSession) return
    
    // Only track focus time for work sessions
    if (this.currentSession.type === 'work') {
      this.currentSession.focusTime = elapsedTime
    }
  }
  
  /**
   * Complete current session
   */
  completeSession() {
    if (!this.currentSession) return
    
    this.currentSession.completed = true
    this.currentSession.endTime = new Date().toISOString()
    
    // Save to daily reports
    this.saveSessionToDaily(this.currentSession)

    // Clear current session
    this.currentSession = null

    console.log('SessionReportModel: Session completed and saved')
    this.emit('sessionSaved', this.currentSession)
  }
  
  /**
   * Cancel current session (when skipped or reset)
   */
  cancelSession() {
    if (!this.currentSession) return
    
    console.log('SessionReportModel: Session cancelled')
    this.clearCurrentSession()
  }
  
  /**
   * Save session to daily reports
   */
  saveSessionToDaily(session) {
    try {
      const reports = this.loadDailyReports()
      const dateKey = session.startDate
      
      if (!reports[dateKey]) {
        reports[dateKey] = {
          date: dateKey,
          sessions: [],
          totalFocusTime: 0,
          completedWorkSessions: 0,
          totalSessions: 0
        }
      }
      
      // Add session to daily report
      reports[dateKey].sessions.push({
        id: session.id,
        type: session.type,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        focusTime: session.focusTime,
        completed: session.completed
      })
      
      // Update daily totals
      if (session.completed) {
        reports[dateKey].totalSessions++
        
        if (session.type === 'work') {
          reports[dateKey].completedWorkSessions++
          reports[dateKey].totalFocusTime += session.focusTime
        }
      }
      
      this.saveDailyReports(reports)
      console.log('SessionReportModel: Saved session to daily report for', dateKey)
      
    } catch (error) {
      console.error('SessionReportModel: Error saving session to daily reports:', error)
    }
  }
  
  /**
   * Get daily report for specific date
   */
  getDailyReport(date) {
    const reports = this.loadDailyReports()
    const dateKey = typeof date === 'string' ? date : this.getDateString(date)
    
    return reports[dateKey] || {
      date: dateKey,
      sessions: [],
      totalFocusTime: 0,
      completedWorkSessions: 0,
      totalSessions: 0
    }
  }
  
  /**
   * Get reports for date range
   */
  getReportsInRange(startDate, endDate) {
    const reports = this.loadDailyReports()
    const result = []
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = this.getDateString(date)
      result.push(reports[dateKey] || {
        date: dateKey,
        sessions: [],
        totalFocusTime: 0,
        completedWorkSessions: 0,
        totalSessions: 0
      })
    }
    
    return result
  }
  
  /**
   * Get all available report dates
   */
  getAvailableDates() {
    const reports = this.loadDailyReports()
    return Object.keys(reports).sort().reverse() // Most recent first
  }
  
  /**
   * Load daily reports from localStorage
   */
  loadDailyReports() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : {}
    } catch (error) {
      console.error('SessionReportModel: Error loading daily reports:', error)
      return {}
    }
  }
  
  /**
   * Save daily reports to localStorage
   */
  saveDailyReports(reports) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(reports))
    } catch (error) {
      console.error('SessionReportModel: Error saving daily reports:', error)
    }
  }
  

  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  /**
   * Get date string in YYYY-MM-DD format
   */
  getDateString(date) {
    return date.toISOString().split('T')[0]
  }
  
  /**
   * Format time in seconds to HH:MM:SS
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }
  
  /**
   * Clear all reports (for testing or reset)
   */
  clearAllReports() {
    localStorage.removeItem(this.storageKey)
    this.currentSession = null
    console.log('SessionReportModel: Cleared all reports')
  }
}
