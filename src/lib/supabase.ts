import { createClient } from '@supabase/supabase-js';

if (process.env.NODE_ENV === 'development') {
  // Ignorar errores de certificados SSL auto-firmados en desarrollo local (común bajo VPN/Proxy corporativo)
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase URL or Anon Key missing. Make sure to add them to your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
