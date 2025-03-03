import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Defined' : 'Missing',
    key: supabaseKey ? 'Defined' : 'Missing'
  });
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Add error handling for Supabase operations
export const handleSupabaseError = (error) => {
  if (error) {
    console.error('Supabase error:', error.message, error.details, error.hint);
    return error.message;
  }
  return null;
};

// Test connection to verify Supabase is working
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey ? 'Provided' : 'Missing');
    
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection test successful');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
    return { success: false, error: err.message };
  }
};

// Test connection on initialization
console.log('Initializing Supabase client...');
testConnection().then(result => {
  if (!result.success) {
    console.error('⚠️ Supabase connection issue detected. Check your environment variables and network connection.');
  } else {
    console.log('✅ Supabase connection successful');
  }
});