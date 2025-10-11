import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  role?: string
  company?: string
  profile_image_url?: string
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  role: 'admin'
  role_id: number
  company: string | null
  contact: string | null
  profile_image_url: string | null
}

// 서버 사이드 사용자 인증 확인
export async function getServerAuth(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // 프로필이 없는 경우도 정상적인 상황으로 처리
      if (profileError.code === 'PGRST116') {
        return {
          id: user.id,
          email: user.email!,
          created_at: user.created_at
        }
      }
      console.error('프로필 가져오기 오류:', profileError)
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      full_name: profile?.full_name,
      role: profile?.role,
      company: profile?.company,
      profile_image_url: profile?.profile_image_url,
      created_at: user.created_at
    }
  } catch (error) {
    console.error('서버 인증 확인 오류:', error)
    return null
  }
}

// 서버 사이드 관리자 인증 확인
export async function getAdminAuth(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role_id, company, contact, profile_image_url')
      .eq('id', user.id)
      .eq('role_id', 2) // admin role
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      ...profile,
      role: 'admin'
    } as AdminUser
  } catch (error) {
    console.error('Admin auth error:', error)
    return null
  }
}

// 사용자 인증 필수 (리다이렉트)
export async function requireServerUserAuth(): Promise<AuthUser> {
  const user = await getServerAuth()

  if (!user) {
    redirect('/login?type=user')
  }

  return user
}

// 관리자 인증 필수 (리다이렉트)
export async function requireAdminAuth(): Promise<AdminUser> {
  const adminUser = await getAdminAuth()

  if (!adminUser) {
    redirect('/login?type=admin&returnTo=/admin')
  }

  return adminUser
}

// 인증 상태에 따른 조건부 리다이렉트
export async function redirectIfAuthenticated(userType: 'user' | 'admin' = 'user') {
  if (userType === 'admin') {
    const admin = await getAdminAuth()
    if (admin) {
      redirect('/admin')
    }
  } else {
    const user = await getServerAuth()
    if (user) {
      redirect('/client/home')
    }
  }
}

// 로그인 페이지용 인증 확인 (이미 로그인된 경우 리다이렉트)
export async function handleLoginPageAuth(searchParams: { type?: string, returnTo?: string }) {
  const userType = searchParams.type === 'admin' ? 'admin' : 'user'

  if (userType === 'admin') {
    const admin = await getAdminAuth()
    if (admin) {
      const returnTo = searchParams.returnTo || '/admin'
      redirect(returnTo)
    }
  } else {
    const user = await getServerAuth()
    if (user) {
      const returnTo = searchParams.returnTo || '/client/home'
      redirect(returnTo)
    }
  }
}

export async function checkAdminAuth(): Promise<{ isAuthenticated: boolean; user: AdminUser | null }> {
  const adminUser = await getAdminAuth()
  return {
    isAuthenticated: !!adminUser,
    user: adminUser
  }
}
