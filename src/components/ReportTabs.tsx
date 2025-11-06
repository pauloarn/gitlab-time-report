import React from 'react'
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
                  dataTrack: [
                    { description: 'Total', timeLoggedInSeconds: totalTime, date: '' },
                  ],
                },
              ]}
              mainKeyInfo={{ key: 'taskName', title: 'Tarefa' }}
              subKey="dataTrack"
              listOfItems={[
                {
                  key: 'description',
                  title: 'Descrição Hora',
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

