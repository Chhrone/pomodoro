/**
 * Notification Manager
 * Handles browser notifications and audio alerts for session completion
 */

export class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.audioContext = null
    this.notificationSounds = {
      sessionComplete: null,
      breakStart: null,
      workStart: null
    }
    
    this.init()
  }

  async init() {
    // Check notification permission
    if ('Notification' in window) {
      this.permission = Notification.permission
    }

    // Initialize audio context for notification sounds
    this.initAudioContext()
    
    // Load notification sounds
    await this.loadNotificationSounds()
  }

  initAudioContext() {
    try {
      // Create audio context for notification sounds
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.warn('Audio context not supported:', error)
    }
  }

  async loadNotificationSounds() {
    try {
      // Create simple notification sounds using Web Audio API
      this.notificationSounds = {
        sessionComplete: this.createNotificationTone(800, 0.3, 'sine'), // High tone
        breakStart: this.createNotificationTone(400, 0.3, 'sine'),      // Medium tone  
        workStart: this.createNotificationTone(600, 0.3, 'sine')        // Medium-high tone
      }
    } catch (error) {
      console.warn('Failed to create notification sounds:', error)
    }
  }

  createNotificationTone(frequency, duration, waveType = 'sine') {
    if (!this.audioContext) return null

    return () => {
      try {
        const oscillator = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
        oscillator.type = waveType
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)
        
        oscillator.start(this.audioContext.currentTime)
        oscillator.stop(this.audioContext.currentTime + duration)
      } catch (error) {
        console.warn('Failed to play notification sound:', error)
      }
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  async showNotification(title, options = {}) {
    // Ensure we have permission
    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      console.warn('Cannot show notification: permission not granted')
      return null
    }

    try {
      const defaultOptions = {
        icon: '/src/assets/pomodoro-icon.png',
        badge: '/src/assets/pomodoro-icon.png',
        tag: 'pomodoro-timer',
        requireInteraction: false,
        silent: false
      }

      const notification = new Notification(title, { ...defaultOptions, ...options })
      
      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    } catch (error) {
      console.error('Failed to show notification:', error)
      return null
    }
  }

  playNotificationSound(soundType = 'sessionComplete') {
    if (!this.audioContext) {
      console.warn('Audio context not available')
      return
    }

    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }

    const soundFunction = this.notificationSounds[soundType]
    if (soundFunction) {
      soundFunction()
    } else {
      console.warn('Unknown notification sound type:', soundType)
    }
  }

  // Specific notification methods for different session events
  async notifySessionComplete(sessionType, nextSessionType = null) {
    let title, body, soundType

    switch (sessionType) {
      case 'work':
        title = '🎉 Sesi Fokus Selesai!'
        body = nextSessionType === 'shortBreak' 
          ? 'Saatnya istirahat sebentar. Timer break akan dimulai otomatis.'
          : 'Saatnya istirahat panjang! Klik untuk memulai break.'
        soundType = 'sessionComplete'
        break
      case 'shortBreak':
        title = '⚡ Break Selesai!'
        body = 'Siap untuk sesi fokus berikutnya? Mari kembali bekerja!'
        soundType = 'workStart'
        break
      case 'longBreak':
        title = '🌟 Long Break Selesai!'
        body = 'Istirahat panjang selesai. Siap untuk sesi fokus yang produktif!'
        soundType = 'workStart'
        break
      default:
        title = 'Timer Selesai'
        body = 'Sesi timer telah berakhir.'
        soundType = 'sessionComplete'
    }

    // Play notification sound
    this.playNotificationSound(soundType)

    // Show browser notification
    return await this.showNotification(title, {
      body,
      icon: '/src/assets/pomodoro-icon.png'
    })
  }

  async notifyBreakStart(breakType, duration) {
    const title = breakType === 'shortBreak' 
      ? '☕ Short Break Dimulai!' 
      : '🛋️ Long Break Dimulai!'
    
    const body = `Istirahat ${duration} menit telah dimulai. Nikmati waktu istirahat Anda!`

    // Play break start sound
    this.playNotificationSound('breakStart')

    // Show browser notification
    return await this.showNotification(title, {
      body,
      icon: '/src/assets/pomodoro-icon.png'
    })
  }

  async notifyWorkStart(sessionNumber) {
    const title = '🎯 Sesi Fokus Dimulai!'
    const body = `Sesi fokus #${sessionNumber} telah dimulai. Tetap fokus dan produktif!`

    // Play work start sound
    this.playNotificationSound('workStart')

    // Show browser notification
    return await this.showNotification(title, {
      body,
      icon: '/src/assets/pomodoro-icon.png'
    })
  }

  // Check if notifications are supported and enabled
  isSupported() {
    return 'Notification' in window
  }

  isEnabled() {
    return this.permission === 'granted'
  }

  // Get current permission status
  getPermissionStatus() {
    return this.permission
  }

  // Cleanup method
  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.notificationSounds = {}
  }
}
