import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  type ApolloQueryResult,
} from '@apollo/client'
import { format, isBefore } from 'date-fns'
import type {
  Epic,
  GitLabUser,
  IssueValidation,
  MonthPeriod,
  Sprint,
  SprintIssue,
  TimeLog,
} from '@/types'
import { convertTimeInHoursMinSec } from '@/lib/utils'

const BASE_URL = 'https://gitlab.com/api/graphql'
const PAGE_SIZE = 100

const TIMELOG_FIELDS = `
  id
  spentAt
  summary
  timeSpent
  user {
    id
    username
  }
`

const ISSUE_FIELDS_FOR_EPIC = `
  id
  name
  webUrl
  weight
  timeEstimate
  state
  milestone {
    id
    title
    webPath
  }
  assignees {
    nodes {
      id
      username
      avatarUrl
      name
    }
  }
  participants {
    nodes {
      id
      username
      avatarUrl
      name
    }
  }
  iteration {
    id
    title
    description
    startDate
    dueDate
  }
`

type EpicIssueNode = {
  id: string
  name: string
  webUrl: string
  weight?: number | null
  timeEstimate?: number | null
  state: string
  milestone?: { id: string; title: string; webPath: string } | null
  assignees: {
    nodes: Array<{
      id: string
      username: string
      avatarUrl?: string | null
      name?: string | null
    }>
  }
  participants?: {
    nodes: Array<{
      id: string
      username: string
      avatarUrl?: string | null
      name?: string | null
    }>
  }
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
    nodes: Array<{
      id: string
      spentAt: string
      summary: string
      timeSpent: number
      user: { id: string; username: string }
    }>
  }
}

const getMonthPeriod = (selectedDate: Date): MonthPeriod => {
  const y = selectedDate.getFullYear()
  const m = selectedDate.getMonth()
  return {
    firstDay: format(new Date(y, m, 1), 'yyyy-MM-dd'),
    lastDay: format(new Date(y, m + 1, 0), 'yyyy-MM-dd'),
  }
}

type UserTimelogNode = {
  id: string
  spentAt: string
  summary: string
  timeSpent: number
  user: { id: string; username: string }
  issue?: {
    id: string
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
  } | null
  mergeRequest?: {
    id: string
    title: string
    webUrl: string
  } | null
}

const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    currentUser {
      id
      username
      name
      avatarUrl
      email
    }
  }
`

const createEpicsQuery = (groupId: string) => {
  return gql`
    query GroupEpics {
      group(fullPath: "${groupId}") {
        epics(state: opened, first: 100) {
          count
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            title
            webUrl
            description
            issues(first: ${PAGE_SIZE}) {
              nodes {
                id
                name
                webUrl
                weight
                timeEstimate
                state
                milestone {
                  id
                  title
                  webPath
                }
                assignees {
                  nodes {
                    id
                    username
                    avatarUrl
                    name
                  }
                }
                participants {
                  nodes {
                    id
                    username
                    avatarUrl
                    name
                  }
                }
                iteration {
                  id
                  title
                  description
                  startDate
                  dueDate
                }
                timelogs(first: ${PAGE_SIZE}) {
                  count
                  totalSpentTime
                  nodes {
                    id
                    spentAt
                    summary
                    timeSpent
                    user {
                      id
                      username
                    }
                  }
                  pageInfo {
                    hasNextPage
                  }
                }
              }
            }
          }
        }
      }
    }
  `
}

export class GitLabService {
  private client: ApolloClient<unknown>

  constructor(userAccessToken: string) {
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: BASE_URL,
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }),
      cache: new InMemoryCache(),
    })
  }

  async getCurrentUser(): Promise<GitLabUser> {
    try {
      const response = await this.client.query<{ currentUser: GitLabUser }>({
        query: CURRENT_USER_QUERY,
      })

      if (!response.data?.currentUser) {
        throw new Error('Falha ao buscar informações do usuário')
      }

      return response.data.currentUser
    } catch (error) {
      throw new Error(
        `Erro ao buscar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  private async fetchTimelogsAfter(
    issueId: string,
    after: string
  ): Promise<EpicIssueNode['timelogs']['nodes']> {
    const nodes: EpicIssueNode['timelogs']['nodes'] = []
    let hasNextPage = true
    let cursor: string | null = after

    while (hasNextPage && cursor) {
      type IssueTimelogsResponse = {
        issue: {
          timelogs: {
            nodes: EpicIssueNode['timelogs']['nodes']
            pageInfo: { hasNextPage: boolean; endCursor: string | null }
          }
        } | null
      }
      const response: ApolloQueryResult<IssueTimelogsResponse> =
        await this.client.query<IssueTimelogsResponse>({
        query: gql`
          query IssueTimelogs($issueId: IssueID!, $after: String!) {
            issue(id: $issueId) {
              timelogs(first: ${PAGE_SIZE}, after: $after) {
                nodes {
                  ${TIMELOG_FIELDS}
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `,
        variables: { issueId, after: cursor },
        fetchPolicy: 'no-cache',
      })

      if (!response.data?.issue) {
        break
      }

      nodes.push(...response.data.issue.timelogs.nodes)
      hasNextPage = response.data.issue.timelogs.pageInfo.hasNextPage
      cursor = response.data.issue.timelogs.pageInfo.endCursor
    }

    return nodes
  }

  private async fetchAllUserTimelogs(
    username: string,
    startDate: string,
    endDate: string
  ): Promise<UserTimelogNode[]> {
    const allTimelogs: UserTimelogNode[] = []
    let hasNextPage = true
    let cursor: string | null = null

    while (hasNextPage) {
      type UserTimelogsResponse = {
        timelogs: {
          nodes: UserTimelogNode[]
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
        }
      }
      const response: ApolloQueryResult<UserTimelogsResponse> =
        await this.client.query<UserTimelogsResponse>({
        query: gql`
          query UserTimelogs(
            $username: String!
            $startDate: Time!
            $endDate: Time!
            $after: String
          ) {
            timelogs(
              username: $username
              startDate: $startDate
              endDate: $endDate
              first: ${PAGE_SIZE}
              after: $after
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                spentAt
                summary
                timeSpent
                user {
                  id
                  username
                }
                issue {
                  id
                  name
                  webUrl
                  weight
                  timeEstimate
                  iteration {
                    id
                    title
                    description
                    startDate
                    dueDate
                  }
                }
                mergeRequest {
                  id
                  title
                  webUrl
                }
              }
            }
          }
        `,
        variables: {
          username,
          startDate,
          endDate,
          ...(cursor ? { after: cursor } : {}),
        },
        fetchPolicy: 'no-cache',
      })

      allTimelogs.push(...response.data.timelogs.nodes)
      hasNextPage = response.data.timelogs.pageInfo.hasNextPage
      cursor = response.data.timelogs.pageInfo.endCursor
    }

    return allTimelogs
  }

  private async fetchAllEpicIssues(epicId: string): Promise<EpicIssueNode[]> {
    type EpicIssueQueryNode = EpicIssueNode & {
      timelogs: EpicIssueNode['timelogs'] & {
        pageInfo?: { hasNextPage: boolean; endCursor: string | null }
      }
    }

    const allIssues: EpicIssueNode[] = []
    let hasNextPage = true
    let cursor: string | null = null

    while (hasNextPage) {
      type EpicIssuesResponse = {
        epic: {
          issues: {
            nodes: EpicIssueQueryNode[]
            pageInfo: { hasNextPage: boolean; endCursor: string | null }
          }
        } | null
      }
      const response: ApolloQueryResult<EpicIssuesResponse> =
        await this.client.query<EpicIssuesResponse>({
        query: gql`
          query EpicIssues($epicId: EpicID!, $after: String) {
            epic(id: $epicId) {
              issues(first: ${PAGE_SIZE}, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  ${ISSUE_FIELDS_FOR_EPIC}
                  timelogs(first: ${PAGE_SIZE}) {
                    count
                    totalSpentTime
                    nodes {
                      ${TIMELOG_FIELDS}
                    }
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          epicId,
          ...(cursor ? { after: cursor } : {}),
        },
        fetchPolicy: 'no-cache',
      })

      if (!response.data?.epic) {
        break
      }

      for (const issue of response.data.epic.issues.nodes) {
        const timelogNodes = [...issue.timelogs.nodes]

        if (issue.timelogs.pageInfo?.hasNextPage && issue.timelogs.pageInfo.endCursor) {
          const more = await this.fetchTimelogsAfter(issue.id, issue.timelogs.pageInfo.endCursor)
          timelogNodes.push(...more)
        }

        allIssues.push({
          ...issue,
          timelogs: {
            count: timelogNodes.length,
            totalSpentTime: timelogNodes.reduce((sum, tl) => sum + tl.timeSpent, 0),
            nodes: timelogNodes,
          },
        })
      }

      hasNextPage = response.data.epic.issues.pageInfo.hasNextPage
      cursor = response.data.epic.issues.pageInfo.endCursor
    }

    return allIssues
  }

  async generateReport(selectedMonth: Date): Promise<{
    timeLogs: TimeLog[]
    validations: IssueValidation[]
  }> {
    try {
      const user = await this.getCurrentUser()
      const dateReferences = getMonthPeriod(selectedMonth)

      if (!user.username) {
        throw new Error('Usuário sem username no GitLab')
      }

      const timelogNodes = await this.fetchAllUserTimelogs(
        user.username,
        dateReferences.firstDay,
        dateReferences.lastDay
      )

      const timeLogs: TimeLog[] = []
      const validations: IssueValidation[] = []
      const groupedByIssuable = new Map<string, {
        taskName: string
        webUrl: string
        weight?: number | null
        timeEstimate?: number | null
        iteration: TimeLog['iteration']
        dataTrack: TimeLog['dataTrack']
      }>()

      timelogNodes.forEach((timelog) => {
        const issue = timelog.issue
        const mergeRequest = timelog.mergeRequest
        const issuableKey = issue?.id ?? mergeRequest?.id
        if (!issuableKey) {
          return
        }

        const taskName = issue?.name ?? mergeRequest?.title ?? 'Sem título'
        const webUrl = issue?.webUrl ?? mergeRequest?.webUrl ?? ''

        if (!groupedByIssuable.has(issuableKey)) {
          groupedByIssuable.set(issuableKey, {
            taskName,
            webUrl,
            weight: issue?.weight,
            timeEstimate: issue?.timeEstimate,
            iteration: issue?.iteration
              ? {
                  id: issue.iteration.id,
                  title: issue.iteration.title,
                  description: issue.iteration.description || null,
                  startDate: issue.iteration.startDate || null,
                  dueDate: issue.iteration.dueDate || null,
                }
              : null,
            dataTrack: [],
          })
        }

        groupedByIssuable.get(issuableKey)!.dataTrack.push({
          timeLoggedInSeconds: timelog.timeSpent,
          description: timelog.summary,
          date: timelog.spentAt,
        })
      })

      groupedByIssuable.forEach((group) => {
        if (group.dataTrack.length === 0) {
          return
        }

        if (group.webUrl.includes('/issues/')) {
          const hasWeight = group.weight !== null && group.weight !== undefined
          const hasTimeEstimate =
            group.timeEstimate !== null && group.timeEstimate !== undefined

          if (!hasWeight || !hasTimeEstimate) {
            validations.push({
              hasWeight,
              hasTimeEstimate,
              issueName: group.taskName,
              issueUrl: group.webUrl,
            })
          }
        }

        group.dataTrack.sort((a, b) => {
          const dateA = new Date(a.date)
          const dateB = new Date(b.date)
          return dateA.getTime() - dateB.getTime()
        })

        timeLogs.push({
          taskName: group.taskName,
          webUrl: group.webUrl,
          weight: group.weight,
          timeEstimate: group.timeEstimate,
          iteration: group.iteration,
          dataTrack: group.dataTrack,
        })
      })

      return {
        timeLogs: timeLogs.sort((a, b) => {
          const dateA = new Date(a.dataTrack[0].date)
          const dateB = new Date(b.dataTrack[0].date)
          return dateA.getTime() - dateB.getTime()
        }),
        validations,
      }
    } catch (error) {
      const graphQLError = error instanceof Error && 'graphQLErrors' in error
        ? (error as { graphQLErrors?: Array<{ message: string }> }).graphQLErrors?.[0]?.message
        : undefined
      throw new Error(
        `Erro ao gerar relatório: ${graphQLError ?? (error instanceof Error ? error.message : 'Erro desconhecido')}`
      )
    }
  }

  static formatCSVData(timeData: TimeLog[]): string {
    let textData: string[] = []
    let totalTime = 0

    timeData.forEach((timeLog) => {
      textData.push(`${timeLog.taskName}\n`)
      textData.push('Descrição Atuação;Data;Tempo Utilizado\n')

      const orderedData = [...timeLog.dataTrack].sort((a, b) => {
        return isBefore(new Date(a.date), new Date(b.date)) ? -1 : 1
      })

      orderedData.forEach((track) => {
        textData.push(
          `${track.description.replace('\n', '')};${format(
            new Date(track.date),
            'dd/MM/yyyy'
          )};${convertTimeInHoursMinSec(track.timeLoggedInSeconds)}\n`
        )
        totalTime += track.timeLoggedInSeconds
      })

      textData.push('\n\n')
    })

    textData.push(`Tempo Total Utilizado;${convertTimeInHoursMinSec(totalTime)}`)

    return textData.join('')
  }

  async getEpicParticipants(groupId: string, epicIid: string): Promise<Array<{ id: string; username: string; avatarUrl: string | null; name: string | null }>> {
    try {
      const response = await this.client.query<{
        workspace: {
          workItem: {
            author: {
              id: string
              username: string
              avatarUrl?: string | null
              name?: string | null
            }
            widgets: Array<{
              type: string
              assignees?: {
                nodes: Array<{
                  id: string
                  username: string
                  avatarUrl?: string | null
                  name?: string | null
                }>
              }
              participants?: {
                nodes: Array<{
                  id: string
                  username: string
                  avatarUrl?: string | null
                  name?: string | null
                }>
              }
            }>
          }
        }
      }>({
        query: gql`
          query GetEpicParticipants($fullPath: ID!, $iid: String!) {
            workspace: namespace(fullPath: $fullPath) {
              workItem(iid: $iid) {
                author {
                  id
                  username
                  avatarUrl
                  name
                }
                widgets(onlyTypes: [ASSIGNEES, PARTICIPANTS]) {
                  type
                  ... on WorkItemWidgetAssignees {
                    assignees {
                      nodes {
                        id
                        username
                        avatarUrl
                        name
                      }
                    }
                  }
                  ... on WorkItemWidgetParticipants {
                    participants {
                      nodes {
                        id
                        username
                        avatarUrl
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          fullPath: groupId,
          iid: epicIid,
        },
        fetchPolicy: 'no-cache',
      })

      const authorId = response.data.workspace.workItem.author?.id
      const participantsMap = new Map<string, { id: string; username: string; avatarUrl: string | null; name: string | null }>()

      // Buscar assignees do épico (excluindo o autor)
      const assigneesWidget = response.data.workspace.workItem.widgets.find(
        (w) => w.type === 'ASSIGNEES'
      ) as { assignees?: { nodes: Array<{ id: string; username: string; avatarUrl?: string | null; name?: string | null }> } } | undefined

      if (assigneesWidget?.assignees?.nodes) {
        assigneesWidget.assignees.nodes.forEach((assignee) => {
          // Excluir o autor/criador do épico
          if (assignee.id !== authorId && !participantsMap.has(assignee.id)) {
            participantsMap.set(assignee.id, {
              id: assignee.id,
              username: assignee.username,
              avatarUrl: assignee.avatarUrl || null,
              name: assignee.name || null,
            })
          }
        })
      }

      // Buscar participants do épico (excluindo o autor)
      const participantsWidget = response.data.workspace.workItem.widgets.find(
        (w) => w.type === 'PARTICIPANTS'
      ) as { participants?: { nodes: Array<{ id: string; username: string; avatarUrl?: string | null; name?: string | null }> } } | undefined

      if (participantsWidget?.participants?.nodes) {
        participantsWidget.participants.nodes.forEach((participant) => {
          // Excluir o autor/criador do épico
          if (participant.id !== authorId && !participantsMap.has(participant.id)) {
            participantsMap.set(participant.id, {
              id: participant.id,
              username: participant.username,
              avatarUrl: participant.avatarUrl || null,
              name: participant.name || null,
            })
          }
        })
      }

      return Array.from(participantsMap.values())
    } catch {
      return []
    }
  }

  async getMilestones(groupId: string, search?: string): Promise<Array<{ id: string; title: string; webPath: string }>> {
    try {
      const allMilestones: Array<{ id: string; title: string; webPath?: string }> = []
      let hasNextPage = true
      let cursor: string | null = null

      while (hasNextPage) {
        const milestonesQuery = search
          ? gql`
              query GroupMilestones($fullPath: ID!, $searchTitle: String!, $after: String) {
                group(fullPath: $fullPath) {
                  milestones(
                    searchTitle: $searchTitle
                    includeAncestors: true
                    includeDescendants: true
                    sort: EXPIRED_LAST_DUE_DATE_ASC
                    state: active
                    first: ${PAGE_SIZE}
                    after: $after
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      title
                      webPath
                    }
                  }
                }
              }
            `
          : gql`
              query GroupMilestones($fullPath: ID!, $after: String) {
                group(fullPath: $fullPath) {
                  milestones(
                    includeAncestors: true
                    includeDescendants: true
                    sort: EXPIRED_LAST_DUE_DATE_ASC
                    state: active
                    first: ${PAGE_SIZE}
                    after: $after
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      title
                      webPath
                    }
                  }
                }
              }
            `

        type GroupMilestonesResponse = {
          group: {
            milestones: {
              nodes: Array<{ id: string; title: string; webPath?: string }>
              pageInfo: { hasNextPage: boolean; endCursor: string | null }
            }
          }
        }
        const response: ApolloQueryResult<GroupMilestonesResponse> =
          await this.client.query<GroupMilestonesResponse>({
          query: milestonesQuery,
          variables: {
            fullPath: groupId,
            ...(search ? { searchTitle: search } : {}),
            ...(cursor ? { after: cursor } : {}),
          },
          fetchPolicy: 'no-cache',
        })

        allMilestones.push(...response.data.group.milestones.nodes)
        hasNextPage = response.data.group.milestones.pageInfo.hasNextPage
        cursor = response.data.group.milestones.pageInfo.endCursor
      }

      return allMilestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        webPath: milestone.webPath || '',
      })).sort((a, b) => a.title.localeCompare(b.title))
    } catch (error) {
      throw new Error(
        `Erro ao buscar milestones: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  async getAllEpics(milestoneTitle?: string): Promise<Epic[]> {
    try {
      const user = await this.getCurrentUser()
      
      // Buscar todos os grupos do usuário
      const groups = await this.getGroups()
      
      // Buscar épicos de todos os grupos
      const allEpics: Epic[] = []
      const processedGroups = new Set<string>()
      
      // Sempre tentar buscar do grupo principal primeiro
      const primaryGroup = 'projectengine-team'
      try {
        const primaryEpics = await this.getSprintsByGroup(primaryGroup, user.id, milestoneTitle)
        allEpics.push(...primaryEpics)
        processedGroups.add(primaryGroup)
      } catch {
        // Continuar mesmo se houver erro no grupo principal
      }
      
      // Buscar épicos de todos os grupos encontrados (exceto o principal se já foi processado)
      for (const group of groups) {
        if (!processedGroups.has(group.fullPath)) {
          try {
            const groupEpics = await this.getSprintsByGroup(group.fullPath, user.id, milestoneTitle)
            allEpics.push(...groupEpics)
            processedGroups.add(group.fullPath)
          } catch {
            // Continuar mesmo se um grupo falhar
          }
        }
      }

      // Ordenar épicos por título
      const sortedEpics = allEpics.sort((a, b) => a.title.localeCompare(b.title))
      return sortedEpics
    } catch (error) {
      throw new Error(
        `Erro ao buscar épicos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  async getSprintsByGroup(groupId: string, userId: string, milestoneTitle?: string): Promise<Epic[]> {
    try {
      let allEpicNodes: Array<{
            id: string
            title: string
            webUrl: string
            description?: string | null
            issues: {
              nodes: Array<{
                id: string
                name: string
                webUrl: string
                weight?: number | null
                timeEstimate?: number | null
                state: string
                milestone?: {
                  id: string
                  title: string
                  webPath: string
                } | null
                assignees: {
                  nodes: Array<{
                    id: string
                    username: string
                    avatarUrl?: string | null
                    name?: string | null
                  }>
                }
                participants?: {
                  nodes: Array<{
                    id: string
                    username: string
                    avatarUrl?: string | null
                    name?: string | null
                  }>
                }
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
                  nodes: Array<{
                    id: string
                    spentAt: string
                    summary: string
                    timeSpent: number
                    user: {
                      id: string
                      username: string
                    }
                  }>
                }
              }>
            }
          }> = []
      
      let hasNextPage = true
      let cursor: string | null = null

      // Primeiro, buscar épicos usando namespace.workItems (mais eficiente, retorna assignees diretamente)
      // Usar webUrl como chave para fazer match com group.epics (já que os IDs são diferentes)
      const epicWorkItemsMap = new Map<string, {
        id: string
        workItemId: string
        iid: string
        title: string
        webUrl: string
        authorId: string
        assignees: Array<{ id: string; username: string; avatarUrl: string | null; name: string | null }>
      }>()

      let workItemsHasNextPage = true
      let workItemsCursor: string | null = null

      while (workItemsHasNextPage) {
        let workItemsQuery: ReturnType<typeof gql>
        
        // Usar variáveis do GraphQL para milestoneTitle ao invés de interpolação
        if (workItemsCursor) {
          if (milestoneTitle) {
            workItemsQuery = gql`
              query GetEpics($fullPath: ID!, $milestoneTitle: [String!], $after: String) {
                namespace(fullPath: $fullPath) {
                  workItems(
                    types: [EPIC]
                    state: opened
                    milestoneTitle: $milestoneTitle
                    after: $after
                    first: 100
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      webUrl
                      author {
                        id
                        username
                        avatarUrl
                        name
                      }
                      widgets(onlyTypes: [ASSIGNEES]) {
                        type
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              username
                              avatarUrl
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `
          } else {
            workItemsQuery = gql`
              query GetEpics($fullPath: ID!, $after: String) {
                namespace(fullPath: $fullPath) {
                  workItems(
                    types: [EPIC]
                    state: opened
                    after: $after
                    first: 100
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      webUrl
                      author {
                        id
                        username
                        avatarUrl
                        name
                      }
                      widgets(onlyTypes: [ASSIGNEES]) {
                        type
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              username
                              avatarUrl
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `
          }
        } else {
          if (milestoneTitle) {
            workItemsQuery = gql`
              query GetEpics($fullPath: ID!, $milestoneTitle: [String!]) {
                namespace(fullPath: $fullPath) {
                  workItems(
                    types: [EPIC]
                    state: opened
                    milestoneTitle: $milestoneTitle
                    first: 100
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      webUrl
                      author {
                        id
                        username
                        avatarUrl
                        name
                      }
                      widgets(onlyTypes: [ASSIGNEES]) {
                        type
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              username
                              avatarUrl
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `
          } else {
            workItemsQuery = gql`
              query GetEpics($fullPath: ID!) {
                namespace(fullPath: $fullPath) {
                  workItems(
                    types: [EPIC]
                    state: opened
                    first: 100
                  ) {
                    pageInfo {
                      hasNextPage
                      endCursor
                    }
                    nodes {
                      id
                      iid
                      title
                      webUrl
                      author {
                        id
                        username
                        avatarUrl
                        name
                      }
                      widgets(onlyTypes: [ASSIGNEES]) {
                        type
                        ... on WorkItemWidgetAssignees {
                          assignees {
                            nodes {
                              id
                              username
                              avatarUrl
                              name
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `
          }
        }

        const queryVariables: { fullPath: string; milestoneTitle?: string[]; after?: string } = {
          fullPath: groupId,
        }
        
        if (milestoneTitle) {
          queryVariables.milestoneTitle = [milestoneTitle]
        }
        
        if (workItemsCursor) {
          queryVariables.after = workItemsCursor
        }

        const workItemsResponse = await this.client.query<{
          namespace: {
            workItems: {
              pageInfo: {
                hasNextPage: boolean
                endCursor: string
              }
              nodes: Array<{
                id: string
                iid: string
                title: string
                webUrl: string
                author: {
                  id: string
                  username: string
                  avatarUrl?: string | null
                  name?: string | null
                }
                widgets: Array<{
                  type: string
                  assignees?: {
                    nodes: Array<{
                      id: string
                      username: string
                      avatarUrl?: string | null
                      name?: string | null
                    }>
                  }
                }>
              }>
            }
          }
        }>({
          query: workItemsQuery,
          variables: queryVariables,
          fetchPolicy: 'no-cache',
        })

        if (!workItemsResponse.data?.namespace) {
          throw new Error(`Namespace "${groupId}" não encontrado ou sem permissão de acesso.`)
        }

        const workItemNodes = workItemsResponse.data.namespace.workItems.nodes || []
        workItemNodes.forEach((workItem: {
          id: string
          iid: string
          title: string
          webUrl: string
          author: {
            id: string
            username: string
            avatarUrl?: string | null
            name?: string | null
          }
          widgets: Array<{
            type: string
            assignees?: {
              nodes: Array<{
                id: string
                username: string
                avatarUrl?: string | null
                name?: string | null
              }>
            }
          }>
        }) => {
          const assigneesWidget = workItem.widgets.find((w: { type: string }) => w.type === 'ASSIGNEES') as { assignees?: { nodes: Array<{ id: string; username: string; avatarUrl?: string | null; name?: string | null }> } } | undefined
          const assignees = assigneesWidget?.assignees?.nodes || []
          
          // Excluir o autor dos assignees
          const epicAssignees = assignees
            .filter(a => a.id !== workItem.author.id)
            .map(a => ({
              id: a.id,
              username: a.username,
              avatarUrl: a.avatarUrl || null,
              name: a.name || null,
            }))

          // Usar webUrl como chave para fazer match com group.epics
          epicWorkItemsMap.set(workItem.webUrl, {
            id: workItem.id,
            workItemId: workItem.id,
            iid: workItem.iid,
            title: workItem.title,
            webUrl: workItem.webUrl,
            authorId: workItem.author.id,
            assignees: epicAssignees,
          })
        })

        workItemsHasNextPage = workItemsResponse.data.namespace.workItems.pageInfo?.hasNextPage || false
        workItemsCursor = workItemsResponse.data.namespace.workItems.pageInfo?.endCursor || null
      }

      // Agora buscar as issues de cada épico usando group.epics
      // Buscar todos os épicos com paginação
      while (hasNextPage) {
        let epicQuery: ReturnType<typeof gql>
        
        if (cursor) {
          epicQuery = gql`
            query GroupEpics {
              group(fullPath: "${groupId}") {
                epics(state: opened, first: 100, after: "${cursor}") {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    id
                    title
                    webUrl
                    description
                    issues(first: 100) {
                      nodes {
                        id
                        name
                        webUrl
                        weight
                        timeEstimate
                        state
                        milestone {
                          id
                          title
                          webPath
                        }
                        assignees {
                          nodes {
                            id
                            username
                            avatarUrl
                            name
                          }
                        }
                        participants {
                          nodes {
                            id
                            username
                            avatarUrl
                            name
                          }
                        }
                        iteration {
                          id
                          title
                          description
                          startDate
                          dueDate
                        }
                        timelogs(first: ${PAGE_SIZE}) {
                          count
                          totalSpentTime
                          nodes {
                            id
                            spentAt
                            summary
                            timeSpent
                            user {
                              id
                              username
                            }
                          }
                          pageInfo {
                            hasNextPage
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `
        } else {
          epicQuery = createEpicsQuery(groupId)
        }

        const response = await this.client.query<{
          group: {
            epics: {
              pageInfo?: {
                hasNextPage: boolean
                endCursor: string
              }
              nodes: Array<{
                id: string
                title: string
                webUrl: string
                description?: string | null
                issues: {
                  nodes: Array<{
                    id: string
                    name: string
                    webUrl: string
                    weight?: number | null
                    timeEstimate?: number | null
                    state: string
                    milestone?: {
                      id: string
                      title: string
                      webPath: string
                    } | null
                    assignees: {
                      nodes: Array<{
                        id: string
                        username: string
                        avatarUrl?: string | null
                        name?: string | null
                      }>
                    }
                    participants?: {
                      nodes: Array<{
                        id: string
                        username: string
                        avatarUrl?: string | null
                        name?: string | null
                      }>
                    }
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
                      nodes: Array<{
                        id: string
                        spentAt: string
                        summary: string
                        timeSpent: number
                        user: {
                          id: string
                          username: string
                        }
                      }>
                    }
                  }>
                }
              }>
            }
          } | null
        }>({
          query: epicQuery,
          fetchPolicy: 'no-cache',
        })

        if (!response.data?.group) {
          throw new Error(`Grupo "${groupId}" não encontrado ou sem permissão de acesso.`)
        }

        if (!response.data.group.epics) {
          throw new Error('Não foi possível buscar épicos do grupo.')
        }

        const epicNodes = response.data.group.epics.nodes || []
        allEpicNodes.push(...epicNodes)

        // Verificar se há mais páginas
        hasNextPage = response.data.group.epics.pageInfo?.hasNextPage || false
        cursor = response.data.group.epics.pageInfo?.endCursor || null
      }

      // Buscar todas as issues de cada épico (sem limite de 100)
      allEpicNodes = await Promise.all(
        allEpicNodes.map(async (epic) => ({
          ...epic,
          issues: {
            nodes: await this.fetchAllEpicIssues(epic.id),
          },
        }))
      )

      const epics: Epic[] = []
      
      allEpicNodes.forEach((epic) => {
        // Verificar se o épico está no mapa de workItems (filtrado por milestone)
        // Usar webUrl para fazer match, já que os IDs são diferentes (WorkItem vs Epic)
        const epicWorkItem = epicWorkItemsMap.get(epic.webUrl)
        
        if (milestoneTitle && !epicWorkItem) {
          // Com filtro de milestone, pular épicos que não estão no mapa
          return
        }

        // Mostrar todas as issues, não apenas as atribuídas ao usuário
        const allEpicIssues = epic.issues.nodes // Todas as issues do épico (para assignees)
        let allIssues = allEpicIssues // Issues filtradas (para sprints)

        // Filtrar por milestone se especificado
        if (milestoneTitle) {
          allIssues = allIssues.filter((issue) => 
            issue.milestone?.title === milestoneTitle
          )

          // Se não houver issues com o milestone, pular este épico
          if (allIssues.length === 0) {
            return
          }
        }

        // Agrupar todas as issues por sprint
        const sprintsMap = new Map<string, SprintIssue[]>()

        allIssues.forEach((issue) => {
          const sprintId = issue.iteration?.id || 'no-sprint'

          if (!sprintsMap.has(sprintId)) {
            sprintsMap.set(sprintId, [])
          }

          const sprintIssue: SprintIssue = {
            id: issue.id,
            name: issue.name,
            webUrl: issue.webUrl,
            weight: issue.weight,
            timeEstimate: issue.timeEstimate,
            state: issue.state,
            totalSpentTime: issue.timelogs.totalSpentTime,
            // Filtrar timelogs apenas do usuário atual
            timelogs: issue.timelogs.nodes
              .filter((tl) => tl.user.id === userId)
              .map((tl) => ({
                timeLoggedInSeconds: tl.timeSpent,
                description: tl.summary,
                date: tl.spentAt,
              })),
            // Incluir assignees
            assignees: issue.assignees.nodes.map((assignee) => ({
              id: assignee.id,
              username: assignee.username,
              avatarUrl: assignee.avatarUrl || null,
              name: assignee.name || null,
            })),
          }

          sprintsMap.get(sprintId)!.push(sprintIssue)
        })

        // Construir sprints
        const sprints: Sprint[] = []
        sprintsMap.forEach((issues, sprintId) => {
          const firstIssue = allIssues.find(
            (issue) => (issue.iteration?.id || 'no-sprint') === sprintId
          )
          const sprint: Sprint = {
            id: sprintId,
            title: firstIssue?.iteration?.title || 'Sem Sprint',
            description: firstIssue?.iteration?.description || null,
            startDate: firstIssue?.iteration?.startDate || null,
            dueDate: firstIssue?.iteration?.dueDate || null,
            issues,
          }
          sprints.push(sprint)
        })

        // Ordenar sprints por data de início
        sprints.sort((a, b) => {
          if (!a.startDate) return 1
          if (!b.startDate) return -1
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        })

        // Agregar assignees e participants únicos de TODAS as issues do épico (não apenas as filtradas)
        // Começar com os assignees diretos do épico (via workItems)
        const allAssignees = new Map<string, { id: string; username: string; avatarUrl: string | null; name: string | null }>()
        const assigneesSet = new Set<string>()
        const participantsSet = new Set<string>()
        
        // Adicionar assignees diretos do épico (já excluindo o autor) se disponível
        if (epicWorkItem) {
          epicWorkItem.assignees.forEach((assignee) => {
            assigneesSet.add(assignee.id)
            allAssignees.set(assignee.id, assignee)
          })
        }
        
        allEpicIssues.forEach((issue) => {
          // Adicionar assignees das issues
          if (issue.assignees && issue.assignees.nodes) {
            issue.assignees.nodes.forEach((assignee) => {
              assigneesSet.add(assignee.id)
              if (!allAssignees.has(assignee.id)) {
                allAssignees.set(assignee.id, {
                  id: assignee.id,
                  username: assignee.username,
                  avatarUrl: assignee.avatarUrl || null,
                  name: assignee.name || null,
                })
              }
            })
          }
          // Adicionar participants das issues
          if (issue.participants && issue.participants.nodes) {
            issue.participants.nodes.forEach((participant) => {
              participantsSet.add(participant.id)
              if (!allAssignees.has(participant.id)) {
                allAssignees.set(participant.id, {
                  id: participant.id,
                  username: participant.username,
                  avatarUrl: participant.avatarUrl || null,
                  name: participant.name || null,
                })
              }
            })
          }
        })
        const epicAssignees = Array.from(allAssignees.values())

        epics.push({
          id: epic.id,
          title: epic.title,
          webUrl: epic.webUrl,
          description: epic.description || null,
          sprints,
          assignees: epicAssignees,
        })
      })

      // Ordenar épicos por título
      const sortedEpics = epics.sort((a, b) => a.title.localeCompare(b.title))
      return sortedEpics
    } catch (error) {
      throw new Error(
        `Erro ao buscar épicos do grupo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  async getSprints(groupId: string): Promise<Epic[]> {
    const user = await this.getCurrentUser()
    return this.getSprintsByGroup(groupId, user.id)
  }

  async getGroups(): Promise<Array<{ id: string; fullPath: string; name: string }>> {
    try {
      const allGroups: Array<{ id: string; fullPath: string; name: string }> = []
      let hasNextPage = true
      let cursor: string | null = null

      while (hasNextPage) {
        type CurrentUserGroupsResponse = {
          currentUser: {
            groups: {
              nodes: Array<{ id: string; fullPath: string; name: string }>
              pageInfo: { hasNextPage: boolean; endCursor: string | null }
            }
          }
        }
        const response: ApolloQueryResult<CurrentUserGroupsResponse> =
          await this.client.query<CurrentUserGroupsResponse>({
          query: gql`
            query CurrentUserGroups($after: String) {
              currentUser {
                groups(first: ${PAGE_SIZE}, after: $after) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  nodes {
                    id
                    fullPath
                    name
                  }
                }
              }
            }
          `,
          variables: cursor ? { after: cursor } : {},
          fetchPolicy: 'no-cache',
        })

        if (!response.data?.currentUser?.groups) {
          break
        }

        allGroups.push(...response.data.currentUser.groups.nodes)
        hasNextPage = response.data.currentUser.groups.pageInfo.hasNextPage
        cursor = response.data.currentUser.groups.pageInfo.endCursor
      }

      return allGroups.map((group) => ({
        id: group.id,
        fullPath: group.fullPath,
        name: group.name,
      })).sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      throw new Error(
        `Erro ao buscar grupos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  static downloadCSV(content: TimeLog[], date: Date): void {
    const data = GitLabService.formatCSVData(content)
    const filename = `horas-trabalhadas-${date.getMonth()}-${date.getDate()}.csv`

    const blob = new Blob([data], { type: 'text/csv;charset=utf-16le' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

