/**
 * BreakConfirmationView - Handles break confirmation UI
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class BreakConfirmationView {
  constructor() {
    // DOM elements
    this.elements = {
      container: null,
      title: null,
      message: null,
      breakType: null,
      breakTime: null,
      bonusTime: null,
      bonusMinutes: null,
      startBreakBtn: null,
      skipBreakBtn: null
    }
    
    // Event callbacks (set by presenter)
    this.callbacks = {}
    
    // Animation state
    this.isAnimating = false
    
    this.initializeElements()
    this.setupEventListeners()
  }
  
  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements.container = document.getElementById('break-confirmation')
    this.elements.title = document.getElementById('break-title')
    this.elements.message = document.getElementById('break-message')
    this.elements.breakType = document.getElementById('break-type')
    this.elements.breakTime = document.getElementById('break-time')
    this.elements.bonusTime = document.getElementById('bonus-time')
    this.elements.bonusMinutes = document.getElementById('bonus-minutes')
    this.elements.startBreakBtn = document.getElementById('start-break-btn')
    this.elements.skipBreakBtn = document.getElementById('skip-break-btn')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Break control buttons
    if (this.elements.startBreakBtn) {
      this.elements.startBreakBtn.addEventListener('click', () => {
        this.callbacks.onStartBreak?.()
      })
    }
    
    if (this.elements.skipBreakBtn) {
      this.elements.skipBreakBtn.addEventListener('click', () => {
        this.callbacks.onSkipBreak?.()
      })
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when break confirmation is visible
      if (!this.isVisible()) return
      
      switch (e.code) {
        case 'Space':
        case 'Enter':
          e.preventDefault()
          this.callbacks.onStartBreak?.()
          break
        case 'Escape':
        case 'KeyS':
          e.preventDefault()
          this.callbacks.onSkipBreak?.()
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
   * Show break confirmation
   */
  show(breakType, breakDuration, sessionNumber) {
    if (!this.elements.container || this.isAnimating) return
    
    this.isAnimating = true
    
    // Update content
    this.updateContent(breakType, breakDuration, sessionNumber)
    
    // Show container
    this.elements.container.classList.remove('hidden')
    
    // Add entrance animation
    this.elements.container.style.opacity = '0'
    this.elements.container.style.transform = 'scale(0.9)'
    
    // Animate in
    requestAnimationFrame(() => {
      this.elements.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
      this.elements.container.style.opacity = '1'
      this.elements.container.style.transform = 'scale(1)'
      
      setTimeout(() => {
        this.isAnimating = false
        this.elements.container.style.transition = ''
      }, 300)
    })
    
    // Focus on start break button
    setTimeout(() => {
      if (this.elements.startBreakBtn) {
        this.elements.startBreakBtn.focus()
      }
    }, 350)
  }
  
  /**
   * Hide break confirmation
   */
  hide() {
    if (!this.elements.container || this.isAnimating) return

    this.isAnimating = true

    // Add exit animation
    this.elements.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
    this.elements.container.style.opacity = '0'
    this.elements.container.style.transform = 'scale(0.9)'

    setTimeout(() => {
      this.elements.container.classList.add('hidden')
      this.elements.container.style.transition = ''
      this.elements.container.style.opacity = ''
      this.elements.container.style.transform = ''
      this.isAnimating = false

      // Hide bonus time
      this.hideBonusTime()
    }, 300)
  }

  /**
   * Hide break confirmation instantly (no animation)
   */
  hideInstant() {
    if (!this.elements.container) return

    // Hide immediately without animation
    this.elements.container.classList.add('hidden')
    this.elements.container.style.transition = ''
    this.elements.container.style.opacity = ''
    this.elements.container.style.transform = ''
    this.isAnimating = false

    // Hide bonus time
    this.hideBonusTime()
  }
  
  /**
   * Check if break confirmation is visible
   */
  isVisible() {
    return this.elements.container && !this.elements.container.classList.contains('hidden')
  }
  
  /**
   * Update break confirmation content
   */
  updateContent(breakType, breakDuration, sessionNumber) {
    // Update title
    if (this.elements.title) {
      const titles = {
        shortBreak: 'Time for a Short Break!',
        longBreak: 'Time for a Long Break!'
      }
      this.elements.title.textContent = titles[breakType] || 'Time for a Break!'
    }
    
    // Update message
    if (this.elements.message) {
      const messages = {
        shortBreak: `Great job completing session ${sessionNumber}! Take a quick break to recharge.`,
        longBreak: `Excellent work! You've completed ${sessionNumber} sessions. Time for a longer break.`
      }
      this.elements.message.textContent = messages[breakType] || 'You\'ve completed a focus session. Ready to start your break?'
    }
    
    // Update break type
    if (this.elements.breakType) {
      const typeNames = {
        shortBreak: 'Short Break',
        longBreak: 'Long Break'
      }
      this.elements.breakType.textContent = typeNames[breakType] || 'Break'
    }
    
    // Update break time
    if (this.elements.breakTime) {
      this.elements.breakTime.textContent = `${breakDuration} minutes`
    }
    
    // Update button text based on break type
    if (this.elements.startBreakBtn) {
      const buttonTexts = {
        shortBreak: 'Start Short Break',
        longBreak: 'Start Long Break'
      }
      this.elements.startBreakBtn.textContent = buttonTexts[breakType] || 'Start Break'
    }
  }
  
  /**
   * Show bonus time
   */
  showBonusTime(bonusSeconds) {
    if (!this.elements.bonusTime || !this.elements.bonusMinutes) return
    
    const minutes = Math.floor(bonusSeconds / 60)
    const seconds = bonusSeconds % 60
    
    let bonusText = ''
    if (minutes > 0) {
      bonusText = `+${minutes} minute${minutes !== 1 ? 's' : ''}`
      if (seconds > 0) {
        bonusText += ` ${seconds} second${seconds !== 1 ? 's' : ''}`
      }
    } else {
      bonusText = `+${seconds} second${seconds !== 1 ? 's' : ''}`
    }
    
    this.elements.bonusMinutes.textContent = bonusText
    
    // Show bonus time container with animation
    if (this.elements.bonusTime.classList.contains('hidden')) {
      this.elements.bonusTime.classList.remove('hidden')
      this.elements.bonusTime.style.opacity = '0'
      this.elements.bonusTime.style.transform = 'translateY(-10px)'
      
      requestAnimationFrame(() => {
        this.elements.bonusTime.style.transition = 'opacity 0.3s ease, transform 0.3s ease'
        this.elements.bonusTime.style.opacity = '1'
        this.elements.bonusTime.style.transform = 'translateY(0)'
        
        setTimeout(() => {
          this.elements.bonusTime.style.transition = ''
        }, 300)
      })
    }
  }
  
  /**
   * Hide bonus time
   */
  hideBonusTime() {
    if (!this.elements.bonusTime) return
    
    this.elements.bonusTime.classList.add('hidden')
    this.elements.bonusTime.style.opacity = ''
    this.elements.bonusTime.style.transform = ''
  }
  
  /**
   * Update bonus time display
   */
  updateBonusTime(bonusSeconds) {
    if (bonusSeconds > 0) {
      this.showBonusTime(bonusSeconds)
    } else {
      this.hideBonusTime()
    }
  }
  
  /**
   * Enable/disable controls
   */
  setControlsEnabled(enabled) {
    const controls = [
      this.elements.startBreakBtn,
      this.elements.skipBreakBtn
    ]
    
    controls.forEach(control => {
      if (control) {
        control.disabled = !enabled
      }
    })
  }
  
  /**
   * Add loading state to start break button
   */
  setStartBreakLoading(loading) {
    if (!this.elements.startBreakBtn) return
    
    if (loading) {
      this.elements.startBreakBtn.disabled = true
      this.elements.startBreakBtn.textContent = 'Starting...'
      this.elements.startBreakBtn.classList.add('loading')
    } else {
      this.elements.startBreakBtn.disabled = false
      this.elements.startBreakBtn.classList.remove('loading')
      // Text will be updated by updateContent
    }
  }
  
  /**
   * Show notification
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
   * Add celebration animation
   */
  addCelebrationAnimation() {
    if (!this.elements.container) return
    
    // Add celebration class
    this.elements.container.classList.add('celebration')
    
    // Remove after animation
    setTimeout(() => {
      this.elements.container.classList.remove('celebration')
    }, 1000)
  }
  
  /**
   * Get DOM element for external access
   */
  getElement(name) {
    return this.elements[name]
  }
  
  /**
   * Set custom break message
   */
  setCustomMessage(message) {
    if (this.elements.message) {
      this.elements.message.textContent = message
    }
  }
  
  /**
   * Set custom break title
   */
  setCustomTitle(title) {
    if (this.elements.title) {
      this.elements.title.textContent = title
    }
  }
}
