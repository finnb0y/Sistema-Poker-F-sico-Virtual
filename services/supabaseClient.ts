import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These values MUST be set in environment variables for the system to work
// Handle both Vite (import.meta.env) and Node.js (process.env) environments
const getEnvVar = (key: string): string => {
  // Check if running in browser with Vite - verify both import.meta and import.meta.env exist
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env === 'object') {
      const value = import.meta.env[key];
      if (typeof value === 'string') {
        return value;
      }
    }
  } catch (e) {
    // import.meta access failed, continue to process.env fallback
  }
  
  // Fallback to process.env for Node.js (testing)
  if (typeof process !== 'undefined' && process.env && typeof process.env === 'object') {
    const value = process.env[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Validate environment variables and provide helpful feedback
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Supabase não configurado - sistema requer Supabase para funcionar');
  console.error('📖 Este sistema opera EXCLUSIVAMENTE em modo multi-dispositivo via Supabase');
  console.error('');
  console.error('🔧 Para configurar o Supabase:');
  console.error('   1. Crie uma conta gratuita em https://supabase.com');
  console.error('   2. Execute o script SQL: supabase-setup.sql');
  console.error('   3. Copie .env.example para .env');
  console.error('   4. Adicione suas credenciais do Supabase no arquivo .env');
  console.error('   5. Reinicie o servidor (npm run dev)');
  console.error('');
  console.error('📚 Consulte ENVIRONMENT_SETUP.md para instruções detalhadas');
  console.error('');
} else {
  console.log('✅ Supabase configurado - sincronização multi-dispositivo habilitada');
  console.log('🔗 Conectando ao projeto:', supabaseUrl);
}

// Create Supabase client - required for system operation
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
