export interface IssuesResponse {
  data: Data
}

export interface Data {
  issues: Issues
}

export interface Issues {
  count: number
  weight: number
  nodes: IssuesNode[]
}

export interface IssuesNode {
  name: string
  timelogs: Timelogs
}

export interface Timelogs {
  count: number
  totalSpentTime: string
  nodes: TimeLogNode[]
}

export interface TimeLogNode {
  id: string
  spentAt: string
  summary: string
  timeSpent: number
  user: User
}

export interface User {
  id: string
  username: string
}