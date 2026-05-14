import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gmhznnwecujoafdisscl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc'

// PKCE(Proof Key for Code Exchange) Flow를 사용한 Supabase 클라이언트 초기화
// PKCE는 OAuth 2.0에서 authorization code를 탈취로부터 보호하는 프로토콜
// state 파라미터와 code_verifier를 자동 관리하여 CSRF 공격 방지
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // OAuth 콜백 URL에서 세션 자동 감지
    flowType: 'pkce',          // PKCE Flow 명시적 설정 (보안 강화 + state 파라미터 자동 관리)
  },
})
