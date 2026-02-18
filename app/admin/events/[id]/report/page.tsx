'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface KpiState {
  attendanceRate: number
  totalParticipants: number
  checkedIn: number
  connections: number
  avgConnectionsPerPerson: number
  messages: number | null
  satisfaction: number | null
   networkingParticipationRate: number
  networkingParticipants: number
}

export default function EventReportPage({ params }: any) {
  const router = useRouter()
  const eventId = params.id

  const [eventInfo, setEventInfo] = useState<{
    title: string
    startDate: string
    endDate: string
    location: string | null
  } | null>(null)

  const [kpi, setKpi] = useState<KpiState>({
    attendanceRate: 0,
    totalParticipants: 0,
    checkedIn: 0,
    connections: 0,
    avgConnectionsPerPerson: 0,
    messages: null,
    satisfaction: null,
    networkingParticipationRate: 0,
    networkingParticipants: 0,
  })

  const [timeline, setTimeline] = useState<any[]>([])
  const [checkinTimeline, setCheckinTimeline] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<{
    interestStats: { label: string; value: number }[]
    roleStats: { label: string; value: number }[]
    ageStats: { label: string; value: number }[]
    mbtiStats: { label: string; value: number }[]
  } | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!eventId) return
      setLoading(true)

      try {
        const adminToken =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('admin_token')
            : null

        if (!adminToken) {
          setEventInfo(null)
          setKpi({
            attendanceRate: 0,
            totalParticipants: 0,
            checkedIn: 0,
            connections: 0,
            avgConnectionsPerPerson: 0,
            messages: null,
            satisfaction: null,
            networkingParticipationRate: 0,
            networkingParticipants: 0,
          })
          setCheckinTimeline([])
          setAnalytics(null)
          setTimeline([])
          return
        }

        const response = await fetch('/api/admin/event-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ eventId }),
        })

        if (!response.ok) {
          setEventInfo(null)
          setKpi({
            attendanceRate: 0,
            totalParticipants: 0,
            checkedIn: 0,
            connections: 0,
            avgConnectionsPerPerson: 0,
            messages: null,
            satisfaction: null,
            networkingParticipationRate: 0,
            networkingParticipants: 0,
          })
          setCheckinTimeline([])
          setAnalytics(null)
          setTimeline([])
          return
        }

        const result = await response.json()

        setEventInfo(result.eventInfo || null)
        setKpi(result.kpi)
        setCheckinTimeline(Array.isArray(result.checkinTimeline) ? result.checkinTimeline : [])
        setAnalytics(result.analytics || null)

        try {
          const timelineToken =
            typeof window !== 'undefined'
              ? window.localStorage.getItem('admin_token')
              : null
          if (timelineToken) {
            const timelineResponse = await fetch('/api/admin/event-collection-timeline', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${timelineToken}`,
              },
              body: JSON.stringify({ eventId, groupBy: 'hour' }),
            })
            if (timelineResponse.ok) {
              const timelineResult = await timelineResponse.json()
              if (Array.isArray(timelineResult.timeline)) {
                setTimeline(timelineResult.timeline)
              } else {
                setTimeline([])
              }
            } else {
              setTimeline([])
            }
          } else {
            setTimeline([])
          }
        } catch {
          setTimeline([])
        }
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [eventId])

  const peakHour = useMemo(() => {
    if (!timeline || timeline.length === 0) return null
    return timeline.reduce(
      (max, cur) => (cur.count > max.count ? cur : max),
      timeline[0]
    )
  }, [timeline])

  const timelineChartData = useMemo(() => {
    if (!checkinTimeline || checkinTimeline.length === 0) return []
    const items = checkinTimeline.filter(item => item.count > 0)
    return items.slice(0, 12).map(item => {
      const parts = String(item.date).split(' ')
      const timePart = parts[1] || parts[0]
      const label = timePart.slice(0, 5)
      return { label, count: item.count }
    })
  }, [checkinTimeline])

  const peakChartData = useMemo(() => {
    if (!timeline || timeline.length === 0) return []
    const sorted = [...timeline].sort((a, b) => b.count - a.count)
    const top = sorted.slice(0, 5)
    return top.map(item => {
      const parts = String(item.date).split(' ')
      const timePart = parts[1] || parts[0]
      const label = timePart.slice(0, 5)
      return { label, count: item.count }
    })
  }, [timeline])

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-semibold text-purple-600">
                NDROP 행사 성과 리포트
              </p>
              <h1 className="text-2xl font-bold text-gray-900">
                리포트 분석
              </h1>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-gray-900 hover:bg-black text-white"
            disabled
          >
            <Download className="mr-2 h-4 w-4" />
            PDF 리포트 다운로드
          </Button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-10">
          <section>
            <Card className="border-0 shadow-md rounded-3xl bg-gradient-to-b from-indigo-50 to-white">
              <CardContent className="px-8 py-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold text-purple-600">
                    A. 행사 기본 정보
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {eventInfo?.title || '행사명'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {eventInfo
                      ? `${new Date(
                          eventInfo.startDate
                        ).toLocaleString()} ~ ${new Date(
                          eventInfo.endDate
                        ).toLocaleString()}`
                      : '행사 일시'}
                    {eventInfo?.location ? ` · ${eventInfo.location}` : ''}
                  </p>
                </div>
                <div className="flex gap-6 text-sm text-gray-700">
                  <div>
                    <p className="text-xs text-gray-500">총 참가자 수</p>
                    <p className="mt-1 text-xl font-semibold">
                      {kpi.totalParticipants}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">실제 참여자 수</p>
                    <p className="mt-1 text-xl font-semibold">
                      {kpi.checkedIn}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                B. 핵심 성과 KPI 요약
              </h2>
            </div>
            <Card className="border-0 shadow-md rounded-3xl bg-gray-50">
              <CardContent className="px-8 py-6 grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-6">
                <div>
                  <p className="text-xs text-gray-500">출석률</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.attendanceRate}
                    <span className="ml-1 text-base">%</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">총 디지털 명함 교환 횟수</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.connections}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">1인당 평균 네트워킹 수</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.avgConnectionsPerPerson}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">네트워킹 메시지 참여 (총 메시지 개수)</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.messages ?? 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">네트워킹 참여율 (메시지 사용 비율)</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.networkingParticipationRate}
                    <span className="ml-1 text-base">%</span>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {kpi.networkingParticipants}명 / {kpi.checkedIn}명
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">평균 만족도</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {kpi.satisfaction ? kpi.satisfaction.toFixed(1) : '-'}
                    {kpi.satisfaction && (
                      <span className="ml-1 text-base text-gray-500">/ 5</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              C. 참여 및 네트워킹 활성 추이
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    시간대별 체크인 추이
                  </p>
                  {timelineChartData.length > 0 ? (
                    <ChartContainer
                      config={{
                        count: {
                          label: '체크인',
                          color: 'hsl(262.1 83.3% 57.8%)'
                        }
                      }}
                      className="h-40 w-full"
                    >
                      <AreaChart data={timelineChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          allowDecimals={false}
                          tickLine={false}
                          axisLine={false}
                          width={24}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="var(--color-count)"
                          fill="var(--color-count)"
                          fillOpacity={0.18}
                        />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center text-xs text-gray-400">
                      아직 시간대별 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    디지털 명함 교환(네트워킹) 발생 추이 및 피크 타임
                  </p>
                  {peakChartData.length > 0 ? (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white px-4 py-3 flex flex-col">
                      <ChartContainer
                        config={{
                          count: {
                            label: '네트워킹',
                            color: 'hsl(263.4 70% 50.4%)'
                          }
                        }}
                        className="h-24 w-full"
                      >
                        <BarChart data={peakChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            strokeOpacity={0.5}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                          />
                          <YAxis
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            width={24}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar
                            dataKey="count"
                            radius={[4, 4, 0, 0]}
                            fill="var(--color-count)"
                          />
                        </BarChart>
                      </ChartContainer>
                      {peakHour && (
                        <p className="mt-2 text-[11px] text-gray-600 text-center">
                          피크 타임: {String(peakHour.date).split(' ')[1]?.slice(0, 5)} /{' '}
                          {peakHour.count}건
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white flex flex-col items-center justify-center text-xs text-gray-400">
                      아직 네트워킹 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              D. 참가자 구성 분석
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    관심사 카테고리 분포
                  </p>
                  {analytics && analytics.interestStats.length > 0 ? (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-indigo-100 to-white px-4 py-3 overflow-hidden">
                      <div className="space-y-2 text-xs text-gray-700">
                        {analytics.interestStats.map(item => {
                          const total = analytics.interestStats.reduce(
                            (sum, s) => sum + s.value,
                            0
                          )
                          const percent =
                            total > 0 ? Math.round((item.value / total) * 100) : 0
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <div className="w-24 truncate">{item.label}</div>
                              <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-indigo-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="w-10 text-right">
                                {percent}
                                <span className="ml-0.5">%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center text-xs text-gray-400">
                      아직 참가자 관심사 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    직군 / 역할 분포
                  </p>
                  {analytics && analytics.roleStats.length > 0 ? (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white px-4 py-3 overflow-hidden">
                      <div className="space-y-2 text-xs text-gray-700">
                        {analytics.roleStats.map(item => {
                          const total = analytics.roleStats.reduce(
                            (sum, s) => sum + s.value,
                            0
                          )
                          const percent =
                            total > 0 ? Math.round((item.value / total) * 100) : 0
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <div className="w-24 truncate">{item.label}</div>
                              <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-purple-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="w-10 text-right">
                                {percent}
                                <span className="ml-0.5">%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white flex items-center justify-center text-xs text-gray-400">
                      아직 직군/역할 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2">
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    연령대 분포
                  </p>
                  {analytics && analytics.ageStats.length > 0 ? (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-indigo-100 to-white px-4 py-3 overflow-hidden">
                      <div className="space-y-2 text-xs text-gray-700">
                        {analytics.ageStats.map(item => {
                          const total = analytics.ageStats.reduce(
                            (sum, s) => sum + s.value,
                            0
                          )
                          const percent =
                            total > 0 ? Math.round((item.value / total) * 100) : 0
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <div className="w-24 truncate">{item.label}</div>
                              <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-indigo-400"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="w-10 text-right">
                                {percent}
                                <span className="ml-0.5">%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-indigo-100 to-white flex items-center justify-center text-xs text-gray-400">
                      아직 연령대 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md rounded-3xl">
                <CardContent className="px-6 py-5">
                  <p className="text-xs text-gray-500 mb-3">
                    MBTI 분포
                  </p>
                  {analytics && analytics.mbtiStats.length > 0 ? (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white px-4 py-3 overflow-hidden">
                      <div className="space-y-2 text-xs text-gray-700">
                        {analytics.mbtiStats.map(item => {
                          const total = analytics.mbtiStats.reduce(
                            (sum, s) => sum + s.value,
                            0
                          )
                          const percent =
                            total > 0 ? Math.round((item.value / total) * 100) : 0
                          return (
                            <div key={item.label} className="flex items-center gap-2">
                              <div className="w-16 font-semibold">{item.label}</div>
                              <div className="flex-1 h-2 rounded-full bg-white/70 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-purple-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="w-10 text-right">
                                {percent}
                                <span className="ml-0.5">%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 rounded-2xl bg-gradient-to-b from-purple-100 to-white flex items-center justify-center text-xs text-gray-400">
                      아직 MBTI 데이터가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold text-gray-900">
              E. AI 기반 인사이트 요약
            </h2>
            <Card className="border-0 shadow-xl rounded-3xl bg-slate-950 text-white">
              <CardContent className="px-8 py-8 grid gap-8 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-center">
                <div>
                  <p className="text-xs font-semibold text-purple-300">
                    행사 성과 총평
                  </p>
                  <p className="mt-4 text-lg leading-relaxed text-slate-100">
                    "AI가 참가자 행동 데이터와 네트워킹 패턴을 분석해, 이번
                    행사의 특징과 다음 회차를 위한 개선 포인트를 정리해
                    드립니다."
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-slate-300">
                    <li>• 이번 행사 특징 요약 (2~3줄)</li>
                    <li>• 네트워킹이 잘 된/덜 된 이유 분석</li>
                    <li>• 다음 행사 개선 제안 (3~5개)</li>
                  </ul>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-b from-purple-500 to-indigo-500 flex items-center justify-center">
                    <span className="text-3xl font-bold">0</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">종합 성과 지수 / 100</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    AI 인사이트 점수는 추후 계산 로직 연동 예정
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {loading && (
            <p className="text-xs text-gray-400 text-center pb-6">
              리포트 데이터를 불러오는 중입니다...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
