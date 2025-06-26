/**
 * SettingsView - Handles settings panel UI
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class SettingsView {
  constructor() {
    // DOM elements
    this.elements = {
      panel: null,
      closeBtn: null,
      
      // Timer settings
      workDuration: null,
      shortBreakDuration: null,
      longBreakDuration: null,
      saveTimerBtn: null,
      
      // Appearance settings
      backgroundType: null,
      backgroundColor: null,
      gradientColor1: null,
      gradientColor2: null,
      backgroundImage: null,
      backgroundImageSetting: null
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
    this.elements.panel = document.getElementById('settings-panel')
    this.elements.closeBtn = document.getElementById('close-settings-btn')
    
    // Timer settings
    this.elements.workDuration = document.getElementById('work-duration')
    this.elements.shortBreakDuration = document.getElementById('short-break-duration')
    this.elements.longBreakDuration = document.getElementById('long-break-duration')
    this.elements.saveTimerBtn = document.getElementById('save-timer-settings')
    
    // Appearance settings
    this.elements.backgroundType = document.getElementById('background-type')
    this.elements.backgroundColor = document.getElementById('background-color')
    this.elements.gradientColor1 = document.getElementById('gradient-color-1')
    this.elements.gradientColor2 = document.getElementById('gradient-color-2')
    this.elements.backgroundImage = document.getElementById('background-image')
    this.elements.backgroundImageSetting = document.getElementById('background-image-setting')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        console.log('Settings panel closing: Close button clicked')
        this.callbacks.onClose?.()
      })
    }
    
    // Timer settings
    if (this.elements.workDuration) {
      this.elements.workDuration.addEventListener('change', (e) => {
        console.log('Timer setting changed: workDuration =', e.target.value)
        this.callbacks.onTimerSettingChange?.('workDuration', parseInt(e.target.value))
      })

      // Add input event listener to detect typing
      this.elements.workDuration.addEventListener('input', (e) => {
        console.log('Timer setting input: workDuration =', e.target.value)
      })
    }

    if (this.elements.shortBreakDuration) {
      this.elements.shortBreakDuration.addEventListener('change', (e) => {
        console.log('Timer setting changed: shortBreakDuration =', e.target.value)
        this.callbacks.onTimerSettingChange?.('shortBreakDuration', parseInt(e.target.value))
      })

      // Add input event listener to detect typing
      this.elements.shortBreakDuration.addEventListener('input', (e) => {
        console.log('Timer setting input: shortBreakDuration =', e.target.value)
      })
    }

    if (this.elements.longBreakDuration) {
      this.elements.longBreakDuration.addEventListener('change', (e) => {
        console.log('Timer setting changed: longBreakDuration =', e.target.value)
        this.callbacks.onTimerSettingChange?.('longBreakDuration', parseInt(e.target.value))
      })

      // Add input event listener to detect typing
      this.elements.longBreakDuration.addEventListener('input', (e) => {
        console.log('Timer setting input: longBreakDuration =', e.target.value)
      })
    }

    // Save timer settings button
    if (this.elements.saveTimerBtn) {
      this.elements.saveTimerBtn.addEventListener('click', () => {
        this.callbacks.onSaveTimerSettings?.()
      })
    }
    
    // Appearance settings
    if (this.elements.backgroundType) {
      this.elements.backgroundType.addEventListener('change', (e) => {
        this.updateBackgroundTypeUI(e.target.value)
        this.callbacks.onAppearanceSettingChange?.('backgroundType', e.target.value)
      })
    }
    
    if (this.elements.backgroundColor) {
      this.elements.backgroundColor.addEventListener('change', (e) => {
        this.callbacks.onAppearanceSettingChange?.('backgroundColor', e.target.value)
      })
    }

    if (this.elements.gradientColor1) {
      this.elements.gradientColor1.addEventListener('change', (e) => {
        this.callbacks.onAppearanceSettingChange?.('gradientColor1', e.target.value)
      })
    }

    if (this.elements.gradientColor2) {
      this.elements.gradientColor2.addEventListener('change', (e) => {
        this.callbacks.onAppearanceSettingChange?.('gradientColor2', e.target.value)
      })
    }
    
    if (this.elements.backgroundImage) {
      this.elements.backgroundImage.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.callbacks.onBackgroundImageChange?.(e.target.files[0])
        }
      })
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when settings panel is visible
      if (!this.isVisible()) return

      if (e.code === 'Escape') {
        e.preventDefault()
        console.log('Settings panel closing: Escape key pressed')
        this.callbacks.onClose?.()
      }
    })
    
    // Click outside to close (only on overlay background, not on panel content)
    if (this.elements.panel) {
      this.elements.panel.addEventListener('mousedown', (e) => {
        // Only close if mousedown directly on the panel overlay (not on any child elements)
        if (e.target === this.elements.panel) {
          this.clickStartedOnOverlay = true
        } else {
          this.clickStartedOnOverlay = false
        }
      })

      this.elements.panel.addEventListener('mouseup', (e) => {
        // Only close if both mousedown and mouseup happened on the overlay
        if (e.target === this.elements.panel && this.clickStartedOnOverlay) {
          console.log('Settings panel closing: Clicked outside panel')
          this.callbacks.onClose?.()
        }
        this.clickStartedOnOverlay = false
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
   * Show settings panel
   */
  show() {
    if (!this.elements.panel || this.isAnimating) return

    this.isAnimating = true

    // Show panel
    this.elements.panel.classList.remove('hidden')

    // Add entrance animation with slide-in from right
    requestAnimationFrame(() => {
      this.elements.panel.classList.add('show')

      setTimeout(() => {
        this.isAnimating = false
      }, 200)
    })

    // Focus on first input
    setTimeout(() => {
      const firstInput = this.elements.panel.querySelector('input, select')
      if (firstInput) {
        firstInput.focus()
      }
    }, 250)
  }
  
  /**
   * Hide settings panel
   */
  hide() {
    if (!this.elements.panel || this.isAnimating) return

    this.isAnimating = true

    // Add exit animation with slide-out to right
    this.elements.panel.classList.remove('show')

    setTimeout(() => {
      this.elements.panel.classList.add('hidden')
      this.isAnimating = false
    }, 200)
  }
  
  /**
   * Check if settings panel is visible
   */
  isVisible() {
    return this.elements.panel && !this.elements.panel.classList.contains('hidden')
  }
  
  /**
   * Update timer settings display
   */
  updateTimerSettings(settings) {
    if (this.elements.workDuration) {
      this.elements.workDuration.value = settings.workDuration
    }
    if (this.elements.shortBreakDuration) {
      this.elements.shortBreakDuration.value = settings.shortBreakDuration
    }
    if (this.elements.longBreakDuration) {
      this.elements.longBreakDuration.value = settings.longBreakDuration
    }
  }
  
  /**
   * Update appearance settings display
   */
  updateAppearanceSettings(settings) {
    if (this.elements.backgroundType) {
      this.elements.backgroundType.value = settings.backgroundType
      this.updateBackgroundTypeUI(settings.backgroundType)
    }
    
    if (this.elements.backgroundColor) {
      this.elements.backgroundColor.value = settings.backgroundColor
    }

    if (this.elements.gradientColor1) {
      this.elements.gradientColor1.value = settings.gradientColor1 || '#667eea'
    }

    if (this.elements.gradientColor2) {
      this.elements.gradientColor2.value = settings.gradientColor2 || '#764ba2'
    }
  }
  
  /**
   * Update background type UI
   */
  updateBackgroundTypeUI(backgroundType) {
    const gradientSetting = document.getElementById('gradient-colors-setting')

    // Show/hide gradient controls
    if (gradientSetting) {
      // Only show gradient controls for 'gradient' type
      // Default background doesn't allow color customization
      if (backgroundType === 'gradient') {
        gradientSetting.classList.remove('hidden')
      } else {
        gradientSetting.classList.add('hidden')
      }
    }

    // Show/hide image upload
    if (this.elements.backgroundImageSetting) {
      if (backgroundType === 'image') {
        this.elements.backgroundImageSetting.classList.remove('hidden')
      } else {
        this.elements.backgroundImageSetting.classList.add('hidden')
      }
    }
  }
  
  /**
   * Update all settings
   */
  updateAllSettings(settings) {
    this.updateTimerSettings(settings.timer)
    this.updateAppearanceSettings(settings.appearance)
  }
  
  /**
   * Show notification in settings
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `settings-notification ${type}`
    notification.textContent = message
    
    // Add to settings content
    const settingsContent = this.elements.panel?.querySelector('.settings-content')
    if (settingsContent) {
      settingsContent.appendChild(notification)
      
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
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error')
  }
  
  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success')
  }
  
  /**
   * Validate timer input
   */
  validateTimerInput(input, min = 1, max = 120) {
    if (!input) return
    
    const value = parseInt(input.value)
    
    if (isNaN(value) || value < min || value > max) {
      input.classList.add('error')
      this.showError(`Value must be between ${min} and ${max} minutes`)
      
      // Reset to valid value
      setTimeout(() => {
        input.value = Math.max(min, Math.min(max, value || min))
        input.classList.remove('error')
      }, 2000)
    } else {
      input.classList.remove('error')
    }
  }
  
  /**
   * Reset settings form
   */
  resetForm() {
    const form = this.elements.panel?.querySelector('form')
    if (form) {
      form.reset()
    }
  }
  
  /**
   * Set loading state
   */
  setLoadingState(loading) {
    const inputs = this.elements.panel?.querySelectorAll('input, select, button')
    
    if (inputs) {
      inputs.forEach(input => {
        input.disabled = loading
      })
    }
    
    if (loading) {
      this.elements.panel?.classList.add('loading')
    } else {
      this.elements.panel?.classList.remove('loading')
    }
  }
  
  /**
   * Get current form values
   */
  getFormValues() {
    return {
      timer: {
        workDuration: parseInt(this.elements.workDuration?.value) || 25,
        shortBreakDuration: parseInt(this.elements.shortBreakDuration?.value) || 5,
        longBreakDuration: parseInt(this.elements.longBreakDuration?.value) || 15
      },
      appearance: {
        backgroundType: this.elements.backgroundType?.value || 'gradient',
        backgroundColor: this.elements.backgroundColor?.value || '#667eea',
        gradientColor1: this.elements.gradientColor1?.value || '#667eea',
        gradientColor2: this.elements.gradientColor2?.value || '#764ba2'
      }
    }
  }
  
  /**
   * Highlight changed settings
   */
  highlightChanges(changes) {
    // Remove existing highlights
    const highlighted = this.elements.panel?.querySelectorAll('.changed')
    highlighted?.forEach(el => el.classList.remove('changed'))
    
    // Add highlights for changed settings
    Object.keys(changes).forEach(category => {
      Object.keys(changes[category]).forEach(setting => {
        const element = this.elements[setting]
        if (element) {
          element.classList.add('changed')
          
          // Remove highlight after delay
          setTimeout(() => {
            element.classList.remove('changed')
          }, 3000)
        }
      })
    })
  }
  
  /**
   * Update timer setting input value
   */
  updateTimerSetting(key, value) {
    const element = this.elements[key]
    if (element) {
      element.value = value
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // You can implement a toast notification here
    console.log('Success:', message)
  }

  /**
   * Show error message
   */
  showError(message) {
    // You can implement a toast notification here
    console.error('Error:', message)
  }

  /**
   * Get DOM element for external access
   */
  getElement(name) {
    return this.elements[name]
  }
}
