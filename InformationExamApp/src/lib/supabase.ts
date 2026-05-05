import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://gmhznnwecujoafdisscl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
