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
  console.error('❌ ERRO: Backend não configurado');
  console.error('');
  console.error('👤 Se você é um USUÁRIO:');
  console.error('   → Não se preocupe! Isso é um problema de configuração do servidor.');
  console.error('   → Entre em contato com o administrador do sistema.');
  console.error('   → O sistema deve estar configurado para funcionar sem setup do usuário.');
  console.error('');
  console.error('🔧 Se você é um DESENVOLVEDOR/MANTENEDOR:');
  console.error('   1. Crie uma conta gratuita em https://supabase.com');
  console.error('   2. Execute os scripts SQL: supabase-setup.sql e supabase-auth-migration.sql');
  console.error('   3. Configure as variáveis de ambiente (veja DEVELOPER_SETUP.md)');
  console.error('   4. Para produção: Configure no painel da Vercel');
  console.error('');
  console.error('📚 Consulte DEVELOPER_SETUP.md para instruções completas');
  console.error('');
} else {
  console.log('✅ Backend configurado - sistema pronto para uso');
  console.log('🔗 Conectado ao servidor:', supabaseUrl);
}

// Create Supabase client - required for system operation
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        },
        // Add reconnection options to improve reliability
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => {
          // Exponential backoff with jitter to prevent thundering herd
          const baseDelay = 1000 * Math.pow(2, tries);
          const jitter = Math.random() * 1000;
          return Math.min(baseDelay + jitter, 30000);
        }
      },
      // Configure retry logic for better resilience
      db: {
        schema: 'public'
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};
