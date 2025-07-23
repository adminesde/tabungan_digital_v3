import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase Client Init - URL:", supabaseUrl ? "Loaded" : "NOT LOADED", "Anon Key:", supabaseAnonKey ? "Loaded" : "NOT LOADED");
console.log("Supabase Anon Key (first 10 chars):", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) : "N/A");


export const supabase = createClient(supabaseUrl, supabaseAnonKey);