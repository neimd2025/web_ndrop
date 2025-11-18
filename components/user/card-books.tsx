"use client";

import React, { useState } from "react"
import { Button } from '@/components/ui/button'
import { ArrowLeft, Search, Star, User } from 'lucide-react'
import { UserMyCard } from "@/components/user/user-my-card";
import { UserSavedCardsClient } from "@/components/user/user-saved-cards-client";

export default function CardBooks({ user, businessCards, participatedEvents, stats, savedCards }) {
  const [filter, setFilter] = useState("mine");

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 text-gray-900" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">명함첩</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 mt-2">
        <div className="w-full bg-gray-100 rounded-lg p-1 flex justify-between">
          {(["mine", "others"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`flex-1 px-8 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                filter === status
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {status === "mine" && "내 명함"}
              {status === "others" && "내가 모은 명함"}
            </button>
          ))}
        </div>
      </div>

      { filter === "mine" && (
      <UserMyCard
        user={user}
        businessCards={businessCards}
        participatedEvents={participatedEvents}
      />
      )}

      { filter === "others" && (
        <UserSavedCardsClient 
          user={user} 
          savedCards={savedCards} 
          filter={filter}
        />
       )}
    </div>
  );
}
