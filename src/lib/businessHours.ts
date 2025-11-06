import { translateMonthToPortuguese } from './utils'
import type { BusinessHoursInfo, Holiday } from '@/types'

/**
 * Calculate the number of business days in a given month
 */
export function getBusinessDaysInMonth(
  year: number,
  month: number,
  holidays: Holiday[] = []
): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let businessDays = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    const dateString = date.toISOString().split('T')[0]

    // Skip weekends and holidays
    if (
      dayOfWeek !== 0 &&
      dayOfWeek !== 6 &&
      !holidays.some((h) => h.date === dateString)
    ) {
      businessDays++
    }
  }

  return businessDays
}

/**
 * Calculate total business hours for a given month
 */
export function getBusinessHoursInMonth(
  year: number,
  month: number,
  hoursPerDay = 8,
  holidays: Holiday[] = []
): number {
  const businessDays = getBusinessDaysInMonth(year, month, holidays)
  return businessDays * hoursPerDay
}

/**
 * Get a formatted string of business hours for a given month
 */
export function getFormattedBusinessHours(
  year: number,
  month: number,
  hoursPerDay = 8,
  holidays: Holiday[] = [],
  loggedHours = 0
): BusinessHoursInfo {
  const businessDays = getBusinessDaysInMonth(year, month, holidays)
  const totalHours = businessDays * hoursPerDay
  const monthName = translateMonthToPortuguese(
    new Date(year, month, 1).toLocaleString('default', { month: 'long' })
  )

  // Convert logged hours from seconds to hours
  const loggedHoursInHours = loggedHours / 3600
  const remainingHours = totalHours - loggedHoursInHours

  return {
    monthName,
    businessDays,
    totalHours,
    hoursPerDay,
    loggedHours: loggedHoursInHours,
    remainingHours,
    isComplete: loggedHoursInHours >= totalHours,
  }
}

