import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { isBefore } from 'date-fns'

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Converts time in seconds to hours, minutes, and seconds format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function convertTimeInHoursMinSec(seconds: number): string {
  if (!seconds) return '0h 0m 0s'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return `${hours}h ${minutes}m ${remainingSeconds}s`
}

export function getNumber(str: string): string {
  return str.replace(/\D/g, '')
}

export function isDateBetween(date: Date, start: Date, end: Date): boolean {
  return !isBefore(date, start) && !isBefore(end, date)
}

/**
 * Translates month name to Brazilian Portuguese
 * @param monthName - Month name in English
 * @returns Month name in Brazilian Portuguese
 */
export function translateMonthToPortuguese(monthName: string): string {
  const monthTranslations: Record<string, string> = {
    January: 'Janeiro',
    February: 'Fevereiro',
    March: 'Março',
    April: 'Abril',
    May: 'Maio',
    June: 'Junho',
    July: 'Julho',
    August: 'Agosto',
    September: 'Setembro',
    October: 'Outubro',
    November: 'Novembro',
    December: 'Dezembro',
  }
  return monthTranslations[monthName] || monthName
}

