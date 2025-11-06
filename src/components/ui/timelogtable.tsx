import React from 'react'
import type {
  TimeLog,
  TimeLogEntry,
  TableColumn,
  TableMainKeyInfo,
} from '@/types'

interface TimeLogTableProps {
  data: TimeLog[]
  mainKeyInfo: TableMainKeyInfo
  subKey: keyof TimeLog
  listOfItems: TableColumn[]
}

export function TimeLogTable({
  data,
  mainKeyInfo,
  subKey,
  listOfItems,
}: TimeLogTableProps) {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center p-4">No data available</div>
  }

  // Separar colunas de issue level e subItem level
  const issueLevelColumns = listOfItems.filter((col) => col.isIssueLevel)
  const subItemColumns = listOfItems.filter((col) => !col.isIssueLevel)

  return (
    <div className="min-w-min p-12">
      <table className="border-collapse table-auto">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-1/4 px-4 py-4 text-sm font-medium text-gray-900 break-words">
              {mainKeyInfo.title}
            </th>
            {issueLevelColumns.map((item, index) => (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                key={`issue-${item.key}-${index}`}
              >
                {item.title}
              </th>
            ))}
            {subItemColumns.map((item, index) => (
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                key={`sub-${item.key}-${index}`}
              >
                {item.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => {
            const subItems = (item[subKey] as TimeLogEntry[]) || []
            const maxRows = Math.max(subItems.length, 1) // Pelo menos 1 linha

            return (
              <React.Fragment key={index}>
                {Array.from({ length: maxRows }).map((_, rowIndex) => (
                  <tr key={`${index}-${rowIndex}`} className="hover:bg-gray-50">
                    {rowIndex === 0 && (
                      <>
                        <td
                          rowSpan={maxRows}
                          className="w-1/4 px-4 py-4 text-sm font-medium text-gray-900 break-words align-top"
                        >
                          {item.webUrl ? (
                            <a
                              href={item.webUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 flex items-center gap-2"
                              title="Clique para abrir no GitLab"
                            >
                              {item[mainKeyInfo.key as keyof TimeLog] as string}
                            </a>
                          ) : (
                            (item[mainKeyInfo.key as keyof TimeLog] as string)
                          )}
                        </td>
                        {issueLevelColumns.map((col, colIndex) => (
                          <td
                            key={`issue-${col.key}-${colIndex}`}
                            rowSpan={maxRows}
                            className="px-4 py-4 text-sm text-gray-900 break-words align-top"
                          >
                            {col.render
                              ? col.render(item[col.key as keyof TimeLog], item)
                              : (item[col.key as keyof TimeLog] as string | number | null | undefined)?.toString() || '-'}
                          </td>
                        ))}
                      </>
                    )}
                    {subItemColumns.map((itemKey, colIndex) => {
                      const subItem = subItems[rowIndex]
                      return (
                        <td
                          key={`sub-${itemKey.key}-${colIndex}`}
                          className="w-1/2 px-4 py-4 text-sm font-medium text-gray-900 break-words"
                        >
                          {subItem ? (
                            <div className="text-sm text-gray-500">
                              {itemKey.render
                                ? itemKey.render(subItem[itemKey.key])
                                : subItem[itemKey.key]}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-300">-</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

