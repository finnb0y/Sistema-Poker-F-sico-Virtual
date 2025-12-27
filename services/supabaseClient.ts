import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These values should be set in environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables and provide helpful feedback
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase não configurado - rodando em modo local');
  console.warn('📖 Para sincronização entre dispositivos, configure as variáveis de ambiente:');
  console.warn('   1. Copie .env.example para .env');
  console.warn('   2. Adicione suas credenciais do Supabase');
  console.warn('   3. Reinicie o servidor (npm run dev)');
  console.warn('📚 Consulte ENVIRONMENT_SETUP.md para mais detalhes');
} else {
  console.log('✅ Supabase configurado - sincronização multi-dispositivo habilitada');
  console.log('🔗 Conectando ao projeto:', supabaseUrl);
}

// Create Supabase client
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
