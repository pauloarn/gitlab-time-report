export const QUERY_KEYS = {
  HOLIDAYS: 'holidays',
  TIME_LOGS: 'timeLogs',
  CURRENT_USER: 'currentUser',
  SPRINTS: 'sprints',
  MILESTONES: 'milestones',
  GROUPS: 'groups',
} as const

export const queryKeys = {
  holidays: (year: number) => [QUERY_KEYS.HOLIDAYS, year] as const,
  timeLogs: (token: string, date: Date) => [QUERY_KEYS.TIME_LOGS, token, date] as const,
  currentUser: (token: string | null) => [QUERY_KEYS.CURRENT_USER, token] as const,
  sprints: (token: string | null, milestoneTitle?: string) => [QUERY_KEYS.SPRINTS, token, milestoneTitle] as const,
  milestones: (token: string | null, groupId: string | null) => [QUERY_KEYS.MILESTONES, token, groupId] as const,
  groups: (token: string | null) => [QUERY_KEYS.GROUPS, token] as const,
}

