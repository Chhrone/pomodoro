/**
 * MusicPresenter - Coordinates between MusicModel and MusicPlayerView
 * Follows MVP pattern - handles business logic and coordination
 */
import { MusicModel } from '../models/MusicModel.js'
import { MusicPlayerView } from '../views/MusicPlayerView.js'

export class MusicPresenter {
  constructor() {
    this.model = new MusicModel()
    this.view = new MusicPlayerView()
    
    // Setup model event listeners
    this.setupModelListeners()
    
    // Setup view callbacks
    this.setupViewCallbacks()
    
    // Initialize UI from model state
    this.initializeUI()

    // Load music tracks
    this.loadMusicTracks()
  }
  
  /**
   * Setup model event listeners
   */
  setupModelListeners() {
    this.model.on('configUpdated', (config) => {
      this.view.updateMusicEnabled(config.enabled)
      this.view.updateVolumeDisplay(Math.round(config.volume * 100))
    })
    
    this.model.on('tracksLoaded', (data) => {
      this.view.updateTracksList(data.tracks, data.currentTrack?.id)
      this.view.clearFileInput()
      this.view.setLoadingState(false)

      if (data.tracks.length > 0) {
        this.view.showSuccess(`Loaded ${data.tracks.length} music file(s)`)
        // Don't show now playing until timer starts
      }
    })
    
    this.model.on('trackSelected', (data) => {
      this.view.updateCurrentTrack(data.track)
      // Don't show now playing until timer starts
    })
    
    this.model.on('tracksCleared', () => {
      this.view.updateTracksList([], null)
      this.view.hideNowPlaying()
    })
    
    this.model.on('loadingStarted', () => {
      this.view.setLoadingState(true)
    })
    
    this.model.on('metadataLoaded', (data) => {
      this.view.setLoadingState(false)
    })
    
    this.model.on('playStarted', () => {
      // Music started playing
      console.log('Music playback started')
    })
    
    this.model.on('playPaused', () => {
      // Music paused
      console.log('Music playback paused')
    })
    
    this.model.on('playStopped', () => {
      // Music stopped
      console.log('Music playback stopped')
    })
    
    this.model.on('trackEnded', () => {
      // Track ended (shouldn't happen with loop enabled)
      console.log('Music track ended')
    })
    
    this.model.on('volumeChanged', (data) => {
      this.view.updateVolumeDisplay(Math.round(data.volume * 100))
    })
    
    this.model.on('error', (data) => {
      this.view.showError(data.error)
      this.view.setLoadingState(false)
      console.error('Music Error:', data.error, data.details)
    })
  }
  
  /**
   * Setup view callbacks
   */
  setupViewCallbacks() {
    this.view.setCallbacks({
      onMusicEnabledChange: (enabled) => {
        this.model.updateConfig({ enabled })
        
        if (!enabled && this.model.getState().isPlaying) {
          this.model.stop()
        }
      },
      
      onVolumeChange: (volumePercent) => {
        const volume = volumePercent / 100 // Convert to 0.0-1.0 range
        this.model.setVolume(volume)
      },
      
      onTrackSelect: (trackId) => {
        if (trackId) {
          this.model.selectTrack(trackId)
        }
      },
      
      onFilesSelected: (files) => {
        this.handleFilesSelected(files)
      },

      onTrackSelected: (trackId) => {
        this.handleTrackSelection(trackId)
      },

      onTrackDelete: (trackId) => {
        this.handleTrackDeletion(trackId)
      }
    })
  }
  
  /**
   * Initialize UI from model state
   */
  initializeUI() {
    const config = this.model.getConfig()
    const state = this.model.getState()
    
    this.view.updateMusicEnabled(config.enabled)
    this.view.updateVolumeDisplay(Math.round(config.volume * 100))
    this.view.updateTracksList(state.tracks, config.currentTrack)
  }
  
  /**
   * Handle file selection
   */
  handleFilesSelected(files) {
    if (!files || files.length === 0) {
      this.view.showError('No files selected')
      return
    }

    // Filter audio files
    const audioFiles = Array.from(files).filter(file =>
      file.type.startsWith('audio/')
    )

    if (audioFiles.length === 0) {
      this.view.showError('No audio files found. Please select MP3, WAV, or other audio files.')
      return
    }

    // Load the files
    try {
      this.model.loadMusicFiles(audioFiles)
    } catch (error) {
      console.error('MusicPresenter: Error loading music files:', error)
      this.view.showError('Failed to load music files: ' + error.message)
    }
  }

  /**
   * Handle track selection from dropdown
   */
  handleTrackSelection(trackId) {
    try {
      // Check if music is currently playing to determine auto-switch
      const wasPlaying = this.model.state.isPlaying
      const track = this.model.selectTrack(trackId, false) // Don't auto-play, let the model decide

      if (track) {
        this.view.updateTrackSelection(track)

        // Show feedback if track was auto-switched
        if (wasPlaying && track) {
          this.view.showSuccess(`Switched to: ${track.name}`)
        }
      }
    } catch (error) {
      console.error('MusicPresenter: Error selecting track:', error)
      this.view.showError('Failed to select track')
    }
  }

  /**
   * Handle track deletion
   */
  handleTrackDeletion(trackId) {
    try {
      const track = this.model.getTrackById(trackId)
      if (!track) {
        this.view.showError('Track not found')
        return
      }

      // Confirm deletion
      const confirmDelete = confirm(`Are you sure you want to delete "${track.name}"?`)
      if (!confirmDelete) {
        return
      }

      // Delete the track
      const success = this.model.deleteTrack(trackId)
      if (success) {
        this.view.showSuccess(`Deleted: ${track.name}`)
      } else {
        this.view.showError('Failed to delete track')
      }
    } catch (error) {
      console.error('MusicPresenter: Error deleting track:', error)
      this.view.showError('Failed to delete track')
    }
  }

  /**
   * Start music playback (called by timer)
   */
  startMusic() {
    if (!this.model.canPlay()) {
      return false
    }
    
    return this.model.play()
  }
  
  /**
   * Stop music playback (called by timer)
   */
  stopMusic() {
    return this.model.stop()
  }
  
  /**
   * Pause music playback (called by timer)
   */
  pauseMusic() {
    return this.model.pause()
  }
  
  /**
   * Resume music playback (called by timer)
   */
  resumeMusic() {
    return this.model.resume()
  }
  
  /**
   * Check if music is currently playing
   */
  isPlaying() {
    return this.model.getState().isPlaying
  }
  
  /**
   * Check if music is enabled
   */
  isEnabled() {
    return this.model.getConfig().enabled
  }
  
  /**
   * Get current music configuration
   */
  getConfig() {
    return this.model.getConfig()
  }
  
  /**
   * Get current music state
   */
  getState() {
    return this.model.getState()
  }
  
  /**
   * Update music configuration
   */
  updateConfig(config) {
    this.model.updateConfig(config)
  }
  
  /**
   * Clear all loaded tracks
   */
  clearTracks() {
    this.model.clearTracks()
  }
  
  /**
   * Load music tracks from assets and storage
   */
  async loadMusicTracks() {
    try {
      await this.model.loadMusicTracks()
    } catch (error) {
      console.error('MusicPresenter: Error loading music tracks:', error)
      this.view.showError('Failed to load music tracks')
    }
  }

  /**
   * Clear all user tracks
   */
  clearUserTracks() {
    try {
      this.model.clearUserTracks()
      this.view.showSuccess('User music tracks cleared')
    } catch (error) {
      console.error('MusicPresenter: Error clearing user tracks:', error)
      this.view.showError('Failed to clear user tracks')
    }
  }

  /**
   * Show now playing with current track
   */
  showNowPlaying() {
    const currentTrack = this.model.getCurrentTrack()
    if (currentTrack) {
      this.view.updateNowPlaying(currentTrack.name)
    }
  }

  /**
   * Hide now playing
   */
  hideNowPlaying() {
    this.view.hideNowPlaying()
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.model.destroy()
  }
}
