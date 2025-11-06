import React from 'react'
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import type { Insight, Holiday } from '@/types'

interface InsightsTableProps {
  data: Insight[]
  selectedDate: Date
  holidays: Holiday[]
}

export function InsightsTable({
  data,
  selectedDate,
  holidays,
}: InsightsTableProps) {
  const getDaysInMonth = () => {
    const start = startOfMonth(selectedDate)
    const end = endOfMonth(selectedDate)
    return eachDayOfInterval({ start, end })
  }

  const days = getDaysInMonth()
  const startingDayIndex = getDay(days[0])
  const holidayDates = holidays.map((h) => h.date)

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
          <div key={day} className="p-2 text-center font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        {Array.from({ length: startingDayIndex }).map((_, index) => (
          <div key={`empty-${index}`} className="p-2" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const dayData = data.find((item) => {
            const itemDate = new Date(item.date)
            itemDate.setDate(itemDate.getDate() + 1)
            return format(itemDate, 'yyyy-MM-dd') === dateStr
          })
          const isHoliday = holidayDates.includes(dateStr)
          return (
            <div
              key={dateStr}
              className="p-2 border dark:border-gray-700 rounded min-h-[80px] text-center dark:bg-gray-800"
            >
              <div className="font-medium dark:text-gray-100">{format(day, 'd')}</div>
              {isHoliday && (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mt-1">
                  Feriado
                </div>
              )}
              {dayData && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {convertTimeInHoursMinSec(dayData.time)}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-4 p-4 border dark:border-gray-700 rounded text-center dark:bg-gray-800">
        <div className="font-medium text-gray-700 dark:text-gray-300">Total de Horas</div>
        <div className="text-lg text-gray-900 dark:text-gray-100">
          {data.reduce((acc, curr) => acc + curr.time, 0) > 0
            ? convertTimeInHoursMinSec(
                data.reduce((acc, curr) => acc + curr.time, 0)
              )
            : '0h 0m 0s'}
        </div>
      </div>
    </div>
  )
}

