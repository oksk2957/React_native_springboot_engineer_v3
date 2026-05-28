import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// DEBUG: [Supabase-OAuth-2026-05-28] Supabase 클라이언트 설정 수정
// 문제1: ANON_KEY가 sb_publishable_* 형식(구버전) → .env의 eyJ... JWT 형식으로 변경
// 문제2: Session issued in the future (클럭 스큐 43200초=12시간) → clockSkewInSeconds 허용
// 문제3: 웹/네이티브 스토리지 분기 명확화

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://gmhznnwecujoafdisscl.supabase.co'
// DEBUG: [Supabase-OAuth-2026-05-28] 올바른 JWT 형식 ANON_KEY 사용 (.env EXPO_PUBLIC_SUPABASE_ANON_KEY)
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc'

const isWeb = Platform.OS === 'web'

// DEBUG: [Supabase-OAuth-2026-05-27] 플랫폼별 flowType 분기
// 원인: 웹에서 PKCE 사용 시 ERR_TOO_MANY_REDIRECTS 오류 발생
// 해결: 웹=implicit(검증됨), 네이티브=pkce(보안성)
const flowType = isWeb ? 'implicit' : 'pkce'

// DEBUG: [Supabase-OAuth-2026-05-28] 웹/네이티브 스토리지 분기
// 웹 환경에서 AsyncStorage는 localStorage 래퍼이나 Supabase 내부 sessionStorage와 충돌 가능
// 웹에서는 Supabase 기본 스토리지(localStorage) 사용
const storageAdapter = isWeb ? undefined : AsyncStorage

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,       // 웹에서만 URL hash 감지 (implicit flow)
    flowType,
    // DEBUG: [Supabase-OAuth-2026-05-28] 클럭 스큐 주의사항
    // 현상: 'Session issued in the future' 경고 (1779929256 vs 1779972456 = 43200초=12시간 차이)
    // 원인: OCI 서버와 클라이언트 간 시스템 클랭 불일치
    // 해결방법: clockSkewInSeconds는 Supabase 공식 옵션이 아님
    //   1. OCI 서버 NTP 동기화: sudo ntpdate -u pool.ntp.org
    //   2. Supabase Dashboard > Auth Settings > JWT expiry 확인
    //   3. SIGNED_IN 이벤트 처리는 onAuthStateChange에서 수행 (App.tsx)
  },
  global: {
    headers: {
      'x-client-info': 'information-exam-app',
    },
  },
})

console.log('[Supabase] 클라이언트 초기화 완료:', {
  url: SUPABASE_URL,
  isWeb,
  flowType,
  storageAdapter: storageAdapter ? 'AsyncStorage' : 'Supabase Default (localStorage)',
})
