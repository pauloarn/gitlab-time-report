import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { MonthPicker } from '@/components/ui/monthpicker'
import { TokenInput } from '@/components/TokenInput'
import { ReportActions } from '@/components/ReportActions'
import { ReportTabs } from '@/components/ReportTabs'
import { useToken } from '@/hooks/useToken'
import { useTimeLogs } from '@/hooks/useTimeLogs'
import { useHolidays } from '@/hooks/useHolidays'
import { TOKEN_STORAGE_KEY } from '@/utils/constants'

export default function App() {
  const { token, showToken, handleTokenChange, handleClearToken, toggleTokenVisibility } =
    useToken()
  const {
    timeLogs,
    totalTime,
    insights,
    loading,
    generateReport,
    downloadCSV,
  } = useTimeLogs()
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const { toast } = useToast()

  const { data: holidays = [] } = useHolidays(selectedDate.getFullYear())

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (savedToken) {
      handleTokenChange({ target: { value: savedToken } } as React.ChangeEvent<HTMLInputElement>)
    }
  }, [handleTokenChange])

  const handleGenerateCSV = async () => {
    if (!token) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu token do GitLab',
        variant: 'destructive',
      })
      return
    }

    try {
      const csvContent = await generateReport(token, selectedDate)
      
      if (csvContent.length) {
        toast({
          title: 'Sucesso!',
          description: 'Relatório gerado com sucesso',
        })
      } else {
        toast({
          title: 'Sem Registros',
          description: 'Nenhum registro encontrado para esse token no mês selecionado',
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao gerar o relatório',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadCSV = () => {
    downloadCSV(selectedDate)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto space-y-8"
      >
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-blue-600">Git Horas</h1>
          <p className="text-gray-600">
            Gere relatórios detalhados de horas trabalhadas do GitLab
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
          <TokenInput
            token={token}
            showToken={showToken}
            onTokenChange={handleTokenChange}
            onClearToken={handleClearToken}
            onToggleVisibility={toggleTokenVisibility}
          />

          <div className="flex items-center justify-center space-x-4">
            <MonthPicker currentValue={selectedDate} setValue={setSelectedDate} />
          </div>

          <ReportActions
            loading={loading}
            hasData={timeLogs.length > 0}
            onGenerate={handleGenerateCSV}
            onDownload={handleDownloadCSV}
          />
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Seus dados são processados localmente e com segurança
          </p>
        </div>
      </motion.div>

      <ReportTabs
        timeLogs={timeLogs}
        totalTime={totalTime}
        insights={insights}
        selectedDate={selectedDate}
        holidays={holidays}
      />

      <Toaster />
    </div>
  )
}

