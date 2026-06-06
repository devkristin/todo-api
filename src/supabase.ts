import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabasePublishableKey) {
  throw new Error('Missing SUPABASE_PUBLISHABLE_KEY environment variable');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_SECRET_KEY environment variable');
}

export const supabaseAuth = createClient(supabaseUrl, supabasePublishableKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export const createSupabaseClient = (token: string): SupabaseClient => {
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false,
    },
    accessToken: async () => token,
  });
};

export default supabaseAdmin;
