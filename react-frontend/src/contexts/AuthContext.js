import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001/api'

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

  const syncProfile = useCallback(async (authToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
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

  const signInWithGoogle = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // [수정] redirectTo: Supabase가 OAuth 처리 후 리디렉션할 앱의 URL
      // (절대 Supabase Callback URL로 설정하지 말 것 → state 파라미터 누락 오류 발생)
      const redirectTo = typeof window !== 'undefined'
        ? window.location.origin + '/auth-callback.html'
        : undefined

      console.info('[AUTH] Google login start', { redirectTo })

// [수정] skipBrowserRedirect 제거 (기본값 false)
      // Supabase가 브라우저 리디렉션을 직접 처리하도록 함
      // ✅ scopes 추가: 사용자 이메일/프로필 조회 + state 파라미터 정상 처리를 위해 필수
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'email profile openid', // ✅ Google 사용자 정보 조회 + state 처리
          queryParams: { prompt: 'select_account' },
        },
      })

      if (error) throw error

      // skipBrowserRedirect: false(기본값)이므로 Supabase가 자동으로
      // data.url(Google 로그인 페이지)로 브라우저를 리디렉션함
      // → window.location.assign(data.url) 불필요

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

        // 로그인 완료 후 Spring Boot 백엔드(9001)로 이동
        console.info('[AUTH] Login success, redirecting to app page...')
        setTimeout(() => {
          window.location.href = 'http://localhost:9001'
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
