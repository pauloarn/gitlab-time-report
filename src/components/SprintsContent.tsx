import { format } from 'date-fns'
import { convertTimeInHoursMinSec } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
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
  selectedEpicId: string
  onEpicChange: (epicId: string) => void
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
  selectedEpicId,
  onEpicChange,
}: SprintsContentProps) {
  // Debug log
  console.log('SprintsContent - épicos recebidos:', epics.length, epics)

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Carregando sprints...</p>
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
            onChange={(e) => {
              onMilestoneChange(e.target.value)
              onEpicChange('') // Reset épico quando mudar milestone
            }}
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

        {/* Filtro de Épico */}
        {epics.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Épico
            </label>
            <select
              value={selectedEpicId}
              onChange={(e) => onEpicChange(e.target.value)}
              disabled={isLoading || epics.length === 0}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todos os Épicos</option>
              {epics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.title}
                </option>
              ))}
            </select>
          </div>
        )}
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
          {(selectedEpicId 
            ? epics.filter((epic) => epic.id === selectedEpicId)
            : epics
          ).map((epic) => (
        <div
          key={epic.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          {/* Header do Épico */}
          <div className="bg-orange-50 dark:bg-orange-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
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
                {epic.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {epic.description}
                  </p>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {sprint.description}
                      </p>
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

