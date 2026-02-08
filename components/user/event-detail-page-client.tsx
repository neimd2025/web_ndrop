"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { EventDetailCard } from "@/components/ui/event-detail-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MatchingTab } from "@/components/user/matching/matching-tab"
import { MyMeetingsTab } from "@/components/user/matching/my-meetings-tab"

interface EventDetailPageClientProps {
  event: any 
  initialParticipation: boolean
  userId: string
}

export function EventDetailPageClient({
  event,
  initialParticipation,
  userId,
}: EventDetailPageClientProps) {
  const [isParticipating, setIsParticipating] = useState(initialParticipation)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "info"

  if (!isParticipating) {
    return (
      <div className="container mx-auto p-4 max-w-md pb-24">
        <EventDetailCard
          event={event}
          showEventCode={false}
          showOrganizerInfo={true}
          onJoinSuccess={() => setIsParticipating(true)}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-md pb-24">
       <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="info">정보</TabsTrigger>
          <TabsTrigger value="matching">매칭</TabsTrigger>
          <TabsTrigger value="meetings">내 미팅</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <EventDetailCard
            event={event}
            showEventCode={true}
            showOrganizerInfo={true}
            onLeaveSuccess={() => setIsParticipating(false)}
          />
        </TabsContent>
        <TabsContent value="matching">
          <MatchingTab eventId={event.id} />
        </TabsContent>
        <TabsContent value="meetings">
          <MyMeetingsTab eventId={event.id} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
