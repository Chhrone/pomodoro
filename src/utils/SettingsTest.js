/**
 * Settings System Test Utility
 * Provides methods to test and validate the centralized settings system
 */

import { settingsManager } from './SettingsManager.js'

export class SettingsTest {
  /**
   * Run comprehensive settings tests
   */
  static runTests() {
    console.log('🧪 Running Settings System Tests...')
    
    const tests = [
      this.testSettingsManagerInitialization,
      this.testSettingsAccess,
      this.testSettingsPersistence,
      this.testSettingsValidation,
      this.testShortcutMethods
    ]
    
    let passed = 0
    let failed = 0
    
    tests.forEach((test, index) => {
      try {
        console.log(`\n📋 Test ${index + 1}: ${test.name}`)
        test.call(this)
        console.log('✅ PASSED')
        passed++
      } catch (error) {
        console.error('❌ FAILED:', error.message)
        failed++
      }
    })
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)
    return { passed, failed, total: tests.length }
  }
  
  /**
   * Test settings manager initialization
   */
  static testSettingsManagerInitialization() {
    if (!settingsManager.initialized) {
      throw new Error('Settings manager not initialized')
    }
    
    const model = settingsManager.getModel()
    if (!model) {
      throw new Error('Settings model not available')
    }
    
    console.log('Settings manager properly initialized')
  }
  
  /**
   * Test basic settings access
   */
  static testSettingsAccess() {
    const settings = settingsManager.getSettings()
    
    if (!settings) {
      throw new Error('Could not retrieve settings')
    }
    
    const requiredCategories = ['timer', 'music', 'appearance', 'notifications', 'advanced']
    requiredCategories.forEach(category => {
      if (!settings[category]) {
        throw new Error(`Missing settings category: ${category}`)
      }
    })
    
    console.log('All settings categories accessible')
  }
  
  /**
   * Test settings persistence
   */
  static testSettingsPersistence() {
    const originalValue = settingsManager.getWorkDuration()
    const testValue = originalValue === 25 ? 30 : 25
    
    // Update setting
    settingsManager.updateSetting('timer', 'workDuration', testValue)
    
    // Verify update
    const updatedValue = settingsManager.getWorkDuration()
    if (updatedValue !== testValue) {
      throw new Error(`Setting not updated. Expected: ${testValue}, Got: ${updatedValue}`)
    }
    
    // Check localStorage
    const stored = localStorage.getItem('pomodoro-settings')
    if (!stored) {
      throw new Error('Settings not saved to localStorage')
    }
    
    const parsedStored = JSON.parse(stored)
    if (parsedStored.timer.workDuration !== testValue) {
      throw new Error('Settings not properly persisted to localStorage')
    }
    
    // Restore original value
    settingsManager.updateSetting('timer', 'workDuration', originalValue)
    
    console.log('Settings persistence working correctly')
  }
  
  /**
   * Test settings validation
   */
  static testSettingsValidation() {
    const originalValue = settingsManager.getWorkDuration()
    
    // Test invalid values (should be clamped)
    settingsManager.updateSetting('timer', 'workDuration', -5)
    const clampedLow = settingsManager.getWorkDuration()
    if (clampedLow < 1) {
      throw new Error('Invalid low value not properly validated')
    }
    
    settingsManager.updateSetting('timer', 'workDuration', 200)
    const clampedHigh = settingsManager.getWorkDuration()
    if (clampedHigh > 120) {
      throw new Error('Invalid high value not properly validated')
    }
    
    // Restore original value
    settingsManager.updateSetting('timer', 'workDuration', originalValue)
    
    console.log('Settings validation working correctly')
  }
  
  /**
   * Test shortcut methods
   */
  static testShortcutMethods() {
    const shortcuts = [
      'getWorkDuration',
      'getShortBreakDuration',
      'getLongBreakDuration',
      'isMusicEnabled',
      'getMusicVolume',
      'getTheme',
      'areNotificationsEnabled'
    ]
    
    shortcuts.forEach(method => {
      if (typeof settingsManager[method] !== 'function') {
        throw new Error(`Shortcut method ${method} not available`)
      }
      
      const result = settingsManager[method]()
      if (result === undefined) {
        throw new Error(`Shortcut method ${method} returned undefined`)
      }
    })
    
    console.log('All shortcut methods working correctly')
  }
  
  /**
   * Test settings export/import
   */
  static testSettingsExportImport() {
    const originalSettings = settingsManager.getSettings()
    
    // Export settings
    const exported = settingsManager.exportSettings()
    if (!exported) {
      throw new Error('Settings export failed')
    }
    
    // Modify a setting
    settingsManager.updateSetting('timer', 'workDuration', 45)
    
    // Import original settings
    const importResult = settingsManager.importSettings(exported)
    if (!importResult) {
      throw new Error('Settings import failed')
    }
    
    // Verify restoration
    const restoredValue = settingsManager.getWorkDuration()
    if (restoredValue !== originalSettings.timer.workDuration) {
      throw new Error('Settings not properly restored after import')
    }
    
    console.log('Settings export/import working correctly')
  }
  
  /**
   * Display current settings summary
   */
  static displaySettingsSummary() {
    console.log('\n📋 Current Settings Summary:')
    console.log('Timer:', settingsManager.getTimerSettings())
    console.log('Music:', settingsManager.getMusicSettings())
    console.log('Appearance:', settingsManager.getAppearanceSettings())
    console.log('Notifications:', settingsManager.getNotificationSettings())
    console.log('Advanced:', settingsManager.getAdvancedSettings())
  }
  
  /**
   * Reset settings to defaults (for testing)
   */
  static resetToDefaults() {
    settingsManager.resetSettings()
    console.log('Settings reset to defaults')
  }
}

// Export for global access in development
if (typeof window !== 'undefined') {
  window.SettingsTest = SettingsTest
}
