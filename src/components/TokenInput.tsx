import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface TokenInputProps {
  token: string
  showToken: boolean
  onTokenChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearToken: () => void
  onToggleVisibility: () => void
}

export function TokenInput({
  token,
  showToken,
  onTokenChange,
  onClearToken,
  onToggleVisibility,
}: TokenInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">
          Token de Acesso do GitLab
        </label>
        {token && (
          <Button
            onClick={onClearToken}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Limpar Token
          </Button>
        )}
      </div>
      <div className="relative">
        <Input
          type={showToken ? 'text' : 'password'}
          placeholder="Cole seu token aqui"
          value={token}
          onChange={onTokenChange}
          className="w-full pr-10"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showToken ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        O token deve ter permissões para acessar issues e time tracking
      </p>
    </div>
  )
}

