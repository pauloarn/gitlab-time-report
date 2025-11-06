import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Tabs from '@/components/ui/tabs'
import { TimeLogTable } from '@/components/ui/timelogtable'
import { InsightsTable } from '@/components/ui/insightstable'
import { BusinessHours } from '@/components/ui/businesshours'
import { format } from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import type { TimeLog, Insight, Holiday } from '@/types'

interface ReportTabsProps {
  timeLogs: TimeLog[]
  totalTime: number
  insights: Insight[]
  selectedDate: Date
  holidays: Holiday[]
}

export function ReportTabs({
  timeLogs,
  totalTime,
  insights,
  selectedDate,
  holidays,
}: ReportTabsProps) {
  if (timeLogs.length === 0) {
    return null
  }

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

  return (
    <Tabs
      items={[
        {
          title: 'Geral',
          component: (
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
                      return <span className="text-gray-400">-</span>
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
                      return <span className="text-gray-400">-</span>
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
          ),
        },
        {
          title: 'Insights',
          component: (
            <InsightsTable
              data={insights}
              selectedDate={selectedDate}
              holidays={holidays}
            />
          ),
        },
        {
          title: 'Horas Úteis',
          component: (
            <BusinessHours selectedDate={selectedDate} totalTime={totalTime} />
          ),
        },
      ]}
    />
  )
}

