import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These values MUST be set in environment variables for the system to work
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
