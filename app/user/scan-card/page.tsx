'use client'

import { Button } from '@/components/ui/button'
import jsQR from 'jsqr'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { toast } from 'sonner'

export default function ScanCardPage() {
  const router = useRouter()
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 카메라 초기화
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        setIsLoading(true)
        setCameraError(null)

        // 카메라 지원 여부 확인
        if (!navigator.mediaDevices) {
          throw new Error('카메라를 지원하지 않는 브라우저입니다.')
        }

        console.log('카메라 지원 확인 완료')
        setIsCameraActive(true)
        setIsScanning(true)
      } catch (error: any) {
        console.error('카메라 초기화 오류:', error)
        setCameraError(error.message || '카메라를 시작할 수 없습니다.')
        setIsCameraActive(false)
        setIsScanning(false)
      } finally {
        setIsLoading(false)
      }
    }

    initializeCamera()
  }, [])

  // QR 코드 감지 시 처리
  const handleQRCodeDetected = useCallback((qrData: string) => {
    setIsScanning(false)
    console.log('QR 코드 데이터:', qrData)

    // QR 코드 데이터를 파싱하여 명함 정보 추출
    try {
      const cardData = JSON.parse(qrData)
      // 명함 데이터 처리 및 저장
      console.log('명함 데이터:', cardData)

      // 성공 메시지 표시 후 명함 상세 페이지로 이동
      toast.success('명함이 성공적으로 스캔되었습니다!')
      router.push(`/business-card/${cardData.id}`)
    } catch (error) {
      console.error('QR 코드 파싱 오류:', error)

      // QR 코드가 JSON이 아닌 경우 다른 형식으로 처리
      if (qrData.startsWith('http') && qrData.includes('/business-card/')) {
        // 명함 상세 페이지 링크인 경우
        const cardId = qrData.split('/business-card/').pop()?.split('?')[0]
        console.log('명함 링크 감지:', cardId)
        if (cardId) {
          toast.success('명함 링크가 감지되었습니다!')
          router.push(`/business-card/${cardId}`)
        } else {
          toast.error('유효하지 않은 명함 링크입니다.')
        }
      } else if (qrData.includes('/business-card/')) {
        // 상대 경로인 경우
        const cardId = qrData.split('/business-card/').pop()
        console.log('명함 ID 감지:', cardId)
        if (cardId) {
          toast.success('명함이 감지되었습니다!')
          router.push(`/business-card/${cardId}`)
        } else {
          toast.error('유효하지 않은 QR 코드입니다.')
        }
      } else {
        toast.error('유효하지 않은 QR 코드입니다.')
      }
    }
  }, [router])

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

  // 사진 촬영
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setCapturedImage(imageSrc)
    }
  }, [])

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

  // 수동 입력 페이지로 이동
  const handleManualInput = useCallback(() => {
    // 수동 입력 페이지로 이동하는 로직
    console.log('수동 입력 페이지로 이동')
  }, [])

  // QR 코드 스캔 시뮬레이션 (개발용) - 실제 구현에서는 제거
  const simulateQRScan = useCallback(() => {
    // 실제 QR 스캔 기능으로 대체 예정
    console.log('QR 스캔 시뮬레이션 - 실제 구현에서는 카메라로 QR 코드를 스캔합니다.')
  }, [])

  // 카메라 재시작 함수
  const restartCamera = () => {
    setCameraError(null)
    setIsLoading(true)
    setIsCameraActive(false)
    setIsScanning(false)

    setTimeout(() => {
      setIsCameraActive(true)
      setIsScanning(true)
      setIsLoading(false)
    }, 1000)
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>카메라를 시작하는 중...</p>
        </div>
      </div>
    )
  }

  // 카메라 오류
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center text-white px-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📷</span>
            </div>
            <h2 className="text-xl font-bold mb-2">카메라 접근 오류</h2>
            <p className="text-gray-300 mb-4">{cameraError}</p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={restartCamera}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              다시 시도
            </Button>

            <Button
              onClick={handleGallerySelect}
              variant="outline"
              className="w-full border-white text-white hover:bg-white hover:text-black"
            >
              갤러리에서 선택
            </Button>

            <Link href="/home">
              <Button variant="ghost" className="w-full text-gray-400">
                홈으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* 숨겨진 캔버스 (QR 스캔용) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-10 px-5 py-4">
        <div className="flex items-center justify-between">
          <Link href="/home">
            <Button variant="ghost" size="sm" className="p-2 bg-white/10 hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white">명함 스캔</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 bg-white/10 hover:bg-white/20"
              onClick={handleGallerySelect}
            >
              📁
            </Button>
          </div>
        </div>
      </div>

      {/* 카메라 뷰 - 전체 화면 */}
      <div className="absolute inset-0">
        {isCameraActive && (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{
              width: { ideal: 1280 },
              height: { ideal: 720 },
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
              setCameraError('카메라를 시작할 수 없습니다. 권한을 확인해주세요.')
              setIsCameraActive(false)
              setIsScanning(false)
            }}
          />
        )}

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
      </div>
    </div>
  )
}
