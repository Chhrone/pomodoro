/**
 * TaskListView - Handles task list panel UI
 * Follows MVP pattern - only handles DOM manipulation and UI events
 */
export class TaskListView {
  constructor() {
    // DOM elements
    this.elements = {
      panel: null,
      closeBtn: null,
      
      // Add task form
      newTaskName: null,
      newTaskCategory: null,
      addTaskBtn: null,
      
      // Task lists
      progressTaskList: null,
      archivedTaskList: null
    }
    
    // Event callbacks (set by presenter)
    this.callbacks = {}
    
    // Animation state
    this.isAnimating = false
    
    // Drag and drop state
    this.dragState = {
      draggedElement: null,
      draggedTaskId: null,
      sourceSection: null
    }
    
    this.initializeElements()
    this.setupEventListeners()

    // Show panel by default
    this.show()
  }
  
  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements.panel = document.getElementById('task-list-panel')
    this.elements.closeBtn = document.getElementById('close-task-list-btn')
    
    // Add task form
    this.elements.newTaskName = document.getElementById('new-task-name')
    this.elements.newTaskCategory = document.getElementById('new-task-category')
    this.elements.addTaskBtn = document.getElementById('add-task-btn')
    
    // Task lists
    this.elements.progressTaskList = document.getElementById('progress-task-list')
    this.elements.archivedTaskList = document.getElementById('archived-task-list')
    
    // Log which elements were found
    Object.entries(this.elements).forEach(([key, element]) => {
      if (!element) {
        console.warn(`TaskListView: Element '${key}' not found`)
      }
    })
    
    console.log('TaskListView: DOM elements initialized')
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        console.log('Task list panel closing: Close button clicked')
        this.callbacks.onClose?.()
      })
    }
    
    // Add task form
    if (this.elements.addTaskBtn) {
      this.elements.addTaskBtn.addEventListener('click', () => {
        this.handleAddTask()
      })
    }
    
    // Enter key in task name input
    if (this.elements.newTaskName) {
      this.elements.newTaskName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.handleAddTask()
        }
      })
      
      // Enable/disable add button based on input
      this.elements.newTaskName.addEventListener('input', () => {
        this.updateAddButtonState()
      })
    }
    
    // Enter key in category input
    if (this.elements.newTaskCategory) {
      this.elements.newTaskCategory.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          this.handleAddTask()
        }
      })
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when task list panel is visible
      if (!this.isVisible()) return

      // Stop all keyboard events from propagating to prevent timer controls
      e.stopPropagation()

      if (e.code === 'Escape') {
        e.preventDefault()
        console.log('Task list panel closing: Escape key pressed')
        this.callbacks.onClose?.()
      }
    }, true) // Use capture phase to intercept events before they reach other handlers
    
    // Click outside to close (only on overlay background, not on panel content)
    if (this.elements.panel) {
      this.elements.panel.addEventListener('mousedown', (e) => {
        // Only close if mousedown directly on the panel overlay (not on any child elements)
        if (e.target === this.elements.panel) {
          this.clickStartedOnOverlay = true
        } else {
          this.clickStartedOnOverlay = false
        }
      })

      this.elements.panel.addEventListener('mouseup', (e) => {
        // Only close if both mousedown and mouseup happened on the overlay
        if (e.target === this.elements.panel && this.clickStartedOnOverlay) {
          console.log('Task list panel closing: Clicked outside panel')
          this.callbacks.onClose?.()
        }
        this.clickStartedOnOverlay = false
      })
    }
    
    // Setup drag and drop for task lists
    this.setupDragAndDrop()
  }
  
  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    // Only enable drag and drop for progress section
    const taskLists = [this.elements.progressTaskList]

    taskLists.forEach(list => {
      if (!list) return

      // Allow drop
      list.addEventListener('dragover', (e) => {
        e.preventDefault()
        list.classList.add('drag-over')

        // Handle reordering within the same section
        const afterElement = this.getDragAfterElement(list, e.clientY)
        const draggedElement = this.dragState.draggedElement

        if (draggedElement && draggedElement !== afterElement) {
          if (afterElement == null) {
            list.appendChild(draggedElement)
          } else {
            list.insertBefore(draggedElement, afterElement)
          }
        }
      })

      list.addEventListener('dragleave', (e) => {
        // Only remove drag-over if we're leaving the list itself, not a child
        if (!list.contains(e.relatedTarget)) {
          list.classList.remove('drag-over')
        }
      })

      list.addEventListener('drop', (e) => {
        e.preventDefault()
        list.classList.remove('drag-over')

        if (this.dragState.draggedTaskId) {
          const targetSection = list.dataset.section
          const sourceSection = this.dragState.sourceSection

          if (targetSection === sourceSection) {
            // Reordering within same section
            this.handleReorder(list, targetSection)
          } else {
            // Moving between sections
            this.callbacks.onTaskMove?.(this.dragState.draggedTaskId, targetSection)
          }
        }

        this.resetDragState()
      })
    })
  }

  /**
   * Get the element after which the dragged element should be inserted
   */
  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')]

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element
  }

  /**
   * Handle reordering within the same section
   */
  handleReorder(list, section) {
    const taskElements = [...list.querySelectorAll('.task-item')]
    const taskIds = taskElements.map(el => parseInt(el.dataset.taskId))
    this.callbacks.onTaskReorder?.(taskIds, section)
  }
  
  /**
   * Handle adding a new task
   */
  handleAddTask() {
    const name = this.elements.newTaskName?.value?.trim()
    const category = this.elements.newTaskCategory?.value?.trim()
    
    if (!name) {
      this.elements.newTaskName?.focus()
      return
    }
    
    this.callbacks.onTaskAdd?.(name, category)
    
    // Clear form
    if (this.elements.newTaskName) this.elements.newTaskName.value = ''
    if (this.elements.newTaskCategory) this.elements.newTaskCategory.value = ''
    this.updateAddButtonState()
    
    // Focus back to name input
    this.elements.newTaskName?.focus()
  }
  
  /**
   * Update add button state based on input
   */
  updateAddButtonState() {
    const hasName = this.elements.newTaskName?.value?.trim()
    if (this.elements.addTaskBtn) {
      this.elements.addTaskBtn.disabled = !hasName
    }
  }
  
  /**
   * Set event callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }
  
  /**
   * Show task list panel
   */
  show() {
    if (!this.elements.panel || this.isAnimating) return

    this.isAnimating = true

    // Show panel
    this.elements.panel.classList.remove('hidden')
    document.getElementById('app').classList.remove('task-list-hidden')

    setTimeout(() => {
      this.isAnimating = false
    }, 300)

    // Focus on task name input
    setTimeout(() => {
      this.elements.newTaskName?.focus()
    }, 350)
  }
  
  /**
   * Hide task list panel
   */
  hide() {
    if (!this.elements.panel || this.isAnimating) return

    this.isAnimating = true

    // Hide panel
    this.elements.panel.classList.add('hidden')
    document.getElementById('app').classList.add('task-list-hidden')

    setTimeout(() => {
      this.isAnimating = false
    }, 300)
  }
  
  /**
   * Check if task list panel is visible
   */
  isVisible() {
    return this.elements.panel && !this.elements.panel.classList.contains('hidden')
  }
  
  /**
   * Reset drag state
   */
  resetDragState() {
    this.dragState = {
      draggedElement: null,
      draggedTaskId: null,
      sourceSection: null
    }
  }

  /**
   * Render tasks in all sections
   */
  renderTasks(tasksByStatus) {
    this.renderTasksInSection(tasksByStatus.progress || [], 'progress')
    this.renderTasksInSection(tasksByStatus.archived || [], 'archived')
  }

  /**
   * Render tasks in a specific section
   */
  renderTasksInSection(tasks, section) {
    const listElement = this.getListElementBySection(section)
    if (!listElement) return

    // Clear existing tasks
    listElement.innerHTML = ''

    // Add tasks
    tasks.forEach(task => {
      const taskElement = this.createTaskElement(task, section)
      listElement.appendChild(taskElement)
    })
  }

  /**
   * Get list element by section name
   */
  getListElementBySection(section) {
    switch (section) {
      case 'progress':
        return this.elements.progressTaskList
      case 'archived':
        return this.elements.archivedTaskList
      default:
        return null
    }
  }

  /**
   * Create a task element
   */
  createTaskElement(task, section) {
    const taskElement = document.createElement('div')
    taskElement.className = 'task-item'
    taskElement.dataset.taskId = task.id
    taskElement.dataset.section = section

    // Add drag handle for progress tasks FIRST (left side)
    if (section === 'progress') {
      const dragHandle = document.createElement('div')
      dragHandle.className = 'task-drag-handle'
      dragHandle.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
          <circle cx="5" cy="6" r="2"/>
          <circle cx="12" cy="6" r="2"/>
          <circle cx="19" cy="6" r="2"/>
          <circle cx="5" cy="18" r="2"/>
          <circle cx="12" cy="18" r="2"/>
          <circle cx="19" cy="18" r="2"/>
        </svg>
      `
      taskElement.appendChild(dragHandle)

      // Make only the drag handle draggable
      taskElement.draggable = false
      dragHandle.draggable = true
      this.setupTaskDragEvents(dragHandle, task, taskElement)
    }

    // Create task content area
    const content = document.createElement('div')
    content.className = 'task-content'

    // Create task header
    const header = document.createElement('div')
    header.className = 'task-item-header'

    const name = document.createElement('div')
    name.className = 'task-item-name'
    name.textContent = task.name

    header.appendChild(name)

    // Add category if exists
    if (task.category) {
      const category = document.createElement('div')
      category.className = 'task-item-category'
      category.textContent = task.category
      header.appendChild(category)
    }

    content.appendChild(header)

    // Add actions based on section
    const actions = this.createTaskActions(task, section)
    if (actions) {
      content.appendChild(actions)
    }

    taskElement.appendChild(content)

    return taskElement
  }

  /**
   * Create task action buttons
   */
  createTaskActions(task, section) {
    const actions = document.createElement('div')
    actions.className = 'task-item-actions'

    if (section === 'progress') {
      // Complete button
      const completeBtn = document.createElement('button')
      completeBtn.className = 'task-action-btn complete'
      completeBtn.textContent = 'Complete'
      completeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.callbacks.onTaskComplete?.(task.id)
      })
      actions.appendChild(completeBtn)

      // Cancel button
      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'task-action-btn cancel'
      cancelBtn.textContent = 'Cancel'
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.callbacks.onTaskCancel?.(task.id)
      })
      actions.appendChild(cancelBtn)

    } else if (section === 'archived') {
      // Add status tag
      const statusTag = document.createElement('div')
      statusTag.className = `task-status-tag ${task.cancelled ? 'cancelled' : 'completed'}`
      statusTag.textContent = task.cancelled ? 'Cancelled' : 'Completed'
      actions.appendChild(statusTag)

      // Restore button
      const restoreBtn = document.createElement('button')
      restoreBtn.className = 'task-action-btn restore'
      restoreBtn.textContent = 'Restore'
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.callbacks.onTaskRestore?.(task.id)
      })
      actions.appendChild(restoreBtn)

      // Delete button
      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'task-action-btn delete'
      deleteBtn.textContent = 'Delete'
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.callbacks.onTaskDelete?.(task.id)
      })
      actions.appendChild(deleteBtn)
    }

    return actions.children.length > 0 ? actions : null
  }

  /**
   * Setup drag events for a task element
   */
  setupTaskDragEvents(dragHandle, task, taskElement) {
    dragHandle.addEventListener('dragstart', (e) => {
      this.dragState.draggedElement = taskElement
      this.dragState.draggedTaskId = task.id
      this.dragState.sourceSection = taskElement.dataset.section

      taskElement.classList.add('dragging')

      // Set drag data
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', task.id)
    })

    dragHandle.addEventListener('dragend', () => {
      taskElement.classList.remove('dragging')

      // Remove drag-over class from all lists
      const lists = [this.elements.progressTaskList]
      lists.forEach(list => list?.classList.remove('drag-over'))

      this.resetDragState()
    })
  }
}
