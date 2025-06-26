/**
 * MusicModel - Manages music playback using Howler.js
 * Follows MVP pattern - no direct DOM interaction
 */
import { Howl, Howler } from 'howler'

export class MusicModel {
  constructor() {
    // Music configuration
    this.config = {
      enabled: true,
      volume: 1.0, // 0.0 to 1.0 (100% default)
      currentTrack: null,
      autoPlay: true
    }
    
    // Music state
    this.state = {
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      duration: 0,
      tracks: [], // Array of track objects
      currentTrackIndex: -1,
      isLoading: false,
      error: null
    }
    
    // Howler instance
    this.howl = null
    
    // Event listeners
    this.listeners = {}
    
    // Initialize Howler global settings
    this.initializeHowler()
  }
  
  /**
   * Initialize Howler global settings
   */
  initializeHowler() {
    // Set global volume
    Howler.volume(this.config.volume)
    
    // Handle mobile unlock
    Howler.autoUnlock = true
  }
  
  /**
   * Event system for MVP communication
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }
  
  /**
   * Emit event to listeners
   */
  emit(event, data = null) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data))
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config }
  }
  
  /**
   * Get current state
   */
  getState() {
    return { ...this.state }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Update Howler global volume
    if (newConfig.volume !== undefined) {
      Howler.volume(newConfig.volume)
      
      // Update current howl volume if playing
      if (this.howl) {
        this.howl.volume(newConfig.volume)
      }
    }
    
    this.emit('configUpdated', this.config)
  }
  
  /**
   * Load default music from assets
   */
  loadDefaultMusic() {
    const defaultTracks = [
      {
        id: 'default_skyrim',
        name: 'Skyrim Ambience - Study & Relaxation Music',
        url: '/src/assets/music/Skyrim%20Ambience%20-%20Study%20&%20Relaxation%20Music.mp3',
        format: 'mp3',
        isDefault: true
      }
    ]

    this.state.tracks = defaultTracks

    // Set first track as current
    if (defaultTracks.length > 0) {
      this.state.currentTrackIndex = 0
      this.config.currentTrack = defaultTracks[0].id
    }

    this.emit('tracksLoaded', {
      tracks: this.state.tracks,
      currentTrack: this.getCurrentTrack()
    })

    return defaultTracks
  }

  /**
   * Load music files from file input
   */
  loadMusicFiles(files) {
    const tracks = []

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('audio/')) {
        const track = {
          id: `track_${Date.now()}_${index}`,
          name: this.extractTrackName(file.name),
          file: file,
          url: URL.createObjectURL(file),
          size: file.size,
          duration: null, // Will be set when loaded
          format: this.getAudioFormat(file.name, file.type) // Add format detection
        }
        tracks.push(track)
      }
    })

    this.state.tracks = tracks

    // Set first track as current if none selected
    if (tracks.length > 0 && this.state.currentTrackIndex === -1) {
      this.state.currentTrackIndex = 0
      this.config.currentTrack = tracks[0].id
    }

    this.emit('tracksLoaded', {
      tracks: this.state.tracks,
      currentTrack: this.getCurrentTrack()
    })

    return tracks
  }

  /**
   * Get audio format from filename and MIME type
   */
  getAudioFormat(filename, mimeType) {
    // Extract extension from filename
    const extension = filename.toLowerCase().split('.').pop()

    // Map extensions to formats Howler.js understands
    const formatMap = {
      'mp3': 'mp3',
      'wav': 'wav',
      'ogg': 'ogg',
      'oga': 'ogg',
      'flac': 'flac',
      'm4a': 'mp4',
      'mp4': 'mp4',
      'aac': 'aac',
      'webm': 'webm'
    }

    // Try to get format from extension first
    if (extension && formatMap[extension]) {
      return formatMap[extension]
    }

    // Fallback to MIME type
    if (mimeType) {
      if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3'
      if (mimeType.includes('wav')) return 'wav'
      if (mimeType.includes('ogg')) return 'ogg'
      if (mimeType.includes('flac')) return 'flac'
      if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'mp4'
      if (mimeType.includes('aac')) return 'aac'
      if (mimeType.includes('webm')) return 'webm'
    }

    // Default fallback
    return 'mp3'
  }
  
  /**
   * Extract track name from filename
   */
  extractTrackName(filename) {
    return filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ')
  }
  
  /**
   * Get current track
   */
  getCurrentTrack() {
    if (this.state.currentTrackIndex >= 0 && this.state.currentTrackIndex < this.state.tracks.length) {
      return this.state.tracks[this.state.currentTrackIndex]
    }
    return null
  }
  
  /**
   * Select track by ID
   */
  selectTrack(trackId) {
    const trackIndex = this.state.tracks.findIndex(track => track.id === trackId)
    
    if (trackIndex >= 0) {
      this.state.currentTrackIndex = trackIndex
      this.config.currentTrack = trackId
      
      const track = this.state.tracks[trackIndex]
      
      // Stop current playback
      this.stop()
      
      this.emit('trackSelected', { track })
      return track
    }
    
    return null
  }
  
  /**
   * Clear all tracks
   */
  clearTracks() {
    // Stop current playback
    this.stop()
    
    // Clean up URLs
    this.state.tracks.forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url)
      }
    })
    
    // Reset state
    this.state.tracks = []
    this.state.currentTrackIndex = -1
    this.config.currentTrack = null
    
    this.emit('tracksCleared')
  }
  
  /**
   * Check if can play music
   */
  canPlay() {
    return this.config.enabled && 
           this.state.tracks.length > 0 && 
           this.state.currentTrackIndex >= 0
  }
  
  /**
   * Play current track
   */
  play() {
    if (!this.config.enabled) {
      this.emit('error', { error: 'Music is disabled' })
      return false
    }
    
    const currentTrack = this.getCurrentTrack()
    if (!currentTrack) {
      this.emit('error', { error: 'No track selected' })
      return false
    }
    
    // Stop current howl if exists
    if (this.howl) {
      this.howl.stop()
      this.howl.unload()
    }
    
    // Create new Howl instance with format specification
    const howlConfig = {
      src: [currentTrack.url],
      loop: true,
      volume: this.config.volume,
      html5: true, // Force HTML5 Audio for better file support
      preload: true, // Preload the audio
      onload: () => {
        this.state.duration = this.howl.duration()
        this.state.isLoading = false
        this.emit('metadataLoaded', {
          duration: this.state.duration
        })
      },
      onplay: () => {
        this.state.isPlaying = true
        this.state.isPaused = false
        this.emit('playStarted')
      },
      onpause: () => {
        this.state.isPlaying = false
        this.state.isPaused = true
        this.emit('playPaused')
      },
      onstop: () => {
        this.state.isPlaying = false
        this.state.isPaused = false
        this.state.currentTime = 0
        this.emit('playStopped')
      },
      onend: () => {
        this.state.isPlaying = false
        this.state.isPaused = false
        this.emit('trackEnded')
      },
      onloaderror: (_, error) => {
        this.state.error = 'Failed to load audio file'
        this.state.isLoading = false
        console.error('Howler load error:', error)
        this.emit('error', {
          error: this.state.error,
          details: error
        })
      },
      onplayerror: (_, error) => {
        this.state.error = 'Failed to start playback'
        console.error('Howler play error:', error)
        this.emit('error', {
          error: this.state.error,
          details: error
        })
      }
    }

    // Add format if available
    if (currentTrack.format) {
      howlConfig.format = [currentTrack.format]
    }

    this.howl = new Howl(howlConfig)
    
    // Start loading
    this.state.isLoading = true
    this.emit('loadingStarted')
    
    // Play the sound
    this.howl.play()
    
    return true
  }
  
  /**
   * Pause current track
   */
  pause() {
    if (!this.howl || !this.state.isPlaying) {
      return false
    }
    
    this.howl.pause()
    return true
  }
  
  /**
   * Resume current track
   */
  resume() {
    if (!this.howl || !this.state.isPaused) {
      return false
    }
    
    this.howl.play()
    return true
  }
  
  /**
   * Stop current track
   */
  stop() {
    if (!this.howl) {
      return false
    }

    this.howl.stop()
    this.state.currentTime = 0

    return true
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.config.volume = Math.max(0, Math.min(1, volume))

    // Update Howler global volume
    Howler.volume(this.config.volume)

    // Update current howl volume
    if (this.howl) {
      this.howl.volume(this.config.volume)
    }

    this.emit('volumeChanged', { volume: this.config.volume })
  }

  /**
   * Toggle music enabled state
   */
  toggleEnabled() {
    this.config.enabled = !this.config.enabled

    if (!this.config.enabled && this.state.isPlaying) {
      this.stop()
    }

    this.emit('configUpdated', this.config)
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.howl) {
      this.howl.stop()
      this.howl.unload()
    }

    this.clearTracks()
    this.listeners = {}
  }
}
