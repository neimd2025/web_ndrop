import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Calendar } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 overflow-x-hidden relative text-white">
      {/* Background Animation Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#1a103c] to-slate-950 opacity-80"></div>
        <div className="absolute top-[-5%] left-[-10%] w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-[-5%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: "4s" }}></div>
        
        {/* Shooting Stars */}
        <div className="absolute top-0 left-[10%] w-[1px] h-[100px] bg-gradient-to-b from-transparent via-white to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "3s" }}></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[120px] bg-gradient-to-b from-transparent via-blue-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "8s" }}></div>
        <div className="absolute top-[20%] left-[50%] w-[1px] h-[80px] bg-gradient-to-b from-transparent via-purple-200 to-transparent rotate-[215deg] animate-shooting-star opacity-0" style={{ animationDelay: "15s" }}></div>

        {/* Twinkling Stars Effect */}
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className={`absolute rounded-full bg-white animate-twinkle ${i % 3 === 0 ? 'w-1 h-1' : i % 3 === 1 ? 'w-0.5 h-0.5' : 'w-1.5 h-1.5'}`}
            style={{ 
              top: `${Math.random() * 100}%`, 
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full max-w-md mx-auto left-0 right-0 bg-slate-950/50 backdrop-blur-md z-50 border-b border-white/5">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img 
              src="/assets/logo-text.png" 
              alt="ndrop text logo" 
              style={{ height: 22, width: "auto", display: "block" }} 
            />
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 px-2 text-xs h-8">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-white text-slate-950 hover:bg-gray-100 rounded-full px-3 text-xs h-8 font-semibold">
                시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-16 pb-8 relative z-10">
        <div className="px-4">
          <div className="text-center space-y-2 py-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-purple-200 text-[10px] font-medium mb-1 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-purple-300" />
              <span>새로운 네트워킹의 시작</span>
            </div>
            
            <h1 className="text-2xl font-bold text-white leading-tight tracking-tight break-keep">
              모두의 특별함이<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                나답게 연결되는 시작 ndrop
              </span>
            </h1>
            
            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed break-keep px-2">
              행사 참여부터 비즈니스 네트워킹까지.<br />
              복잡한 명함 교환 없이 간편하게 서로를 연결하세요.
            </p>

            <div className="relative w-80 h-80 mx-auto -mt-6 -mb-40 animate-bounce-slow">
              <Image 
                src="/assets/logo-main.png" 
                alt="ndrop character" 
                fill 
                className="object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                priority
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-3 px-4 relative z-10 -mt-4">
              <Link href="/login" className="w-full">
                <Button size="lg" className="w-full h-11 text-sm bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300">
                  지금 시작하기
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-3 mt-6 mb-12">
            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-300">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">스마트한 네트워킹</h3>
              <p className="text-xs text-gray-400 leading-relaxed break-keep">
                참가자들의 프로필을 미리 확인하고
                <br />관심 있는 사람에게 미팅을 요청하세요.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-300">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">간편한 일정 관리</h3>
              <p className="text-xs text-gray-400 leading-relaxed break-keep">
                약속된 미팅 일정을 한눈에 확인하고
                <br />효율적으로 시간을 관리하세요.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-300">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-base font-bold text-white mb-1">AI 추천 매칭</h3>
              <p className="text-xs text-gray-400 leading-relaxed break-keep">
                나의 관심사와 직무를 분석하여
                <br />가장 적합한 네트워킹 파트너를 추천해드립니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-950 border-t border-white/5 relative z-10">
        <div className="px-4 text-center">
          <p className="text-[10px] text-gray-600">
            © 2024 ndrop. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
