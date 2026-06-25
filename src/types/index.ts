export type Priority = 'high' | 'medium' | 'low'
export type FinanceType = 'income' | 'expense'

export interface Task {
  id: string
  userId: string
  title: string
  description: string | null
  priority: Priority
  dueDate: string | null
  categories: string[]
  completed: boolean
  completedAt: string | null
  notionId: string | null
  createdAt: string
  updatedAt: string
}

export interface FinanceRecord {
  id: string
  userId: string
  amount: number
  type: FinanceType
  category: string
  date: string
  memo: string | null
  createdAt: string
}

export interface MonthlyBudget {
  id: string
  userId: string
  yearMonth: string
  budgetAmount: number
  createdAt: string
  updatedAt: string
}

export interface ResearchPhase {
  id: string
  userId: string
  phaseKey: string
  phaseName: string
  progress: number
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ResearchMilestone {
  id: string
  userId: string
  title: string
  dueDate: string | null
  achieved: boolean
  achievedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkShift {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  hourlyRate: number
  transportFee: number
  confirmed: boolean
  createdAt: string
  updatedAt: string
}

export interface DailyReport {
  id: string
  userId: string
  reportDate: string
  doneToday: string | null
  insights: string | null
  tomorrowPlan: string | null
  createdAt: string
  updatedAt: string
}

export interface UserSettings {
  id: string
  userId: string
  obsidianVaultName: string | null
  notionHomeUrl: string | null
  customApps: CustomApp[]
  calendarIds: string[]
  taskCategories: string[]
  createdAt: string
  updatedAt: string
}

export interface CustomApp {
  label: string
  url: string
}

export interface CalendarEvent {
  id: string
  title: string
  startAt: string
  endAt: string
  isAllDay: boolean
  calendarId: string
  calendarName: string
}

export interface CalendarInfo {
  id: string
  name: string
  color: string
}

export interface ApiError {
  code: string
  message: string
}
