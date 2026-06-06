import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || (!supabaseServiceRoleKey && !supabasePublishableKey)) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseKey = supabaseServiceRoleKey || supabasePublishableKey;

if (!supabaseKey) {
  throw new Error('Missing Supabase key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
