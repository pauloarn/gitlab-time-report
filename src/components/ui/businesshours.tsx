import React, { useState, useEffect, useRef } from 'react'
import { getFormattedBusinessHours } from '@/lib/businessHours'
import { useHolidays } from '@/hooks/useHolidays'
import { SuccessAnimation } from '@/components/ui/SuccessAnimation'

interface BusinessHoursProps {
  selectedDate: Date
  totalTime: number
}

export function BusinessHours({ selectedDate, totalTime }: BusinessHoursProps) {
  const [hoursPerDay, setHoursPerDay] = useState<number>(8)
  const { data: holidays = [], isLoading, error } = useHolidays(
    selectedDate.getFullYear()
  )
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false)
  const hasPlayedRef = useRef<boolean>(false)

  const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHoursPerDay(Number(event.target.value))
  }

  const businessHoursInfo = getFormattedBusinessHours(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    hoursPerDay,
    holidays,
    totalTime || 0
  )

  // Play animation only when completed and not played yet
  useEffect(() => {
    if (
      businessHoursInfo.remainingHours <= 0 &&
      businessHoursInfo.isComplete &&
      !hasPlayedRef.current
    ) {
      setShowSuccessAnimation(true)
      hasPlayedRef.current = true
    }
    if (businessHoursInfo.remainingHours > 0) {
      hasPlayedRef.current = false
    }
  }, [businessHoursInfo.remainingHours, businessHoursInfo.isComplete])

  if (isLoading) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="text-red-600 dark:text-red-400">
          Erro ao carregar feriados. Por favor, tente novamente.
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {showSuccessAnimation && (
        <SuccessAnimation onComplete={() => setShowSuccessAnimation(false)} />
      )}
      <h2 className="text-xl font-semibold mb-4 dark:text-gray-100">Cálculo de Horas Úteis</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Horas por Dia
          </label>
          <input
            type="number"
            min="1"
            max="24"
            value={hoursPerDay}
            onChange={handleHoursChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h3 className="text-lg font-medium mb-2 dark:text-gray-100">Resumo de Horas</h3>
          <div className="space-y-2">
            <p className="dark:text-gray-300">
              <span className="font-medium">Mês:</span> {businessHoursInfo.monthName}
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">Dias Úteis:</span>{' '}
              {businessHoursInfo.businessDays}
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">Horas por Dia:</span>{' '}
              {businessHoursInfo.hoursPerDay}
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">Horas Esperadas:</span>{' '}
              {businessHoursInfo.totalHours.toFixed(1)}h
            </p>
            <p className="dark:text-gray-300">
              <span className="font-medium">Horas Registradas:</span>{' '}
              {businessHoursInfo.loggedHours.toFixed(1)}h
            </p>
            <p
              className={`font-medium ${
                businessHoursInfo.remainingHours > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {businessHoursInfo.remainingHours > 0
                ? `Faltam ${businessHoursInfo.remainingHours.toFixed(1)}h`
                : 'Horas completadas!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

