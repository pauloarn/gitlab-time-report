import { useQuery } from '@tanstack/react-query'
import { HolidaysService } from '@/services/holidays.service'
import { QUERY_KEYS } from '@/utils/queryKeys'
import type { Holiday } from '@/types'

export function useHolidays(year: number) {
  return useQuery<Holiday[]>({
    queryKey: [QUERY_KEYS.HOLIDAYS, year],
    queryFn: () => HolidaysService.fetchHolidays(year),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  })
}

