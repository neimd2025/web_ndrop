"use client"

import { useState } from "react"
import { Event } from "@/lib/supabase/server-actions"
import { calculateEventStatus } from "@/lib/supabase/database"
import { EventTabs } from "./event-tabs"
import { EventCard } from "./event-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface DashboardClientProps {
  initialEvents: Event[]
}

export function DashboardClient({ initialEvents }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState("진행중")

  // Filter events based on active tab
  const filteredEvents = initialEvents.filter(event => {
    const status = calculateEventStatus(event)
    switch (activeTab) {
      case "진행중":
        return status === "ongoing"
      case "예정":
        return status === "upcoming"
      case "종료":
        return status === "completed"
      default:
        return true
    }
  })

  return (
    <>
      <div className="px-4 py-6 space-y-6">
        {/* Tabs */}
        <EventTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <p>현재 표시된 이벤트가 없습니다.</p>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link href="/admin/events/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </>
  )
}