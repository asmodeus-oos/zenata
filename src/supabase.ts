import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
  
  console.error(
    `CRITICAL: Missing Supabase environment variables: ${missing.join(', ')}. ` +
    'The application will not function correctly. Ensure these are set in Vercel ' +
    'with the "VITE_" prefix for client-side access.'
  );
}

// Fallback to empty strings to prevent immediate crash on import, 
// though operations will still fail.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
