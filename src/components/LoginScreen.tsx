import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface LoginScreenProps {
  token: string
  showToken: boolean
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onToggleVisibility: () => void
  onEnter: () => void
}

export function LoginScreen({
  token,
  showToken,
  onTokenChange,
  onToggleVisibility,
  onEnter,
}: LoginScreenProps) {
  const { theme, toggleTheme } = useTheme()
  const logoPath = theme === 'dark' ? '/black-git-horas-icon.png' : '/white-git-horas-icon.png'
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && token.trim()) {
      onEnter()
    }
  }

  return (
    <>
      {/* Botão de toggle de tema no canto superior direito - fixed para sempre ficar no mesmo lugar */}
      <button
        onClick={toggleTheme}
        style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 50 }}
        className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>

      <div className="min-h-screen bg-gradient-to-b from-orange-50 dark:from-gray-900 to-white dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex justify-center"
        >
          <img
            key={theme}
            src={logoPath}
            alt="Git Horas Logo"
            className="w-80 h-80 object-contain"
          />
        </motion.div>

        {/* Modal de token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Token de Acesso do GitLab
            </label>
            <div className="relative">
              <Input
                type={showToken ? 'text' : 'password'}
                placeholder="Cole seu token aqui"
                value={token}
                onChange={onTokenChange}
                onKeyPress={handleKeyPress}
                className="w-full pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={onToggleVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
              >
                {showToken ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={onEnter}
            disabled={!token.trim()}
            className="w-full"
            size="lg"
          >
            Entrar
          </Button>
        </motion.div>
      </motion.div>
      </div>
    </>
  )
}

