import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nzuauswumrueagrlikgp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56dWF1c3d1bXJ1ZWFncmxpa2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjExMDgsImV4cCI6MjA5MTk5NzEwOH0.nsN0tVmGM1DrBD1CzgpUVkKBWM3t-_D-NnpgTEGqZEc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
