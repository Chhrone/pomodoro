/**
 * MusicModel - Manages music playback using Howler.js
 * Follows MVP pattern - no direct DOM interaction
 */
import { Howl, Howler } from 'howler'
import { MusicStorage } from '../utils/MusicStorage.js'

export class MusicModel {
  constructor() {
    // Music configuration
    this.config = {
      enabled: true,
      volume: 1.0, // 0.0 to 1.0 (100% default)
      currentTrack: null,
      autoPlay: true,
      playbackMode: 'loop' // 'loop' or 'list'
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

    // Music storage for user files
    this.musicStorage = new MusicStorage()

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
   * Load music tracks from manifest and user storage
   */
  async loadMusicTracks() {
    try {
      // Load default tracks from manifest
      const defaultTracks = await this.loadDefaultTracks()

      // Load user tracks from storage (now async)
      const userTracks = await this.loadUserTracks()

      // Combine all tracks
      this.state.tracks = [...defaultTracks, ...userTracks]

      // Set first track as current if none selected
      if (this.state.tracks.length > 0 && this.state.currentTrackIndex === -1) {
        this.state.currentTrackIndex = 0
        this.config.currentTrack = this.state.tracks[0].id
      }

      this.emit('tracksLoaded', {
        tracks: this.state.tracks,
        currentTrack: this.getCurrentTrack()
      })

      return this.state.tracks
    } catch (error) {
      console.error('Failed to load music tracks:', error)
      this.emit('error', { error: 'Failed to load music tracks' })
      return []
    }
  }

  /**
   * Load default tracks from assets folder
   */
  async loadDefaultTracks() {
    const defaultTracks = []

    // In deployment, there might be no default music files
    // This is expected behavior - users will add their own music

    try {
      // Import music files directly using Vite's import system with eager loading
      const musicModules = import.meta.glob('/src/assets/music/*.mp3', {
        eager: true,
        query: '?url',
        import: 'default'
      })

      const moduleEntries = Object.entries(musicModules)

      if (moduleEntries.length === 0) {
        console.info('No default music files found in assets/music folder. This is normal for deployment - users can add their own music.')
        return defaultTracks
      }

      for (const [path, url] of moduleEntries) {
        try {
          const filename = path.split('/').pop()
          const trackName = filename.replace('.mp3', '').replace(/[_-]/g, ' ')

          defaultTracks.push({
            id: `default_${filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
            name: trackName,
            url: url,
            format: 'mp3',
            isDefault: true,
            filename: filename
          })
          console.log(`Loaded default music file: ${filename}`)
        } catch (error) {
          console.warn(`Failed to load music file from ${path}:`, error)
        }
      }

      console.log(`Loaded ${defaultTracks.length} default music tracks`)
    } catch (error) {
      console.info('No default music tracks available. Users can add their own music files.')
    }

    return defaultTracks
  }

  /**
   * Load user tracks from storage (IndexedDB + localStorage metadata)
   */
  async loadUserTracks() {
    try {
      // First try to load from IndexedDB if available
      if (MusicStorage.isSupported()) {
        await this.musicStorage.init()
        const storedFiles = await this.musicStorage.getAllFiles()

        if (storedFiles.length > 0) {
          console.log(`Loaded ${storedFiles.length} user tracks from IndexedDB`)
          return storedFiles.map(file => ({
            id: file.id,
            name: file.metadata.name,
            url: file.data, // base64 data from IndexedDB
            size: file.metadata.size,
            format: file.metadata.format,
            isDefault: false,
            addedDate: file.metadata.addedDate
          }))
        }
      }

      // Fallback to localStorage metadata (without file data)
      const stored = localStorage.getItem('pomodoro_user_music')
      if (!stored) return []

      const userTracks = JSON.parse(stored)
      console.log(`Loaded ${userTracks.length} user track metadata from localStorage`)

      // Return tracks without URLs (they'll need to be re-uploaded)
      return userTracks.map(track => ({
        ...track,
        isDefault: false,
        needsReupload: !track.url // Flag tracks that need re-upload
      }))
    } catch (error) {
      console.warn('Failed to load user tracks from storage:', error)
      return []
    }
  }

  /**
   * Save user tracks to localStorage (metadata only, not file data)
   */
  saveUserTracks() {
    try {
      const userTracks = this.state.tracks.filter(track => !track.isDefault)

      // Only save metadata, not the actual file data to avoid quota issues
      const trackMetadata = userTracks.map(track => ({
        id: track.id,
        name: track.name,
        size: track.size,
        format: track.format,
        isDefault: false,
        addedDate: track.addedDate,
        // Don't save the URL (base64 data) to localStorage
        hasFile: true
      }))

      localStorage.setItem('pomodoro_user_music', JSON.stringify(trackMetadata))
      console.log(`Saved metadata for ${trackMetadata.length} user tracks to localStorage`)
    } catch (error) {
      console.error('Failed to save user tracks:', error)

      // If still failing, try to save just the essential data
      try {
        const userTracks = this.state.tracks.filter(track => !track.isDefault)
        const essentialData = userTracks.map(track => ({
          id: track.id,
          name: track.name,
          isDefault: false
        }))
        localStorage.setItem('pomodoro_user_music', JSON.stringify(essentialData))
        console.log('Saved essential track data as fallback')
      } catch (fallbackError) {
        console.error('Failed to save even essential track data:', fallbackError)
        // Clear the storage to prevent corruption
        localStorage.removeItem('pomodoro_user_music')
      }
    }
  }

  /**
   * Load music files from file input and add to existing tracks
   */
  async loadMusicFiles(files) {
    const newTracks = []
    let useIndexedDB = MusicStorage.isSupported()

    // Initialize storage if using IndexedDB
    if (useIndexedDB) {
      try {
        await this.musicStorage.init()
      } catch (error) {
        console.warn('Failed to initialize IndexedDB, falling back to localStorage:', error)
        useIndexedDB = false
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith('audio/')) {
        try {
          const trackId = `user_track_${Date.now()}_${i}`
          const base64Data = await this.fileToBase64(file)

          const metadata = {
            name: this.extractTrackName(file.name),
            size: file.size,
            format: this.getAudioFormat(file.name, file.type),
            addedDate: new Date().toISOString()
          }

          const track = {
            id: trackId,
            name: metadata.name,
            url: base64Data,
            size: metadata.size,
            duration: null,
            format: metadata.format,
            isDefault: false,
            addedDate: metadata.addedDate
          }

          // Store in IndexedDB if available
          if (useIndexedDB) {
            try {
              await this.musicStorage.storeFile(trackId, base64Data, metadata)
              console.log(`Stored ${file.name} in IndexedDB`)
            } catch (error) {
              console.warn(`Failed to store ${file.name} in IndexedDB:`, error)
              // Continue with the track anyway, it will be in memory
            }
          }

          newTracks.push(track)
        } catch (error) {
          console.error('Failed to process file:', file.name, error)
        }
      }
    }

    // Add new tracks to existing tracks
    this.state.tracks = [...this.state.tracks, ...newTracks]

    // Save user tracks metadata to localStorage (not the file data)
    this.saveUserTracks()

    // Set first track as current if none selected
    if (this.state.tracks.length > 0 && this.state.currentTrackIndex === -1) {
      this.state.currentTrackIndex = 0
      this.config.currentTrack = this.state.tracks[0].id
    }

    this.emit('tracksLoaded', {
      tracks: this.state.tracks,
      currentTrack: this.getCurrentTrack()
    })

    return newTracks
  }

  /**
   * Convert file to base64 for storage
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Clear all user tracks
   */
  clearUserTracks() {
    this.state.tracks = this.state.tracks.filter(track => track.isDefault)
    this.saveUserTracks()

    // Reset current track if it was a user track
    if (this.state.currentTrackIndex >= 0) {
      const currentTrack = this.getCurrentTrack()
      if (currentTrack && !currentTrack.isDefault) {
        this.state.currentTrackIndex = this.state.tracks.length > 0 ? 0 : -1
        this.config.currentTrack = this.state.tracks.length > 0 ? this.state.tracks[0].id : null
      }
    }

    this.emit('tracksLoaded', {
      tracks: this.state.tracks,
      currentTrack: this.getCurrentTrack()
    })
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
   * Get track by ID
   */
  getTrackById(trackId) {
    return this.state.tracks.find(track => track.id === trackId)
  }
  
  /**
   * Select track by ID
   */
  selectTrack(trackId, autoPlay = false) {
    const trackIndex = this.state.tracks.findIndex(track => track.id === trackId)

    if (trackIndex >= 0) {
      const previousTrackId = this.config.currentTrack
      const wasPlaying = this.state.isPlaying

      this.state.currentTrackIndex = trackIndex
      this.config.currentTrack = trackId

      const track = this.state.tracks[trackIndex]

      // Stop current playback if track changed
      if (previousTrackId !== trackId) {
        this.stop()

        // If music was playing and track changed, start playing new track
        if (wasPlaying || autoPlay) {
          setTimeout(() => {
            this.play()
          }, 100) // Small delay to ensure clean transition
        }
      }

      this.emit('trackSelected', {
        track,
        wasPlaying,
        autoSwitched: wasPlaying && previousTrackId !== trackId
      })
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
   * Delete track by ID
   */
  deleteTrack(trackId) {
    try {
      const trackIndex = this.state.tracks.findIndex(track => track.id === trackId)
      if (trackIndex === -1) {
        return false
      }

      const track = this.state.tracks[trackIndex]
      const wasCurrentTrack = this.state.currentTrackIndex === trackIndex

      // Stop playback if deleting current track
      if (wasCurrentTrack && this.state.isPlaying) {
        this.stop()
      }

      // Remove track from array
      this.state.tracks.splice(trackIndex, 1)

      // Update current track index if needed
      if (this.state.currentTrackIndex > trackIndex) {
        this.state.currentTrackIndex--
      } else if (this.state.currentTrackIndex === trackIndex) {
        // Current track was deleted, select next available track
        if (this.state.tracks.length > 0) {
          if (trackIndex >= this.state.tracks.length) {
            this.state.currentTrackIndex = this.state.tracks.length - 1
          }
          // else keep same index (which now points to next track)
          this.config.currentTrack = this.state.tracks[this.state.currentTrackIndex]?.id || null
        } else {
          this.state.currentTrackIndex = -1
          this.config.currentTrack = null
        }
      }

      // Remove from user tracks in localStorage if it's a user track
      if (track.isUserTrack) {
        const userTracks = this.loadUserTracks()
        const updatedUserTracks = userTracks.filter(userTrack => userTrack.id !== trackId)
        localStorage.setItem('userMusicTracks', JSON.stringify(updatedUserTracks))
      }

      // Clean up URL if it's a blob URL
      if (track.url && track.url.startsWith('blob:')) {
        URL.revokeObjectURL(track.url)
      }

      // Emit tracks updated event
      this.emit('tracksLoaded', {
        tracks: this.state.tracks,
        currentTrack: this.getCurrentTrack()
      })

      return true
    } catch (error) {
      console.error('Error deleting track:', error)
      return false
    }
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
      loop: this.config.playbackMode === 'loop',
      volume: this.config.volume,
      html5: true, // Force HTML5 Audio for better file support
      preload: true, // Preload the audio
      xhr: {
        method: 'GET',
        headers: {
          'Accept': 'audio/*'
        }
      },
      onload: () => {
        this.state.duration = this.howl.duration()
        this.state.isLoading = false
        console.log(`Successfully loaded: ${currentTrack.name}`)
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

        // Auto-advance to next track in list mode
        if (this.config.playbackMode === 'list') {
          this.nextTrack()
        }
      },
      onloaderror: (_, error) => {
        this.state.error = `Failed to load audio file: ${currentTrack.name}`
        this.state.isLoading = false
        console.error('Howler load error for track:', currentTrack.name, error)
        console.error('Track URL:', currentTrack.url)
        this.emit('error', {
          error: this.state.error,
          details: error,
          track: currentTrack
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
   * Set playback mode
   */
  setPlaybackMode(mode) {
    if (mode === 'loop' || mode === 'list') {
      this.config.playbackMode = mode

      // Update current howl loop setting
      if (this.howl) {
        this.howl.loop(mode === 'loop')
      }

      this.emit('playbackModeChanged', { mode })
    }
  }

  /**
   * Toggle playback mode
   */
  togglePlaybackMode() {
    const newMode = this.config.playbackMode === 'loop' ? 'list' : 'loop'
    this.setPlaybackMode(newMode)
    return newMode
  }

  /**
   * Go to next track
   */
  nextTrack() {
    if (this.state.tracks.length === 0) return false

    const wasPlaying = this.state.isPlaying
    const currentIndex = this.state.currentTrackIndex
    let nextIndex = currentIndex + 1

    // Handle end of list based on playback mode
    if (nextIndex >= this.state.tracks.length) {
      if (this.config.playbackMode === 'list') {
        nextIndex = 0 // Loop back to first track
      } else {
        return false // Don't advance in loop mode
      }
    }

    this.state.currentTrackIndex = nextIndex
    this.config.currentTrack = this.state.tracks[nextIndex].id

    this.emit('trackSelected', {
      track: this.getCurrentTrack(),
      index: nextIndex
    })

    // Continue playing if was playing
    if (wasPlaying) {
      this.play()
    }

    return true
  }

  /**
   * Go to previous track
   */
  previousTrack() {
    if (this.state.tracks.length === 0) return false

    const wasPlaying = this.state.isPlaying
    const currentIndex = this.state.currentTrackIndex
    let prevIndex = currentIndex - 1

    // Handle beginning of list based on playback mode
    if (prevIndex < 0) {
      if (this.config.playbackMode === 'list') {
        prevIndex = this.state.tracks.length - 1 // Loop to last track
      } else {
        return false // Don't go back in loop mode
      }
    }

    this.state.currentTrackIndex = prevIndex
    this.config.currentTrack = this.state.tracks[prevIndex].id

    this.emit('trackSelected', {
      track: this.getCurrentTrack(),
      index: prevIndex
    })

    // Continue playing if was playing
    if (wasPlaying) {
      this.play()
    }

    return true
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
