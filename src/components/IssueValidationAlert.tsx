import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { IssueValidation } from '@/types'

interface IssueValidationAlertProps {
  validations: IssueValidation[]
}

export function IssueValidationAlert({
  validations,
}: IssueValidationAlertProps) {
  if (validations.length === 0) {
    return null
  }

  const issuesWithoutWeight = validations.filter((v) => !v.hasWeight)
  const issuesWithoutEstimate = validations.filter((v) => !v.hasTimeEstimate)
  const issuesWithoutBoth = validations.filter(
    (v) => !v.hasWeight && !v.hasTimeEstimate
  )

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 mb-2">
            Atenção: Algumas demandas estão sem informações
          </h3>

          {issuesWithoutBoth.length > 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-yellow-700 mb-1">
                Demandas sem Weight e Time Estimate ({issuesWithoutBoth.length}):
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
                {issuesWithoutBoth.slice(0, 5).map((validation, index) => (
                  <li key={index}>
                    <a
                      href={validation.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {validation.issueName}
                    </a>
                  </li>
                ))}
                {issuesWithoutBoth.length > 5 && (
                  <li className="text-yellow-500">
                    +{issuesWithoutBoth.length - 5} mais
                  </li>
                )}
              </ul>
            </div>
          )}

          {issuesWithoutWeight.length > 0 && issuesWithoutBoth.length === 0 && (
            <div className="mb-3">
              <p className="text-sm font-medium text-yellow-700 mb-1">
                Demandas sem Weight ({issuesWithoutWeight.length}):
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
                {issuesWithoutWeight.slice(0, 5).map((validation, index) => (
                  <li key={index}>
                    <a
                      href={validation.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {validation.issueName}
                    </a>
                  </li>
                ))}
                {issuesWithoutWeight.length > 5 && (
                  <li className="text-yellow-500">
                    +{issuesWithoutWeight.length - 5} mais
                  </li>
                )}
              </ul>
            </div>
          )}

          {issuesWithoutEstimate.length > 0 && issuesWithoutBoth.length === 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">
                Demandas sem Time Estimate ({issuesWithoutEstimate.length}):
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600">
                {issuesWithoutEstimate.slice(0, 5).map((validation, index) => (
                  <li key={index}>
                    <a
                      href={validation.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {validation.issueName}
                    </a>
                  </li>
                ))}
                {issuesWithoutEstimate.length > 5 && (
                  <li className="text-yellow-500">
                    +{issuesWithoutEstimate.length - 5} mais
                  </li>
                )}
              </ul>
            </div>
          )}

          <p className="text-xs text-yellow-600 mt-3">
            Recomendamos adicionar Weight e Time Estimate nas demandas para
            melhor controle e planejamento.
          </p>
        </div>
      </div>
    </div>
  )
}

