//@ts-nocheck
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserCardDetail } from "@/components/user/user-card-detail";
import { UserProfile, UserBusinessCard } from "@/lib/supabase/user-server-actions";

interface UserMyCardDetailPageProps {
  user?: UserProfile;
  businessCards?: UserBusinessCard[];
}

export default function UserMyCardDetailPage({ user, businessCards = [] }: UserMyCardDetailPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 pb-24 relative text-white overflow-hidden">
      {/* Background Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob" style={{ animationDelay: "4s" }}></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-0 left-[10%] w-[1px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[120px] bg-gradient-to-b from-transparent via-blue-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "8s" }}></div>
      </div>

      <div className="relative z-10">
        <div className="bg-slate-950/50 backdrop-blur-md border-b border-white/10 px-5 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 -ml-2 text-white hover:text-white/80 hover:bg-white/10"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">내 명함 상세</h1>
            <div className="w-10"></div>
          </div>
        </div>

        <UserCardDetail user={user} businessCards={businessCards} />
      </div>
    </div>
  );
}
