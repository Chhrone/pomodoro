/**
 * Centralized Settings Manager
 * Provides a singleton interface for accessing application settings
 * This ensures all components use the same settings instance and stay in sync
 */

import { SettingsModel } from '../models/SettingsModel.js'

class SettingsManager {
  constructor() {
    this.model = null
    this.initialized = false
  }

  /**
   * Initialize the settings manager with a settings model
   */
  init(settingsModel) {
    if (this.initialized) {
      console.warn('SettingsManager already initialized')
      return
    }

    this.model = settingsModel
    this.initialized = true
    
    console.log('SettingsManager initialized')
  }

  /**
   * Get the settings model instance
   */
  getModel() {
    if (!this.initialized) {
      throw new Error('SettingsManager not initialized. Call init() first.')
    }
    return this.model
  }

  /**
   * Get all settings
   */
  getSettings() {
    return this.getModel().getSettings()
  }

  /**
   * Get settings for a specific category
   */
  getCategory(category) {
    return this.getModel().getCategory(category)
  }

  /**
   * Get a specific setting value
   */
  getSetting(category, key) {
    return this.getModel().getSetting(category, key)
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    return this.getModel().updateSettings(newSettings)
  }

  /**
   * Update a specific setting
   */
  updateSetting(category, key, value) {
    return this.getModel().updateSetting(category, key, value)
  }

  /**
   * Listen to settings changes
   */
  on(event, callback) {
    return this.getModel().on(event, callback)
  }

  /**
   * Timer Settings Shortcuts
   */
  getTimerSettings() {
    return this.getModel().getTimerSettings()
  }

  getWorkDuration() {
    return this.getModel().getWorkDuration()
  }

  getShortBreakDuration() {
    return this.getModel().getShortBreakDuration()
  }

  getLongBreakDuration() {
    return this.getModel().getLongBreakDuration()
  }

  getSessionsUntilLongBreak() {
    return this.getModel().getSessionsUntilLongBreak()
  }

  /**
   * Music Settings Shortcuts
   */
  getMusicSettings() {
    return this.getModel().getMusicSettings()
  }

  isMusicEnabled() {
    return this.getModel().isMusicEnabled()
  }

  getMusicVolume() {
    return this.getModel().getMusicVolume()
  }

  getCurrentTrack() {
    return this.getModel().getCurrentTrack()
  }

  getPlaybackMode() {
    return this.getModel().getPlaybackMode()
  }

  /**
   * Appearance Settings Shortcuts
   */
  getAppearanceSettings() {
    return this.getModel().getAppearanceSettings()
  }

  getTheme() {
    return this.getModel().getTheme()
  }

  getBackgroundType() {
    return this.getModel().getBackgroundType()
  }

  getBackgroundColor() {
    return this.getModel().getBackgroundColor()
  }

  getGradientColors() {
    return this.getModel().getGradientColors()
  }

  /**
   * Notification Settings Shortcuts
   */
  getNotificationSettings() {
    return this.getModel().getNotificationSettings()
  }

  areNotificationsEnabled() {
    return this.getModel().areNotificationsEnabled()
  }

  isSoundEnabled() {
    return this.getModel().isSoundEnabled()
  }

  areDesktopNotificationsEnabled() {
    return this.getModel().areDesktopNotificationsEnabled()
  }

  /**
   * Advanced Settings Shortcuts
   */
  getAdvancedSettings() {
    return this.getModel().getAdvancedSettings()
  }

  areAutoStartBreaksEnabled() {
    return this.getModel().areAutoStartBreaksEnabled()
  }

  isAutoStartWorkEnabled() {
    return this.getModel().isAutoStartWorkEnabled()
  }

  /**
   * Utility Methods
   */
  resetSettings() {
    return this.getModel().resetSettings()
  }

  exportSettings() {
    return this.getModel().exportSettings()
  }

  importSettings(jsonString) {
    return this.getModel().importSettings(jsonString)
  }

  hasCustomSettings() {
    return this.getModel().hasCustomSettings()
  }

  /**
   * Apply settings to the application
   */
  applyAppearanceSettings() {
    return this.getModel().applyAppearanceSettings()
  }
}

// Create and export singleton instance
export const settingsManager = new SettingsManager()

// Also export the class for testing purposes
export { SettingsManager }
