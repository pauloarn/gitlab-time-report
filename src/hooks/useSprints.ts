import { useQuery } from '@tanstack/react-query'
import { GitLabService } from '@/services/gitlab.service'
import { queryKeys } from '@/utils/queryKeys'
import type { Epic } from '@/types'

export function useSprints(token: string | null, milestoneTitle?: string) {
  const {
    data: epics = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Epic[], Error>({
    queryKey: [queryKeys.sprints, token, milestoneTitle],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token é necessário para buscar épicos.')
      }
      const gitlabService = new GitLabService(token)
      return gitlabService.getAllEpics(milestoneTitle)
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  })

  return { epics, isLoading, isError, error, refetch }
}

export function useMilestones(token: string | null, groupId: string | null) {
  const {
    data: milestones = [],
    isLoading,
    isError,
    error,
  } = useQuery<
    Array<{ id: string; title: string; webPath: string }>,
    Error
  >({
    queryKey: [queryKeys.milestones, token, groupId],
    queryFn: async () => {
      if (!token || !groupId) {
        throw new Error('Token e GroupId são necessários para buscar milestones.')
      }
      const gitlabService = new GitLabService(token)
      return gitlabService.getMilestones(groupId)
    },
    enabled: !!token && !!groupId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  })

  return { milestones, isLoading, isError, error }
}

export function useGroups(token: string | null) {
  const {
    data: groups = [],
    isLoading,
    isError,
    error,
  } = useQuery<
    Array<{ id: string; fullPath: string; name: string }>,
    Error
  >({
    queryKey: [queryKeys.groups, token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Token é necessário para buscar grupos.')
      }
      const gitlabService = new GitLabService(token)
      return gitlabService.getGroups()
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  })

  return { groups, isLoading, isError, error }
}

