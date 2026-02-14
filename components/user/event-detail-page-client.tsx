"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { EventDetailCard } from "@/components/ui/event-detail-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NetworkingTab } from "@/components/user/matching/networking-tab"
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
  const initialMeetingId = searchParams.get("meetingId")
  const initialOpenChat = searchParams.get("openChat") === "true"

  const [currentTab, setCurrentTab] = useState(defaultTab)

  useEffect(() => {
    setCurrentTab(defaultTab)
  }, [defaultTab])

  if (!isParticipating) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
          <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        </div>

        <div className="relative z-10 container mx-auto p-4 max-w-md pb-24">
          <EventDetailCard
            event={event}
            showEventCode={false}
            showOrganizerInfo={true}
            onJoinSuccess={() => setIsParticipating(true)}
            isDarkTheme={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto p-4 max-w-md pb-24">
         <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-slate-900/50 border border-white/10 p-1">
              <TabsTrigger 
                value="info"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400 hover:text-white hover:bg-white/5"
              >
                정보
              </TabsTrigger>
              <TabsTrigger 
                value="networking"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400 hover:text-white hover:bg-white/5"
              >
                네트워킹
              </TabsTrigger>
              <TabsTrigger 
                value="meetings"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400 hover:text-white hover:bg-white/5"
              >
                미팅
              </TabsTrigger>
            </TabsList>
          <TabsContent value="info">
            <EventDetailCard
              event={event}
              showEventCode={true}
              showOrganizerInfo={true}
              onLeaveSuccess={() => setIsParticipating(false)}
              isDarkTheme={true}
            />
          </TabsContent>
          <TabsContent value="networking">
            <NetworkingTab eventId={event.id} />
          </TabsContent>
          <TabsContent value="meetings">
            <MyMeetingsTab 
              eventId={event.id} 
              userId={userId} 
              initialMeetingId={initialMeetingId || undefined}
              initialOpenChat={initialOpenChat}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
