import { useState } from 'react'
import { TermsModal } from '@/components/TermsModal'

export function Footer() {
  const version = '2.0.0'
  const [showTermsModal, setShowTermsModal] = useState(false)

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Informações principais */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Versão {version}</span>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Created by{' '}
                <span className="text-orange-600 dark:text-orange-400">Code Hive</span>
                {' '}e{' '}
                <span className="text-orange-600 dark:text-orange-400">Paulo Amador</span>
              </p>
            </div>
          </div>

          {/* Termo de uso */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="text-center">
              <button
                onClick={() => setShowTermsModal(true)}
                className="text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium"
              >
                Ver Termos de Uso completos
              </button>
            </div>
          </div>
        </div>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </footer>
  )
}

