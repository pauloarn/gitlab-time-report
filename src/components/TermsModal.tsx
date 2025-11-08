import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Termos de Uso
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Privacidade e Armazenamento de Dados
                    </h3>
                    <p>
                      Este software <strong>não coleta, armazena ou transmite</strong> nenhum tipo de dado pessoal ou 
                      informações do usuário para servidores externos. Todos os dados, incluindo tokens de acesso, 
                      são armazenados exclusivamente na <strong>cache local do navegador do usuário</strong> e permanecem 
                      totalmente sob seu controle.
                    </p>
                    <p>
                      O token de acesso do GitLab é fornecido <strong>voluntariamente pelo usuário</strong> e utilizado 
                      apenas para realizar consultas à API do GitLab diretamente do navegador. Nenhuma informação é 
                      enviada ou salva em servidores externos.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Aviso Legal
                    </h3>
                    <p>
                      Este software é fornecido "como está" (AS IS), sem garantias de qualquer natureza, 
                      expressas ou implícitas, incluindo, mas não se limitando a, garantias de comercialização, 
                      adequação a um propósito específico e não violação.
                    </p>
                    <p>
                      Em nenhuma circunstância os desenvolvedores, mantenedores ou contribuidores deste projeto 
                      serão responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, exemplares 
                      ou consequenciais (incluindo, mas não se limitando a, perda de dados, lucros ou interrupção 
                      de negócios) decorrentes do uso ou da incapacidade de usar este software, mesmo que tenham sido 
                      avisados da possibilidade de tais danos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={onClose}
                  className="w-full"
                  size="lg"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

