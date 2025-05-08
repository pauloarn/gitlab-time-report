import React from "react";
import {format} from "date-fns";
import {Button} from "@/components/ui/button";
import {ChevronLeft, ChevronRight} from "lucide-react";

export function MonthPicker({currentValue, setValue}) {
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril",
        "Maio", "Junho", "Julho", "Agosto",
        "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const currentDate = currentValue || new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const handleMonthChange = (monthIndex) => {
        const newDate = new Date(currentYear, monthIndex, 1);
        setValue(newDate);
    };

    const changeYear = (increment) => {
        const newDate = new Date(currentYear + increment, currentMonth, 1);
        setValue(newDate);
    };

    return (
        <div className="flex flex-col p-1 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between w-full mb-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeYear(-1)}
                >
                    <ChevronLeft className="h-4 w-4"/>
                </Button>
                <span className="font-semibold">{currentYear}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => changeYear(1)}
                >
                    <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>
            <div className="grid grid-cols-3 gap-1">
                {months.map((month, index) => (
                    <Button
                        key={month}
                        variant="ghost"
                        className={`text-sm p-2 ${
                            index === currentMonth ? "bg-blue-100" : ""
                        }`}
                        onClick={() => handleMonthChange(index)}
                    >
                        {format(new Date(currentYear, index), "MMM")}
                    </Button>
                ))}
            </div>
        </div>
    );
}