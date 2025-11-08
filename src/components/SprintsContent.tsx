import { format } from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import { AlertTriangle, ChevronDown, ChevronUp, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { useState } from 'react'
import type { Epic } from '@/types'

interface SprintsContentProps {
  epics: Epic[]
  isLoading: boolean
  isError?: boolean
  error?: Error | null
  milestones: Array<{ id: string; title: string; webPath: string }>
  milestonesLoading: boolean
  selectedMilestoneTitle: string
  onMilestoneChange: (milestoneTitle: string) => void
}

export function SprintsContent({
  epics,
  isLoading,
  isError,
  error,
  milestones,
  milestonesLoading,
  selectedMilestoneTitle,
  onMilestoneChange,
}: SprintsContentProps) {
  // Estado para controlar quais descrições estão expandidas
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Função helper para converter URLs relativas de avatares para absolutas
  const getAvatarUrl = (avatarUrl: string | null | undefined): string | null => {
    if (!avatarUrl) return null
    
    // Se já for uma URL absoluta, retornar como está
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl
    }
    
    // Se for uma URL relativa, converter para absoluta do GitLab
    if (avatarUrl.startsWith('/')) {
      return `https://gitlab.com${avatarUrl}`
    }
    
    // Se não começar com /, assumir que é relativa e adicionar https://gitlab.com
    return `https://gitlab.com/${avatarUrl}`
  }
  
  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Carregando épicos...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">
          Erro ao carregar épicos
        </p>
        {error && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {error.message}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Filtros lado a lado */}
      <div className="mb-6 flex gap-4 flex-wrap">
        {/* Filtro de Milestone */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtrar por Milestone
          </label>
          <select
            value={selectedMilestoneTitle}
            onChange={(e) => onMilestoneChange(e.target.value)}
            disabled={milestonesLoading || milestones.length === 0}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Todos os Milestones</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.title}>
                {milestone.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensagem quando não há épicos */}
      {epics.length === 0 && !isLoading && (
        <div className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum épico encontrado
          </p>
        </div>
      )}

            {/* Lista de Épicos */}
            {epics.length > 0 && (
              <div className="space-y-8">
                {epics.map((epic) => (
        <div
          key={epic.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
        >
          {/* Header do Épico */}
          <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  <a
                    href={epic.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {epic.title}
                  </a>
                </h3>
                {epic.assignees && epic.assignees.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Assignees:</span>
                    {epic.assignees.map((assignee) => {
                      const initials = assignee.name
                        ? assignee.name
                            .split(' ')
                            .map((part) => part.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join('')
                        : assignee.username
                            .split(/[._-]/)
                            .map((part) => part.charAt(0).toUpperCase())
                            .slice(0, 2)
                            .join('')
                      
                      const avatarUrl = getAvatarUrl(assignee.avatarUrl)
                      
                      return (
                        <div
                          key={assignee.id}
                          className="flex items-center gap-1.5"
                          title={assignee.name || assignee.username}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={assignee.name || assignee.username}
                              className="w-5 h-5 rounded-full object-cover"
                              onError={(e) => {
                                // Se a imagem falhar, mostrar inicial
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            className={`w-5 h-5 rounded-full bg-orange-500 dark:bg-orange-600 flex items-center justify-center text-white text-xs font-medium ${avatarUrl ? 'hidden' : ''}`}
                          >
                            {initials}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {assignee.name || assignee.username}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {epic.description && (
                  <div className="mt-1">
                    <button
                      onClick={() => toggleDescription(`epic-${epic.id}`)}
                      className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {expandedDescriptions.has(`epic-${epic.id}`) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ocultar descrição
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Ver descrição
                        </>
                      )}
                    </button>
                    {expandedDescriptions.has(`epic-${epic.id}`) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 prose prose-sm dark:prose-invert max-w-none prose-img:max-w-full prose-img:rounded-lg">
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            img: ({ src, alt }) => {
                              // Converter URLs relativas de imagens do GitLab para absolutas
                              if (src && !src.startsWith('http')) {
                                // Se for uma imagem relativa do GitLab, construir URL completa
                                const gitlabBaseUrl = epic.webUrl.split('/-/')[0]
                                let imageUrl = src
                                
                                if (src.startsWith('/')) {
                                  imageUrl = `https://gitlab.com${src}`
                                } else if (src.includes('uploads/')) {
                                  // Imagens enviadas diretamente no GitLab
                                  imageUrl = `${gitlabBaseUrl}/${src}`
                                } else {
                                  // Tentar diferentes caminhos comuns do GitLab
                                  // Primeiro tenta como wiki, depois como raw file
                                  imageUrl = `${gitlabBaseUrl}/-/wikis/${src}`
                                }
                                
                                return (
                                  <img 
                                    src={imageUrl} 
                                    alt={alt} 
                                    className="max-w-full rounded-lg my-2"
                                    onError={(e) => {
                                      // Se falhar, tentar como raw file
                                      const target = e.target as HTMLImageElement
                                      if (!src.startsWith('http') && !target.src.includes('/-/raw/')) {
                                        const fallbackUrl = `${gitlabBaseUrl}/-/raw/main/${src}`
                                        target.src = fallbackUrl
                                      }
                                    }}
                                  />
                                )
                              }
                              return <img src={src} alt={alt} className="max-w-full rounded-lg my-2" />
                            },
                            table: ({ children }) => (
                              <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {epic.description}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sprints do Épico */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {epic.sprints.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                Nenhuma sprint encontrada
              </div>
            ) : (
              epic.sprints.map((sprint) => (
                <div key={sprint.id} className="p-6">
                  {/* Header da Sprint */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {sprint.title}
                    </h4>
                    {sprint.startDate && sprint.dueDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(sprint.startDate), 'dd/MM/yyyy')} -{' '}
                        {format(new Date(sprint.dueDate), 'dd/MM/yyyy')}
                      </p>
                    )}
                    {sprint.description && (
                      <div className="mt-1">
                        <button
                          onClick={() => toggleDescription(`sprint-${sprint.id}`)}
                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          {expandedDescriptions.has(`sprint-${sprint.id}`) ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Ocultar descrição
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Ver descrição
                            </>
                          )}
                        </button>
                        {expandedDescriptions.has(`sprint-${sprint.id}`) && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 prose prose-sm dark:prose-invert max-w-none prose-img:max-w-full prose-img:rounded-lg">
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw]}
                              components={{
                                img: ({ src, alt }) => {
                                  // Converter URLs relativas de imagens do GitLab para absolutas
                                  if (src && !src.startsWith('http')) {
                                    // Se for uma imagem relativa do GitLab, tentar construir URL completa
                                    // Nota: sprint não tem webUrl, então usamos uma URL base genérica
                                    const gitlabBaseUrl = 'https://gitlab.com'
                                    const imageUrl = src.startsWith('/') 
                                      ? `${gitlabBaseUrl}${src}`
                                      : `${gitlabBaseUrl}/${src}`
                                    return <img src={imageUrl} alt={alt} className="max-w-full rounded-lg" />
                                  }
                                  return <img src={src} alt={alt} className="max-w-full rounded-lg" />
                                },
                                table: ({ children }) => (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                th: ({ children }) => (
                                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {sprint.description}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Issues da Sprint */}
                  {sprint.issues.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma task encontrada nesta sprint
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Task
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Assignees
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Estado
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Weight
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Time Estimate
                            </th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700 dark:text-gray-300">
                              Tempo Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sprint.issues.map((issue) => {
                            const hasWeight = issue.weight !== null && issue.weight !== undefined
                            const hasTimeEstimate =
                              issue.timeEstimate !== null && issue.timeEstimate !== undefined
                            const missingBoth = !hasWeight && !hasTimeEstimate

                            return (
                              <tr
                                key={issue.id}
                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <td className="py-3 px-3">
                                  <a
                                    href={issue.webUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {issue.name}
                                  </a>
                                </td>
                                <td className="py-3 px-3">
                                  {issue.assignees && issue.assignees.length > 0 ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {issue.assignees.map((assignee) => {
                                        const initials = assignee.name
                                          ? assignee.name
                                              .split(' ')
                                              .map((part: string) => part.charAt(0).toUpperCase())
                                              .slice(0, 2)
                                              .join('')
                                          : assignee.username
                                              .split(/[._-]/)
                                              .map((part: string) => part.charAt(0).toUpperCase())
                                              .slice(0, 2)
                                              .join('')
                                        
                                        const avatarUrl = getAvatarUrl(assignee.avatarUrl)
                                        
                                        return (
                                          <div
                                            key={assignee.id}
                                            className="flex items-center gap-1.5"
                                            title={assignee.name || assignee.username}
                                          >
                                            {avatarUrl ? (
                                              <img
                                                src={avatarUrl}
                                                alt={assignee.name || assignee.username}
                                                className="w-6 h-6 rounded-full object-cover"
                                                onError={(e) => {
                                                  // Se a imagem falhar, mostrar inicial
                                                  const target = e.target as HTMLImageElement
                                                  target.style.display = 'none'
                                                  const fallback = target.nextElementSibling as HTMLElement
                                                  if (fallback) fallback.style.display = 'flex'
                                                }}
                                              />
                                            ) : null}
                                            <div 
                                              className={`w-6 h-6 rounded-full bg-orange-500 dark:bg-orange-600 flex items-center justify-center text-white text-xs font-medium ${avatarUrl ? 'hidden' : ''}`}
                                            >
                                              {initials}
                                            </div>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                              {assignee.name || assignee.username}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                                      <User className="w-4 h-4" />
                                      <span className="text-xs">Sem assignee</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      issue.state === 'opened'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : issue.state === 'closed'
                                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    }`}
                                  >
                                    {issue.state}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  {missingBoth && !hasWeight ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>-</span>
                                    </span>
                                  ) : hasWeight ? (
                                    <span>{issue.weight}</span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {missingBoth && !hasTimeEstimate ? (
                                    <span className="text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-1">
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>-</span>
                                    </span>
                                  ) : hasTimeEstimate ? (
                                    <span>{convertTimeInHoursMinSec(issue.timeEstimate!)}</span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  {convertTimeInHoursMinSec(issue.totalSpentTime)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        ))}
        </div>
      )}
    </div>
  )
}

