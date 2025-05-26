import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Toaster} from "@/components/ui/toaster";
import {useToast} from "@/components/ui/use-toast";
import {motion} from "framer-motion";
import {downloadCSV, generateReport} from "@/lib/gitlab";
import {Eye, EyeOff} from "lucide-react";
import {MonthPicker} from "@/components/ui/monthpicker.jsx";
import {TimeLogTable} from "@/components/ui/timelogtable.jsx";
import {convertTimeInHoursMinSec} from "@/lib/utils.js";
import {format} from "date-fns";
import Tabs from "@/components/ui/tabs.jsx";
import {InsightsTable} from "@/components/ui/insightstable.jsx";
import {fetchHollidays} from "@/lib/hollidays.js";

export default function App() {
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [hollidays, setHollidays] = useState([])
    const [insights, setInsights] = useState([])
    const [timeLogs, setTimeLogs] = useState([]);
    const [totalTime, setTotalTime] = useState(0);
    const {toast} = useToast();

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
            const csvContent = await generateReport(token, selectedDate);
            let auxTotal = 0;
            csvContent.forEach(element => {
                element.dataTrack.forEach(secondary => {
                    auxTotal += secondary.timeLoggedInSeconds;
                })
            })
            setTotalTime(auxTotal)
            setTimeLogs(csvContent);
            extractInsights(csvContent);
            const innerHollidays = await fetchHollidays(selectedDate.getFullYear())
            setHollidays(innerHollidays)
            if (csvContent.length) {
                toast({
                    title: "Sucesso!",
                    description: "Relatório gerado com sucesso",
                });
            } else {
                toast({
                    title: "Sem Registros",
                    description: "Nenhum registro encontrado para esse token no mês selecionado"
                })
            }
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

    const extractInsights = (data) => {
        const dates = {}
        data.forEach((data) => {
            data.dataTrack.forEach((secondary) => {
                const key = secondary.date.split("T")[0]
                if (dates[key]) {
                    dates[key] += secondary.timeLoggedInSeconds
                } else {
                    dates[key] = secondary.timeLoggedInSeconds
                }
            })
        })
        const keys = Object.keys(dates)
        const final = []
        keys.forEach((key) => {
            final.push({date: key, time: dates[key]})
        })
        final.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA.getTime() - dateB.getTime();
        });
        setInsights(final)
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-1">
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
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
                                    <Eye className="h-4 w-4"/>
                                ) : (
                                    <EyeOff className="h-4 w-4"/>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            O token deve ter permissões para acessar issues e time tracking
                        </p>
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                        <MonthPicker currentValue={selectedDate} setValue={setSelectedDate}/>
                    </div>
                    <div className="space-y-4">

                        <Button
                            onClick={handleGenerateCSV}
                            disabled={loading}
                            className="w-full"
                        >
                            Buscar Horas
                        </Button>
                        {timeLogs.length > 0 &&
                            <Button
                                onClick={() => downloadCSV(timeLogs, selectedDate)}
                                disabled={loading}
                                className="w-full"
                                variant={"secondary"}
                            >
                                Exportar CSV
                            </Button>
                        }

                    </div>
                </div>

                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500">
                        Seus dados são processados localmente e com segurança
                    </p>
                </div>
            </motion.div>
            {timeLogs.length > 0 &&
                <Tabs
                    items={[{
                        title: 'Geral', component: <TimeLogTable
                            data={[...timeLogs, {dataTrack: [{description: "Total", timeLoggedInSeconds: totalTime}]}]}
                            mainKeyInfo={{key: 'taskName', title: 'Tarefa'}}
                            subKey="dataTrack"
                            listOfItems={[
                                {
                                    key: 'description',
                                    title: 'Descrição Hora'
                                },
                                {
                                    key: 'date', title: 'Data', render: (data) => {
                                        if (data) {
                                            return format(new Date(data), 'dd/MM/yyyy')
                                        }
                                    }
                                },
                                {
                                    key: 'timeLoggedInSeconds',
                                    title: 'Horas Trabalhadas',
                                    render: convertTimeInHoursMinSec
                                }
                            ]}
                        />
                    }, {
                        title: 'Insights',
                        component: <InsightsTable data={insights} selectedDate={selectedDate} hollidays={hollidays}/>
                    }]}
                />
            }
            <Toaster/>
        </div>
    );
}
