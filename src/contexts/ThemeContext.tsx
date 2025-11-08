import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'gitlab-time-report-theme'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há tema salvo no localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (savedTheme) {
      return savedTheme
    }
    
    // Verificar preferência do sistema
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Salvar no localStorage
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

