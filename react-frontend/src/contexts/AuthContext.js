import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

// DEBUG: [Supabase-OAuth-2026-05-27] React Frontend AuthContext - Supabase OAuth 통합
// 원인: Google OAuth HTTP origin 차단 → Supabase OAuth로 전환
// 해결: Supabase signInWithOAuth 사용, 백엔드 /api/auth/verify에서 Supabase JWT 검증

// DEBUG: [2026-05-27] API Base URL 설정
// 환경변수 REACT_APP_API_BASE_URL 미설정시 localhost fallback
// OCI 서버 배포시 .env 파일에 REACT_APP_API_BASE_URL=http://158.180.78.125:9001/api 설정 필요
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001/api'

// DEBUG: API Base URL 로깅 (개발/배포 환경 확인용)
console.log('[AuthContext] API Base URL:', API_BASE_URL)

const readStoredAuth = () => {
  const savedToken = localStorage.getItem('authToken')
  const savedUser = localStorage.getItem('user')

  if (!savedToken || !savedUser) {
    return { token: null, user: null }
  }

  try {
    return { token: savedToken, user: JSON.parse(savedUser) }
  } catch {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    return { token: null, user: null }
  }
}

const persistAuth = (token, user) => {
  localStorage.setItem('authToken', token)
  localStorage.setItem('user', JSON.stringify(user))
}

const clearAuthStorage = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

const createAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isAuthenticated = !!token

  // DEBUG: [Supabase-OAuth-2026-05-27] Supabase JWT를 백엔드에 검증
  const syncProfile = useCallback(async (authToken) => {
    // DEBUG: [Supabase-OAuth-2026-05-27] 백엔드 /api/auth/verify 엔드포인트 호출
    // Supabase JWT를 백엔드에서 검증
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: createAuthHeaders(authToken),
    })

    const data = await response.json()
    if (!response.ok || !data.valid) throw new Error(data.error || '토큰 검증에 실패했습니다.')

    if (data.user) {
      persistAuth(authToken, data.user)
      setToken(authToken)
      setUser(data.user)
    }

    return data
  }, [])

  // DEBUG: [Supabase-OAuth-2026-05-27] Supabase OAuth를 통한 Google 로그인
  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // DEBUG: [Supabase-OAuth-2026-05-27] redirectTo 설정
      // DEBUG: [Supabase-OAuth-2026-05-27] redirectTo 원복
      // 원인: Supabase 콜백 URL 직접 설정 시 state 파라미터 충돌
      // 해결: 애플리케이션 콜백 URL로 설정 (Supabase가 자동으로 state 추가)
      const redirectTo = typeof window !== 'undefined'
        ? 'http://158.180.78.125:9000/auth-callback'
        : undefined

      console.info('[AUTH] Google login start', { redirectTo })

      // Supabase OAuth로 Google 로그인
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'email profile openid',
          queryParams: { prompt: 'select_account' },
        },
      })

      if (error) throw error

      // Supabase가 자동으로 data.url(Google 로그인 페이지)로 브라우저를 리디렉션함
      return data
    } catch (err) {
      console.error('[AUTH] Google login failed', err)
      setError(err.message || 'Google 로그인 실패')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH] State Change:', event, session?.user?.email)

      if (event === 'SIGNED_IN' && session) {
        setToken(session.access_token)
        setUser(session.user)
        persistAuth(session.access_token, session.user)

        // DEBUG: [OCI-Prod-2026-05-27] OCI 서버 IP 업데이트
        // 원인: OCI 서버 IP 변경 (168.110.119.132 → 158.180.78.125)
        // 해결: 환경변수에서 Frontend URL을 가져오거나 기본값 사용
        const redirectUrl = process.env.REACT_APP_FRONTEND_URL || 'http://158.180.78.125:9000'
        console.info('[AUTH] Login success, redirecting to:', redirectUrl)
        setTimeout(() => {
          window.location.href = redirectUrl
        }, 500)
      } else if (event === 'SIGNED_OUT') {
        clearAuthStorage()
        setToken(null)
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuthStorage()
    setToken(null)
    setUser(null)
    setError(null)
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      const stored = readStoredAuth()
      setToken(stored.token)
      setUser(stored.user)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setToken(session.access_token)
          setUser(session.user)
          persistAuth(session.access_token, session.user)
        }
      } catch (err) {
        console.warn('세션 복원 에러:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      isAuthenticated,
      signInWithGoogle,
      signOut,
      syncProfile,
    }),
    [user, token, loading, error, isAuthenticated, signInWithGoogle, signOut, syncProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
