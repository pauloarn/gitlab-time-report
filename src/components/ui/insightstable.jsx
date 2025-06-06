import React from 'react';
import {eachDayOfInterval, endOfMonth, format, getDay, startOfMonth} from 'date-fns';
import {convertTimeInHoursMinSec} from '@/lib/utils.js';

export function InsightsTable({data, selectedDate, hollidays}) {
    console.log(hollidays)
    const getDaysInMonth = () => {
        const start = startOfMonth(selectedDate);
        const end = endOfMonth(selectedDate);
        return eachDayOfInterval({start, end});
    };

    const days = getDaysInMonth();
    const startingDayIndex = getDay(days[0]);

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="p-2 text-center font-medium text-gray-500">
                        {day}
                    </div>
                ))}
                {Array.from({length: startingDayIndex}).map((_, index) => (
                    <div key={`empty-${index}`} className="p-2"/>
                ))}
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = data.find(item => {
                        return format(new Date(item.date).setDate(new Date(item.date).getDate() + 1), 'yyyy-MM-dd') === dateStr
                    });
                    const isHoliday = hollidays.map(h => h.date).includes(dateStr);
                    return (
                        <div key={dateStr} className="p-2 border rounded min-h-[80px] text-center">
                            <div className="font-medium">{format(day, 'd')}</div>
                            {isHoliday && (
                                <div
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                                    Feriado
                                </div>
                            )}
                            {dayData && (
                                <div className="text-xs text-gray-600 mt-1">
                                    {convertTimeInHoursMinSec(dayData.time)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-4 p-4 border rounded text-center">
                <div className="font-medium text-gray-700">Total de Horas</div>
                <div className="text-lg text-gray-900">
                    {data.reduce((acc, curr) => acc + curr.time, 0) > 0
                        ? convertTimeInHoursMinSec(data.reduce((acc, curr) => acc + curr.time, 0))
                        : "0h 0m 0s"
                    }
                </div>
            </div>
        </div>
    );
}

