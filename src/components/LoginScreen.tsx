import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

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
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && token.trim()) {
      onEnter()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <img
              src="/git-horas-icon.png"
              alt="Git Horas Logo"
              className="w-32 h-32 object-contain"
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-xl shadow-lg space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
  )
}

