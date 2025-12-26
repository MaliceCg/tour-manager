import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qsmtpguuxkyhoasbmghr.supabase.co';
const supabaseAnonKey = 'sb_publishable_tCVqRLlKe1VebPK3368WYA_3VuyLCcK';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
