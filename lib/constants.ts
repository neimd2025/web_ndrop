// Admin 관련 상수
export const ADMIN_EMAILS = [
  'admin@ndrop.com',
  'simjaehyeong@gmail.com',
  'test@admin.com'
]

// 역할 ID 상수
export const ROLE_IDS = {
  USER: 1,
  ADMIN: 2
} as const

// 역할 이름 상수
export const ROLE_NAMES = {
  USER: 'user',
  ADMIN: 'admin'
} as const

// Admin 이메일 확인 함수
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// 역할 ID로 역할 이름 가져오기
export const getRoleNameById = (roleId: number): string => {
  switch (roleId) {
    case ROLE_IDS.ADMIN:
      return ROLE_NAMES.ADMIN
    case ROLE_IDS.USER:
    default:
      return ROLE_NAMES.USER
  }
}

// 역할 이름으로 역할 ID 가져오기
export const getRoleIdByName = (roleName: string): number => {
  switch (roleName) {
    case ROLE_NAMES.ADMIN:
      return ROLE_IDS.ADMIN
    case ROLE_NAMES.USER:
    default:
      return ROLE_IDS.USER
  }
}
