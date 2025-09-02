import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://oyedfzsqqqdfrmhbcbwb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZWRmenNxcXFkZnJtaGJjYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwMDksImV4cCI6MjA3MjE1OTAwOX0.zlQAXksbwfK6y-pIQVgju9e1DG-Kj8Gmbpvvs9TPU5g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
