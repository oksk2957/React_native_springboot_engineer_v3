import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://gmhznnwecujoafdisscl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc';

const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    /**
     * [flowType 변경: pkce → implicit]
     *
     * PKCE 문제점:
     *   - code_verifier를 localStorage에 저장 후 리다이렉트
     *   - 리다이렉트(페이지 재로드) 과정에서 localStorage 초기화 or 손실
     *   - 결과: "ERR_TOO_MANY_REDIRECTS" + P===undefined 내부 오류
     *
     * implicit 장점:
     *   - 코드 교환 없이 access_token을 URL hash(#)에서 직접 수신
     *   - localStorage 의존 없음 → 리다이렉트 루프 없음
     *   - detectSessionInUrl:true 로 자동 파싱
     */
    storage: isWeb ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb,  // 웹에서 URL hash의 토큰 자동 감지
    flowType: 'implicit',        // PKCE → implicit 으로 변경 (ERR_TOO_MANY_REDIRECTS 해결)
  },
});
