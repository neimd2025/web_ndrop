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

interface UserScanCardClientProps {
  user: UserProfile
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

        // 이미 저장된 명함인지 확인
        const { data: existingCard } = await supabase
          .from('collected_cards')
          .select('id')
          .eq('collector_id', user.id)
          .eq('business_card_id', cardId)
          .single()

        if (existingCard) {
          alert('이미 저장된 명함입니다!')
          router.push(`/client/saved-cards/${existingCard.id}`)
          return
        }

        // 명함 저장
        const { data: savedCard, error: saveError } = await supabase
          .from('collected_cards')
          .insert({
            collector_id: user.id,
            business_card_id: cardId,
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

        alert('명함이 성공적으로 저장되었습니다!')
        router.push(`/client/saved-cards/${savedCard.id}`)
      } else {
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
              // 이벤트 참가
              const { error: joinError } = await supabase
                .from('event_participants')
                .insert({
                  event_id: event.id,
                  user_id: user.id,
                  status: 'confirmed'
                })

              if (joinError) {
                console.error('이벤트 참가 오류:', joinError)
                alert('이벤트 참가에 실패했습니다.')
                setIsScanning(true)
                return
              }

              // 참가자 수 업데이트
              const { error: updateError } = await supabase.rpc('increment_event_participants', {
                event_id: event.id
              })

              if (updateError) {
                console.warn('참가자 수 업데이트 실패:', updateError)
              }

              alert('이벤트에 참가했습니다!')
              router.push(`/client/events/${event.id}`)
            } else {
              setIsScanning(true)
            }
            return
          }
        }

        // JSON 형식으로 파싱 시도
        try {
          const cardData = JSON.parse(qrData)
          console.log('명함 데이터:', cardData)
          alert('명함 데이터가 감지되었습니다!')
          // 추가적인 처리 필요시 여기에 구현
        } catch (parseError) {
          alert('유효하지 않은 QR 코드입니다.')
        }
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

    // QR 코드가 감지되지 않으면 계속 스캔
    if (isScanning) {
      requestAnimationFrame(scanQRCode)
    }
  }, [isScanning, handleQRCodeDetected])

  // 카메라 활성화 시 QR 스캔 시작
  useEffect(() => {
    if (isCameraActive && isScanning) {
      // 카메라가 로드될 때까지 잠시 대기
      const timer = setTimeout(() => {
        scanQRCode()
      }, 1000) // 1초 대기

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
            {/* 모서리 표시 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-purple-600 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-purple-600 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-purple-600 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-purple-600 rounded-br-lg"></div>
          </div>
        </div>

        {/* 스캔 중 표시 */}
        {isScanning && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-white text-center">
              <div className="animate-pulse">QR 코드 스캔 중...</div>
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
