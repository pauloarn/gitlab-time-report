import { Button } from '@/components/ui/button'

interface ReportActionsProps {
  loading: boolean
  hasData: boolean
  onDownload: () => void
}

export function ReportActions({
  loading,
  hasData,
  onDownload,
}: ReportActionsProps) {
  if (!hasData) {
    return null
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={onDownload}
        disabled={loading}
        className="w-full"
        variant="secondary"
      >
        Exportar CSV
      </Button>
    </div>
  )
}

