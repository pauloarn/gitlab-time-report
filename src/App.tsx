import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { MonthPicker } from '@/components/ui/monthpicker'
import { ReportActions } from '@/components/ReportActions'
import { ReportTabs } from '@/components/ReportTabs'
import { IssueValidationAlert } from '@/components/IssueValidationAlert'
import { LoginScreen } from '@/components/LoginScreen'
import { Header } from '@/components/Header'
import { useToken } from '@/hooks/useToken'
import { useTimeLogs } from '@/hooks/useTimeLogs'
import { useHolidays } from '@/hooks/useHolidays'
import { useUser } from '@/hooks/useUser'
import { TOKEN_STORAGE_KEY } from '@/utils/constants'

export default function App() {
  const { token, showToken, handleTokenChange, handleClearToken, toggleTokenVisibility } =
    useToken()
  const {
    timeLogs,
    totalTime,
    insights,
    validations,
    loading,
    generateReport,
    downloadCSV,
    reset,
  } = useTimeLogs()
  const [selectedDate, setSelectedDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const { toast } = useToast()

  const { data: holidays = [] } = useHolidays(selectedDate.getFullYear())
  const { user } = useUser(isLoggedIn ? token : null)

  useEffect(() => {
    // Carregar token salvo apenas se não estiver logado
    if (!isLoggedIn) {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (savedToken) {
        handleTokenChange({ target: { value: savedToken } } as React.ChangeEvent<HTMLInputElement>)
      }
    }
  }, [handleTokenChange, isLoggedIn])

  const handleEnter = () => {
    if (!token.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira seu token do GitLab',
        variant: 'destructive',
      })
      return
    }
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    handleClearToken()
    reset()
    setIsLoggedIn(false)
  }

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
      const result = await generateReport(token, selectedDate)
      
      if (result.timeLogs.length) {
        const hasWarnings = result.validations.length > 0
        
        toast({
          title: hasWarnings ? 'Relatório gerado com avisos' : 'Sucesso!',
          description: hasWarnings
            ? `${result.validations.length} demanda(s) sem Weight ou Time Estimate`
            : 'Relatório gerado com sucesso',
          variant: hasWarnings ? 'default' : 'default',
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

  if (!isLoggedIn) {
    return (
      <>
        <LoginScreen
          token={token}
          showToken={showToken}
          onTokenChange={handleTokenChange}
          onToggleVisibility={toggleTokenVisibility}
          onEnter={handleEnter}
        />
        <Toaster />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header user={user} onLogout={handleLogout} />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto space-y-8"
        >
          <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
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
        </motion.div>
      </div>

      {validations.length > 0 && (
        <div className="max-w-md mx-auto">
          <IssueValidationAlert validations={validations} />
        </div>
      )}

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

