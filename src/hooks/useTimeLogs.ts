import { useState, useCallback } from 'react'
import { GitLabService } from '@/services/gitlab.service'
import type { TimeLog, Insight } from '@/types'

export function useTimeLogs() {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [totalTime, setTotalTime] = useState<number>(0)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  const extractInsights = useCallback((data: TimeLog[]) => {
    const dates: Record<string, number> = {}
    
    data.forEach((item) => {
      item.dataTrack.forEach((entry) => {
        const key = entry.date.split('T')[0]
        if (dates[key]) {
          dates[key] += entry.timeLoggedInSeconds
        } else {
          dates[key] = entry.timeLoggedInSeconds
        }
      })
    })

    const final: Insight[] = Object.keys(dates).map((key) => ({
      date: key,
      time: dates[key],
    }))

    final.sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return dateA.getTime() - dateB.getTime()
    })

    setInsights(final)
  }, [])

  const generateReport = useCallback(
    async (token: string, selectedDate: Date) => {
      if (!token) {
        throw new Error('Token é obrigatório')
      }

      setLoading(true)
      try {
        const gitlabService = new GitLabService(token)
        const csvContent = await gitlabService.generateReport(selectedDate)

        const auxTotal = csvContent.reduce((acc, element) => {
          return (
            acc +
            element.dataTrack.reduce(
              (sum, secondary) => sum + secondary.timeLoggedInSeconds,
              0
            )
          )
        }, 0)

        setTotalTime(auxTotal)
        setTimeLogs(csvContent)
        extractInsights(csvContent)

        return csvContent
      } finally {
        setLoading(false)
      }
    },
    [extractInsights]
  )

  const downloadCSV = useCallback((date: Date) => {
    GitLabService.downloadCSV(timeLogs, date)
  }, [timeLogs])

  const reset = useCallback(() => {
    setTimeLogs([])
    setTotalTime(0)
    setInsights([])
  }, [])

  return {
    timeLogs,
    totalTime,
    insights,
    loading,
    generateReport,
    downloadCSV,
    reset,
  }
}

