/**
 * TaskModel - Manages task data and persistence
 * Follows MVP pattern - handles data operations and business logic
 */
export class TaskModel {
  constructor() {
    this.tasks = []
    this.nextId = 1
    this.storageKey = 'pomodoro-tasks'
    
    this.loadTasks()
  }
  
  /**
   * Load tasks from localStorage
   */
  loadTasks() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        this.tasks = data.tasks || []
        this.nextId = data.nextId || 1
        
        // Ensure all tasks have required properties
        this.tasks = this.tasks.map(task => ({
          id: task.id,
          name: task.name || '',
          category: task.category || '',
          status: task.status || 'add',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          order: task.order !== undefined ? task.order : 0
        }))
        
        console.log('TaskModel: Loaded tasks from localStorage:', this.tasks)
      }
    } catch (error) {
      console.error('TaskModel: Error loading tasks from localStorage:', error)
      this.tasks = []
      this.nextId = 1
    }
  }
  
  /**
   * Save tasks to localStorage
   */
  saveTasks() {
    try {
      const data = {
        tasks: this.tasks,
        nextId: this.nextId
      }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
      console.log('TaskModel: Saved tasks to localStorage')
    } catch (error) {
      console.error('TaskModel: Error saving tasks to localStorage:', error)
    }
  }
  
  /**
   * Create a new task
   */
  createTask(name, category = '') {
    if (!name || !name.trim()) {
      throw new Error('Task name is required')
    }

    const task = {
      id: this.nextId++,
      name: name.trim(),
      category: category.trim(),
      status: 'progress', // New tasks go directly to progress
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: this.getMaxOrderInSection('progress') + 1
    }

    this.tasks.push(task)
    this.saveTasks()

    console.log('TaskModel: Created task:', task)
    return task
  }
  
  /**
   * Update a task
   */
  updateTask(id, updates) {
    const taskIndex = this.tasks.findIndex(task => task.id === id)
    if (taskIndex === -1) {
      throw new Error('Task not found')
    }
    
    const task = this.tasks[taskIndex]
    const updatedTask = {
      ...task,
      ...updates,
      id: task.id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    }
    
    this.tasks[taskIndex] = updatedTask
    this.saveTasks()
    
    console.log('TaskModel: Updated task:', updatedTask)
    return updatedTask
  }
  
  /**
   * Delete a task
   */
  deleteTask(id) {
    const taskIndex = this.tasks.findIndex(task => task.id === id)
    if (taskIndex === -1) {
      throw new Error('Task not found')
    }
    
    const deletedTask = this.tasks.splice(taskIndex, 1)[0]
    this.saveTasks()
    
    console.log('TaskModel: Deleted task:', deletedTask)
    return deletedTask
  }
  
  /**
   * Get all tasks
   */
  getAllTasks() {
    return [...this.tasks]
  }
  
  /**
   * Get tasks by status
   */
  getTasksByStatus(status) {
    return this.tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.order - b.order)
  }
  
  /**
   * Get a task by ID
   */
  getTaskById(id) {
    return this.tasks.find(task => task.id === id)
  }
  
  /**
   * Move task to different status
   */
  moveTaskToStatus(id, newStatus) {
    const task = this.getTaskById(id)
    if (!task) {
      throw new Error('Task not found')
    }
    
    const validStatuses = ['add', 'progress', 'archived']
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Invalid status')
    }
    
    // Set new order to be at the end of the target section
    const newOrder = this.getMaxOrderInSection(newStatus) + 1
    
    return this.updateTask(id, { 
      status: newStatus,
      order: newOrder
    })
  }
  
  /**
   * Reorder tasks within a section
   */
  reorderTasks(taskIds, status) {
    const validStatuses = ['add', 'progress', 'archived']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status')
    }
    
    // Update order for each task
    taskIds.forEach((id, index) => {
      const task = this.getTaskById(id)
      if (task && task.status === status) {
        this.updateTask(id, { order: index })
      }
    })
    
    console.log('TaskModel: Reordered tasks in section:', status)
  }
  
  /**
   * Get maximum order value in a section
   */
  getMaxOrderInSection(status) {
    const tasksInSection = this.getTasksByStatus(status)
    if (tasksInSection.length === 0) {
      return 0
    }
    return Math.max(...tasksInSection.map(task => task.order))
  }
  
  /**
   * Mark task as completed (move to archived)
   */
  completeTask(id) {
    return this.moveTaskToStatus(id, 'archived')
  }
  
  /**
   * Mark task as cancelled (move to archived)
   */
  cancelTask(id) {
    const task = this.moveTaskToStatus(id, 'archived')
    return this.updateTask(id, { cancelled: true })
  }
  
  /**
   * Restore task from archived to progress
   */
  restoreTask(id) {
    const task = this.getTaskById(id)
    if (!task) {
      throw new Error('Task not found')
    }
    
    // Remove cancelled flag if it exists
    const updates = { cancelled: false }
    const restoredTask = this.updateTask(id, updates)
    
    return this.moveTaskToStatus(id, 'progress')
  }
  
  /**
   * Start working on a task (move from add to progress)
   */
  startTask(id) {
    return this.moveTaskToStatus(id, 'progress')
  }
  
  /**
   * Get task statistics
   */
  getStats() {
    const stats = {
      total: this.tasks.length,
      add: this.getTasksByStatus('add').length,
      progress: this.getTasksByStatus('progress').length,
      archived: this.getTasksByStatus('archived').length,
      completed: this.tasks.filter(task => task.status === 'archived' && !task.cancelled).length,
      cancelled: this.tasks.filter(task => task.status === 'archived' && task.cancelled).length
    }
    
    return stats
  }
  
  /**
   * Clear all tasks (for testing or reset)
   */
  clearAllTasks() {
    this.tasks = []
    this.nextId = 1
    this.saveTasks()
    console.log('TaskModel: Cleared all tasks')
  }
}
