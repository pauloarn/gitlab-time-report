import React, { useState, useEffect } from 'react'
import { getFormattedBusinessHours } from '@/lib/businessHours'
import { fetchHollidays } from '@/lib/hollidays'

export function BusinessHours({ selectedDate, totalTime }) {
	const [hoursPerDay, setHoursPerDay] = useState(8)
	const [holidays, setHollidays] = useState([])

	useEffect(() => {
		async function loadHolidays() {
			try {
				const yearHolidays = await fetchHollidays(selectedDate.getFullYear())
				setHollidays(yearHolidays)
			} catch (error) {
				console.error('Falha ao carregar feriados:', error)
			}
		}
		loadHolidays()
	}, [selectedDate.getFullYear()])

	const handleHoursChange = (event) => {
		setHoursPerDay(Number(event.target.value))
	}

	const businessHoursInfo = getFormattedBusinessHours(
		selectedDate.getFullYear(),
		selectedDate.getMonth(),
		hoursPerDay,
		holidays,
		totalTime || 0
	)

	return (
		<div className='p-4 bg-white rounded-lg shadow'>
			<h2 className='text-xl font-semibold mb-4'>Cálculo de Horas Úteis</h2>

			<div className='space-y-4'>
				<div>
					<label className='block text-sm font-medium text-gray-700 mb-1'>Horas por Dia</label>
					<input
						type='number'
						min='1'
						max='24'
						value={hoursPerDay}
						onChange={handleHoursChange}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				<div className='mt-6 p-4 bg-gray-50 rounded-md'>
					<h3 className='text-lg font-medium mb-2'>Resumo de Horas</h3>
					<div className='space-y-2'>
						<p>
							<span className='font-medium'>Mês:</span> {businessHoursInfo.monthName}
						</p>
						<p>
							<span className='font-medium'>Dias Úteis:</span> {businessHoursInfo.businessDays}
						</p>
						<p>
							<span className='font-medium'>Horas por Dia:</span> {businessHoursInfo.hoursPerDay}
						</p>
						<p>
							<span className='font-medium'>Horas Esperadas:</span>{' '}
							{businessHoursInfo.totalHours.toFixed(1)}h
						</p>
						<p>
							<span className='font-medium'>Horas Registradas:</span>{' '}
							{businessHoursInfo.loggedHours.toFixed(1)}h
						</p>
						<p
							className={`font-medium ${
								businessHoursInfo.remainingHours > 0 ? 'text-red-600' : 'text-green-600'
							}`}
						>
							{businessHoursInfo.remainingHours > 0
								? `Faltam ${businessHoursInfo.remainingHours.toFixed(1)}h`
								: 'Horas completadas!'}
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
