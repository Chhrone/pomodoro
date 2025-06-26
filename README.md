# 🍅 Pomodoro Timer

A modern, feature-rich Pomodoro Timer application built with vanilla JavaScript following the MVP (Model-View-Presenter) architecture pattern. This application helps you boost productivity using the proven Pomodoro Technique with customizable settings, background music, and beautiful visual design.

## ✨ Features

### 🎯 Core Timer Functionality
- **Pomodoro Technique Implementation**: 25-minute focus sessions with 5-minute short breaks and 15-minute long breaks
- **Customizable Timer Settings**: Adjust work session, short break, and long break durations
- **Visual Progress Ring**: Circular progress indicator with different directions for focus (CCW) and break (CW) sessions
- **Session Tracking**: Track completed sessions and total focus time
- **Smart Break System**: Automatic break suggestions with bonus time for delayed breaks

### 🎵 Music Integration
- **Background Music Support**: Play ambient music during focus sessions using Howler.js
- **Multiple Audio Formats**: Support for MP3, WAV, OGG, and other web audio formats
- **Volume Control**: Adjustable volume with real-time slider
- **Now Playing Display**: Scrolling text showing current track with smooth animations
- **Auto-pause**: Music automatically stops during breaks and pauses

### 🎨 Customizable Appearance
- **Multiple Background Types**: Choose from gradient, solid color, or custom image backgrounds
- **Color Customization**: Dual color picker for gradient backgrounds
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, minimalist interface with smooth animations and transitions

### ⚙️ Advanced Settings
- **Persistent Settings**: All preferences saved to localStorage
- **Grace Period System**: 10-second grace period before break confirmation
- **Bonus Time Tracking**: Earn extra break time for delayed break starts
- **Keyboard Shortcuts**: ESC to close settings, space for start/pause (planned)
- **Click Outside Protection**: Smart click detection prevents accidental settings panel closure

### 🔧 Developer Features
- **MVP Architecture**: Clean separation of concerns with Model-View-Presenter pattern
- **Event-Driven Design**: Loose coupling between components using custom event system
- **Modular Structure**: Well-organized codebase with separate modules for each feature
- **Console Debugging**: Comprehensive logging for troubleshooting
- **No Framework Dependencies**: Pure vanilla JavaScript for maximum performance

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic markup with modern web standards
- **CSS3**: Advanced styling with CSS Grid, Flexbox, custom properties, and animations
- **Vanilla JavaScript (ES6+)**: Modern JavaScript features including modules, classes, and async/await
- **CSS Custom Properties**: Dynamic theming and color management
- **Web APIs**: localStorage for persistence, Web Audio API integration

### Audio
- **Howler.js**: Professional audio library for cross-browser audio support
- **Web Audio API**: Native browser audio capabilities
- **Multiple Format Support**: MP3, WAV, OGG, AAC, and more

### Architecture
- **MVP Pattern**: Model-View-Presenter for clean code organization
- **Event-Driven Architecture**: Custom event emitter for component communication
- **Module System**: ES6 modules for code organization and reusability
- **Observer Pattern**: Reactive updates between components

### Development Tools
- **Vite**: Fast build tool and development server
- **Modern Browser Support**: Chrome, Firefox, Safari, Edge
- **Mobile-First Design**: Responsive layout with progressive enhancement
- **Hot Module Replacement**: Instant updates during development

## 🚀 Getting Started

### Quick Start Guide

1. **First Launch**: The timer starts with default settings (25min work, 5min short break, 15min long break)
2. **Start Timer**: Click the "Start" button to begin your first focus session
3. **Customize Settings**: Click the gear icon to adjust timer durations, background, and music
4. **Add Music**: In settings, load your own audio files or use the default ambient track
5. **Track Progress**: Monitor completed sessions and total focus time in the stats section

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
│   │   ├── TimerModel.js   # Timer logic and state
│   │   ├── SettingsModel.js # Settings management
│   │   └── MusicModel.js   # Audio playback logic
│   ├── views/              # UI layer (MVP View)
│   │   ├── TimerView.js    # Timer display and controls
│   │   ├── SettingsView.js # Settings panel UI
│   │   ├── MusicPlayerView.js # Music controls UI
│   │   └── BreakConfirmationView.js # Break confirmation UI
│   ├── presenters/         # Logic layer (MVP Presenter)
│   │   ├── TimerPresenter.js # Timer coordination
│   │   ├── SettingsPresenter.js # Settings coordination
│   │   └── MusicPresenter.js # Music coordination
│   ├── utils/              # Utility functions
│   │   └── EventEmitter.js # Custom event system
│   ├── styles/             # CSS stylesheets
│   │   ├── variables.css   # CSS custom properties
│   │   ├── base.css        # Base styles and reset
│   │   ├── components.css  # Component styles
│   │   ├── settings.css    # Settings panel styles
│   │   ├── break-confirmation.css # Break confirmation styles
│   │   └── responsive.css  # Mobile responsiveness
│   ├── assets/             # Static assets
│   │   └── music/          # Default music files
│   └── app.js              # Application entry point
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

## 🔧 Development

### Architecture Overview
The application follows the MVP (Model-View-Presenter) pattern:

- **Models**: Handle data, business logic, and state management
- **Views**: Manage DOM manipulation and user interface
- **Presenters**: Coordinate between models and views, handle user interactions

### Key Design Patterns
- **Observer Pattern**: Event-driven communication between components
- **Module Pattern**: ES6 modules for code organization
- **Strategy Pattern**: Different behaviors for work/break sessions
- **State Pattern**: Timer state management (running, paused, stopped)

### Adding New Features
1. Create model for data/logic in `src/models/`
2. Create view for UI in `src/views/`
3. Create presenter to coordinate in `src/presenters/`
4. Add styles in appropriate CSS file
5. Import and initialize in `src/app.js`

### Debug Mode
Open browser Developer Tools (F12) and check the Console tab for detailed logging information about:
- Settings panel open/close events
- Timer state changes
- Music playback status
- Error messages and warnings

## 📱 Browser Support

- **Chrome**: 80+ (recommended)
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+
- **Mobile Safari**: iOS 13+
- **Chrome Mobile**: Android 8+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pomodoro Technique**: Created by Francesco Cirillo
- **Howler.js**: Audio library by James Simpson
- **Design Inspiration**: Modern productivity applications
- **Icons**: Custom SVG icons
- **Default Music**: Ambient soundscapes for focus

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Open an issue on GitHub
3. Check browser console for error messages
4. Ensure you're using a supported browser version

---

**Happy focusing! 🍅✨**
