/**
 * SettingsPresenter - Connects SettingsModel with SettingsView
 * Follows MVP pattern - handles settings logic and coordinates between model and views
 */
import { SettingsModel } from '../models/SettingsModel.js'
import { SettingsView } from '../views/SettingsView.js'
import { EventEmitter } from '../utils/EventEmitter.js'

export class SettingsPresenter extends EventEmitter {
  constructor() {
    super()

    // Initialize model and views
    this.model = new SettingsModel()
    this.settingsView = new SettingsView()

    // State
    this.isVisible = false

    this.setupModelListeners()
    this.setupViewCallbacks()
    this.initializeUI()
  }
  
  /**
   * Initialize the presenter
   */
  init() {
    // Apply initial appearance settings
    this.model.applyAppearanceSettings()
    this.updateUI()
  }
  
  /**
   * Setup model event listeners
   */
  setupModelListeners() {
    // Settings change events
    this.model.on('settingsChanged', (data) => {
      this.updateUI()
      this.applySettings(data.settings)
      this.emit('settingsChanged', data.settings)
      
      // Show notification for changes
      if (Object.keys(data.changes).length > 0) {
        this.settingsView.showSuccess('Settings updated successfully')
        this.settingsView.highlightChanges(data.changes)
      }
    })
    
    this.model.on('settingChanged', (data) => {
      this.updateUI()
      this.applySettings(data.settings)
      this.emit('settingsChanged', data.settings)
    })
    
    this.model.on('settingsReset', (data) => {
      this.updateUI()
      this.applySettings(data.settings)
      this.settingsView.showSuccess('Settings reset to defaults')
      this.emit('settingsChanged', data.settings)
    })
    
    this.model.on('categoryReset', (data) => {
      this.updateUI()
      this.settingsView.showSuccess(`${data.category} settings reset`)
    })
    
    // Save/load events
    this.model.on('settingsSaved', () => {
      // Settings automatically saved
    })
    
    this.model.on('settingsSaveError', (data) => {
      this.settingsView.showError('Failed to save settings: ' + data.error.message)
    })
    
    this.model.on('importError', (data) => {
      this.settingsView.showError('Import failed: ' + data.error)
    })
  }
  
  /**
   * Setup view callbacks
   */
  setupViewCallbacks() {
    // Settings view callbacks
    this.settingsView.setCallbacks({
      onClose: () => this.hideSettings(),
      onTimerSettingChange: (key, value) => this.handleTimerSettingChange(key, value),
      onAppearanceSettingChange: (key, value) => this.handleAppearanceSettingChange(key, value),
      onBackgroundImageChange: (file) => this.handleBackgroundImageChange(file),
      onSaveTimerSettings: () => this.handleSaveTimerSettings()
    })
    
    // Music settings are now handled by MusicPresenter directly
    // No need for music view callbacks here
  }
  
  /**
   * Initialize UI with current settings
   */
  initializeUI() {
    this.updateUI()
  }
  
  /**
   * Update UI based on current settings
   */
  updateUI() {
    const settings = this.model.getSettings()
    
    // Update settings view
    this.settingsView.updateAllSettings(settings)
    
    // Music settings are now handled by MusicPresenter directly
  }
  
  /**
   * Show settings panel
   */
  showSettings() {
    if (this.isVisible) return
    
    this.isVisible = true
    this.settingsView.show()
    this.updateUI()
    
    this.emit('settingsShown')
  }
  
  /**
   * Hide settings panel
   */
  hideSettings() {
    if (!this.isVisible) return
    
    this.isVisible = false
    this.settingsView.hide()
    
    this.emit('settingsHidden')
  }
  
  /**
   * Toggle settings panel visibility
   */
  toggleSettings() {
    if (this.isVisible) {
      this.hideSettings()
    } else {
      this.showSettings()
    }
  }
  
  /**
   * Handle timer setting changes (no auto save)
   */
  handleTimerSettingChange(key, value) {
    // Just validate the value but don't save to model yet
    const validatedValue = this.validateTimerValue(key, value)

    if (validatedValue !== value) {
      this.settingsView.showError(`Invalid value for ${key}. Using ${validatedValue} instead.`)
      // Update the input field to show the validated value
      this.settingsView.updateTimerSetting(key, validatedValue)
    }

    // Don't save to model - only save when user clicks save button
  }

  /**
   * Handle save timer settings
   */
  handleSaveTimerSettings() {
    // Get current form values
    const formValues = this.settingsView.getFormValues()

    // Validate and save timer settings
    const timerSettings = formValues.timer

    // Validate each setting
    const validatedSettings = {
      workDuration: this.validateTimerValue('workDuration', timerSettings.workDuration),
      shortBreakDuration: this.validateTimerValue('shortBreakDuration', timerSettings.shortBreakDuration),
      longBreakDuration: this.validateTimerValue('longBreakDuration', timerSettings.longBreakDuration)
    }

    // Update model with validated settings
    Object.keys(validatedSettings).forEach(key => {
      this.model.updateSetting('timer', key, validatedSettings[key])
    })

    // Reset timer with new settings
    this.emit('timerSettingsSaved', validatedSettings)

    // Show success message
    this.settingsView.showSuccess('Timer settings saved successfully!')
  }
  
  /**
   * Handle appearance setting changes
   */
  handleAppearanceSettingChange(key, value) {
    this.model.updateSetting('appearance', key, value)
    
    // Apply appearance changes immediately
    this.model.applyAppearanceSettings()
  }
  
  /**
   * Handle background image change
   */
  handleBackgroundImageChange(file) {
    if (!file || !file.type.startsWith('image/')) {
      this.settingsView.showError('Please select a valid image file')
      return
    }
    
    // Create object URL for the image
    const imageUrl = URL.createObjectURL(file)
    
    // Update setting
    this.model.updateSetting('appearance', 'backgroundImage', imageUrl)
    this.model.updateSetting('appearance', 'backgroundType', 'image')
    
    // Apply immediately
    this.model.applyAppearanceSettings()
    
    this.settingsView.showSuccess('Background image updated')
  }
  
  /**
   * Handle music setting changes (deprecated - now handled by MusicPresenter)
   */
  handleMusicSettingChange(key, value) {
    // Music settings are now handled by MusicPresenter directly
    // This method is kept for compatibility but does nothing
  }
  
  /**
   * Validate timer values
   */
  validateTimerValue(key, value) {
    const constraints = {
      workDuration: { min: 1, max: 120 },
      shortBreakDuration: { min: 1, max: 60 },
      longBreakDuration: { min: 1, max: 120 },
      sessionsUntilLongBreak: { min: 1, max: 10 }
    }
    
    const constraint = constraints[key]
    if (!constraint) return value
    
    return Math.max(constraint.min, Math.min(constraint.max, value))
  }
  
  /**
   * Apply settings to the application
   */
  applySettings(settings) {
    // Apply appearance settings
    this.model.applyAppearanceSettings()
    
    // Emit settings for other components
    this.emit('settingsApplied', settings)
  }
  
  /**
   * Reset all settings to defaults
   */
  resetAllSettings() {
    this.model.resetSettings()
    this.settingsView.showSuccess('All settings reset to defaults')
  }
  
  /**
   * Reset specific category
   */
  resetCategory(category) {
    this.model.resetCategory(category)
  }
  
  /**
   * Export settings as JSON
   */
  exportSettings() {
    try {
      const settingsJson = this.model.exportSettings()
      
      // Create download link
      const blob = new Blob([settingsJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = 'pomodoro-settings.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      this.settingsView.showSuccess('Settings exported successfully')
    } catch (error) {
      this.settingsView.showError('Failed to export settings')
      console.error('Export error:', error)
    }
  }
  
  /**
   * Import settings from JSON
   */
  importSettings(jsonString) {
    const success = this.model.importSettings(jsonString)
    
    if (success) {
      this.settingsView.showSuccess('Settings imported successfully')
    }
    // Error is handled by model event listener
  }
  
  /**
   * Get current settings
   */
  getSettings() {
    return this.model.getSettings()
  }
  
  /**
   * Get specific setting category
   */
  getCategory(category) {
    return this.model.getCategory(category)
  }
  
  /**
   * Update settings from external source
   */
  updateSettings(newSettings) {
    this.model.updateSettings(newSettings)
  }
  
  /**
   * Check if settings panel is visible
   */
  isSettingsVisible() {
    return this.isVisible
  }
  
  /**
   * Get settings summary
   */
  getSettingsSummary() {
    return this.model.getSettingsSummary()
  }
  
  /**
   * Check if settings are customized
   */
  hasCustomSettings() {
    return this.model.hasCustomSettings()
  }
  
  /**
   * Handle external music track updates (deprecated - now handled by MusicPresenter)
   */
  updateMusicTracks(tracks, currentTrackId) {
    // Music UI is now handled by MusicPresenter directly
    // This method is kept for compatibility but does nothing
  }

  /**
   * Handle external music state updates (deprecated - now handled by MusicPresenter)
   */
  updateMusicState(state) {
    // Music UI is now handled by MusicPresenter directly
    // This method is kept for compatibility but does nothing
  }
}
