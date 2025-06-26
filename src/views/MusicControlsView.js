/**
 * MusicControlsView - Handles music control UI (floating controls)
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class MusicControlsView {
  constructor() {
    // DOM elements
    this.elements = {
      container: null,
      playPauseBtn: null,
      playIcon: null,
      pauseIcon: null,
      prevBtn: null,
      nextBtn: null,
      modeBtn: null,
      loopIcon: null,
      listIcon: null,
      volumeSlider: null,
      volumeDisplay: null
    }
    
    // Event callbacks (set by presenter)
    this.callbacks = {}
    
    // State
    this.isVisible = false
    this.currentMode = 'loop'
    
    this.initializeElements()
    this.setupEventListeners()
  }
  
  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements.container = document.getElementById('music-controls')
    this.elements.playPauseBtn = document.getElementById('music-play-pause-btn')
    this.elements.playIcon = document.getElementById('music-play-icon')
    this.elements.pauseIcon = document.getElementById('music-pause-icon')
    this.elements.prevBtn = document.getElementById('music-prev-btn')
    this.elements.nextBtn = document.getElementById('music-next-btn')
    this.elements.modeBtn = document.getElementById('music-mode-btn')
    this.elements.loopIcon = document.getElementById('music-loop-icon')
    this.elements.listIcon = document.getElementById('music-list-icon')
    this.elements.volumeSlider = document.getElementById('music-volume-slider')
    this.elements.volumeDisplay = document.getElementById('music-volume-display')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Play/Pause button
    if (this.elements.playPauseBtn) {
      this.elements.playPauseBtn.addEventListener('click', () => {
        this.callbacks.onPlayPauseToggle?.()
      })
    }
    
    // Previous track button
    if (this.elements.prevBtn) {
      this.elements.prevBtn.addEventListener('click', () => {
        this.callbacks.onPreviousTrack?.()
      })
    }
    
    // Next track button
    if (this.elements.nextBtn) {
      this.elements.nextBtn.addEventListener('click', () => {
        this.callbacks.onNextTrack?.()
      })
    }
    
    // Mode toggle button
    if (this.elements.modeBtn) {
      this.elements.modeBtn.addEventListener('click', () => {
        this.callbacks.onModeToggle?.()
      })
    }
    
    // Volume slider
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value)
        this.updateVolumeDisplay(volume)
        this.callbacks.onVolumeChange?.(volume)
      })
    }
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = callbacks
  }
  
  /**
   * Show music controls
   */
  show() {
    if (!this.elements.container) return
    
    this.elements.container.classList.remove('hidden')
    this.isVisible = true
  }
  
  /**
   * Hide music controls
   */
  hide() {
    if (!this.elements.container) return
    
    this.elements.container.classList.add('hidden')
    this.isVisible = false
  }
  
  /**
   * Update play/pause button state
   */
  updatePlayPauseState(isPlaying) {
    if (!this.elements.playIcon || !this.elements.pauseIcon) return
    
    if (isPlaying) {
      this.elements.playIcon.style.display = 'none'
      this.elements.pauseIcon.style.display = 'block'
    } else {
      this.elements.playIcon.style.display = 'block'
      this.elements.pauseIcon.style.display = 'none'
    }
  }
  
  /**
   * Update playback mode display
   */
  updatePlaybackMode(mode) {
    if (!this.elements.loopIcon || !this.elements.listIcon) return
    
    this.currentMode = mode
    
    if (mode === 'loop') {
      this.elements.loopIcon.style.display = 'block'
      this.elements.listIcon.style.display = 'none'
      this.elements.modeBtn.title = 'Switch to List Mode'
    } else {
      this.elements.loopIcon.style.display = 'none'
      this.elements.listIcon.style.display = 'block'
      this.elements.modeBtn.title = 'Switch to Loop Mode'
    }
  }
  
  /**
   * Update volume display
   */
  updateVolumeDisplay(volume) {
    if (this.elements.volumeDisplay) {
      this.elements.volumeDisplay.textContent = `${volume}%`
    }
    
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.value = volume
    }
  }
  
  /**
   * Enable/disable controls based on music availability
   */
  setControlsEnabled(enabled) {
    const buttons = [
      this.elements.playPauseBtn,
      this.elements.prevBtn,
      this.elements.nextBtn,
      this.elements.modeBtn
    ]
    
    buttons.forEach(btn => {
      if (btn) {
        btn.disabled = !enabled
        if (enabled) {
          btn.style.opacity = '1'
          btn.style.cursor = 'pointer'
        } else {
          btn.style.opacity = '0.5'
          btn.style.cursor = 'not-allowed'
        }
      }
    })
    
    if (this.elements.volumeSlider) {
      this.elements.volumeSlider.disabled = !enabled
    }
  }
  
  /**
   * Update navigation button states
   */
  updateNavigationState(canGoPrev, canGoNext) {
    if (this.elements.prevBtn) {
      this.elements.prevBtn.disabled = !canGoPrev
      this.elements.prevBtn.style.opacity = canGoPrev ? '1' : '0.5'
    }
    
    if (this.elements.nextBtn) {
      this.elements.nextBtn.disabled = !canGoNext
      this.elements.nextBtn.style.opacity = canGoNext ? '1' : '0.5'
    }
  }
  
  /**
   * Get current visibility state
   */
  isShown() {
    return this.isVisible
  }
  
  /**
   * Get current UI state
   */
  getCurrentState() {
    return {
      isVisible: this.isVisible,
      volume: parseInt(this.elements.volumeSlider?.value || '100'),
      mode: this.currentMode
    }
  }
  
  /**
   * Update from state
   */
  updateFromState(state) {
    if (state.isVisible !== undefined) {
      if (state.isVisible) {
        this.show()
      } else {
        this.hide()
      }
    }
    
    if (state.volume !== undefined) {
      this.updateVolumeDisplay(state.volume)
    }
    
    if (state.mode !== undefined) {
      this.updatePlaybackMode(state.mode)
    }
    
    if (state.isPlaying !== undefined) {
      this.updatePlayPauseState(state.isPlaying)
    }
    
    if (state.enabled !== undefined) {
      this.setControlsEnabled(state.enabled)
    }
  }
}
