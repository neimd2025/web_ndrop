"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UserBusinessCard, UserProfile } from "@/lib/supabase/user-server-actions";
import { User, Mail, Phone } from "lucide-react";

interface UserMyCardProps {
  user?: UserProfile;
  businessCards?: UserBusinessCard[];
}

export function UserMyCard({ user, businessCards = [] }: UserMyCardProps) {
  const primaryCard = businessCards.find((c) => c.is_public) || businessCards[0];

  const name = user?.full_name ?? user?.email?.split("@")[0] ?? "사용자";
  const handle = "@" + (user?.full_name ? user.full_name.split(" ")[0] : user?.email?.split("@")[0]);
  const intro = primaryCard?.introduction ?? primaryCard?.bio ?? user?.introduction ?? "";
  const company = primaryCard?.company ?? primaryCard?.affiliation ?? "미입력";
  const job = primaryCard?.job_title ?? primaryCard?.title ?? "미입력";
  const phone = primaryCard?.phone ?? primaryCard?.contact ?? "";
  const email = primaryCard?.email ?? user?.email ?? "";

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, "");
    if (/^02\d{7,8}$/.test(digits)) return digits.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
    if (/^01[016789]\d{7,8}$/.test(digits)) return digits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
    return num;
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4">
      <Card className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl border border-gray-200">
        <div className="relative bg-[#242E3A] h-32 flex items-end px-6 pb-6">
          <div className="absolute left-7 top-6 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-white overflow-hidden">
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="mb-3 ml-[6.6rem]">
            <h2 className="text-2xl font-semibold text-white">{name}</h2>
            <p className="text-sm text-gray-200 mt-1">{handle}</p>
          </div>
        </div>

<div className="w-full h-12 bg-[#242E3A]">
  <div className="w-full h-full bg-white rounded-t-full"></div>
</div>
  
<div className="px-6 pb-6 bg-white">
          <div className="flex flex-col gap-3">
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-purple-300 text-purple-700 font-medium text-md bg-white">소속</button>
              <p className="text-md font-medium text-gray-700">{company}</p>
            </div>
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-gray-200 text-gray-700 font-medium text-md bg-white">직무</button>
              <p className="text-md font-medium text-gray-700">{job}</p>
            </div>
          </div>

          {/* 소개 */}
          {intro ? (
            <div className="mt-6 bg-gray-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-28 overflow-hidden">
              <p className="line-clamp-4">{intro}</p>
            </div>
          ) : (
            <div className="mt-6 bg-gray-100 rounded-xl p-4 text-sm text-gray-400">
              소개가 없습니다.
            </div>
          )}

          {/* 연락처 */}
          <div className="mt-6 px-1">
            <h3 className="text-md font-semibold text-gray-800 mb-3">연락처</h3>
            <div className="flex flex-col gap-4">
              {phone && (
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">전화번호</span>
                    <span className="text-purple-600 font-medium text-sm">{formatPhone(phone)}</span>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-4">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">이메일</span>
                    <span className="text-purple-600 font-medium text-sm">{email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="my-8 flex gap-3">
            {/* 편집하기 버튼 - 왼쪽, 보라색 배경 */}
            <Link 
              href="/client/namecard/edit"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
            >
      편집하기
  </Link>
            <Link 
              href="/card-books/my-card-detail"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-purple-600 border border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-md"
            >
      더보기
  </Link>
</div>
        </div>
      </Card>
    </div>
  );
}
