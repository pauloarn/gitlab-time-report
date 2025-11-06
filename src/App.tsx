import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { MonthPicker } from '@/components/ui/monthpicker'
import { ReportActions } from '@/components/ReportActions'
import { ReportContent } from '@/components/ReportContent'
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
  const [activeTab, setActiveTab] = useState<number>(0)
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

  // Buscar dados automaticamente quando entrar na tela ou mudar o mês
  useEffect(() => {
    if (isLoggedIn && token) {
      handleGenerateCSV()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, selectedDate])

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
      return
    }

    try {
      const result = await generateReport(token, selectedDate)
      
      if (result.timeLogs.length) {
        const hasWarnings = result.validations.length > 0
        
        if (hasWarnings) {
          toast({
            title: 'Relatório gerado com avisos',
            description: `${result.validations.length} demanda(s) sem Weight ou Time Estimate`,
            variant: 'default',
          })
        }
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 dark:from-gray-900 to-white dark:to-gray-800">
      <Header
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Calendário à esquerda */}
          <div className="flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg sticky top-24">
              <MonthPicker currentValue={selectedDate} setValue={setSelectedDate} />
              {timeLogs.length > 0 && (
                <div className="mt-6">
                  <ReportActions
                    loading={loading}
                    hasData={timeLogs.length > 0}
                    onDownload={handleDownloadCSV}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo à direita */}
          <div className="flex-1 min-w-0">
            {loading && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
              </div>
            )}

            {!loading && (
              <>
                {validations.length > 0 && (
                  <div className="mb-6">
                    <IssueValidationAlert validations={validations} />
                  </div>
                )}

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <ReportContent
                    activeTab={activeTab}
                    timeLogs={timeLogs}
                    totalTime={totalTime}
                    insights={insights}
                    selectedDate={selectedDate}
                    holidays={holidays}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Toaster />
    </div>
  )
}

