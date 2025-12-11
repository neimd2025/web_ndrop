//@ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { eventAPI, eventParticipantAPI } from '@/lib/supabase/database';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/user/user-event-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter } from 'next/navigation';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('');
  const router = useRouter();

  const REGIONS = [
    '전체', '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  // 클라이언트에서 직접 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setCurrentUser(null);
          setAuthLoading(false);
          return;
        }

        setCurrentUser({
          id: session.user.id,
          email: session.user.email!,
        });
      } catch (err) {
        setError('로그인이 필요합니다.');
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 이벤트 데이터 가져오기 - 공개 이벤트만
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const eventsData = await eventAPI.getAllEvents();
        
        // is_public이 true인 이벤트만 필터링
        // is_public이 undefined/null인 경우도 공개로 간주 (기본값이 true)
        const publicEvents = eventsData.filter(event => 
          event.is_public === true || event.is_public === undefined || event.is_public === null
        );
        
        setEvents(publicEvents);
      } catch (err) {
        setError('이벤트를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 이벤트 참가 처리 - API 사용
  const handleJoinEvent = async (eventId) => {
    if (!currentUser) {
      setError('이벤트 참가를 위해서는 로그인이 필요합니다.');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [eventId]: true }));
      setError('');
      
      const event = await eventAPI.getEvent(eventId);
      if (!event) {
        throw new Error('이벤트를 찾을 수 없습니다.');
      }

      // 공개 이벤트인지 확인
      if (event.is_public === false) {
        throw new Error('비공개 이벤트는 참가할 수 없습니다.');
      }

      if (event.max_participants && event.current_participants >= event.max_participants) {
        throw new Error('이 이벤트는 마감되었습니다.');
      }

      if (new Date(event.end_date) < new Date()) {
        throw new Error('종료된 이벤트입니다.');
      }

      // 실제 API 호출로 참가 처리
      const participation = await eventParticipantAPI.joinEvent(eventId, currentUser.id);
      if (!participation) {
        throw new Error('이벤트 참가에 실패했습니다.');
      }

      // 이벤트 목록 업데이트 (참가자 수 증가)
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === eventId 
            ? { ...e, current_participants: (e.current_participants || 0) + 1 }
            : e
        )
      );

      alert('이벤트에 성공적으로 참가했습니다!');
    } catch (err) {
      setError(err.message || '이벤트 참가 중 오류가 발생했습니다.');
      console.error('Error joining event:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // 이벤트 참가 취소 처리 - API 사용
  const handleCancelEvent = async (eventId) => {
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [eventId]: true }));
      setError('');

      // 실제 API 호출로 참가 취소 처리
      const success = await eventParticipantAPI.leaveEvent(eventId, currentUser.id);
      if (!success) {
        throw new Error('이벤트 참가 취소에 실패했습니다.');
      }

      // 이벤트 목록 업데이트 (참가자 수 감소)
      setEvents(prevEvents => 
        prevEvents.map(e => 
          e.id === eventId 
            ? { ...e, current_participants: Math.max(0, (e.current_participants || 1) - 1) }
            : e
        )
      );

      alert('이벤트 참가를 취소했습니다.');
    } catch (err) {
      setError(err.message || '이벤트 참가 취소 중 오류가 발생했습니다.');
      console.error('Error canceling event:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // 이벤트 필터링
  const filteredEvents = events.filter(event => {
    // 검색어 필터링
    const matchesSearch = !searchTerm.trim() ||
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.region?.toLowerCase().includes(searchTerm.toLowerCase());

    // 지역 필터링
    const matchesRegion = !selectedRegion || selectedRegion === '전체' || event.region === selectedRegion;

    // 공개 이벤트만 필터링 (이미 데이터를 가져올 때 필터링했지만 추가 확인)
    const isPublic = event.is_public !== false;

    return matchesSearch && matchesRegion && isPublic;
  });

  // 참가 버튼 컴포넌트
  const getActionButton = (event) => {
    const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
    const isPastEvent = new Date(event.end_date) < new Date();
    const isLoading = actionLoading[event.id];

    if (isLoading) {
      return (
        <Button disabled className="w-1/2 bg-purple-400">
          처리 중...
        </Button>
      );
    }

    if (isPastEvent) {
      return (
        <Button disabled className="w-1/2 bg-gray-400">
          지난 이벤트
        </Button>
      );
    }

    if (isEventFull) {
      return (
        <Button disabled className="w-1/2 bg-gray-400">
          마감된 이벤트
        </Button>
      );
    }

    return (
      <Button 
        onClick={() => handleJoinEvent(event.id)}
        className="w-1/2 bg-purple-600 hover:bg-purple-700"
      >
        참가하기
      </Button>
    );
  };

  return (
    <div className="min-h-screen">
      {/* 헤더 - 지정된 디자인 적용 */}
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
          <h1 className="text-xl font-bold text-gray-900">공식 행사</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* 검색바 - 지정된 디자인 적용 */}
      <div className="bg-white px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="행사 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-5">
        {/* 지역 필터 드롭다운 */}
        <div className="mb-6">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="지역" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 이벤트 카드 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-2">이벤트를 불러오는 중...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onJoinEvent={handleJoinEvent}
                actionLoading={actionLoading}
                currentUser={currentUser}
                getActionButton={getActionButton}
                param="public"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              공개된 이벤트가 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              다른 지역을 선택하거나 검색어를 변경해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;