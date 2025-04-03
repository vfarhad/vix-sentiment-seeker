
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dorghxtadxvberjosnpd.supabase.co';
// Always use the anon/public key for browser applications
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvcmdoeHRhZHh2YmVyam9zbnBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MzY5OTIsImV4cCI6MjA1OTIxMjk5Mn0.t53FzC8q8QJcFh9UWFjM8qjSGrwZMMZULvGHJYaNkYg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
