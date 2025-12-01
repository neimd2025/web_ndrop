//@ts-nocheck
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { UserBusinessCard, UserProfile } from "@/lib/supabase/user-server-actions";
import { User, Mail, Phone, QrCode, Edit3, Trash2 } from "lucide-react";
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
  user?: UserProfile;
  businessCards?: UserBusinessCard[];
}

export function UserCardDetail({ user, businessCards = [] }: UserCardDetailProps) {
  const primaryCard = businessCards.find((c) => c.is_public) || businessCards[0];
  const router = useRouter();

  // user가 undefined면 primaryCard에서 데이터 가져오기
  const name = user?.full_name ?? primaryCard?.full_name ?? user?.email?.split("@")[0] ?? "사용자";
  const handle = "@" + (user?.full_name ? user.full_name.split(" ")[0] : primaryCard?.name ?? user?.email?.split("@")[0]);
  const intro = primaryCard?.introduction ?? primaryCard?.bio ?? user?.introduction ?? "";
  const company = primaryCard?.company ?? primaryCard?.affiliation ?? "미소속";
  const job = primaryCard?.work_field ?? "미입력";
  const phone = primaryCard?.phone ?? primaryCard?.contact ?? "";
  const email = primaryCard?.email ?? user?.email ?? "";
  
  // external_links는 user가 없으면 primaryCard에서 가져오기
  const externalLinks = user?.external_links ?? primaryCard?.external_links ?? [];

  // user가 없으면 primaryCard에서 프로필 이미지 가져오기
  const profileImage = user?.profile_image_url ?? primaryCard?.profile_image_url ?? "";

  // user가 없으면 primaryCard에서 MBTI, 성격, 관심사, 취미 가져오기
  const mbti = user?.mbti ?? primaryCard?.mbti ?? "";
  const personalityKeywords = user?.personality_keywords ?? primaryCard?.personality_keywords ?? [];
  const interestKeywords = user?.interest_keywords ?? primaryCard?.interest_keywords ?? [];
  const hobbyKeywords = user?.hobby_keywords ?? primaryCard?.hobby_keywords ?? [];

  const formatPhone = (num: string) => {
    const digits = num.replace(/\D/g, "");
    if (/^02\d{7,8}$/.test(digits)) return digits.replace(/^(02)(\d{3,4})(\d{4})$/, "$1-$2-$3");
    if (/^01[016789]\d{7,8}$/.test(digits)) return digits.replace(/^(01[016789])(\d{3,4})(\d{4})$/, "$1-$2-$3");
    return num;
  };

  // Supabase 직접 접근 방식으로 삭제 처리
  const handleDelete = async () => {
    if (!primaryCard?.id) return;

    if (!confirm('정말 이 명함을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const supabase = createClient()
     
      // collected_cards 테이블에서 삭제
      const { error } = await supabase
        .from('collected_cards')
        .delete()
        .eq('card_id', primaryCard.id)

      if (error) {
        console.error('명함 삭제 오류:', error)
        alert('명함 삭제 중 오류가 발생했습니다.')
        return
      }

      // 삭제 성공 시 명함첩 페이지로 이동
      alert('명함이 삭제되었습니다.')
      router.push('/client/card-books')
      
    } catch (error) {
      console.error('명함 삭제 오류:', error)
      alert('명함 삭제 중 오류가 발생했습니다.')
    }
  };

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
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-purple-300 text-purple-700 font-medium text-md bg-white">소속</button>
              <p className="text-md font-medium text-gray-700">{company}</p>
            </div>
            <div className="w-full flex flex-row items-center justify-between">
              <button className="px-4 py-1.5 rounded-full border-2 border-gray-200 text-gray-700 font-medium text-md bg-white">직무</button>
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
                    <span className="text-purple-600 font-medium text-sm">{formatPhone(phone)}</span>
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

          {user ? (
            <div className="my-6 flex gap-3">
              {/* 편집하기 버튼 - 왼쪽, 보라색 배경 */}
              <Link 
                href="/client/namecard/edit"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md"
              >
                <Edit3 className="w-5 h-5" />
                편집하기
              </Link>
              
              {/* QR 코드 보기 버튼 - 오른쪽, 흰색 배경 */}
              <Link 
                href="/client/my-qr"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-purple-600 border border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-md"
              >
                <QrCode className="w-5 h-5" />
                QR 보기
              </Link>
            </div>
          ) : (
            // user가 없고 primaryCard가 있을 때만 삭제 버튼 표시
            primaryCard && (
              <div className="my-6">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  <Trash2 className="w-4 h-4" />
                  명함 삭제
                </button>
              </div>
            )
          )}
        </div>
      </Card>
    </div>
  );
}

// TagSelector와 SocialLinks 컴포넌트는 동일하게 유지
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
    if (lowerUrl.includes("brunch.co.kr")) return <FaFeatherAlt size={24} className="orange-500" />;
    
    return <FaGlobe size={24} className="text-gray-700" />;
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {links.map((link) => (
<div className="flex flex-row gap-3">
        <a
          key={link}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center items-center hover:opacity-80 transition hover:scale-110"
          title={link}
        >
          {getIcon(link)}
        </a>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-center items-center"
          title={link}
        >
          {link}
        </a>
</div>
      ))}
    </div>
  );
}