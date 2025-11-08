import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { format, isBefore } from 'date-fns'
import type {
  Epic,
  GitLabQueryResponse,
  GitLabUser,
  IssueValidation,
  MonthPeriod,
  Sprint,
  SprintIssue,
  TimeLog,
} from '@/types'
import { convertTimeInHoursMinSec, getNumber, isDateBetween } from '@/lib/utils'

const BASE_URL = 'https://gitlab.com/api/graphql'

// Tipo para a resposta da query de sprints
interface SprintsQueryResponse {
  issues: {
    count: number
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
        description?: string | null
        startDate?: string | null
        dueDate?: string | null
      } | null
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
}

const getMonthPeriod = (selectedDate: Date): MonthPeriod => {
  const y = selectedDate.getFullYear()
  const m = selectedDate.getMonth()
  return {
    firstDay: new Date(y, m, 1).toISOString(),
    lastDay: new Date(y, m + 1, 0).toISOString(),
  }
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

const createTimeLogQuery = (userId: string, selectedDate: string) => {
  return gql`
    query CurrentUser {
      issues(assigneeId: "${userId}", first: 100, updatedAfter: "${selectedDate}") {
        count
        weight
        nodes {
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
          timelogs(first: 100) {
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
  `
}

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
                  }
                }
                iteration {
                  id
                  title
                  description
                  startDate
                  dueDate
                }
                timelogs(first: 100) {
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

const createSprintsQuery = (userId: string) => {
  return gql`
    query CurrentUser {
      issues(assigneeId: "${userId}", first: 100) {
        count
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
            description
            startDate
            dueDate
          }
          iteration {
            id
            title
            description
            startDate
            dueDate
          }
          timelogs(first: 100) {
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
  `
}

export class GitLabService {
  private client: ApolloClient<unknown>

  constructor(userAccessToken: string) {
    this.client = new ApolloClient({
      uri: BASE_URL,
      headers: {
        Authorization: `Bearer ${userAccessToken}`,
      },
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

  async generateReport(selectedMonth: Date): Promise<{
    timeLogs: TimeLog[]
    validations: IssueValidation[]
  }> {
    try {
      const user = await this.getCurrentUser()
      const dateReferences = getMonthPeriod(selectedMonth)

      const response = await this.client.query<GitLabQueryResponse>({
        query: createTimeLogQuery(getNumber(user.id), dateReferences.firstDay),
      })

      const timeLogs: TimeLog[] = []
      const validations: IssueValidation[] = []

      response.data.issues.nodes.forEach((node) => {
        const timeLogAux: TimeLog = {
          taskName: node.name,
          webUrl: node.webUrl,
          weight: node.weight,
          timeEstimate: node.timeEstimate,
          iteration: node.iteration ? {
            id: node.iteration.id,
            title: node.iteration.title,
            description: node.iteration.description || null,
            startDate: node.iteration.startDate || null,
            dueDate: node.iteration.dueDate || null,
          } : null,
          dataTrack: [],
        }

        node.timelogs.nodes.forEach((timeLog) => {
          if (
            timeLog.user.id === user.id &&
            isDateBetween(
              new Date(timeLog.spentAt),
              new Date(dateReferences.firstDay),
              new Date(dateReferences.lastDay)
            )
          ) {
            timeLogAux.dataTrack.push({
              timeLoggedInSeconds: timeLog.timeSpent,
              description: timeLog.summary,
              date: timeLog.spentAt,
            })
          }
        })

        // Verificar se a issue tem weight e timeEstimate apenas se tiver time logs
        if (timeLogAux.dataTrack.length > 0) {
          const hasWeight = node.weight !== null && node.weight !== undefined
          const hasTimeEstimate =
            node.timeEstimate !== null && node.timeEstimate !== undefined

          // Adicionar à lista de validações se faltar alguma informação
          if (!hasWeight || !hasTimeEstimate) {
            validations.push({
              hasWeight,
              hasTimeEstimate,
              issueName: node.name,
              issueUrl: node.webUrl,
            })
          }

          timeLogAux.dataTrack.sort((a, b) => {
            const dateA = new Date(a.date)
            const dateB = new Date(b.date)
            return dateA.getTime() - dateB.getTime()
          })
          timeLogs.push(timeLogAux)
        }
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
      throw new Error(
        `Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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

  async getMilestones(groupId: string, search?: string): Promise<Array<{ id: string; title: string; webPath: string }>> {
    try {
      const searchFilter = search ? `searchTitle: "${search}", ` : ''
      const response = await this.client.query<{
        group: {
          milestones: {
            nodes: Array<{
              id: string
              title: string
              webPath?: string
            }>
          }
        }
      }>({
        query: gql`
          query GroupMilestones {
            group(fullPath: "${groupId}") {
              milestones(
                ${searchFilter}
                includeAncestors: true
                includeDescendants: true
                sort: EXPIRED_LAST_DUE_DATE_ASC
                state: active
                first: 100
              ) {
                nodes {
                  id
                  title
                  webPath
                }
              }
            }
          }
        `,
        fetchPolicy: 'no-cache',
      })

      return response.data.group.milestones.nodes.map((milestone) => ({
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
        console.log(`Buscando épicos do grupo principal: ${primaryGroup}${milestoneTitle ? ` (milestone: ${milestoneTitle})` : ''}`)
        const primaryEpics = await this.getSprintsByGroup(primaryGroup, user.id, milestoneTitle)
        console.log(`Encontrados ${primaryEpics.length} épicos no grupo ${primaryGroup}`)
        allEpics.push(...primaryEpics)
        processedGroups.add(primaryGroup)
      } catch (error) {
        console.error(`Erro ao buscar épicos do grupo principal ${primaryGroup}:`, error)
      }
      
      // Buscar épicos de todos os grupos encontrados (exceto o principal se já foi processado)
      for (const group of groups) {
        if (!processedGroups.has(group.fullPath)) {
          try {
            const groupEpics = await this.getSprintsByGroup(group.fullPath, user.id, milestoneTitle)
            allEpics.push(...groupEpics)
            processedGroups.add(group.fullPath)
          } catch (error) {
            // Continuar mesmo se um grupo falhar
            console.warn(`Erro ao buscar épicos do grupo ${group.name} (${group.fullPath}):`, error)
          }
        }
      }

      // Ordenar épicos por título
      const sortedEpics = allEpics.sort((a, b) => a.title.localeCompare(b.title))
      console.log(`Total de épicos retornados (todos os grupos): ${sortedEpics.length}`)
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
                          }
                        }
                        iteration {
                          id
                          title
                          description
                          startDate
                          dueDate
                        }
                        timelogs(first: 100) {
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
        console.log(`Grupo ${groupId}: encontrados ${epicNodes.length} épicos nesta página`)
        allEpicNodes.push(...epicNodes)

        // Verificar se há mais páginas
        hasNextPage = response.data.group.epics.pageInfo?.hasNextPage || false
        cursor = response.data.group.epics.pageInfo?.endCursor || null
      }

      console.log(`Total de épicos encontrados no grupo ${groupId}: ${allEpicNodes.length}`)

      const epics: Epic[] = []

      allEpicNodes.forEach((epic) => {
        // Mostrar todas as issues, não apenas as atribuídas ao usuário
        let allIssues = epic.issues.nodes

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

        // Verificar se o usuário participa deste épico
        // (tem issues atribuídas ou tem timelogs)
        const userParticipates = allIssues.some((issue) => {
          // Verificar se o usuário é assignee
          const isAssignee = issue.assignees.nodes.some((assignee) => assignee.id === userId)
          
          // Verificar se o usuário tem timelogs nesta issue
          const hasTimelogs = issue.timelogs.nodes.some((tl) => tl.user.id === userId)
          
          return isAssignee || hasTimelogs
        })

        // Se o usuário não participa, pular este épico
        if (!userParticipates) {
          return
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

        epics.push({
          id: epic.id,
          title: epic.title,
          webUrl: epic.webUrl,
          description: epic.description || null,
          sprints,
        })
      })

      // Ordenar épicos por título
      const sortedEpics = epics.sort((a, b) => a.title.localeCompare(b.title))
      console.log(`Épicos processados e retornados do grupo ${groupId}: ${sortedEpics.length}`)
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
      const response = await this.client.query<{
        currentUser: {
          groups: {
            nodes: Array<{
              id: string
              fullPath: string
              name: string
            }>
          }
        }
      }>({
        query: gql`
          query CurrentUserGroups {
            currentUser {
              groups(first: 100) {
                nodes {
                  id
                  fullPath
                  name
                }
              }
            }
          }
        `,
        fetchPolicy: 'no-cache',
      })

      if (!response.data?.currentUser?.groups) {
        return []
      }

      return response.data.currentUser.groups.nodes.map((group) => ({
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

