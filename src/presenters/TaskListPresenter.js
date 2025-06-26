/**
 * TaskListPresenter - Coordinates between TaskModel and TaskListView
 * Follows MVP pattern - handles business logic and coordinates data flow
 */
import { EventEmitter } from '../utils/EventEmitter.js'

export class TaskListPresenter extends EventEmitter {
  constructor(taskModel, taskListView) {
    super()
    
    this.model = taskModel
    this.view = taskListView
    this.isVisible = false
    
    this.setupViewCallbacks()
    this.updateUI()
    
    console.log('TaskListPresenter: Initialized')
  }
  
  /**
   * Setup view event callbacks
   */
  setupViewCallbacks() {
    this.view.setCallbacks({
      onClose: () => this.hideTaskList(),
      onTaskAdd: (name, category) => this.handleAddTask(name, category),
      onTaskStart: (id) => this.handleStartTask(id),
      onTaskComplete: (id) => this.handleCompleteTask(id),
      onTaskCancel: (id) => this.handleCancelTask(id),
      onTaskRestore: (id) => this.handleRestoreTask(id),
      onTaskDelete: (id) => this.handleDeleteTask(id),
      onTaskMove: (id, targetSection) => this.handleMoveTask(id, targetSection),
      onTaskReorder: (taskIds, section) => this.handleReorderTasks(taskIds, section)
    })
  }
  
  /**
   * Handle adding a new task
   */
  handleAddTask(name, category) {
    try {
      const task = this.model.createTask(name, category)
      this.updateUI()
      this.emit('taskAdded', task)
      console.log('TaskListPresenter: Task added:', task)
    } catch (error) {
      console.error('TaskListPresenter: Error adding task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle starting a task (move from add to progress)
   */
  handleStartTask(id) {
    try {
      const task = this.model.startTask(id)
      this.updateUI()
      this.emit('taskStarted', task)
      console.log('TaskListPresenter: Task started:', task)
    } catch (error) {
      console.error('TaskListPresenter: Error starting task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle completing a task
   */
  handleCompleteTask(id) {
    try {
      const task = this.model.completeTask(id)
      this.updateUI()
      this.emit('taskCompleted', task)
      console.log('TaskListPresenter: Task completed:', task)
    } catch (error) {
      console.error('TaskListPresenter: Error completing task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle cancelling a task
   */
  handleCancelTask(id) {
    try {
      const task = this.model.cancelTask(id)
      this.updateUI()
      this.emit('taskCancelled', task)
      console.log('TaskListPresenter: Task cancelled:', task)
    } catch (error) {
      console.error('TaskListPresenter: Error cancelling task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle restoring a task from archived
   */
  handleRestoreTask(id) {
    try {
      const task = this.model.restoreTask(id)
      this.updateUI()
      this.emit('taskRestored', task)
      console.log('TaskListPresenter: Task restored:', task)
    } catch (error) {
      console.error('TaskListPresenter: Error restoring task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle deleting a task permanently
   */
  handleDeleteTask(id) {
    try {
      // Show confirmation for permanent deletion
      if (confirm('Are you sure you want to permanently delete this task?')) {
        const task = this.model.deleteTask(id)
        this.updateUI()
        this.emit('taskDeleted', task)
        console.log('TaskListPresenter: Task deleted:', task)
      }
    } catch (error) {
      console.error('TaskListPresenter: Error deleting task:', error)
      this.emit('error', error.message)
    }
  }
  
  /**
   * Handle moving a task between sections
   */
  handleMoveTask(id, targetSection) {
    try {
      // Map section names to status values
      const statusMap = {
        'add': 'add',
        'progress': 'progress',
        'archived': 'archived'
      }

      const targetStatus = statusMap[targetSection]
      if (!targetStatus) {
        throw new Error('Invalid target section')
      }

      const task = this.model.moveTaskToStatus(id, targetStatus)
      this.updateUI()

      // Emit appropriate event based on the move
      if (targetStatus === 'progress') {
        this.emit('taskStarted', task)
      } else if (targetStatus === 'archived') {
        this.emit('taskCompleted', task)
      } else if (targetStatus === 'add') {
        this.emit('taskRestored', task)
      }

      console.log('TaskListPresenter: Task moved to:', targetStatus, task)
    } catch (error) {
      console.error('TaskListPresenter: Error moving task:', error)
      this.emit('error', error.message)
    }
  }

  /**
   * Handle reordering tasks within a section
   */
  handleReorderTasks(taskIds, section) {
    try {
      // Map section names to status values
      const statusMap = {
        'add': 'add',
        'progress': 'progress',
        'archived': 'archived'
      }

      const status = statusMap[section]
      if (!status) {
        throw new Error('Invalid section')
      }

      this.model.reorderTasks(taskIds, status)
      // No need to update UI since the view already shows the new order

      console.log('TaskListPresenter: Tasks reordered in section:', section)
    } catch (error) {
      console.error('TaskListPresenter: Error reordering tasks:', error)
      this.emit('error', error.message)
      // Refresh UI to restore original order
      this.updateUI()
    }
  }
  
  /**
   * Update UI based on current tasks
   */
  updateUI() {
    const tasksByStatus = {
      progress: this.model.getTasksByStatus('progress'),
      archived: this.model.getTasksByStatus('archived')
    }

    this.view.renderTasks(tasksByStatus)
  }
  
  /**
   * Show task list panel
   */
  showTaskList() {
    if (this.isVisible) return
    
    this.isVisible = true
    this.view.show()
    this.updateUI()
    
    this.emit('taskListShown')
  }
  
  /**
   * Hide task list panel
   */
  hideTaskList() {
    if (!this.isVisible) return
    
    this.isVisible = false
    this.view.hide()
    
    this.emit('taskListHidden')
  }
  
  /**
   * Toggle task list panel visibility
   */
  toggleTaskList() {
    if (this.isVisible) {
      this.hideTaskList()
    } else {
      this.showTaskList()
    }
  }
  
  /**
   * Get task statistics
   */
  getStats() {
    return this.model.getStats()
  }
  
  /**
   * Get all tasks
   */
  getAllTasks() {
    return this.model.getAllTasks()
  }
  
  /**
   * Get tasks by status
   */
  getTasksByStatus(status) {
    return this.model.getTasksByStatus(status)
  }
  
  /**
   * Clear all tasks (for testing)
   */
  clearAllTasks() {
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      this.model.clearAllTasks()
      this.updateUI()
      this.emit('allTasksCleared')
    }
  }
  
  /**
   * Check if task list is visible
   */
  isTaskListVisible() {
    return this.isVisible
  }
}
