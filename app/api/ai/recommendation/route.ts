import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = "nodejs"; // Force Node.js runtime

// Gemini 클라이언트 초기화
const apiKey = process.env.GEMINI_API_KEY;
console.log("Gemini API Key Loaded:", !!apiKey); // 키 존재 여부만 로그 출력 (보안)

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  console.log("AI route hit");
  console.log("GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);

  try {
    const { userProfile, candidateProfiles, eventId } = await req.json();

    // 1. API 키가 없거나 프로필 정보가 부족한 경우 에러 처리
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");
      return NextResponse.json({ error: "API Key Missing" }, { status: 500 });
    }

    if (!userProfile || !candidateProfiles || candidateProfiles.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // 2. 행사 정보 조회 (Supabase)
    let eventContext = {
      name: "정보 없음",
      type: "정보 없음",
      theme: "정보 없음"
    };

    if (eventId) {
      try {
        const supabase = await createClient();
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (event) {
          eventContext = {
            name: event.title || "정보 없음",
            type: event.event_type || event.type || "정보 없음",
            theme: event.theme || event.description || "정보 없음"
          };
        }
      } catch (dbError) {
        console.error("Failed to fetch event details:", dbError);
        // 이벤트 정보 조회 실패해도 진행
      }
    }

    // 프롬프트 구성 (사용자 요청 템플릿 적용)
    const prompt = ` 
 당신은 오프라인 행사 네트워킹 전략 설계자입니다. 
 
 목표: 
 행사 참가자 중에서 현재 사용자에게 가장 의미 있는 만남이 될 3명을 선정하세요. 
 
 이 추천은 단순 관심사 일치가 아니라, 
 행사 현장에서 실제 대화 가치와 연결 가능성을 기준으로 판단해야 합니다. 
 
 -------------------------------------------------- 
 [현재 사용자 프로필] 
 이름: ${userProfile.name || userProfile.nickname || '알 수 없음'} 
 직무: ${userProfile.job_title || userProfile.role || '알 수 없음'} 
 회사: ${userProfile.company || '알 수 없음'} 
 산업 분야: ${userProfile.work_field || '알 수 없음'} 
 관심사: ${userProfile.interest_keywords?.join(', ') || userProfile.interests || '없음'} 
 행사 참가 목적: ${userProfile.networking_goal || '정보 없음'} 
 
 -------------------------------------------------- 
 [행사 맥락] 
 행사 이름: ${eventContext.name} 
 행사 성격: ${eventContext.type} 
 행사 주제: ${eventContext.theme} 
 
 -------------------------------------------------- 
 [후보자 목록] 
 ${JSON.stringify(candidateProfiles.map((p: any) => ({
    id: p.id || p.user_id,
    name: p.nickname || p.name,
    job_title: p.job_title || p.role,
    company: p.company,
    work_field: p.work_field,
    interests: p.interest_keywords || p.interests,
    introduction: p.introduction
 })), null, 2)} 
 
 -------------------------------------------------- 
 
 추천 기준: 
 
 1. 행사 현장에서 대화가 자연스럽게 이어질 수 있는 연결성 
 2. 서로의 직무 또는 산업이 대화 가치가 있는 관계인지 
 3. 현재 참가 목적과 연결될 가능성 
 4. 상호 보완 가능성 (예: 개발자 ↔ 마케팅, 창업가 ↔ 투자자) 
 5. 같은 고민, 같은 단계에 있는 경우 (의미 있는 커뮤니티 연결) 
 
 제외 기준: 
 - 단순 취미 일치 
 - 표면적 관심사 겹침 
 - 설명이 모호한 추천 
 
 -------------------------------------------------- 
 
 출력 형식 (JSON만 반환): 
 
 { 
   "recommendations": [ 
     { 
       "id": "후보자ID", 
       "type": "strategic" | "community", 
       "reason": "행사 현장에서 이 사람과 왜 대화해야 하는지 구체적으로 설명 (2~3문장)" 
     } 
   ] 
 } 
 
 반드시 3명만 선택하세요. 
 설명은 실행 중심적이고 구체적으로 작성하세요. 
 `;

    // 디버깅을 위한 프롬프트 로그 출력
    console.log("--- [DEBUG] AI Prompt Generated ---");
    console.log(prompt);
    console.log("-----------------------------------");

    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Gemini raw response:", JSON.stringify(response, null, 2));
    
    const text = response.text();
    
    // JSON 파싱
    let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    let parsedResult;
    try {
      const json = JSON.parse(cleanText);
      if (json.recommendations && Array.isArray(json.recommendations)) {
        parsedResult = json.recommendations;
      } else if (Array.isArray(json)) {
        parsedResult = json;
      } else {
        parsedResult = [];
      }
    } catch (e) {
      console.error("Failed to parse Gemini response:", cleanText);
      return NextResponse.json({ 
        recommendations: [], 
        error: "Failed to parse AI response" 
      }, { status: 500 });
    }

    return NextResponse.json({ recommendations: parsedResult });

  } catch (error: any) {
    console.error("AI Recommendation Error:", error);
    return NextResponse.json({ 
      recommendations: [], 
      error: error.message 
    }, { status: 500 });
  }
}
