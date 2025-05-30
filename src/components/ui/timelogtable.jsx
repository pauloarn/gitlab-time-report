import React from 'react'

// const teste = {
//     key: string
//     title: string
//      render: (value) => string
// }

export function TimeLogTable({ data, mainKeyInfo, subKey, listOfItems }) {
	if (!data || data.length === 0) {
		return <div className='text-gray-500 text-center p-4'>No data available</div>
	}

	return (
		<div className='min-w-min p-12'>
			<table className='border-collapse table-auto'>
				<thead className='bg-gray-50'>
					<tr>
						<th className='w-1/4 px-4 py-4 text-sm font-medium text-gray-900 break-words'>
							{mainKeyInfo.title}
						</th>
						{listOfItems.map((item, index) => (
							<th
								className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
								key={item.key + index}
							>
								{item.title}
							</th>
						))}
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200'>
					{data.map((item, index) => {
						const subItems = item[subKey] || []
						return (
							<tr key={index} className='hover:bg-gray-50'>
								<td className='w-1/4 px-4 py-4 text-sm font-medium text-gray-900 break-words'>
									{item.webUrl ? (
										<a
											href={item.webUrl}
											target='_blank'
											rel='noopener noreferrer'
											className='text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center gap-2'
											title='Clique para abrir no GitLab'
										>
											{item[mainKeyInfo.key]}
										</a>
									) : (
										item[mainKeyInfo.key]
									)}
								</td>
								{listOfItems.map((itemKey, index) => (
									<td
										className='w-1/2 px-4 py-4 text-sm font-medium text-gray-900 break-words'
										key={itemKey.key + index}
									>
										<div className='space-y-2'>
											{subItems.map((subItem, subIndex) => (
												<div key={subIndex} className='text-sm text-gray-500'>
													{itemKey.render
														? itemKey.render(subItem[itemKey.key])
														: subItem[itemKey.key]}
												</div>
											))}
										</div>
									</td>
								))}
							</tr>
						)
					})}
				</tbody>
			</table>
		</div>
	)
}
