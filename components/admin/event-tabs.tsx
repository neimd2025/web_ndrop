"use client"

interface EventTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function EventTabs({ activeTab, onTabChange }: EventTabsProps) {
  const tabs = ["진행중", "예정", "종료"]

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}