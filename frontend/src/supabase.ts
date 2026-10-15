import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || 'http://localhost:54321'
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuYWNvZGFzbXN5c2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNDcyMDAsImV4cCI6MTg4NzgxMzIwMH0.test_key'

export const supabase = createClient(supabaseUrl, supabaseKey)
