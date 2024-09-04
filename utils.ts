import {getDate,getYear,getMonth, isEqual, isAfter, isBefore} from 'date-fns'
export const getNumber = (text: string) => {
  return text.replace(/\D/g, '')
}
export const convertTimeInHoursMinSec = (timeInSeconds: number) => {
  timeInSeconds = Math.abs(timeInSeconds)
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor(timeInSeconds / 60) % 60
  const seconds = timeInSeconds % 60

  const hourText = hours.toString().padStart(2, '0')
  const minutesText = minutes.toString().padStart(2, '0')
  const secondsText = seconds.toString().padStart(2, '0')

  return `${hourText}:${minutesText}:${secondsText}`
}
export const removeTimeFromDate = (date: Date) => {
  return new Date(getYear(date), getMonth(date), getDate(date))
}
export const isEqualDate = (dateOne: Date, dateTwo: Date) => {
  dateOne = removeTimeFromDate(dateOne)
  dateTwo = removeTimeFromDate(dateTwo)
  return isEqual(dateOne, dateTwo)
}

export const isDateEqualOrAfter = (date: Date, afterDate: Date) => {
  date = removeTimeFromDate(date)
  afterDate = removeTimeFromDate(afterDate)
  return isEqualDate(date, afterDate) || isAfter(date, afterDate)
}

export const isDateAfter = (date: Date, afterDate: Date) => {
  date = removeTimeFromDate(date)
  afterDate = removeTimeFromDate(afterDate)
  return isAfter(date, afterDate)
}

export const isDateEqualOrBefore = (date: Date, beforeDate: Date) => {
  date = removeTimeFromDate(date)
  beforeDate = removeTimeFromDate(beforeDate)
  return isEqualDate(date, beforeDate) || isBefore(date, beforeDate)
}

export const isDateBetween = (date: Date, leftDate: Date, rightDate: Date) => {
  return (
    isDateEqualOrAfter(date, leftDate) && isDateEqualOrBefore(date, rightDate)
  )
}