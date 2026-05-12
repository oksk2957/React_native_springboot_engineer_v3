import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://gmhznnwecujoafdisscl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc';

// 웹: localStorage + detectSessionInUrl:true (PKCE code 자동 교환)
// 모바일: AsyncStorage + detectSessionInUrl:false (딥링크로 처리)
const isWeb = Platform.OS === 'web';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: isWeb ? undefined : AsyncStorage, // 웹은 기본 localStorage 사용
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // ✅ 웹에서만 true: PKCE authorization_code 자동 교환
    flowType: 'pkce',          // ✅ PKCE Flow 명시적 활성화 (Supabase 권장)
  },
});
