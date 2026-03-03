import type { Task, TaskFormData, ApiResponse, TaskStats } from '../types/Task'

const API_BASE = 'https://project-template-2.thesimpleprogrammer.com/api'

class TaskService {
  async getAllTasks(): Promise<Task[]> {
    const response = await fetch(`${API_BASE}/tasks.php`)
    const result: ApiResponse<Task[]> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch tasks')
    }
    
    return result.data || []
  }

  async getTask(id: number): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks.php/${id}`)
    const result: ApiResponse<Task> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Task not found')
    }
    
    return result.data!
  }

  async createTask(taskData: TaskFormData): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    })
    
    const result: ApiResponse<{ id: number }> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create task')
    }
    
    return this.getTask(result.data!.id)
  }

  async updateTask(id: number, taskData: Partial<TaskFormData>): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks.php/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData)
    })
    
    const result: ApiResponse<void> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update task')
    }
  }

  async deleteTask(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks.php/${id}`, {
      method: 'DELETE'
    })
    
    const result: ApiResponse<void> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete task')
    }
  }

  async getStats(): Promise<TaskStats> {
    const response = await fetch(`${API_BASE}/stats.php`)
    const result: ApiResponse<TaskStats> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stats')
    }
    
    return result.data!
  }

  async resetDemo(): Promise<void> {
    const response = await fetch(`${API_BASE}/reset.php`, {
      method: 'POST'
    })
    
    const result: ApiResponse<void> = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to reset demo')
    }
  }

  async toggleTaskStatus(id: number, status: Task['status']): Promise<void> {
    await this.updateTask(id, { status })
  }
}

export const taskService = new TaskService()