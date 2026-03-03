import React, { useState, useEffect } from 'react'
import type { Task, TaskStats } from './types/Task'
import { taskService } from './services/api'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import TaskStatsComponent from './components/TaskStats'  // ✅ Renamed to avoid conflict
import LoadingSpinner from './components/LoadingSpinner'

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [resetting, setResetting] = useState(false)
  const [filter, setFilter] = useState<'all' | Task['status']>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [])

  const fetchTasks = async (): Promise<void> => {
    try {
      setLoading(true)
      const tasksData = await taskService.getAllTasks()
      setTasks(tasksData)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      alert('Failed to load tasks. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (): Promise<void> => {
    try {
      const statsData = await taskService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleCreateTask = async (taskData: any): Promise<void> => {
    try {
      await taskService.createTask(taskData)
      fetchTasks()
      fetchStats()
      setShowForm(false)
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  const handleUpdateTask = async (taskData: any): Promise<void> => {
    if (!editingTask) return
    
    try {
      await taskService.updateTask(editingTask.id, taskData)
      fetchTasks()
      fetchStats()
      setShowForm(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const handleDeleteTask = async (id: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      await taskService.deleteTask(id)
      fetchTasks()
      fetchStats()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const handleToggleStatus = async (id: number, status: Task['status']): Promise<void> => {
    try {
      await taskService.toggleTaskStatus(id, status)
      fetchTasks()
      fetchStats()
    } catch (error) {
      console.error('Error updating task status:', error)
      alert('Failed to update task status. Please try again.')
    }
  }

  const handleReset = async (): Promise<void> => {
    if (!confirm('Reset to original demo data? This will remove all added tasks.')) return
    
    try {
      setResetting(true)
      await taskService.resetDemo()
      fetchTasks()
      fetchStats()
      alert('Demo data reset successfully!')
    } catch (error) {
      console.error('Error resetting demo:', error)
      alert('Failed to reset demo. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  const handleEdit = (task: Task): void => {
    setEditingTask(task)
    setShowForm(true)
  }

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Manager</h1>
          <p className="text-gray-600">Stay organized and productive</p>
        </div>

        {/* Demo Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Live Demo:</strong> Full-featured task management system built with TypeScript. 
                Create, organize, and track your tasks with priority levels, categories, and due dates!
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && <TaskStatsComponent stats={stats} />}  {/* ✅ Use renamed component */}

        {/* Action Bar */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => {
                setShowForm(true)
                setEditingTask(null)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Task
            </button>
            
            <button
              onClick={handleReset}
              disabled={resetting}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              {resetting ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              {resetting ? 'Resetting...' : 'Reset Demo'}
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <TaskList 
          tasks={filteredTasks}
          onEdit={handleEdit}
          onDelete={handleDeleteTask}
          onToggleStatus={handleToggleStatus}
        />

        {/* Task Form Modal */}
        {showForm && (
          <TaskForm
            task={editingTask}
            onSave={editingTask ? handleUpdateTask : handleCreateTask}
            onCancel={() => {
              setShowForm(false)
              setEditingTask(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App