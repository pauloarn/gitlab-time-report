import { AlertTriangle } from 'lucide-react'
import { TimeLogTable } from '@/components/ui/timelogtable'
import { InsightsTable } from '@/components/ui/insightstable'
import { BusinessHours } from '@/components/ui/businesshours'
import { format } from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import type { TimeLog, Insight, Holiday } from '@/types'

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
  // Calcular totais de Weight e Time Estimate
  const totalWeight = timeLogs.reduce((sum, log) => {
    return sum + (log.weight && typeof log.weight === 'number' ? log.weight : 0)
  }, 0)

  const totalTimeEstimate = timeLogs.reduce((sum, log) => {
    return sum + (log.timeEstimate && typeof log.timeEstimate === 'number' ? log.timeEstimate : 0)
  }, 0)

  // Verificar se pelo menos uma issue tem weight/timeEstimate
  const hasAnyWeight = timeLogs.some((log) => log.weight !== null && log.weight !== undefined)
  const hasAnyTimeEstimate = timeLogs.some(
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
        <TimeLogTable
          data={[
            ...timeLogs,
            {
              taskName: 'Total',
              webUrl: '',
              weight: hasAnyWeight ? totalWeight : null,
              timeEstimate: hasAnyTimeEstimate ? totalTimeEstimate : null,
              dataTrack: [
                { description: 'Total', timeLoggedInSeconds: totalTime, date: '' },
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
              key: 'date',
              title: 'Data',
              render: (data: string) => {
                if (data) {
                  return format(new Date(data), 'dd/MM/yyyy')
                }
                return ''
              },
            },
            {
              key: 'timeLoggedInSeconds',
              title: 'Horas Trabalhadas',
              render: convertTimeInHoursMinSec,
            },
          ]}
        />
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

