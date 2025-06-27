# 🍅 Pomodoro Timer

A modern, feature-rich Pomodoro Timer application built with vanilla JavaScript following the MVP (Model-View-Presenter) architecture pattern. This application helps you boost productivity using the proven Pomodoro Technique with customizable settings, background music, and beautiful visual design.

🌐 **Live Demo**: [pomodoro.rayin.my.id](https://pomodoro.rayin.my.id)
*Hosted on Vercel with DNS managed by Cloudflare*

## ✨ Features

### 🎯 Core Timer Functionality
- **Pomodoro Technique Implementation**: 25-minute focus sessions with 5-minute short breaks and 15-minute long breaks
- **Customizable Timer Settings**: Adjust work session, short break, and long break durations
- **Visual Progress Ring**: Circular progress indicator with smooth animations and rounded borders
- **Session Tracking**: Track completed sessions and total focus time with daily reports
- **Smart Break System**: Auto-start short breaks with grace period for delayed breaks
- **Web Workers**: Background timer processing for consistent performance when tab is inactive

### 🎵 Music Integration
- **Background Music Support**: Play ambient music during focus sessions using Howler.js
- **Multiple Audio Formats**: Support for MP3, WAV, OGG, and other web audio formats
- **Music Controls**: Play/pause, previous/next track, loop/list mode toggle
- **Volume Control**: Adjustable volume with real-time slider
- **Now Playing Display**: Scrolling text showing current track with smooth animations
- **Auto-pause**: Music automatically stops during breaks and pauses
- **Custom Music Upload**: Add your own music files for personalized focus sessions

### 🎨 Customizable Appearance
- **Multiple Background Types**: Choose from default, gradient, solid color, or custom image backgrounds
- **Color Customization**: Dual color picker for gradient backgrounds with primary/secondary color system
- **Dark/Light Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, minimalist interface with smooth animations and transitions
- **Settings Panel**: Slide-in settings panel with organized sections

### 📊 Session Reports
- **Daily Statistics**: Track focus time and completed sessions by date
- **Weekly Charts**: Visual representation of productivity patterns
- **Session History**: Detailed breakdown of work sessions and break times
- **Progress Tracking**: Monitor productivity trends over time

### ⚙️ Advanced Settings
- **Centralized Settings System**: All preferences managed through unified settings model
- **Persistent Storage**: Settings automatically saved to localStorage with validation
- **Settings Import/Export**: Backup and restore your preferences
- **Auto-save**: Appearance settings save immediately, timer settings require manual save
- **Keyboard Shortcuts**: ESC to close settings, space for start/pause
- **Click Outside Protection**: Smart click detection prevents accidental settings panel closure

## 🛠️ Tech Stack

### Frontend Technologies
- **HTML5**: Semantic markup with modern web standards and accessibility features
- **CSS3**: Advanced styling with CSS Grid, Flexbox, custom properties, and smooth animations
- **Vanilla JavaScript (ES6+)**: Modern JavaScript with modules, classes, async/await, and Web Workers
- **CSS Custom Properties**: Dynamic theming and color management system
- **Web APIs**: localStorage, Web Workers, Notification API, and File API

### Audio System
- **Howler.js**: Professional audio library for cross-browser audio support
- **Web Audio API**: Native browser audio capabilities for enhanced performance
- **Multiple Format Support**: MP3, WAV, OGG, AAC, FLAC, and more audio formats
- **Audio Storage**: Client-side music file management with localStorage integration

### Architecture & Patterns
- **MVP Pattern**: Model-View-Presenter architecture for clean separation of concerns
- **Event-Driven Architecture**: Custom event emitter system for loose component coupling
- **Centralized Settings Management**: Unified settings model with automatic persistence
- **Module System**: ES6 modules for code organization and reusability
- **Observer Pattern**: Reactive updates and state synchronization between components

### Development & Build Tools
- **Vite**: Lightning-fast build tool and development server with HMR
- **ES6 Modules**: Native module system for optimal performance
- **Modern Browser APIs**: Leveraging latest web standards for enhanced functionality
- **Mobile-First Design**: Responsive layout with progressive enhancement

### Hosting & Infrastructure
- **Vercel**: Serverless deployment platform for optimal performance and global CDN
- **Cloudflare**: DNS management and additional performance optimization
- **Custom Domain**: Professional domain setup with SSL/TLS encryption

## 🚀 Getting Started

Visit [pomodoro.rayin.my.id](https://pomodoro.rayin.my.id) to start using the timer immediately!

### Quick Start Guide

1. **First Launch**: The timer starts with default settings (25min work, 5min short break, 15min long break)
2. **Start Timer**: Click the "Start" button to begin your first focus session
3. **Customize Settings**: Click the gear icon to adjust timer durations, background, and music
4. **Add Music**: In settings, load your own audio files for personalized focus sessions
5. **Track Progress**: Monitor completed sessions and total focus time in the daily reports

## 📖 How to Use

### Basic Timer Operation
1. **Start/Pause**: Click "Start" to begin, "Pause" to temporarily stop
2. **Reset**: Click "Reset" to return to the beginning of current session
3. **Skip**: Click "Skip" to immediately move to the next session

### Break Management
- After completing a work session, you'll see a break confirmation screen
- **Start Break**: Begin your break with any accumulated bonus time
- **Skip Break**: Continue working without taking a break
- **Bonus Time**: Delay starting breaks to earn extra break time (max 10 minutes)

### Settings Configuration

#### Timer Settings
- **Work Session**: Duration of focus periods (1-120 minutes)
- **Short Break**: Duration of short breaks (1-60 minutes)  
- **Long Break**: Duration of long breaks (1-120 minutes)
- Click "Save Timer Settings" to apply changes

#### Appearance Settings
- **Background Type**: Choose gradient, solid, or image background
- **Gradient Colors**: Customize primary and secondary colors for gradients
- **Background Image**: Upload custom background image

#### Music Settings
- **Enable Music**: Toggle background music on/off
- **Volume Control**: Adjust music volume (0-100%)
- **Track Selection**: Choose from loaded tracks or upload new ones
- **Load Music**: Add MP3, WAV, or other audio files

### Keyboard Shortcuts
- **ESC**: Close settings panel
- **Space**: Start/pause timer (when not in input fields)

## 🏗️ Project Structure

```
pomodoro/
├── index.html              # Main HTML file
├── src/
│   ├── models/             # Data layer (MVP Model)
│   │   ├── TimerModel.js   # Timer logic and state management
│   │   ├── SettingsModel.js # Centralized settings management
│   │   ├── MusicModel.js   # Audio playback and music logic
│   │   └── ReportModel.js  # Session tracking and statistics
│   ├── views/              # UI layer (MVP View)
│   │   ├── TimerView.js    # Timer display and controls
│   │   ├── SettingsView.js # Settings panel UI
│   │   ├── MusicPlayerView.js # Music controls UI
│   │   ├── MusicControlsView.js # Music playback controls
│   │   ├── BreakConfirmationView.js # Break confirmation UI
│   │   └── ReportView.js   # Statistics and reports UI
│   ├── presenters/         # Logic layer (MVP Presenter)
│   │   ├── TimerPresenter.js # Timer coordination and logic
│   │   ├── SettingsPresenter.js # Settings coordination
│   │   ├── MusicPresenter.js # Music coordination
│   │   └── ReportPresenter.js # Reports coordination
│   ├── utils/              # Utility functions and helpers
│   │   ├── EventEmitter.js # Custom event system
│   │   ├── SettingsManager.js # Centralized settings access
│   │   ├── TimerWorkerManager.js # Web Workers for background timing
│   │   ├── NotificationManager.js # Browser notifications
│   │   └── MusicStorage.js # Music file storage management
│   ├── styles/             # CSS stylesheets
│   │   ├── variables.css   # CSS custom properties and themes
│   │   ├── base.css        # Base styles and reset
│   │   ├── components.css  # Component styles
│   │   ├── settings.css    # Settings panel styles
│   │   ├── music.css       # Music player styles
│   │   ├── reports.css     # Reports and statistics styles
│   │   └── responsive.css  # Mobile responsiveness
│   ├── assets/             # Static assets
│   │   └── music/          # Default music files
│   └── main.js             # Application entry point
├── docs/                   # Documentation
│   └── SETTINGS_SYSTEM.md  # Settings system documentation
└── README.md               # This file
```

## 🎨 Customization

### Adding Custom Music
1. Open Settings (gear icon)
2. Navigate to Music Settings section
3. Click "Load Music Files"
4. Select one or more audio files from your device
5. Choose your preferred track from the dropdown

### Changing Appearance
1. Open Settings → Appearance Settings
2. Select background type:
   - **Default**: Clean gradient background
   - **Gradient**: Custom two-color gradient
   - **Solid**: Single color background
   - **Image**: Upload custom background image
3. Use color pickers to customize colors
4. Changes apply immediately

### Modifying Timer Durations
1. Open Settings → Timer Settings
2. Adjust durations using number inputs:
   - Work Session: 1-120 minutes
   - Short Break: 1-60 minutes
   - Long Break: 1-120 minutes
3. Click "Save Timer Settings" to apply

## 🏛️ Architecture

### MVP Pattern Implementation
The application follows the MVP (Model-View-Presenter) pattern for clean code organization:

- **Models**: Handle data, business logic, state management, and persistence
- **Views**: Manage DOM manipulation, user interface, and user interactions
- **Presenters**: Coordinate between models and views, handle application logic

### Key Design Patterns
- **Observer Pattern**: Event-driven communication between components
- **Singleton Pattern**: Centralized settings management
- **Module Pattern**: ES6 modules for code organization and encapsulation
- **Strategy Pattern**: Different behaviors for work/break sessions
- **State Pattern**: Timer state management (running, paused, stopped)

### Core Features Architecture
- **Centralized Settings**: Unified settings model with automatic localStorage persistence
- **Web Workers**: Background timer processing for consistent performance
- **Event-Driven Updates**: Reactive UI updates based on state changes
- **Modular Audio System**: Flexible music management with multiple format support
- **Responsive Design**: Mobile-first approach with progressive enhancement

## 📱 Browser Compatibility

### Desktop Browsers
- **Chrome**: 80+ (recommended for best performance)
- **Firefox**: 75+ (full feature support)
- **Safari**: 13+ (macOS compatibility)
- **Edge**: 80+ (Windows integration)

### Mobile Browsers
- **Mobile Safari**: iOS 13+ (iPhone/iPad support)
- **Chrome Mobile**: Android 8+ (Android compatibility)
- **Samsung Internet**: Latest versions
- **Firefox Mobile**: Latest versions

### Required Features
- ES6 Modules support
- Web Workers API
- localStorage API
- File API (for music uploads)
- CSS Custom Properties

## 🌟 Key Features Summary

✅ **Pomodoro Timer** - Customizable work/break intervals
✅ **Background Music** - Upload and play your own tracks
✅ **Visual Progress** - Smooth circular progress indicators
✅ **Session Tracking** - Daily and weekly productivity reports
✅ **Dark/Light Mode** - Automatic theme switching
✅ **Responsive Design** - Works on all devices
✅ **Offline Capable** - Functions without internet connection
✅ **Settings Persistence** - Your preferences are always saved

## 🙏 Acknowledgments

- **Pomodoro Technique**: Created by Francesco Cirillo
- **Howler.js**: Professional audio library by James Simpson
- **Vite**: Fast build tool for modern web development
- **Vercel**: Hosting platform for seamless deployment
- **Cloudflare**: DNS management and performance optimization

---

**🍅 Start your productive journey at [pomodoro.rayin.my.id](https://pomodoro.rayin.my.id) ✨**
