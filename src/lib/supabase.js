import { createClient } from '@supabase/supabase-js';

// These environment variables will be needed
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

try {
    if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey) {
        client = createClient(supabaseUrl, supabaseAnonKey);
    } else {
        console.warn("Supabase credentials missing or invalid. Auth disabled.");
    }
} catch (e) {
    console.warn("Supabase init failed:", e.message);
}

export const supabase = client;
