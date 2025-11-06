import { useState } from 'react'
import React from 'react'

interface TabItem {
  title: string
  component: React.ReactNode
}

interface TabsProps {
  items: TabItem[]
}

const TabButton = ({
  children,
  isActive,
  onClick,
}: {
  children: React.ReactNode
  isActive: boolean
  onClick: () => void
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-t-lg transition-colors ${
        isActive
          ? 'bg-white dark:bg-gray-800 text-black dark:text-white border-b-2 border-orange-500 dark:border-orange-400'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default function Tabs({ items }: TabsProps) {
  const [activeTab, setActiveTab] = useState<number>(0)

  return (
    <div className="w-full flex flex-col items-center px-[10%]">
      <div className="flex gap-2 justify-center w-full border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-orange-50 dark:bg-gray-800 z-10">
        {items.map((item, index) => (
          <TabButton
            key={index}
            isActive={activeTab === index}
            onClick={() => setActiveTab(index)}
          >
            {item.title}
          </TabButton>
        ))}
      </div>
      <div className="p-4 w-full flex justify-center">
        {items[activeTab]?.component}
      </div>
    </div>
  )
}

