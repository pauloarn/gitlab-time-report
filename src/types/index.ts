// Time Log Types
export interface TimeLogEntry {
  timeLoggedInSeconds: number
  description: string
  date: string
}

export interface TimeLog {
  taskName: string
  webUrl: string
  dataTrack: TimeLogEntry[]
  weight?: number | null
  timeEstimate?: number | null
  iteration?: {
    id: string
    title: string
    description?: string | null
    startDate?: string | null
    dueDate?: string | null
  } | null
}

// Holiday Types
export interface Holiday {
  date: string
  name: string
  type: string
}

// Insights Types
export interface Insight {
  date: string
  time: number
}

// Business Hours Types
export interface BusinessHoursInfo {
  monthName: string
  businessDays: number
  totalHours: number
  hoursPerDay: number
  loggedHours: number
  remainingHours: number
  isComplete: boolean
}

// GitLab API Types
export interface GitLabUser {
  id: string
  username?: string
  name?: string
  avatarUrl?: string
  email?: string
}

export interface GitLabTimeLog {
  id: string
  spentAt: string
  summary: string
  timeSpent: number
  user: GitLabUser
}

export interface GitLabIssue {
  name: string
  webUrl: string
  weight?: number | null
  timeEstimate?: number | null
  iteration?: {
    id: string
    title: string
    description?: string | null
    startDate?: string | null
    dueDate?: string | null
  } | null
  timelogs: {
    count: number
    totalSpentTime: number
    nodes: GitLabTimeLog[]
    pageInfo: {
      hasNextPage: boolean
    }
  }
}

export interface IssueValidation {
  hasWeight: boolean
  hasTimeEstimate: boolean
  issueName: string
  issueUrl: string
}

export interface GitLabQueryResponse {
  issues: {
    count: number
    weight: number
    nodes: GitLabIssue[]
  }
}

import type React from 'react'

// Component Props Types
export interface TableColumn {
  key: string
  title: string
  render?: (value: unknown, item?: TimeLog) => React.ReactNode
  isIssueLevel?: boolean // Se true, mostra no nível da issue, não nos subItems
}

export interface TableMainKeyInfo {
  key: string
  title: string
}

// Month Period
export interface MonthPeriod {
  firstDay: string
  lastDay: string
}

// Epic and Sprint Types
export interface Epic {
  id: string
  title: string
  webUrl: string
  description?: string | null
  sprints: Sprint[]
  assignees?: Array<{
    id: string
    username: string
    avatarUrl?: string | null
    name?: string | null
  }>
}

export interface Sprint {
  id: string
  title: string
  description?: string | null
  startDate?: string | null
  dueDate?: string | null
  issues: SprintIssue[]
}

export interface SprintIssue {
  id: string
  name: string
  webUrl: string
  weight?: number | null
  timeEstimate?: number | null
  state: string
  totalSpentTime: number
  timelogs: TimeLogEntry[]
  assignees?: Array<{
    id: string
    username: string
    avatarUrl?: string | null
    name?: string | null
  }>
}


