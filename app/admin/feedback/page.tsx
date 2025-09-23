"use client"

import AdminHeader from "@/components/admin/admin-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { createClient } from "@/utils/supabase/client"
import { Calendar, MessageSquare, Star } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Feedback {
  id: string
  user_id: string
  event_id: string
  rating: number
  feedback: string
  created_at: string
  user_profiles: {
    full_name: string
  } | null
  events: {
    title: string
  } | null
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const { admin } = useAdminAuth()
  const supabase = createClient()

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const fetchFeedbacks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('feedback')
        .select(`
          *,
          user_profiles(full_name),
          events(title)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('피드백 데이터 가져오기 오류:', error)
        toast.error('피드백 데이터를 불러오는데 실패했습니다.')
        return
      }

      setFeedbacks(data || [])
    } catch (error) {
      console.error('피드백 데이터 가져오기 오류:', error)
      toast.error('피드백 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`h-4 w-4 ${index < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`} />
    ))
  }

  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length).toFixed(1)
      : "0.0"

  return (
    <div className="min-h-screen bg-white">
      <AdminHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">이벤트 피드백</h1>
            <p className="text-gray-500 mt-1">총 {feedbacks.length}개의 피드백</p>
          </div>
          <div className="text-center">
            <div className="flex items-center space-x-1">
              {renderStars(Math.round(Number.parseFloat(averageRating)))}
            </div>
            <p className="text-sm text-gray-500 mt-1">평균 {averageRating}점</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">{feedbacks.length}</span>
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-500 mt-1">총 피드백</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">{averageRating}</span>
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">평균 평점</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {feedbacks.filter((f) => f.rating >= 4).length}
                </span>
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-gray-500 mt-1">긍정적 피드백</p>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">피드백 데이터를 불러오는 중입니다...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">아직 피드백이 없습니다.</p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <Card key={feedback.id} className="border border-gray-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-gray-900">{feedback.user_profiles?.full_name || "익명"}</h3>
                        <Badge className="bg-purple-100 text-purple-700 text-xs">{feedback.events?.title || "알 수 없음"}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center space-x-1">{renderStars(feedback.rating)}</div>
                        <span className="text-sm text-gray-500">{feedback.rating}점</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{feedback.created_at}</span>
                  </div>

                  <p className="text-gray-700 leading-relaxed">{feedback.feedback}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{feedback.user_profiles?.full_name?.charAt(0) || "?"}</span>
                      </div>
                      <span className="text-sm text-gray-600">{feedback.user_profiles?.full_name || "익명"}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        feedback.rating >= 4
                          ? "border-green-200 text-green-700 bg-green-50"
                          : feedback.rating >= 3
                            ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                            : "border-red-200 text-red-700 bg-red-50"
                      }`}
                    >
                      {feedback.rating >= 4 ? "긍정적" : feedback.rating >= 3 ? "보통" : "부정적"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
