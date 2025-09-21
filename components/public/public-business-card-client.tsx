"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { UserBusinessCard } from '@/lib/supabase/user-server-actions'
import { Mail, Phone, Globe, MapPin, User, Building } from 'lucide-react'
import { useState } from 'react'

interface PublicBusinessCardClientProps {
  businessCard: UserBusinessCard & {
    user_profiles: {
      id: string
      full_name: string
      email: string
      profile_image_url?: string
    }
  }
}

export function PublicBusinessCardClient({ businessCard }: PublicBusinessCardClientProps) {
  const [isSaved, setIsSaved] = useState(false)

  const handleSaveCard = () => {
    // TODO: 명함 저장 기능 구현
    setIsSaved(true)
    alert('명함이 저장되었습니다!')
  }

  const getInitial = () => {
    const name = businessCard.name || businessCard.user_profiles.full_name || 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-lg font-semibold text-center">명함</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* 명함 카드 */}
        <Card className="bg-white shadow-lg border-0 overflow-hidden">
          <CardContent className="p-0">
            {/* 헤더 배경 */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 h-24 relative">
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                {businessCard.user_profiles.profile_image_url ? (
                  <img
                    src={businessCard.user_profiles.profile_image_url}
                    alt="프로필"
                    className="w-16 h-16 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white rounded-full border-4 border-white flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-xl">{getInitial()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 명함 정보 */}
            <div className="pt-10 pb-6 px-6 text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {businessCard.name}
              </h2>
              <p className="text-purple-600 font-medium mb-1">
                {businessCard.title}
              </p>
              <p className="text-gray-600 text-sm mb-4">
                {businessCard.company}
              </p>

              {/* 소개 */}
              {businessCard.bio && (
                <div className="mb-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {businessCard.bio}
                  </p>
                </div>
              )}

              {/* 연락처 정보 */}
              <div className="space-y-3 mb-6">
                {/* 이메일 */}
                <div className="flex items-center justify-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <a
                    href={`mailto:${businessCard.email}`}
                    className="text-gray-700 hover:text-purple-600"
                  >
                    {businessCard.email}
                  </a>
                </div>

                {/* 전화번호 */}
                {businessCard.phone && (
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <a
                      href={`tel:${businessCard.phone}`}
                      className="text-gray-700 hover:text-purple-600"
                    >
                      {businessCard.phone}
                    </a>
                  </div>
                )}

                {/* 웹사이트 */}
                {businessCard.website && (
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <a
                      href={businessCard.website.startsWith('http') ? businessCard.website : `https://${businessCard.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-700 hover:text-purple-600"
                    >
                      {businessCard.website}
                    </a>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-3">
                <Button
                  onClick={handleSaveCard}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSaved}
                >
                  {isSaved ? '저장됨' : '명함 저장하기'}
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(`mailto:${businessCard.email}`, '_blank')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    이메일
                  </Button>
                  {businessCard.phone && (
                    <Button
                      onClick={() => window.open(`tel:${businessCard.phone}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-gray-200"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      전화
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            Powered by Neimed
          </p>
        </div>
      </div>
    </div>
  )
}