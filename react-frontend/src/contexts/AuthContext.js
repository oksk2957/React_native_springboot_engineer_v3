import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9000/api'

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
    if (!response.ok || !data.valid) throw new Error(data.error || '세션 검증에 실패했습니다.')

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
      // 1. Google 인증 후 Supabase 콜백 URL로 돌아오도록 설정 (코드 교환 안정화)
      const redirectTo = 'https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback'
      console.info('[AUTH] Google login start', { redirectTo })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
          skipBrowserRedirect: true, // Web 환경에서는 우리가 직접 리다이렉트하므로 true로 설정 (Supabase 자체 리다이렉트 방지)
        },
      })

      if (error) throw error
      // data.url이 존재하면 Google 인증 URL을 얻은 것이므로, 이를 열어 인증 플로우 시작
      // AuthContext가 직접 window.location.assign을 호출하여 리다이렉트 제어권을 가짐
      if (data?.url) {
        window.location.assign(data.url)
      } else {
        throw new Error('OAuth 로그인 URL을 받지 못했습니다.')
      }
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
        
        // 2. 로그인이 완료되면 사용자가 원하는 9000 포트로 이동 (기존 로직 유지)
        console.info('[AUTH] Login success, redirecting to port 9000...')
        setTimeout(() => {
          window.location.href = 'http://localhost:9000'
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
        await supabase.auth.getSession()
      } catch (err) {
        console.warn('세션 조회 실패:', err)
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
