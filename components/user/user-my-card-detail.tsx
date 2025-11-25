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

export default function UserMyCardDetailPage({ user, businessCards = [] }: MyCardDetailPageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <div className="bg-[#242E3A] border-0 px-5 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">내 명함 상세</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <UserCardDetail user={user} businessCards={businessCards} />
    </div>
  );
}
