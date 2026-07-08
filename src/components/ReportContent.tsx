import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Search, X } from 'lucide-react'
import { TimeLogTable } from '@/components/ui/timelogtable'
import { InsightsTable } from '@/components/ui/insightstable'
import { BusinessHours } from '@/components/ui/businesshours'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import type { TimeLog, Insight, Holiday } from '@/types'

function matchesIssueSearch(log: TimeLog, query: string): boolean {
  const term = query.trim().toLowerCase()
  if (!term) return true

  if (log.taskName.toLowerCase().includes(term)) return true
  if (log.webUrl.toLowerCase().includes(term)) return true
  if (log.iteration?.title?.toLowerCase().includes(term)) return true

  return log.dataTrack.some(
    (entry) =>
      entry.description.toLowerCase().includes(term) ||
      format(new Date(entry.date), 'dd/MM/yyyy').includes(term)
  )
}

interface ReportContentProps {
  activeTab: number
  timeLogs: TimeLog[]
  totalTime: number
  insights: Insight[]
  selectedDate: Date
  holidays: Holiday[]
}

export function ReportContent({
  activeTab,
  timeLogs,
  totalTime,
  insights,
  selectedDate,
  holidays,
}: ReportContentProps) {
  const [issueSearch, setIssueSearch] = useState('')

  useEffect(() => {
    setIssueSearch('')
  }, [selectedDate])

  const filteredTimeLogs = useMemo(() => {
    if (activeTab !== 0 || !issueSearch.trim()) {
      return timeLogs
    }
    return timeLogs.filter((log) => matchesIssueSearch(log, issueSearch))
  }, [activeTab, issueSearch, timeLogs])

  const filteredTotalTime = useMemo(
    () =>
      filteredTimeLogs.reduce(
        (sum, log) =>
          sum + log.dataTrack.reduce((entrySum, entry) => entrySum + entry.timeLoggedInSeconds, 0),
        0
      ),
    [filteredTimeLogs]
  )

  // Calcular totais de Weight e Time Estimate
  const totalWeight = filteredTimeLogs.reduce((sum, log) => {
    return sum + (log.weight && typeof log.weight === 'number' ? log.weight : 0)
  }, 0)

  const totalTimeEstimate = filteredTimeLogs.reduce((sum, log) => {
    return sum + (log.timeEstimate && typeof log.timeEstimate === 'number' ? log.timeEstimate : 0)
  }, 0)

  // Verificar se pelo menos uma issue tem weight/timeEstimate
  const hasAnyWeight = filteredTimeLogs.some((log) => log.weight !== null && log.weight !== undefined)
  const hasAnyTimeEstimate = filteredTimeLogs.some(
    (log) => log.timeEstimate !== null && log.timeEstimate !== undefined
  )

  // Se não houver dados, mostrar mensagem apropriada para cada aba
  if (timeLogs.length === 0) {
    switch (activeTab) {
      case 0: // Geral
        return (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhum registro encontrado para este mês</p>
          </div>
        )
      case 1: // Insights
        return (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhum insight disponível para este mês</p>
          </div>
        )
      case 2: // Horas Úteis
        return (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível para calcular horas úteis</p>
          </div>
        )
      default:
        return null
    }
  }

  switch (activeTab) {
    case 0: // Geral
      return (
        <div>
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <label htmlFor="issue-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar demandas
            </label>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="issue-search"
                type="search"
                value={issueSearch}
                onChange={(e) => setIssueSearch(e.target.value)}
                placeholder="Nome, projeto (ex: venus, ceres), iteration ou descrição..."
                className="pl-9 pr-9"
              />
              {issueSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
                  onClick={() => setIssueSearch('')}
                  aria-label="Limpar busca"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {issueSearch.trim() && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {filteredTimeLogs.length} de {timeLogs.length} demanda(s)
              </p>
            )}
          </div>

          {filteredTimeLogs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma demanda encontrada para &quot;{issueSearch.trim()}&quot;
              </p>
            </div>
          ) : (
            <TimeLogTable
              data={[
                ...filteredTimeLogs,
                {
                  taskName: 'Total',
                  webUrl: '',
                  weight: hasAnyWeight ? totalWeight : null,
                  timeEstimate: hasAnyTimeEstimate ? totalTimeEstimate : null,
                  iteration: null,
                  dataTrack: [
                    { description: 'Total', timeLoggedInSeconds: filteredTotalTime, date: '' },
                  ],
                },
              ]}
              mainKeyInfo={{ key: 'taskName', title: 'Tarefa' }}
              subKey="dataTrack"
              listOfItems={[
                {
                  key: 'weight',
                  title: 'Weight',
                  isIssueLevel: true,
                  render: (value: unknown, item?: TimeLog) => {
                    if (value === null || value === undefined) {
                      const hasTimeEstimate =
                        item?.timeEstimate !== null &&
                        item?.timeEstimate !== undefined
                      if (!hasTimeEstimate) {
                        return (
                          <span className="text-yellow-600 font-medium flex items-center gap-1" title="Sem Weight e Time Estimate">
                            <AlertTriangle className="h-4 w-4" />
                            <span>-</span>
                          </span>
                        )
                      }
                      return <span className="text-gray-400 dark:text-gray-500">-</span>
                    }
                    return <span>{value as number}</span>
                  },
                },
                {
                  key: 'timeEstimate',
                  title: 'Time Estimate',
                  isIssueLevel: true,
                  render: (value: unknown, item?: TimeLog) => {
                    if (value === null || value === undefined) {
                      const hasWeight =
                        item?.weight !== null && item?.weight !== undefined
                      if (!hasWeight) {
                        return (
                          <span className="text-yellow-600 font-medium flex items-center gap-1" title="Sem Weight e Time Estimate">
                            <AlertTriangle className="h-4 w-4" />
                            <span>-</span>
                          </span>
                        )
                      }
                      return <span className="text-gray-400 dark:text-gray-500">-</span>
                    }
                    return <span>{convertTimeInHoursMinSec(value as number)}</span>
                  },
                },
                {
                  key: 'iteration',
                  title: 'Iteration',
                  isIssueLevel: true,
                  render: (_value: unknown, item?: TimeLog) => {
                    const iteration = item?.iteration
                    if (!iteration || !iteration.title) {
                      return <span className="text-gray-400 dark:text-gray-500">-</span>
                    }
                    return <span className="dark:text-gray-100">{iteration.title}</span>
                  },
                },
                {
                  key: 'date',
                  title: 'Data',
                  render: (value: unknown) => {
                    const data = value as string
                    if (data) {
                      return format(new Date(data), 'dd/MM/yyyy')
                    }
                    return ''
                  },
                },
                {
                  key: 'timeLoggedInSeconds',
                  title: 'Horas Trabalhadas',
                  render: (value: unknown) => {
                    return convertTimeInHoursMinSec(value as number)
                  },
                },
              ]}
            />
          )}
        </div>
      )
    case 1: // Insights
      return (
        <InsightsTable
          data={insights}
          selectedDate={selectedDate}
          holidays={holidays}
        />
      )
    case 2: // Horas Úteis
      return (
        <BusinessHours selectedDate={selectedDate} totalTime={totalTime} />
      )
    default:
      return null
  }
}

