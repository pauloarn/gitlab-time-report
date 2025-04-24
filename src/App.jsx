import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { generateReport, downloadCSV } from "@/lib/gitlab";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

export default function App() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCurrentMonth, setIsCurrentMonth] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const handleGenerateCSV = async () => {
    if (!token) {
      toast({
        title: "Erro",
        description: "Por favor, insira seu token do GitLab",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const csvContent = await generateReport(token, isCurrentMonth);
      const filename = `relatorio-gitlab-${new Date().toISOString().slice(0, 7)}.csv`;
      downloadCSV(csvContent, filename);
      
      toast({
        title: "Sucesso!",
        description: "Relatório gerado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar o relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Token de Acesso do GitLab
            </label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                placeholder="Cole seu token aqui"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showToken ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              O token deve ter permissões para acessar issues e time tracking
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCurrentMonth(false)}
                className={!isCurrentMonth ? "bg-blue-100" : ""}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700">
                {isCurrentMonth ? "Mês Atual" : "Mês Anterior"}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsCurrentMonth(true)}
                className={isCurrentMonth ? "bg-blue-100" : ""}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleGenerateCSV}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Gerando relatório..." : "Gerar Relatório CSV"}
            </Button>
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-500">
            Seus dados são processados localmente e com segurança
          </p>
          <p className="text-xs text-gray-400">
            O relatório incluirá todas as horas registradas no {isCurrentMonth ? "mês atual" : "mês anterior"}
          </p>
        </div>
      </motion.div>
      <Toaster />
    </div>
  );
}
