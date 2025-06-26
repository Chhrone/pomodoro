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
   * Update report data
   */
  updateReport(focusTime, completedSessions) {
    this.focusTimeElement.textContent = focusTime
    this.sessionsElement.textContent = completedSessions
  }
}
