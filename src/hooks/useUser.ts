import { useState, useEffect } from 'react'
import { GitLabService } from '@/services/gitlab.service'
import type { GitLabUser } from '@/types'

export function useUser(token: string | null) {
  const [user, setUser] = useState<GitLabUser | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const gitlabService = new GitLabService(token)
        const userData = await gitlabService.getCurrentUser()
        setUser(userData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar usuário')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [token])

  return { user, loading, error }
}

