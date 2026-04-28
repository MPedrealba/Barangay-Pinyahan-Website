// ============================================
// config/supabase.js — Supabase Storage Client
// ============================================
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase env vars not set. File uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
