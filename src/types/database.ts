// Types TypeScript pour l'application CleanCheck

// ============================================
// ENUMS
// ============================================

export type Role = "CLIENT" | "ADMIN"
export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

// ============================================
// USER
// ============================================

export interface User {
  id: string
  email: string
  password: string
  name: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SITE
// ============================================

export interface Site {
  id: string
  userId: string
  name: string
  address: string | null
  pinCode: string | null
  qrToken: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// TASK
// ============================================

export interface Task {
  id: string
  siteId: string
  name: string
  description: string | null
  orderIndex: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================
// CLEANING SESSION
// ============================================

export interface CleaningSession {
  id: string
  siteId: string
  workerName: string
  startTime: Date
  endTime: Date | null
  durationSeconds: number | null
  status: SessionStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================
// SESSION TASK
// ============================================

export interface SessionTask {
  id: string
  sessionId: string
  taskId: string
  completed: boolean
  completedAt: Date | null
  notes: string | null
  createdAt: Date
}

// ============================================
// TYPES AVEC RELATIONS
// ============================================

export interface SiteWithTasks extends Site {
  tasks: Task[]
}

export interface SiteWithDetails extends Site {
  tasks: Task[]
  cleaningSessions: CleaningSession[]
  _count?: {
    tasks: number
    cleaningSessions: number
  }
}

export interface SessionWithSiteAndTasks extends CleaningSession {
  site: {
    id: string
    name: string
    address: string | null
  }
  sessionTasks: (SessionTask & {
    task: Task | null
  })[]
}
