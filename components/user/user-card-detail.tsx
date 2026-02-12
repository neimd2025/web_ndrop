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
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98]"
          >
            <Edit3 className="w-5 h-5" />
            편집하기
          </Link>
          
          <Link 
            href="/client/my-qr"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 text-purple-300 border border-purple-500/30 rounded-2xl font-bold hover:bg-slate-700 hover:text-purple-200 transition-all shadow-lg active:scale-[0.98]"
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
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-bold hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/25 active:scale-[0.98]"
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
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-bold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 disabled:from-purple-400 disabled:to-indigo-400 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
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
      <Card className="w-full max-w-md overflow-hidden border-0 rounded-none shadow-none flex flex-col items-center text-center bg-transparent">
        {/* 상단 배경 */}
        <div className="relative w-full h-60 flex flex-col items-center justify-end pb-6">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-slate-900/50 to-transparent"></div>
          
          {/* 프로필 이미지 */}
          <div className="relative mt-8 w-24 h-24 rounded-full bg-slate-950 shadow-2xl shadow-purple-500/20 border-2 border-purple-500/50 overflow-hidden z-10 ring-4 ring-slate-900/50 shrink-0 transform-gpu">
            {profileImage ? (
              <img
                src={profileImage}
                alt={name}
                className="w-full h-full object-cover block"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                <User className="w-10 h-10" />
              </div>
            )}
          </div>

          <div className="my-4 relative z-10">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{name}</h2>
          </div>
        </div>

        {/* 상단 둥근 부분 */}
        <div className="w-full h-12 relative -mt-6 z-0">
          <div className="w-full h-full bg-slate-950 rounded-t-[3rem] border-t border-white/10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]"></div>
        </div>

        <div className="w-full px-8 bg-slate-950 text-left pb-10 min-h-[500px]">
          <div className="flex flex-col gap-3">
            { company !== "미소속" && (
            <div className="w-full flex flex-row items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <span className="px-4 py-1.5 rounded-full border border-purple-500/30 text-purple-300 font-medium text-sm bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.15)]">소속</span>
              <p className="text-lg font-bold text-white tracking-wide drop-shadow-sm">{company}</p>
            </div>
            )}
            <div className="w-full flex flex-row items-center justify-between group hover:bg-white/5 p-2 rounded-xl transition-colors -mx-2">
              <span className="px-4 py-1.5 rounded-full border border-slate-700 text-slate-300 font-medium text-sm bg-slate-800 group-hover:bg-slate-700 transition-colors shadow-inner">{ company !== "미소속" ? "직무" : "하는 일" }</span>
              <p className="text-lg font-bold text-white tracking-wide drop-shadow-sm">{job}</p>
            </div>
          </div>

          {/* 소개 */}
          {intro ? (
            <div className="mt-6 bg-slate-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-[15px] text-slate-200 leading-relaxed shadow-inner relative group hover:border-purple-500/30 transition-colors">
              <p className="line-clamp-4">{intro}</p>
            </div>
          ) : (
            <div className="mt-6 bg-slate-900 border border-white/5 rounded-2xl p-5 text-sm text-slate-600 text-center">
              소개가 없습니다.
            </div>
          )}

          <div className="mt-8 px-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
              연락처
            </h3>
            <div className="flex flex-col gap-4">
              {phone && (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
                    <Phone className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 mb-0.5">전화번호</span>
                    <a 
                      href="#"
                      onClick={handlePhoneClick}
                      className="text-white font-medium text-base hover:text-purple-400 transition-colors"
                    >
                      {formatPhone(phone)}
                    </a>
                  </div>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center group-hover:border-purple-500/50 transition-colors">
                    <Mail className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 mb-0.5">이메일</span>
                    <span className="text-white font-medium text-base break-all">{email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full border-t border-white/10 my-8"></div>

          <div className="mt-6 px-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              나는 이런 사람입니다
            </h3>
            <div className="mt-6 w-full space-y-8">

              {/* MBTI */}
              {mbti && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 ml-1">MBTI</h4>
                  <span className="inline-block px-4 py-1.5 rounded-full border bg-slate-900 text-purple-300 border-purple-500/30 font-semibold shadow-lg shadow-purple-900/20">
                    {mbti}
                  </span>
                </div>
              )}

              {/* 성격 */}
              {personalityKeywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 ml-1">성격</h4>
                  <TagSelector tags={personalityKeywords} />
                </div>
              )}

              {/* 관심사 */}
              {interestKeywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 ml-1">관심사</h4>
                  <TagSelector tags={interestKeywords.map(tag => `#${tag}`)} />
                </div>
              )}

              {/* 취미 */}
              {hobbyKeywords.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3 ml-1">취미</h4>
                  <TagSelector tags={hobbyKeywords} />
                </div>
              )}
            </div>
          </div>

          <div className="w-full border-t border-white/10 my-8"></div>

          {/* 외부 링크 섹션 - 항상 표시 */}
          <div className="my-6 px-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-green-500 rounded-full"></span>
              외부 링크
            </h3>
            {externalLinks.length > 0 ? (
              <SocialLinks links={externalLinks} />
            ) : (
              <div className="text-center py-8 text-slate-600 bg-slate-900/50 rounded-xl border border-white/5 border-dashed">
                아직 등록된 링크가 없어요
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="my-8 flex gap-3 sticky bottom-4 z-20">
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
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${
            selectedTags.includes(tag)
              ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/50"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-600"
          } transition-all duration-200`}
        >
          {tag}
        </button>
      ))}

      {!showAll && tags.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="px-3 py-1.5 rounded-lg border bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200 transition-colors text-sm font-medium"
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
    
    if (lowerUrl.includes("instagram.com")) return <FaInstagram size={20} className="text-pink-500" />;
    if (lowerUrl.includes("linkedin.com")) return <FaLinkedin size={20} className="text-blue-500" />;
    if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) return <FaYoutube size={20} className="text-red-500" />;
    if (lowerUrl.includes("facebook.com")) return <FaFacebook size={20} className="text-blue-600" />;
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return <FaTwitter size={20} className="text-white" />;
    if (lowerUrl.includes("tiktok.com")) return <FaTiktok size={20} className="text-white" />;
    if (lowerUrl.includes("github.com")) return <FaGithub size={20} className="text-white" />;
    if (lowerUrl.includes("notion.so") || lowerUrl.includes("notion.site")) return <SiNotion size={20} className="text-white" />;
    if (lowerUrl.includes("figma.com")) return <FaFigma size={20} className="text-purple-500" />;
    if (lowerUrl.includes("behance.net")) return <FaBehance size={20} className="text-blue-500" />;
    if (lowerUrl.includes("dribbble.com")) return <FaDribbble size={20} className="text-pink-500" />;
    if (lowerUrl.includes("medium.com")) return <FaMedium size={20} className="text-white" />;
    if (lowerUrl.includes("blog.naver.com") || lowerUrl.includes("blog.me")) return <SiNaver size={18} className="text-green-500" />;
    if (lowerUrl.includes("brunch.co.kr")) return <FaFeatherAlt size={20} className="text-orange-500" />;
    
    return <FaGlobe size={20} className="text-slate-400" />;
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {links.map((link) => (
        <div key={link} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all group">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border border-white/10 group-hover:border-purple-500/50 transition-colors"
            title={link}
          >
            {getIcon(link)}
          </a>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-300 group-hover:text-purple-400 transition-colors truncate flex-1"
            title={link}
          >
            {link}
          </a>
        </div>
      ))}
    </div>
  );
}