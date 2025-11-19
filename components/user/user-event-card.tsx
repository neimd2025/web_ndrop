// components/EventCard.jsx
import Link from 'next/link';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EventCard = ({ 
  event, 
  onJoinEvent, 
  actionLoading, 
  currentUser,
  getStatusBadge,
  getActionButton 
}) => {
  return (
    <div className="bg-white border border-gray-200 hover:border-purple-300 transition-colors rounded-lg overflow-hidden">
      {/* 이미지 영역 */}
      {event.image_url && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* 콘텐츠 영역 */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Link href={`/client/events/${event.id}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors cursor-pointer">
                  {event.title}
                </h3>
              </Link> 
              {getStatusBadge(event)}
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
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

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{event.current_participants || 0}/{event.max_participants}명 참가</span>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex gap-2">
          <Link href={`/client/events/${event.id}`} className="w-1/2">
            <Button variant="outline" className="w-full">
              상세보기
            </Button>
          </Link>
          {getActionButton(event)}
        </div>
      </div>
    </div>
  );
};

export default EventCard;