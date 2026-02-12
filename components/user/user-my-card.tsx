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
      <Card className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
        <div className="relative bg-slate-900 h-32 flex items-end px-6 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-slate-900"></div>
          <div className="absolute left-7 top-6 w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center shadow-lg border-4 border-slate-950 overflow-hidden z-10 ring-2 ring-purple-500/20">
            {user?.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="mb-3 ml-[6.6rem] relative z-10">
            <h2 className="text-2xl font-bold text-white drop-shadow-md">{name}</h2>
            <p className="text-sm text-slate-300 mt-1">{handle}</p>
          </div>
        </div>

        <div className="w-full h-12 bg-slate-900 relative">
          <div className="w-full h-full bg-slate-950 rounded-t-[3rem] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] relative z-10"></div>
        </div>
          
        <div className="px-6 pb-6 bg-slate-950 relative z-10 min-h-[400px]">
          <div className="flex flex-col gap-4">
            <div className="w-full flex flex-row items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <span className="px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-300 font-medium text-sm bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.15)]">소속</span>
              <p className="text-lg font-bold text-white tracking-wide">{company}</p>
            </div>
            <div className="w-full flex flex-row items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <span className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 font-medium text-sm bg-slate-800 shadow-inner">직무</span>
              <p className="text-lg font-bold text-white tracking-wide">{job}</p>
            </div>
          </div>

          {/* 소개 */}
          {intro ? (
            <div className="mt-6 bg-slate-900/80 backdrop-blur-sm rounded-2xl p-5 text-[15px] text-slate-200 leading-relaxed max-h-32 overflow-hidden border border-white/10 shadow-inner group hover:border-purple-500/30 transition-colors">
              <p className="line-clamp-4">{intro}</p>
            </div>
          ) : (
            <div className="mt-6 bg-slate-900/50 rounded-2xl p-5 text-sm text-slate-500 border border-white/5 border-dashed text-center">
              소개가 없습니다.
            </div>
          )}

          {/* 연락처 */}
          <div className="mt-8 px-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              연락처
            </h3>
            <div className="flex flex-col gap-4">
              {phone && (
                <div className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-xl transition-colors -mx-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 mb-0.5">전화번호</span>
                    <span className="text-white font-medium text-base">{formatPhone(phone)}</span>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-xl transition-colors -mx-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 mb-0.5">이메일</span>
                    <span className="text-white font-medium text-base break-all">{email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="my-8 flex gap-3">
            {/* 편집하기 버튼 - 왼쪽, 보라색 배경 */}
            <Link 
              href="/client/namecard/edit"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98]"
            >
              편집하기
            </Link>
            <Link 
              href="/card-books/my-card-detail"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 text-purple-300 border border-purple-500/30 rounded-2xl font-bold hover:bg-slate-700 hover:text-purple-200 transition-all shadow-lg active:scale-[0.98]"
            >
              더보기
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
