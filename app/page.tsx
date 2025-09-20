export default function RootPage() {
  // 미들웨어에서 모든 라우팅을 처리하므로 여기서는 간단한 로딩 UI만 표시
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="text-white font-bold text-xl">N</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">
            Neimed
          </h1>
          <p className="text-gray-600">
            로딩 중...
          </p>
        </div>
      </div>
    </div>
  )
}
