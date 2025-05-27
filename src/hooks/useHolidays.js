import { useQuery } from '@tanstack/react-query'
import { fetchHollidays } from '@/lib/hollidays'
import { QUERY_KEYS } from '@/utils/queryKeys'

export function useHolidays(year) {
	return useQuery({
		queryKey: [QUERY_KEYS.HOLIDAYS, year],
		queryFn: () => fetchHollidays(year),
		staleTime: 1000 * 60 * 60 * 24, // 24 hours
		gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
	})
}
