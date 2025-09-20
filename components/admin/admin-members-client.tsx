"use client"

import AdminHeader from "@/components/admin/admin-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AdminMember } from "@/lib/supabase/admin-server-actions"
import { Eye, Filter, MessageSquare, Search, Users } from "lucide-react"
import { useState } from "react"

interface AdminMembersClientProps {
  initialMembers: AdminMember[]
}

export function AdminMembersClient({ initialMembers }: AdminMembersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("전체")

  const filters = ["전체", "활성", "비활성"]

  const filteredMembers = initialMembers.filter((member) => {
    const matchesSearch =
      member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.company?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      activeFilter === "전체" ||
      (activeFilter === "활성" && member.role === "active") ||
      (activeFilter === "비활성" && member.role === "inactive")

    return matchesSearch && matchesFilter
  })

  return (
    <>
      <AdminHeader />

      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
            <p className="text-gray-500 mt-1">총 {initialMembers.length}명의 회원</p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-lg font-semibold text-purple-600">{initialMembers.length}</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="이름, 이메일, 회사로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
            />
          </div>

          <div className="flex space-x-2">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                className={`px-4 py-2 rounded-xl ${
                  activeFilter === filter
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "border-2 border-gray-200 bg-white hover:border-purple-300"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Members List */}
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <Card key={member.id} className="border border-gray-200 hover:border-purple-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{member.full_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900">{member.full_name}</h3>
                          <Badge
                            variant={member.role === "active" ? "default" : "secondary"}
                            className={`text-xs ${
                              member.role === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {member.role === "active" ? "활성" : "비활성"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-sm text-gray-600">
                          {member.company} / {member.role}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>가입일: {new Date(member.created_at).toLocaleDateString()}</span>
                          <span>최근 활동: {member.role}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>참가 이벤트: 0개</span>
                          <span>프로필 조회: 0회</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="p-2">
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  )
}