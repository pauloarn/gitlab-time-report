import { translateMonthToPortuguese } from './utils'

/**
 * Calculate the number of business days in a given month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @param {Array} holidays - Array of holiday dates
 * @returns {number} Number of business days
 */
export function getBusinessDaysInMonth(year, month, holidays = []) {
	const daysInMonth = new Date(year, month + 1, 0).getDate()
	let businessDays = 0

	for (let day = 1; day <= daysInMonth; day++) {
		const date = new Date(year, month, day)
		const dayOfWeek = date.getDay()
		const dateString = date.toISOString().split('T')[0]

		// Skip weekends and holidays
		if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.some((h) => h.date === dateString)) {
			businessDays++
		}
	}

	return businessDays
}

/**
 * Calculate total business hours for a given month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @param {number} hoursPerDay - Number of business hours per day (default: 8)
 * @param {Array} holidays - Array of holiday dates
 * @returns {number} Total business hours for the month
 */
export function getBusinessHoursInMonth(year, month, hoursPerDay = 8, holidays = []) {
	const businessDays = getBusinessDaysInMonth(year, month, holidays)
	return businessDays * hoursPerDay
}

/**
 * Get a formatted string of business hours for a given month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @param {number} hoursPerDay - Number of business hours per day (default: 8)
 * @param {Array} holidays - Array of holiday dates
 * @param {number} loggedHours - Total logged hours in seconds
 * @returns {Object} Formatted object with business hours information
 */
export function getFormattedBusinessHours(
	year,
	month,
	hoursPerDay = 8,
	holidays = [],
	loggedHours = 0
) {
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
