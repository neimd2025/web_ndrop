"use client"

import { Button } from '@/components/ui/button'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import jsQR from 'jsqr'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

interface UserEventScanClientProps {
  user: UserProfile | null
}

export function UserEventScanClient({ user }: UserEventScanClientProps) {
  const router = useRouter()
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 컴포넌트 마운트 시 바로 카메라 활성화
  useEffect(() => {
    setIsCameraActive(true)
    setIsScanning(true)
  }, [])

  // QR 코드 감지 시 처리 (행사 참여 전용)
  const handleQRCodeDetected = useCallback(async (qrData: string) => {
    setIsScanning(false)
    console.log('행사 QR 코드 데이터:', qrData)

    // 비로그인 사용자의 경우 로그인 페이지로 이동
    if (!user) {
      alert('행사 참여를 위해서는 로그인이 필요합니다.')
      router.push('/login?type=user')
      return
    }

    try {
      const supabase = createClient()

      // 이벤트 코드인지 확인 (6자리 문자열)
      if (qrData.length === 6 && /^[A-Z0-9]+$/.test(qrData)) {
        // 이벤트 코드로 이벤트 찾기
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('event_code', qrData)
          .single()

        if (event && !eventError) {
          // 이미 참가했는지 확인
          const { data: existingParticipation } = await supabase
            .from('event_participants')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', user.id)
            .single()

          if (existingParticipation) {
            alert('이미 참가한 이벤트입니다!')
            router.push(`/client/events/${event.id}`)
            return
          }

          // 이벤트 참가 확인
          const confirmed = confirm(`${event.title} 이벤트에 참가하시겠습니까?`)
          if (confirmed) {
            // API를 통해 참가 (알림 생성 포함)
            const response = await fetch('/api/user/join-event', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                eventId: event.id,
                userId: user.id
              })
            })

            const result = await response.json()

            if (result.success) {
              alert('이벤트에 참가했습니다!')
              router.push(`/client/events/${event.id}`)
            } else {
              alert(result.message || '이벤트 참가에 실패했습니다.')
              setIsScanning(true)
            }
          } else {
            setIsScanning(true)
          }
        } else {
          alert('유효하지 않은 이벤트 코드입니다.')
          setIsScanning(true)
        }
      } else {
        alert('유효하지 않은 QR 코드입니다. 이벤트 코드를 스캔해주세요.')
        setIsScanning(true)
      }
    } catch (error) {
      console.error('QR 코드 처리 오류:', error)
      alert('QR 코드 처리 중 오류가 발생했습니다.')
      setIsScanning(true)
    }
  }, [user, router])

  // QR 코드 스캔 로직 (최적화된 버전)
  const scanQRCode = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current || !isScanning) return

    const video = webcamRef.current.video
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!video || !context) return

    // 비디오가 준비되지 않았으면 잠시 대기
    if (video.readyState !== 4) {
      if (isScanning) {
        setTimeout(() => requestAnimationFrame(scanQRCode), 100)
      }
      return
    }

    // 비디오 크기가 설정되지 않았으면 대기
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      if (isScanning) {
        setTimeout(() => requestAnimationFrame(scanQRCode), 100)
      }
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        handleQRCodeDetected(code.data)
        return
      }
    } catch (error) {
      console.error('QR 스캔 오류:', error)
      if (isScanning) {
        setTimeout(() => requestAnimationFrame(scanQRCode), 200)
      }
      return
    }

    // QR 코드가 감지되지 않으면 적절한 간격으로 다시 스캔
    if (isScanning) {
      setTimeout(() => requestAnimationFrame(scanQRCode), 100) // 100ms 간격으로 스캔
    }
  }, [isScanning, handleQRCodeDetected])

  // 스캔 시작/중지
  useEffect(() => {
    if (isScanning && isCameraActive) {
      // 카메라가 로드될 때까지 잠시 대기
      const timer = setTimeout(() => {
        scanQRCode()
      }, 500) // 500ms 대기

      return () => clearTimeout(timer)
    }
  }, [isScanning, isCameraActive, scanQRCode])

  // 플래시 토글
  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn)
  }

  // 카메라 재시작
  const restartCamera = () => {
    setIsCameraActive(false)
    setTimeout(() => {
      setIsCameraActive(true)
      setIsScanning(true)
    }, 100)
  }

  // 갤러리에서 이미지 선택
  const handleGallerySelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const imageSrc = e.target?.result as string
          setCapturedImage(imageSrc)

          // 갤러리 이미지에서 QR 코드 스캔
          const img = new window.Image()
          img.onload = () => {
            const canvas = canvasRef.current
            if (canvas) {
              const context = canvas.getContext('2d')
              if (context) {
                canvas.width = img.width
                canvas.height = img.height
                context.drawImage(img, 0, 0)
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                const code = jsQR(imageData.data, imageData.width, imageData.height)

                if (code) {
                  handleQRCodeDetected(code.data)
                } else {
                  alert('이미지에서 QR 코드를 찾을 수 없습니다.')
                }
              }
            }
          }
          img.src = imageSrc
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [handleQRCodeDetected])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* 숨겨진 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/client/events/join">
            <Button variant="ghost" size="sm" className="p-2 bg-white/10 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">행사 QR 스캔</h1>
          <div></div>
        </div>
      </div>

      {/* 카메라 뷰 - 전체 화면 */}
      <div className="absolute inset-0">
        <Webcam
          ref={webcamRef}
          audio={false}
          width="100%"
          height="100%"
          className="object-cover w-full h-full"
          videoConstraints={{
            facingMode: "environment" // 후면 카메라 사용
          }}
          onUserMedia={() => {
            console.log('카메라가 로드되었습니다.')
            // 카메라 로드 후 QR 스캔 시작
            if (isScanning) {
              setTimeout(() => {
                scanQRCode()
              }, 500)
            }
          }}
          onUserMediaError={(error) => {
            console.error('카메라 오류:', error)
            alert('카메라 접근에 실패했습니다. 권한을 확인해주세요.')
          }}
        />

        {/* 스캔 프레임 오버레이 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 relative">
            {/* 모서리 표시 - 부드러운 애니메이션 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-purple-500 rounded-tl-lg animate-pulse"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-purple-500 rounded-tr-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-purple-500 rounded-bl-lg animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-purple-500 rounded-br-lg animate-pulse" style={{ animationDelay: '0.6s' }}></div>

            {/* 스캔 라인 애니메이션 */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-bounce" style={{ animationDuration: '2s' }}></div>
            </div>
          </div>
        </div>

        {/* 스캔 중 표시 */}
        {isScanning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-white text-center bg-black/50 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="ml-2 text-sm">행사 QR 스캔 중...</span>
              </div>
            </div>
          </div>
        )}

        {/* 하단 컨트롤 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-center gap-3">
            <Button
              onClick={handleGallerySelect}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              갤러리에서 선택
            </Button>
            <Button
              onClick={restartCamera}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              카메라 재시작
            </Button>
            <Link href="/client/events/join">
              <Button className="bg-white/20 hover:bg-white/30 text-white border border-white/30">
                코드 입력
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
