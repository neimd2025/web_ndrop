//@ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { UserBusinessCard, UserProfile } from "@/lib/supabase/user-server-actions";
import { User, Mail, Phone, QrCode, Edit3, Trash2, Save } from "lucide-react";
import { 
  FaInstagram, 
  FaLinkedin, 
  FaGlobe, 
  FaYoutube, 
  FaFacebook, 
  FaTwitter, 
  FaTiktok,
  FaGithub,
  FaFigma,
  FaBehance,
  FaDribbble,
  FaMedium,
  FaFeatherAlt,
} from "react-icons/fa";
import { SiNotion, SiNaver } from "react-icons/si";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface UserCardDetailProps {
  user?: UserProfile;           // 현재 로그인한 사용자 (currentUser)
  cardOwner?: UserProfile;      // 명함 소유자 (폴백용)
  businessCards?: UserBusinessCard[];
}

export function UserCardDetail({ user, cardOwner, businessCards = [] }: UserCardDetailProps) {
  const primaryCard = businessCards.find((c) => c?.is_public) || businessCards[0];
  const router = useRouter();
  
  // 상태 추가
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isOwnCard, setIsOwnCard] = useState(false);
  const [isCollectedCard, setIsCollectedCard] = useState(false);

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    const checkCardStatus = async () => {
      if (!user?.id || !primaryCard?.id) return;
      
      try {
        const supabase = createClient();
        
        // 자신의 명함인지 확인 (현재 사용자 ID vs 명함 소유자 ID)
        const isOwn = user.id === primaryCard.user_id;
        setIsOwnCard(isOwn);
        
        console.log('현재 사용자 ID:', user.id);
        console.log('명함 소유자 ID:', primaryCard.user_id);
        console.log('자신의 명함인가?', isOwn);
        
        // 자신의 명함이면 저장 상태 확인 불필요
        if (isOwn) {
          setIsSaved(false);
          setIsCollectedCard(false);
          return;
        }
        
        // 다른 사람의 명함인 경우, 저장 여부 확인
        const { data: existingCard } = await supabase
          .from('collected_cards')
          .select('id')
          .eq('collector_id', user.id)
          .eq('card_id', primaryCard.id)
          .single();
        
        if (existingCard) {
          setIsSaved(true);
          setIsCollectedCard(true);
        } else {
          setIsSaved(false);
          setIsCollectedCard(false);
        }
        
      } catch (error) {
        console.error('명함 상태 확인 오류:', error);
        setIsSaved(false);
        setIsCollectedCard(false);
        setIsOwnCard(false);
      }
    };

    checkCardStatus();
  }, [user?.id, primaryCard?.id, primaryCard?.user_id]);

  // 명함 소유자 정보 결정: primaryCard → cardOwner
  const ownerProfile = cardOwner;

  // 표시할 데이터: primaryCard 우선, 없으면 cardOwner
  const name = primaryCard?.full_name ?? ownerProfile?.full_name ?? "";
  const intro = primaryCard?.introduction ?? primaryCard?.bio ?? ownerProfile?.introduction ?? "";
  const company = primaryCard?.company ?? primaryCard?.affiliation ?? "미소속";
  const job = primaryCard?.work_field ?? primaryCard?.role ?? primaryCard?.job_title ?? "미입력";
  const phone = primaryCard?.phone ?? primaryCard?.contact ?? "";
  const email = primaryCard?.email ?? ownerProfile?.email ?? "";
  
  // external_links는 primaryCard에서 가져오기
  const externalLinks = primaryCard?.external_links ?? ownerProfile?.external_links ?? [];

  // 프로필 이미지는 primaryCard에서 가져오기
  const profileImage = primaryCard?.profile_image_url ?? ownerProfile?.profile_image_url ?? "";

  // MBTI, 성격, 관심사, 취미는 primaryCard에서 가져오기
  const mbti = primaryCard?.mbti ?? ownerProfile?.mbti ?? "";
  const personalityKeywords = primaryCard?.keywords ?? ownerProfile?.keywords ?? [];
  const interestKeywords = primaryCard?.interest_keywords ?? ownerProfile?.interest_keywords ?? [];
  const hobbyKeywords = primaryCard?.hobby_keywords ?? ownerProfile?.hobby_keywords ?? [];

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, "");
    if (/^02\d{7,8}$/.test(digits)) return digits.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
    if (/^01[016789]\d{7,8}$/.test(digits)) return digits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
    return num;
  };

  // 명함 저장 핸들러
  const handleSaveCard = async () => {
    if (!user) {
      alert('명함을 저장하려면 로그인이 필요합니다.')
      router.push('/login?type=user')
      return
    }

    // 자신의 명함인지 확인
    if (isOwnCard) {
      alert('자신의 명함은 저장할 수 없습니다.')
      return
    }

    if (isSaved) {
      alert('이미 저장된 명함입니다!')
      return
    }

    try {
      setIsSaving(true)
      const supabase = createClient()

      // 명함 저장
      const { data: savedCard, error: saveError } = await supabase
        .from('collected_cards')
        .insert({
          collector_id: user.id,
          card_id: primaryCard.id,
          collected_at: new Date().toISOString()
        })
        .select()
        .single()

      if (saveError) {
        console.error('명함 저장 오류:', saveError)
        alert('명함 저장에 실패했습니다.')
        return
      }

      setIsSaved(true)
      setIsCollectedCard(true)
      alert('명함이 성공적으로 저장되었습니다!')

      // 저장된 명함 페이지로 이동
      router.push(`/card-books/${savedCard.id}`)
    } catch (error) {
      console.error('명함 저장 중 오류:', error)
      alert('명함 저장 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

const handlePhoneClick = async (e) => {
  e.preventDefault();
  
  try {
    await navigator.clipboard.writeText(phone);
    alert('전화번호가 복사되었습니다. 전화 앱에 붙여넣기 해주세요.');
    
    // iOS에서는 input을 만들어서 포커스
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const input = document.createElement('input');
      input.setAttribute('type', 'tel');
      input.setAttribute('value', phone);
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.focus();
      setTimeout(() => {
        document.body.removeChild(input);
      }, 1000);
    }
  } catch (err) {
    console.error('복사 실패:', err);
    // 폴백: 일반 tel 링크로
    window.location.href = `tel:${phone}`;
  }
};


  // 명함 삭제 핸들러
// 명함 삭제 핸들러
const handleDelete = async () => {
  if (!primaryCard?.id || !user?.id) return;

  if (!confirm('정말 이 명함을 삭제하시겠습니까?')) {
    return;
  }

  try {
    const supabase = createClient()
   
    // collected_cards 테이블에서 삭제
    const { error } = await supabase
      .from('collected_cards')
      .delete()
      .eq('collector_id', user.id)
      .eq('card_id', primaryCard.id)

    if (error) {
      console.error('명함 삭제 오류:', error)
      
      // PGRST116은 "결과가 0개"라는 의미가 아니라 "단일 행을 요청했는데 0개 또는 여러 개의 행 반환"이라는 의미
      // 삭제 실패 시 수집된 명함이 없는 경우
      if (error.code === 'PGRST116') {
        console.log('삭제할 수집 명함이 없음')
        // 이미 삭제되었거나 수집되지 않은 명함
        setIsSaved(false)
        setIsCollectedCard(false)
        alert('이미 삭제되었거나 수집되지 않은 명함입니다.')
        return
      }
      
      alert('명함 삭제 중 오류가 발생했습니다.')
      return
    }

    // 삭제 성공 (Supabase delete는 성공시 오류가 없으면 삭제된 것으로 간주)
    console.log('명함 삭제 성공')
    alert('명함이 삭제되었습니다.')
    setIsSaved(false)
    setIsCollectedCard(false)
    
    // 페이지 새로고침이나 상태 업데이트
    router.push('/client/card-books')
    
  } catch (error) {
    console.error('명함 삭제 오류:', error)
    alert('명함 삭제 중 오류가 발생했습니다.')
  }
};

  // 버튼 렌더링 로직
  const renderActionButtons = () => {
    // 1. 자신의 명함인 경우
    if (isOwnCard) {
      return (
        <>
          <Link 
            href="/client/namecard/edit"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
          >
            <Edit3 className="w-5 h-5" />
            편집하기
          </Link>
          
          <Link 
            href="/client/my-qr"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-purple-600 border border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-md"
          >
            <QrCode className="w-5 h-5" />
            QR 보기
          </Link>
        </>
      );
    }

    // 2. 수집된 명함인 경우 (삭제 버튼)
    if (isCollectedCard) {
      return (
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
        >
          <Trash2 className="w-5 h-5" />
          명함 삭제하기
        </button>
      );
    }

    // 3. 수집되지 않은 타인의 명함인 경우 (저장 버튼)
    return (
      <button
        onClick={handleSaveCard}
        disabled={isSaved || isSaving}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md disabled:bg-purple-400 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>저장 중...</>
        ) : isSaved ? (
          <>
            <Save className="w-5 h-5" />
            저장됨
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            명함 저장하기
          </>
        )}
      </button>
    );
  };

  // primaryCard가 없는 경우 처리
  if (!primaryCard) {
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">명함을 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-6">해당 명함이 존재하지 않거나 삭제되었습니다.</p>
          <Link 
            href="/client/card-books"
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            명함첩으로 돌아가기
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center w-full">
      <Card className="w-full max-w-md overflow-hidden border-0 rounded-none shadow-none flex flex-col items-center text-center">
        {/* 상단 배경 */}
        <div className="relative w-full bg-[#242E3A] h-60 flex flex-col items-center justify-end pb-6">
          {/* 프로필 이미지 */}
          <div className="relative mt-8 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-md border-0 border-white overflow-hidden">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="my-4">
            <h2 className="text-2xl font-semibold text-white">{name}</h2>
          </div>
        </div>

        {/* 상단 흰색 둥근 부분 */}
        <div className="w-full h-12 bg-[#242E3A]">
          <div className="w-full h-full bg-white rounded-t-full"></div>
        </div>

        <div className="w-full px-8 bg-white text-left">
          <div className="flex flex-col gap-3">
            { company !== "미소속" && (
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-purple-300 text-purple-700 font-medium text-md bg-white">소속</button>
              <p className="text-md font-medium text-gray-700">{company}</p>
            </div>
            )}
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-gray-200 text-gray-700 font-medium text-md bg-white">{ company !== "미소속" ? "직무" : "하는 일" }</button>
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

          <div className="mt-6 px-1">
            <h3 className="text-md font-semibold text-gray-800 mb-3">연락처</h3>
            <div className="flex flex-col gap-4">
              {phone && (
                <div className="flex items-center gap-4">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">전화번호</span>
<a 
  href="#"
  onClick={handlePhoneClick}
  className="text-purple-600 font-medium text-sm hover:text-purple-800 transition-colors"
>
  {formatPhone(phone)}
</a>
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

          <div className="w-full border-t-2 border-gray-300 my-9"></div>

          <div className="mt-6 px-1">
            <h3 className="text-md font-semibold text-gray-800 mb-3">나는 이런 사람입니다</h3>
            <div className="mt-6 w-full">

              {/* MBTI */}
              {mbti && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-600 mb-3">MBTI</h4>
                  <span className="px-3 py-1 rounded-full border bg-gray-100 text-gray-700 border-gray-300">
                    {mbti}
                  </span>
                </div>
              )}

              {/* 성격 */}
              {personalityKeywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-600 mb-3">성격</h4>
                  <TagSelector tags={personalityKeywords} />
                </div>
              )}

              {/* 관심사 */}
              {interestKeywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-600 mb-3">관심사</h4>
                  <TagSelector tags={interestKeywords.map(tag => `#${tag}`)} />
                </div>
              )}

              {/* 취미 */}
              {hobbyKeywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-600 mb-3">취미</h4>
                  <TagSelector tags={hobbyKeywords} />
                </div>
              )}
            </div>
          </div>

          <div className="w-full border-t-2 border-gray-300 my-9"></div>

          {/* 외부 링크 섹션 - 항상 표시 */}
          <div className="my-6 px-1">
            <h3 className="text-md font-semibold text-gray-800 mb-3">외부 링크</h3>
            {externalLinks.length > 0 ? (
              <SocialLinks links={externalLinks} />
            ) : (
              <div className="text-center py-4 text-gray-400">
                아직 사이트가 없어요
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="my-6 flex gap-3">
            {renderActionButtons()}
          </div>
        </div>
      </Card>
    </div>
  );
}


interface TagSelectorProps {
  tags: string[];
}

export function TagSelector({ tags }: TagSelectorProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const displayedTags = showAll ? tags : tags.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-2">
      {displayedTags.map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`px-3 py-1.5 rounded-lg border ${
            selectedTags.includes(tag)
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-gray-100 text-gray-700 border-gray-300"
          } transition`}
        >
          {tag}
        </button>
      ))}

      {!showAll && tags.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="px-3 py-1 rounded-lg border bg-gray-200 text-gray-700 border-gray-300"
        >
          +{tags.length - 3}
        </button>
      )}
    </div>
  );
}

interface SocialLinksProps {
  links: string[];
}

export function SocialLinks({ links }: SocialLinksProps) {
  const getIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes("instagram.com")) return <FaInstagram size={24} className="text-pink-500" />;
    if (lowerUrl.includes("linkedin.com")) return <FaLinkedin size={24} className="text-blue-700" />;
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return <FaYoutube size={24} className="text-red-600" />;
    if (lowerUrl.includes("facebook.com")) return <FaFacebook size={24} className="text-blue-600" />;
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return <FaTwitter size={24} className="text-black" />;
    if (lowerUrl.includes("tiktok.com")) return <FaTiktok size={24} className="text-black" />;
    if (lowerUrl.includes("github.com")) return <FaGithub size={24} className="text-gray-800" />;
    if (lowerUrl.includes("notion.so") || lowerUrl.includes("notion.site")) return <SiNotion size={24} className="text-black" />;
    if (lowerUrl.includes("figma.com")) return <FaFigma size={24} className="text-purple-600" />;
    if (lowerUrl.includes("behance.net")) return <FaBehance size={24} className="text-blue-800" />;
    if (lowerUrl.includes("dribbble.com")) return <FaDribbble size={24} className="text-pink-500" />;
    if (lowerUrl.includes("medium.com")) return <FaMedium size={24} className="text-black" />;
    if (lowerUrl.includes("blog.naver.com") || lowerUrl.includes("blog.me")) return <SiNaver size={24} className="text-green-500" />;
    if (lowerUrl.includes("brunch.co.kr")) return <FaFeatherAlt size={24} className="text-orange-500" />;
    
    return <FaGlobe size={24} className="text-gray-700" />;
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {links.map((link) => (
        <div key={link} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center hover:opacity-80 transition"
            title={link}
          >
            {getIcon(link)}
          </a>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-700 hover:text-purple-600 transition-colors truncate flex-1"
            title={link}
          >
            {link}
          </a>
        </div>
      ))}
    </div>
  );
}