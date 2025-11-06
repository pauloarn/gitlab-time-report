import React from 'react'
import { Button } from '@/components/ui/button'

interface ReportActionsProps {
  loading: boolean
  hasData: boolean
  onGenerate: () => void
  onDownload: () => void
}

export function ReportActions({
  loading,
  hasData,
  onGenerate,
  onDownload,
}: ReportActionsProps) {
  return (
    <div className="space-y-4">
      <Button onClick={onGenerate} disabled={loading} className="w-full">
        Buscar Horas
      </Button>
      {hasData && (
        <Button
          onClick={onDownload}
          disabled={loading}
          className="w-full"
          variant="secondary"
        >
          Exportar CSV
        </Button>
      )}
    </div>
  )
}

