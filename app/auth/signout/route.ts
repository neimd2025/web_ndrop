import { createClient } from '@/utils/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  
  // Check if we have a session first
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  const requestUrl = new URL(req.url)
  const from = requestUrl.searchParams.get('from') || '/'
  const type = requestUrl.searchParams.get('type') || 'user'
  
  // 로그인 페이지로 리다이렉트
  const loginUrl = new URL('/login', req.url)
  if (from) {
    loginUrl.searchParams.set('from', from)
  }
  if (type) {
    loginUrl.searchParams.set('type', type)
  }
  
  return NextResponse.redirect(loginUrl)
}