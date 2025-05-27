import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isBefore } from 'date-fns'

export function cn(...inputs) {
	return twMerge(clsx(inputs))
}

/**
 * Converts time in seconds to hours, minutes, and seconds format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function convertTimeInHoursMinSec(seconds) {
	if (!seconds) return '0h 0m 0s'
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const remainingSeconds = seconds % 60
	return `${hours}h ${minutes}m ${remainingSeconds}s`
}

export function getNumber(str) {
	return str.replace(/\D/g, '')
}

export function isDateBetween(date, start, end) {
	return !isBefore(date, start) && !isBefore(end, date)
}

/**
 * Translates month name to Brazilian Portuguese
 * @param {string} monthName - Month name in English
 * @returns {string} Month name in Brazilian Portuguese
 */
export function translateMonthToPortuguese(monthName) {
	const monthTranslations = {
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
