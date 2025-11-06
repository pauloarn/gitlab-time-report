import { ApolloClient, gql, InMemoryCache } from '@apollo/client'
import { format, isBefore } from 'date-fns'
import type {
  GitLabQueryResponse,
  GitLabUser,
  IssueValidation,
  MonthPeriod,
  TimeLog,
} from '@/types'
import { convertTimeInHoursMinSec, getNumber, isDateBetween } from '@/lib/utils'

const BASE_URL = 'https://gitlab.com/api/graphql'

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

