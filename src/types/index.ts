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
  timelogs: {
    count: number
    totalSpentTime: number
    nodes: GitLabTimeLog[]
    pageInfo: {
      hasNextPage: boolean
    }
  }
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
  render?: (value: unknown) => React.ReactNode
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

