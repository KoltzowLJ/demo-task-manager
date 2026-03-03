export interface Task {
  id: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  category: string
  due_date: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskFormData {
  title: string
  description: string
  status: Task['status']
  priority: Task['priority']
  category: string
  due_date: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface TaskStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  overdue: number
}