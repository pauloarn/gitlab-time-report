import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { TermsModal } from './TermsModal'

interface TermsAcceptanceModalProps {
  isOpen: boolean
  onAccept: () => void
  onReject: () => void
}

export function TermsAcceptanceModal({ isOpen, onAccept, onReject }: TermsAcceptanceModalProps) {
  const [showTermsModal, setShowTermsModal] = useState(false)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Termos de Uso
                  </h2>
                  <button
                    onClick={onReject}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    aria-label="Fechar modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <p>
                      Para continuar, você precisa ler e aceitar nossos Termos de Uso.
                    </p>
                    <p>
                      Ao clicar em "Entendi e li os termos", você confirma que leu, compreendeu e concorda com os termos de uso e política de privacidade.
                    </p>
                    <button
                      onClick={() => setShowTermsModal(true)}
                      className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium"
                    >
                      Ler Termos de Uso completos
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <Button
                    onClick={onReject}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={onAccept}
                    className="flex-1"
                    size="lg"
                  >
                    Entendi e li os termos
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  )
}

