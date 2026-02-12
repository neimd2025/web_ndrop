//@ts-nocheck
// components/EventCard.jsx
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EventCard = ({ 
  event, 
  onJoinEvent, 
  actionLoading, 
  currentUser,
  getActionButton,
  param
}) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-colors rounded-lg overflow-hidden shadow-lg shadow-purple-900/10">
      {/* 이미지 영역 */}
      <Link href={`/client/events/${event.id}?source=${param}`}>
        {event.image_url && (
          <div className="w-full h-48 overflow-hidden relative">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
          </div>
        )}
      
      {/* 콘텐츠 영역 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link href={`/client/events/${event.id}?source=${param}`}>
              <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition-colors cursor-pointer mb-2">
                {event.title}
              </h3>
            </Link>
            <p className="text-slate-400 text-sm mb-3 line-clamp-2">{event.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>
              {new Date(event.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short'
              })}
              {' '}
              {new Date(event.start_date).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4 text-green-400" />
            <span>{event.current_participants || 0}/{event.max_participants}명 참가</span>
          </div>
        </div>
      </div>
      </Link>
    </div>
  );
};

export default EventCard;
