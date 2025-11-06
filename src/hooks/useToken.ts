import React, { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { TOKEN_STORAGE_KEY } from '@/utils/constants'

export function useToken() {
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  })
  const [showToken, setShowToken] = useState<boolean>(false)
  const { toast } = useToast()

  const handleTokenChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newToken = e.target.value
      setToken(newToken)
      if (newToken) {
        localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
      }
    },
    []
  )

  const handleClearToken = useCallback(() => {
    setToken('')
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    toast({
      title: 'Token removido',
      description: 'O token foi removido com sucesso',
    })
  }, [toast])

  const toggleTokenVisibility = useCallback(() => {
    setShowToken((prev) => !prev)
  }, [])

  return {
    token,
    showToken,
    handleTokenChange,
    handleClearToken,
    toggleTokenVisibility,
  }
}

