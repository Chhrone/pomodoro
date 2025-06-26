/**
 * MusicPlayerView - Handles music player UI (integrated into settings)
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class MusicPlayerView {
  constructor() {
    // DOM elements
    this.elements = {
      musicEnabled: null,
      musicVolume: null,
      volumeDisplay: null,
      musicTrack: null,
      loadMusicBtn: null,
      deleteTrackBtn: null,
      musicFileInput: null,
      nowPlaying: null,
      nowPlayingContent: null
    }
    
    // Event callbacks (set by presenter)
    this.callbacks = {}
    
    this.initializeElements()
    this.setupEventListeners()
  }
  
  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements.musicEnabled = document.getElementById('music-enabled')
    this.elements.musicVolume = document.getElementById('music-volume')
    this.elements.volumeDisplay = document.getElementById('volume-display')
    this.elements.musicTrack = document.getElementById('music-track')
    this.elements.loadMusicBtn = document.getElementById('load-music-btn')
    this.elements.deleteTrackBtn = document.getElementById('delete-track-btn')
    this.elements.musicFileInput = document.getElementById('music-file-input')
    this.elements.nowPlaying = document.getElementById('now-playing')
    this.elements.nowPlayingContent = document.getElementById('now-playing-content')
    this.elements.nowPlayingText1 = document.getElementById('now-playing-text-1')
    this.elements.nowPlayingText2 = document.getElementById('now-playing-text-2')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Music enabled checkbox
    if (this.elements.musicEnabled) {
      this.elements.musicEnabled.addEventListener('change', (e) => {
        this.callbacks.onMusicEnabledChange?.(e.target.checked)
      })
    }
    
    // Volume slider
    if (this.elements.musicVolume) {
      this.elements.musicVolume.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value)
        this.updateVolumeDisplay(volume)
        this.callbacks.onVolumeChange?.(volume)
      })
    }
    
    // Track selection
    if (this.elements.musicTrack) {
      this.elements.musicTrack.addEventListener('change', (e) => {
        const trackId = e.target.value
        if (trackId) {
          this.callbacks.onTrackSelected?.(trackId)
        }
        // Update delete button state
        this.setDeleteButtonEnabled(!!trackId)
      })
    }
    
    // Load music button
    if (this.elements.loadMusicBtn) {
      this.elements.loadMusicBtn.addEventListener('click', () => {
        this.openFileDialog()
      })
    }

    // Delete track button
    if (this.elements.deleteTrackBtn) {
      this.elements.deleteTrackBtn.addEventListener('click', () => {
        const selectedTrackId = this.elements.musicTrack?.value
        if (selectedTrackId) {
          this.callbacks.onTrackDelete?.(selectedTrackId)
        }
      })
    }
    
    // File input
    if (this.elements.musicFileInput) {
      this.elements.musicFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.callbacks.onFilesSelected?.(e.target.files)
        }
      })
    }
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  
  /**
   * Update music enabled state
   */
  updateMusicEnabled(enabled) {
    if (this.elements.musicEnabled) {
      this.elements.musicEnabled.checked = enabled
    }
    
    // Enable/disable other music controls
    this.setMusicControlsEnabled(enabled)
  }
  
  /**
   * Update volume display
   */
  updateVolumeDisplay(volume) {
    if (this.elements.volumeDisplay) {
      this.elements.volumeDisplay.textContent = `${volume}%`
    }
    
    if (this.elements.musicVolume) {
      this.elements.musicVolume.value = volume
    }
  }
  
  /**
   * Update tracks list
   */
  updateTracksList(tracks, currentTrackId) {
    if (!this.elements.musicTrack) return

    // Clear existing options
    this.elements.musicTrack.innerHTML = ''

    if (tracks.length === 0) {
      // No tracks available
      const option = document.createElement('option')
      option.value = ''
      option.textContent = 'No music files found'
      option.disabled = true
      this.elements.musicTrack.appendChild(option)
      this.elements.musicTrack.disabled = true
      this.setDeleteButtonEnabled(false)
    } else {
      // Add tracks
      tracks.forEach(track => {
        const option = document.createElement('option')
        option.value = track.id
        option.textContent = track.name

        if (track.id === currentTrackId) {
          option.selected = true
        }

        this.elements.musicTrack.appendChild(option)
      })

      this.elements.musicTrack.disabled = false
      this.setDeleteButtonEnabled(true)
    }
  }
  
  /**
   * Update current track display
   */
  updateCurrentTrack(track) {
    if (!this.elements.musicTrack || !track) return

    // Select the track in dropdown
    this.elements.musicTrack.value = track.id
  }

  /**
   * Update track selection (alias for updateCurrentTrack for compatibility)
   */
  updateTrackSelection(track) {
    this.updateCurrentTrack(track)
  }
  
  /**
   * Set loading state
   */
  setLoadingState(isLoading) {
    if (this.elements.loadMusicBtn) {
      this.elements.loadMusicBtn.disabled = isLoading
      this.elements.loadMusicBtn.textContent = isLoading ? 'Loading...' : 'Insert Music'
    }
  }
  
  /**
   * Set music controls enabled state
   */
  setMusicControlsEnabled(enabled) {
    const controls = [
      this.elements.musicVolume,
      this.elements.musicTrack,
      this.elements.loadMusicBtn
    ]

    controls.forEach(control => {
      if (control) {
        control.disabled = !enabled
      }
    })

    // Delete button should be enabled only if music is enabled and there are tracks
    if (this.elements.deleteTrackBtn) {
      const hasSelectedTrack = this.elements.musicTrack?.value && this.elements.musicTrack.value !== ''
      this.elements.deleteTrackBtn.disabled = !enabled || !hasSelectedTrack
    }

    // Update visual state
    const musicSection = this.elements.musicEnabled?.closest('.settings-section')
    if (musicSection) {
      if (enabled) {
        musicSection.classList.remove('disabled')
      } else {
        musicSection.classList.add('disabled')
      }
    }
  }

  /**
   * Set delete button enabled state
   */
  setDeleteButtonEnabled(enabled) {
    if (this.elements.deleteTrackBtn) {
      const musicEnabled = this.elements.musicEnabled?.checked || false
      const hasSelectedTrack = this.elements.musicTrack?.value && this.elements.musicTrack.value !== ''
      this.elements.deleteTrackBtn.disabled = !musicEnabled || !enabled || !hasSelectedTrack
    }
  }
  
  /**
   * Open file dialog for music selection
   */
  openFileDialog() {
    if (this.elements.musicFileInput) {
      this.elements.musicFileInput.click()
    }
  }
  
  /**
   * Clear file input
   */
  clearFileInput() {
    if (this.elements.musicFileInput) {
      this.elements.musicFileInput.value = ''
    }
  }
  
  /**
   * Show success message
   */
  showSuccess(message) {
    console.log('Music Success:', message)
    this.showNotification(message, 'success')
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Music Error:', message)
    this.showNotification(message, 'error')
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `music-notification ${type}`
    notification.textContent = message
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `

    document.body.appendChild(notification)

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 10)

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }
  
  /**
   * Get current UI state
   */
  getCurrentState() {
    return {
      enabled: this.elements.musicEnabled?.checked || false,
      volume: parseInt(this.elements.musicVolume?.value || '50'),
      selectedTrack: this.elements.musicTrack?.value || null
    }
  }
  
  /**
   * Update UI from state
   */
  updateFromState(state) {
    if (state.enabled !== undefined) {
      this.updateMusicEnabled(state.enabled)
    }
    
    if (state.volume !== undefined) {
      this.updateVolumeDisplay(state.volume)
    }
    
    if (state.tracks) {
      this.updateTracksList(state.tracks, state.currentTrackId)
    }

    if (state.currentTrack) {
      this.updateNowPlaying(state.currentTrack)
    }
  }

  /**
   * Update now playing display
   */
  updateNowPlaying(trackName) {
    if (!this.elements.nowPlaying || !this.elements.nowPlayingText1 || !this.elements.nowPlayingText2) return

    if (trackName && trackName !== 'No music selected') {
      const displayText = `Now Playing - ${trackName}`
      this.elements.nowPlayingText1.textContent = displayText
      this.elements.nowPlayingText2.textContent = displayText
      this.elements.nowPlaying.classList.remove('hidden')
    } else {
      this.elements.nowPlaying.classList.add('hidden')
    }
  }

  /**
   * Hide now playing display
   */
  hideNowPlaying() {
    if (this.elements.nowPlaying) {
      this.elements.nowPlaying.classList.add('hidden')
    }
  }
}
