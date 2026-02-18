import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://fuqxdgywfliceqvlzhrl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cXhkZ3l3ZmxpY2Vxdmx6aHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NDI1ODIsImV4cCI6MjA4NzAxODU4Mn0.Nj1EzYLyJROCi__B9fbOqyAj7Wc0arXkp4H4cImyuDc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
