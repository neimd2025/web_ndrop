"use client"

import { Button } from '@/components/ui/button'
import { notificationService } from '@/lib/notification-helpers'
import { UserProfile } from '@/lib/supabase/user-server-actions'
import { createClient } from '@/utils/supabase/client'
import jsQR from 'jsqr'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'

interface UserScanCardClientProps {
  user: UserProfile | null
}

export function UserScanCardClient({ user }: UserScanCardClientProps) {
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

  // QR 코드 감지 시 처리
  const handleQRCodeDetected = useCallback(async (qrData: string) => {
    setIsScanning(false)
    console.log('QR 코드 데이터:', qrData)

    try {
      // Supabase 클라이언트 생성
      const supabase = createClient()

      // named.link 형식의 URL에서 카드 ID 추출
      let cardId = null

      if (qrData.includes('business-card/')) {
        cardId = qrData.split('business-card/')[1]
      } else if (qrData.startsWith('named.link/')) {
        cardId = qrData.split('/').pop()
      }

      if (cardId) {
        // 비로그인 사용자의 경우 명함 페이지로 이동
        if (!user) {
          router.push(`/business-card/${cardId}`)
          return
        }

        // 명함 데이터 가져오기
        const { data: businessCard, error } = await supabase
          .from('business_cards')
          .select('*')
          .eq('id', cardId)
          .eq('is_public', true)
          .single()

        if (error || !businessCard) {
          alert('유효하지 않은 QR 코드이거나 공개되지 않은 명함입니다.')
          setIsScanning(true)
          return
        }

        // 자신의 명함인지 확인
        if (businessCard.user_id === user.id) {
          alert('자신의 명함은 저장할 수 없습니다.')
          router.push(`/business-card/${cardId}`)
          return
        }

        // 이미 저장된 명함인지 확인
        const { data: existingCard } = await supabase
          .from('collected_cards')
          .select('id')
          .eq('collector_id', user.id)
          .eq('card_id', cardId)
          .single()

        if (existingCard) {
          alert('이미 저장된 명함입니다!')
          router.push(`/client/saved-cards`)
          return
        }

        // 명함 저장
        const { data: savedCard, error: saveError } = await supabase
          .from('collected_cards')
          .insert({
            collector_id: user.id,
            card_id: cardId,
            collected_at: new Date().toISOString()
          })
          .select()
          .single()

        if (saveError) {
          console.error('명함 저장 오류:', saveError)
          alert('명함 저장에 실패했습니다.')
          setIsScanning(true)
          return
        }

        // 명함 수집 알림 생성
        try {
          await notificationService.createBusinessCardCollectedNotification(
            user.id,
            businessCard.user_id,
            cardId,
            businessCard.full_name || '알 수 없는 사용자'
          )
        } catch (notificationError) {
          console.error('알림 생성 오류:', notificationError)
          // 알림 생성 실패해도 명함 저장은 성공으로 처리
        }

        alert('명함이 성공적으로 저장되었습니다!')
        router.push(`/client/saved-cards/${savedCard.id}`)
      } else {
        alert('유효하지 않은 명함 QR 코드입니다.')
        setIsScanning(true)
      }
    } catch (error) {
      console.error('QR 코드 처리 오류:', error)
      alert('QR 코드 처리 중 오류가 발생했습니다.')
    }

    setIsScanning(true)
  }, [user.id, router])

  // QR 코드 스캔
  const scanQRCode = useCallback(() => {
    if (webcamRef.current && canvasRef.current) {
      const video = webcamRef.current.video
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        if (context) {
          // 비디오 크기가 유효한지 확인
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            // 비디오가 아직 로드되지 않았으면 다시 시도
            if (isScanning) {
              requestAnimationFrame(scanQRCode)
            }
            return
          }

          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          try {
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // 캔버스 크기가 유효한지 확인
            if (canvas.width === 0 || canvas.height === 0) {
              console.warn('캔버스 크기가 0입니다. 다시 시도합니다.')
              if (isScanning) {
                requestAnimationFrame(scanQRCode)
              }
              return
            }

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)

            if (code) {
              console.log('QR 코드 감지:', code.data)
              // QR 코드 데이터 처리
              handleQRCodeDetected(code.data)
              return
            }
          } catch (error) {
            console.error('QR 스캔 오류:', error)
            // 오류 발생 시 잠시 대기 후 다시 시도
            setTimeout(() => {
              if (isScanning) {
                requestAnimationFrame(scanQRCode)
              }
            }, 100)
            return
          }
        }
      }
    }

    // QR 코드가 감지되지 않으면 적절한 간격으로 다시 스캔
    if (isScanning) {
      setTimeout(() => requestAnimationFrame(scanQRCode), 100) // 100ms 간격으로 스캔
    }
  }, [isScanning, handleQRCodeDetected])

  // 카메라 활성화 시 QR 스캔 시작
  useEffect(() => {
    if (isCameraActive && isScanning) {
      // 카메라가 로드될 때까지 잠시 대기 (시간 단축)
      const timer = setTimeout(() => {
        scanQRCode()
      }, 500) // 500ms 대기로 단축

      return () => clearTimeout(timer)
    }
  }, [isCameraActive, isScanning, scanQRCode])

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
                // 이미지 크기가 유효한지 확인
                if (img.width === 0 || img.height === 0) {
                  alert('이미지 크기가 유효하지 않습니다.')
                  return
                }

                canvas.width = img.width
                canvas.height = img.height

                try {
                  context.drawImage(img, 0, 0)

                  // 캔버스 크기가 유효한지 확인
                  if (canvas.width === 0 || canvas.height === 0) {
                    alert('이미지 처리 중 오류가 발생했습니다.')
                    return
                  }

                  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
                  const code = jsQR(imageData.data, imageData.width, imageData.height)

                  if (code) {
                    handleQRCodeDetected(code.data)
                  } else {
                    alert('이미지에서 QR 코드를 찾을 수 없습니다.')
                  }
                } catch (error) {
                  console.error('이미지 QR 스캔 오류:', error)
                  alert('이미지 처리 중 오류가 발생했습니다.')
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
    <div className="fixed inset-0 bg-black">
      {/* 숨겨진 캔버스 (QR 스캔용) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/client/home">
            <Button variant="ghost" size="sm" className="p-2 bg-white/10 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">명함 스캔</h1>
          <div></div>
        </div>
      </div>

      {/* 카메라 뷰 - 전체 화면 */}
      <div className="absolute inset-0">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          className="w-full h-full object-cover"
          videoConstraints={{
            width: 1280,
            height: 720,
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
                <span className="ml-2 text-sm">스캔 중...</span>
              </div>
            </div>
          </div>
        )}

        {/* 하단 컨트롤 */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-center">
            <Button
              onClick={handleGallerySelect}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              갤러리에서 선택
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
