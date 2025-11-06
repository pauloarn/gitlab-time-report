import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import type { GitLabUser } from '@/types'

interface HeaderProps {
  user: GitLabUser | null
  onLogout: () => void
  activeTab: number
  onTabChange: (tab: number) => void
}

export function Header({ user, onLogout, activeTab, onTabChange }: HeaderProps) {
  const getInitials = (name?: string, username?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (username) {
      return username.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const normalizeAvatarUrl = (url?: string | null): string | null => {
    if (!url) return null
    
    // Se já é uma URL completa, retorna como está
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    // Se é uma URL relativa, adiciona o domínio do GitLab
    if (url.startsWith('/')) {
      return `https://gitlab.com${url}`
    }
    
    return url
  }

  const displayName = user?.name || user?.username || 'Usuário'
  const avatarUrl = normalizeAvatarUrl(user?.avatarUrl)

  const tabs = ['Geral', 'Insights', 'Horas Úteis']

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center flex-shrink-0">
            <img
              src="/git-horas-icon.png"
              alt="Git Horas Logo"
              className="h-24 w-24 object-contain"
            />
          </div>

          <div className="flex gap-2 flex-1 justify-center">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => onTabChange(index)}
                className={`px-4 py-2 rounded-t-lg transition-colors text-sm font-medium ${
                  activeTab === index
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-accent"
                >
                  <span className="text-sm font-medium hidden sm:block">
                    {displayName}
                  </span>
                  <Avatar className="h-10 w-10">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {getInitials(user?.name, user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Avatar className="h-8 w-8">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                      {getInitials(user?.name, user?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    {user?.email && (
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

