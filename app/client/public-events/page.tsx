"use client";

import React, { useState, useEffect } from 'react';
import { eventAPI, eventParticipantAPI } from '@/lib/supabase/database';
import { createClient } from '@/utils/supabase/client';
import { ArrowLeft, Search, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/user/user-event-card';
import { useRouter } from 'next/navigation';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'모집중' | '마감'>('모집중');
  const router = useRouter();

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
        setEvents(eventsData);
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

  // 이벤트 모집 상태 확인
  const isEventAvailable = (event) => {
    const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
    const isPastEvent = new Date(event.end_date) < new Date();
    return !isEventFull && !isPastEvent;
  };

  // 이벤트 필터링
  const filteredEvents = events.filter(event => {
    // 검색어 필터링
    const matchesSearch = !searchTerm.trim() ||
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 탭별 필터링
    switch (activeTab) {
      case '모집중':
        return isEventAvailable(event);
      case '마감':
        const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
        const isPastEvent = new Date(event.end_date) < new Date();
        return isEventFull || isPastEvent;
      default:
        return true;
    }
  });

  // 상태 뱃지 컴포넌트
  const getStatusBadge = (event) => {
    const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
    const isPastEvent = new Date(event.end_date) < new Date();

    if (isPastEvent) {
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          종료
        </span>
      );
    }

    if (isEventFull) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
          마감
        </span>
      );
    }

    return (
      <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
        모집 중
      </span>
    );
  };

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
        {/* 토글 버튼들 - 모집중/마감으로 변경 */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          {(['모집중', '마감'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* 이벤트 카드 목록 */}
        {loading ? (
          <div className="text-center py-12" />
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
                getStatusBadge={getStatusBadge}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === '모집중' ? '모집 중인 이벤트가 없습니다' : '마감된 이벤트가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === '모집중' ? '새로운 이벤트를 기다려주세요!' : '모집 중인 이벤트를 확인해보세요!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;