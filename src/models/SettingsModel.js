// Application settings and preferences management
export class SettingsModel {
  constructor() {
    // Define default settings structure
    this.defaultSettings = {
      timer: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 3
      },

      music: {
        enabled: true,
        volume: 100, // Changed to 100% as per user preference
        currentTrack: null,
        autoPlay: true,
        playbackMode: 'loop' // 'loop' or 'list'
      },

      appearance: {
        backgroundType: 'gradient', // Changed from 'default' to 'gradient'
        backgroundColor: '#667eea',
        gradientColor1: '#667eea',
        gradientColor2: '#764ba2',
        backgroundImage: null,
        theme: 'light' // Default to light mode as per user preference
      },

      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      },

      advanced: {
        gracePeriodsEnabled: true,
        bonusTimeEnabled: true,
        autoStartBreaks: true, // Auto-start short breaks as per user preference
        autoStartWork: false
      }
    }

    // Storage key for localStorage
    this.storageKey = 'pomodoro-settings'

    // Current settings (loaded from localStorage or defaults)
    this.settings = this.loadSettings()

    // Event listeners
    this.listeners = {}

    // Initialize settings on first load
    this.initializeSettings()
  }

  /**
   * Initialize settings on first load
   */
  initializeSettings() {
    // Apply appearance settings immediately
    this.applyAppearanceSettings()

    // Emit initial settings loaded event
    this.emit('settingsLoaded', this.getSettings())
  }

  // Event system
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

  getSettings() {
    return JSON.parse(JSON.stringify(this.settings))
  }

  getCategory(category) {
    return JSON.parse(JSON.stringify(this.settings[category] || {}))
  }

  getSetting(category, key) {
    return this.settings[category]?.[key]
  }
  
  /**
   * Update settings
   */
  updateSettings(newSettings) {
    const oldSettings = this.getSettings()
    
    // Deep merge settings
    this.settings = this.deepMerge(this.settings, newSettings)
    
    // Validate settings
    this.validateSettings()
    
    // Save to localStorage
    this.saveSettings()
    
    // Emit change event
    this.emit('settingsChanged', {
      settings: this.getSettings(),
      oldSettings: oldSettings,
      changes: this.getChanges(oldSettings, this.settings)
    })
  }
  
  /**
   * Update specific setting
   */
  updateSetting(category, key, value) {
    if (!this.settings[category]) {
      this.settings[category] = {}
    }
    
    const oldValue = this.settings[category][key]
    this.settings[category][key] = value
    
    // Validate settings
    this.validateSettings()
    
    // Save to localStorage
    this.saveSettings()
    
    // Emit change event
    this.emit('settingChanged', {
      category,
      key,
      value,
      oldValue,
      settings: this.getSettings()
    })
  }
  
  /**
   * Reset settings to defaults
   */
  resetSettings() {
    const oldSettings = this.getSettings()
    this.settings = JSON.parse(JSON.stringify(this.defaultSettings))
    
    // Save to localStorage
    this.saveSettings()
    
    // Emit change event
    this.emit('settingsReset', {
      settings: this.getSettings(),
      oldSettings: oldSettings
    })
  }
  
  /**
   * Reset specific category to defaults
   */
  resetCategory(category) {
    if (!this.defaultSettings[category]) return
    
    const oldCategory = this.getCategory(category)
    this.settings[category] = JSON.parse(JSON.stringify(this.defaultSettings[category]))
    
    // Save to localStorage
    this.saveSettings()
    
    // Emit change event
    this.emit('categoryReset', {
      category,
      settings: this.getCategory(category),
      oldSettings: oldCategory
    })
  }
  
  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all properties exist and handle new settings
        const merged = this.deepMerge(this.defaultSettings, parsed)

        // Validate loaded settings
        this.validateLoadedSettings(merged)

        console.log('Settings loaded from localStorage:', merged)
        return merged
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
      // Clear corrupted data
      this.clearSettings()
    }

    // Return defaults if loading failed
    console.log('Using default settings')
    return JSON.parse(JSON.stringify(this.defaultSettings))
  }

  /**
   * Validate loaded settings and fix any issues
   */
  validateLoadedSettings(settings) {
    // Ensure all required categories exist
    Object.keys(this.defaultSettings).forEach(category => {
      if (!settings[category]) {
        settings[category] = JSON.parse(JSON.stringify(this.defaultSettings[category]))
      }
    })

    // Ensure all required properties exist within categories
    Object.keys(this.defaultSettings).forEach(category => {
      Object.keys(this.defaultSettings[category]).forEach(key => {
        if (settings[category][key] === undefined) {
          settings[category][key] = this.defaultSettings[category][key]
        }
      })
    })
  }

  /**
   * Clear settings from localStorage
   */
  clearSettings() {
    try {
      localStorage.removeItem(this.storageKey)
      console.log('Settings cleared from localStorage')
    } catch (error) {
      console.warn('Failed to clear settings from localStorage:', error)
    }
  }
  
  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings))
      this.emit('settingsSaved', { settings: this.getSettings() })
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
      this.emit('settingsSaveError', { error })
    }
  }
  
  /**
   * Validate settings values
   */
  validateSettings() {
    // Timer validation
    if (this.settings.timer) {
      this.settings.timer.workDuration = this.clamp(this.settings.timer.workDuration, 1, 120)
      this.settings.timer.shortBreakDuration = this.clamp(this.settings.timer.shortBreakDuration, 1, 60)
      this.settings.timer.longBreakDuration = this.clamp(this.settings.timer.longBreakDuration, 1, 120)
      this.settings.timer.sessionsUntilLongBreak = this.clamp(this.settings.timer.sessionsUntilLongBreak, 1, 10)
    }
    
    // Music validation
    if (this.settings.music) {
      this.settings.music.volume = this.clamp(this.settings.music.volume, 0, 100)
    }
    
    // Appearance validation
    if (this.settings.appearance) {
      const validBackgroundTypes = ['default', 'gradient', 'solid', 'image']
      if (!validBackgroundTypes.includes(this.settings.appearance.backgroundType)) {
        this.settings.appearance.backgroundType = 'default'
      }
      
      // Validate color format
      if (this.settings.appearance.backgroundColor && !this.isValidColor(this.settings.appearance.backgroundColor)) {
        this.settings.appearance.backgroundColor = '#667eea'
      }
    }
  }
  
  /**
   * Check if color is valid hex format
   */
  isValidColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
  
  /**
   * Clamp number between min and max
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
  }
  
  /**
   * Deep merge two objects
   */
  deepMerge(target, source) {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }
  
  /**
   * Get changes between old and new settings
   */
  getChanges(oldSettings, newSettings) {
    const changes = {}
    
    for (const category in newSettings) {
      if (typeof newSettings[category] === 'object') {
        for (const key in newSettings[category]) {
          if (oldSettings[category]?.[key] !== newSettings[category][key]) {
            if (!changes[category]) changes[category] = {}
            changes[category][key] = {
              old: oldSettings[category]?.[key],
              new: newSettings[category][key]
            }
          }
        }
      }
    }
    
    return changes
  }
  
  /**
   * Export settings as JSON
   */
  exportSettings() {
    return JSON.stringify(this.settings, null, 2)
  }
  
  /**
   * Import settings from JSON
   */
  importSettings(jsonString) {
    try {
      const imported = JSON.parse(jsonString)
      this.updateSettings(imported)
      return true
    } catch (error) {
      this.emit('importError', { error: 'Invalid JSON format' })
      return false
    }
  }
  
  /**
   * Get settings for specific component
   */
  getTimerSettings() {
    return this.getCategory('timer')
  }
  
  getMusicSettings() {
    return this.getCategory('music')
  }
  
  getAppearanceSettings() {
    return this.getCategory('appearance')
  }
  
  getNotificationSettings() {
    return this.getCategory('notifications')
  }
  
  getAdvancedSettings() {
    return this.getCategory('advanced')
  }

  /**
   * Convenience methods for common settings access
   */

  // Timer settings shortcuts
  getWorkDuration() {
    return this.getSetting('timer', 'workDuration')
  }

  getShortBreakDuration() {
    return this.getSetting('timer', 'shortBreakDuration')
  }

  getLongBreakDuration() {
    return this.getSetting('timer', 'longBreakDuration')
  }

  getSessionsUntilLongBreak() {
    return this.getSetting('timer', 'sessionsUntilLongBreak')
  }

  // Music settings shortcuts
  isMusicEnabled() {
    return this.getSetting('music', 'enabled')
  }

  getMusicVolume() {
    return this.getSetting('music', 'volume')
  }

  getCurrentTrack() {
    return this.getSetting('music', 'currentTrack')
  }

  getPlaybackMode() {
    return this.getSetting('music', 'playbackMode')
  }

  // Appearance settings shortcuts
  getTheme() {
    return this.getSetting('appearance', 'theme')
  }

  getBackgroundType() {
    return this.getSetting('appearance', 'backgroundType')
  }

  getBackgroundColor() {
    return this.getSetting('appearance', 'backgroundColor')
  }

  getGradientColors() {
    return {
      color1: this.getSetting('appearance', 'gradientColor1'),
      color2: this.getSetting('appearance', 'gradientColor2')
    }
  }

  // Notification settings shortcuts
  areNotificationsEnabled() {
    return this.getSetting('notifications', 'enabled')
  }

  isSoundEnabled() {
    return this.getSetting('notifications', 'sound')
  }

  areDesktopNotificationsEnabled() {
    return this.getSetting('notifications', 'desktop')
  }

  // Advanced settings shortcuts
  areAutoStartBreaksEnabled() {
    return this.getSetting('advanced', 'autoStartBreaks')
  }

  isAutoStartWorkEnabled() {
    return this.getSetting('advanced', 'autoStartWork')
  }
  
  /**
   * Apply appearance settings to document
   */
  applyAppearanceSettings() {
    const appearance = this.getAppearanceSettings()

    // Apply background
    const body = document.body

    switch (appearance.backgroundType) {
      case 'solid':
        body.style.background = appearance.backgroundColor
        body.classList.add('solid-background')
        body.classList.remove('custom-background')
        break

      case 'image':
        if (appearance.backgroundImage) {
          body.style.backgroundImage = `url(${appearance.backgroundImage})`
          body.classList.add('custom-background')
          body.classList.remove('solid-background')
        }
        break

      case 'default':
        // Use default colors from CSS variables - reset to original values
        this.resetCSSVariablesToDefault()
        body.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)'
        body.classList.remove('solid-background', 'custom-background')
        break

      case 'gradient':
      default:
        // Update CSS custom properties for dynamic theming
        this.updateCSSVariables(appearance)
        const color1 = appearance.gradientColor1 || appearance.backgroundColor || '#667eea'
        const color2 = appearance.gradientColor2 || '#764ba2'
        body.style.background = `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`
        body.classList.remove('solid-background', 'custom-background')
        break
    }

    // Apply theme
    body.setAttribute('data-theme', appearance.theme || 'light')
  }

  /**
   * Update CSS custom properties for dynamic theming
   */
  updateCSSVariables(appearance) {
    const root = document.documentElement

    // Update primary and secondary colors based on gradient colors
    if (appearance.gradientColor1) {
      root.style.setProperty('--primary-color', appearance.gradientColor1)
      // Generate a slightly darker version for primary-dark
      const darkColor = this.darkenColor(appearance.gradientColor1, 10)
      root.style.setProperty('--primary-dark', darkColor)
    }

    if (appearance.gradientColor2) {
      root.style.setProperty('--secondary-color', appearance.gradientColor2)
    }
  }

  /**
   * Reset CSS custom properties to default values
   */
  resetCSSVariablesToDefault() {
    const root = document.documentElement

    // Reset to original default colors
    root.style.setProperty('--primary-color', '#667eea')
    root.style.setProperty('--primary-dark', '#5a6fd8')
    root.style.setProperty('--secondary-color', '#764ba2')
  }

  /**
   * Darken a hex color by a percentage
   */
  darkenColor(hex, percent) {
    // Remove # if present
    hex = hex.replace('#', '')

    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Darken by percentage
    const factor = (100 - percent) / 100
    const newR = Math.round(r * factor)
    const newG = Math.round(g * factor)
    const newB = Math.round(b * factor)

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
  }
  
  /**
   * Check if settings are different from defaults
   */
  hasCustomSettings() {
    return JSON.stringify(this.settings) !== JSON.stringify(this.defaultSettings)
  }
  
  /**
   * Get settings summary for display
   */
  getSettingsSummary() {
    return {
      timer: `${this.settings.timer.workDuration}/${this.settings.timer.shortBreakDuration}/${this.settings.timer.longBreakDuration} min`,
      music: this.settings.music.enabled ? `${this.settings.music.volume}% volume` : 'Disabled',
      background: this.settings.appearance.backgroundType,
      customized: this.hasCustomSettings()
    }
  }
}
