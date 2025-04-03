
import { createClient } from '@supabase/supabase-js';

// Use environment variables with fallback values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dorghxtadxvberjosnpd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcmdoeHRhZHh2YmVyam9zbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzY5OTIsImV4cCI6MjA1OTIxMjk5Mn0._A1mruxAV8K7Ak7fCV-ZscbMHqXhqTZbq1PTFVNyl4c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log when the supabase client is created with these values
console.log('Supabase client created with URL:', supabaseUrl);
