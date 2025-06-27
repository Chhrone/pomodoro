# Centralized Settings System

## Overview

The Pomodoro application now uses a centralized settings system that provides:

- **Unified Settings Management**: All settings are managed through a single `SettingsManager` instance
- **Persistent Storage**: Settings are automatically saved to and loaded from localStorage
- **Type Safety**: Settings are validated and have proper defaults
- **Event-Driven Updates**: Components are notified when settings change
- **Easy Access**: Convenient shortcut methods for common settings

## Architecture

### Core Components

1. **SettingsModel** (`src/models/SettingsModel.js`)
   - Manages the actual settings data and localStorage persistence
   - Provides validation and default values
   - Emits events when settings change

2. **SettingsManager** (`src/utils/SettingsManager.js`)
   - Singleton wrapper around SettingsModel
   - Provides convenient access methods
   - Ensures all components use the same settings instance

3. **SettingsPresenter** (`src/presenters/SettingsPresenter.js`)
   - Handles the settings UI
   - Coordinates between SettingsModel and SettingsView
   - Manages user interactions

## Settings Structure

```javascript
{
  timer: {
    workDuration: 25,           // minutes
    shortBreakDuration: 5,      // minutes
    longBreakDuration: 15,      // minutes
    sessionsUntilLongBreak: 3   // number of sessions
  },
  
  music: {
    enabled: true,              // boolean
    volume: 100,                // percentage (0-100)
    currentTrack: null,         // track ID or null
    playbackMode: 'loop'        // 'loop' or 'list'
  },
  
  appearance: {
    backgroundType: 'gradient', // 'default', 'gradient', 'solid', 'image'
    backgroundColor: '#667eea',  // hex color
    gradientColor1: '#667eea',   // hex color
    gradientColor2: '#764ba2',   // hex color
    backgroundImage: null,       // base64 or null
    theme: 'light'              // 'light' or 'dark'
  },
  
  notifications: {
    enabled: true,              // boolean
    sound: true,                // boolean
    desktop: false              // boolean
  },
  
  advanced: {
    gracePeriodsEnabled: true,  // boolean
    bonusTimeEnabled: true,     // boolean
    autoStartBreaks: true,      // boolean (auto-start short breaks)
    autoStartWork: false        // boolean
  }
}
```

## Usage Examples

### Basic Settings Access

```javascript
import { settingsManager } from './utils/SettingsManager.js'

// Get all settings
const settings = settingsManager.getSettings()

// Get specific category
const timerSettings = settingsManager.getTimerSettings()

// Get specific setting
const workDuration = settingsManager.getSetting('timer', 'workDuration')
```

### Using Shortcut Methods

```javascript
// Timer shortcuts
const workDuration = settingsManager.getWorkDuration()
const shortBreakDuration = settingsManager.getShortBreakDuration()
const longBreakDuration = settingsManager.getLongBreakDuration()

// Music shortcuts
const isMusicEnabled = settingsManager.isMusicEnabled()
const musicVolume = settingsManager.getMusicVolume()
const currentTrack = settingsManager.getCurrentTrack()

// Appearance shortcuts
const theme = settingsManager.getTheme()
const backgroundType = settingsManager.getBackgroundType()
const gradientColors = settingsManager.getGradientColors()

// Notification shortcuts
const notificationsEnabled = settingsManager.areNotificationsEnabled()
const soundEnabled = settingsManager.isSoundEnabled()
```

### Updating Settings

```javascript
// Update single setting
settingsManager.updateSetting('timer', 'workDuration', 30)

// Update multiple settings
settingsManager.updateSettings({
  timer: {
    workDuration: 30,
    shortBreakDuration: 10
  },
  music: {
    volume: 80
  }
})
```

### Listening to Changes

```javascript
// Listen to all settings changes
settingsManager.on('settingsChanged', (data) => {
  console.log('Settings updated:', data.settings)
  console.log('Changes:', data.changes)
})

// Listen to specific setting changes
settingsManager.on('settingChanged', (data) => {
  console.log(`${data.category}.${data.key} changed from ${data.oldValue} to ${data.value}`)
})
```

## Component Integration

### Timer Integration

The TimerModel automatically loads its configuration from the centralized settings:

```javascript
// TimerModel automatically syncs with settings
const timerModel = new TimerModel()
// Config is loaded from settingsManager.getTimerSettings()
```

### Music Integration

The MusicPresenter syncs with centralized settings and saves changes back:

```javascript
// Music settings are automatically synced
// Changes in music UI are saved to centralized settings
```

### Appearance Integration

Appearance settings are automatically applied when changed:

```javascript
// Theme and background changes are applied immediately
settingsManager.updateSetting('appearance', 'theme', 'dark')
// UI automatically updates to dark theme
```

## Development Tools

### Testing

```javascript
// Run comprehensive settings tests
window.testSettings()

// Access settings manager in console
window.settingsManager.getSettings()

// Reset settings for testing
window.SettingsTest.resetToDefaults()
```

### Debugging

```javascript
// Display current settings
window.SettingsTest.displaySettingsSummary()

// Validate settings integration
window.settingsPresenter.validateSettingsIntegration()

// Debug settings panel state
window.debugSettings()
```

## Benefits

1. **Consistency**: All components use the same settings source
2. **Persistence**: Settings automatically persist across sessions
3. **Validation**: Invalid settings are automatically corrected
4. **Performance**: Settings are cached and only saved when changed
5. **Maintainability**: Centralized settings logic is easier to maintain
6. **Extensibility**: Easy to add new settings categories or options

## Migration Notes

The new system is backward compatible with existing localStorage data. When the application loads:

1. Existing settings are automatically migrated to the new structure
2. Missing settings are filled with defaults
3. Invalid settings are corrected
4. The settings are re-saved in the new format

## Best Practices

1. **Always use settingsManager**: Don't access localStorage directly
2. **Use shortcut methods**: They're more readable and type-safe
3. **Listen to events**: React to settings changes rather than polling
4. **Validate inputs**: Use the built-in validation methods
5. **Test thoroughly**: Use the provided testing utilities

## Future Enhancements

- Settings import/export functionality
- Settings profiles/presets
- Cloud synchronization
- Settings history/undo
- Advanced validation rules
