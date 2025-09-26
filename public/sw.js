// Service Worker for ndrop PWA
const CACHE_NAME = 'ndrop-v1.0.0'
const STATIC_CACHE = 'ndrop-static-v1'
const DYNAMIC_CACHE = 'ndrop-dynamic-v1'

// 캐시할 정적 리소스
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/splash01.png',
  '/images/splash02.png',
  '/images/splash03.png',
  '/images/splash04.png'
]

// 네트워크 우선, 캐시 폴백 전략
const networkFirst = async (request) => {
  try {
    const response = await fetch(request)
    const cache = await caches.open(DYNAMIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// 캐시 우선, 네트워크 폴백 전략
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const response = await fetch(request)
    const cache = await caches.open(STATIC_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    // 오프라인 페이지 반환
    return caches.match('/offline.html')
  }
}

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...')

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('정적 리소스 캐싱 중...')
      return cache.addAll(STATIC_ASSETS)
    })
  )

  self.skipWaiting()
})

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...')

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('오래된 캐시 삭제:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )

  self.clients.claim()
})

// 페치 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 요청은 네트워크 우선
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // 정적 리소스는 캐시 우선
  if (request.destination === 'image' ||
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(cacheFirst(request))
    return
  }

  // HTML 페이지는 네트워크 우선
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request))
    return
  }

  // 기타 요청은 네트워크 우선
  event.respondWith(networkFirst(request))
})

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('백그라운드 동기화:', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// 푸시 알림
self.addEventListener('push', (event) => {
  console.log('푸시 알림 수신:', event)

  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/icon-72x72.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('ndrop', options)
  )
})

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭:', event)

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/notifications')
    )
  } else if (event.action === 'close') {
    // 아무것도 하지 않음
  } else {
    // 기본 동작: 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 오프라인 중에 저장된 데이터 동기화
    const offlineData = await getOfflineData()

    if (offlineData.length > 0) {
      console.log('오프라인 데이터 동기화 중...')

      for (const data of offlineData) {
        try {
          // Supabase에 데이터 전송
          await syncDataToSupabase(data)
          await removeOfflineData(data.id)
        } catch (error) {
          console.error('데이터 동기화 실패:', error)
        }
      }
    }
  } catch (error) {
    console.error('백그라운드 동기화 오류:', error)
  }
}

// IndexedDB를 사용한 오프라인 데이터 관리
async function getOfflineData() {
  // 실제 구현에서는 IndexedDB를 사용
  return []
}

async function syncDataToSupabase(data) {
  // 실제 구현에서는 Supabase API 호출
  console.log('Supabase에 데이터 동기화:', data)
}

async function removeOfflineData(id) {
  // 실제 구현에서는 IndexedDB에서 데이터 삭제
  console.log('오프라인 데이터 삭제:', id)
}

// 메시지 이벤트 (메인 스레드와 통신)
self.addEventListener('message', (event) => {
  console.log('Service Worker 메시지 수신:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})
