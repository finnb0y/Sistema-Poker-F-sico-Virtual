import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface User {
  id: string;
  username: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

const SESSION_TOKEN_KEY = 'poker_session_token';
const SESSION_USER_KEY = 'poker_session_user';

/**
 * Hash a password using Web Crypto API (SHA-256)
 * 
 * ⚠️ SECURITY WARNING: This implementation uses SHA-256 which is NOT secure for production.
 * SHA-256 is vulnerable to rainbow table and brute force attacks.
 * 
 * For production use, implement server-side password hashing with:
 * - bcrypt (recommended)
 * - argon2
 * - PBKDF2
 * 
 * These algorithms include:
 * - Automatic salt generation
 * - Computational cost factors
 * - Protection against rainbow tables
 * 
 * Current implementation is for demo/development purposes only.
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate a random session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  /**
   * Register a new user
   */
  register: async (username: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado. Autenticação requer Supabase.' };
    }

    if (!username || username.length < 3) {
      return { success: false, error: 'Nome de usuário deve ter pelo menos 3 caracteres' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
    }

    try {
      // Hash the password
      const passwordHash = await hashPassword(password);

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('poker_users')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle(); // Use maybeSingle to handle no rows without error

      // Handle database errors
      if (checkError) {
        console.error('Error checking username:', checkError);
        return { success: false, error: 'Erro ao verificar nome de usuário' };
      }

      if (existingUser) {
        return { success: false, error: 'Nome de usuário já existe' };
      }

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('poker_users')
        .insert({
          username: username.toLowerCase(),
          password_hash: passwordHash
        })
        .select('id, username')
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user:', createError);
        return { success: false, error: 'Falha ao criar usuário' };
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error: sessionError } = await supabase
        .from('poker_user_sessions')
        .insert({
          user_id: newUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        return { success: false, error: 'Falha ao criar sessão' };
      }

      const user: User = {
        id: newUser.id,
        username: newUser.username
      };

      const session: AuthSession = {
        user,
        token: sessionToken,
        expiresAt
      };

      // Save session to localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));

      return { success: true, session };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Erro ao registrar usuário' };
    }
  },

  /**
   * Login user
   */
  login: async (username: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado. Autenticação requer Supabase.' };
    }

    if (!username || !password) {
      return { success: false, error: 'Nome de usuário e senha são obrigatórios' };
    }

    try {
      // Hash the password
      const passwordHash = await hashPassword(password);

      // Find user
      const { data: user, error: userError } = await supabase
        .from('poker_users')
        .select('id, username')
        .eq('username', username.toLowerCase())
        .eq('password_hash', passwordHash)
        .single();

      if (userError || !user) {
        return { success: false, error: 'Nome de usuário ou senha inválidos' };
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error: sessionError } = await supabase
        .from('poker_user_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Failed to create session:', sessionError);
        return { success: false, error: 'Falha ao criar sessão' };
      }

      const authUser: User = {
        id: user.id,
        username: user.username
      };

      const session: AuthSession = {
        user: authUser,
        token: sessionToken,
        expiresAt
      };

      // Save session to localStorage
      localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(authUser));

      return { success: true, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);

    if (token && isSupabaseConfigured() && supabase) {
      try {
        // Delete session from database
        await supabase
          .from('poker_user_sessions')
          .delete()
          .eq('session_token', token);
      } catch (error) {
        console.error('⚠️ Falha ao deletar sessão no banco de dados:', error);
        // Continue with local cleanup even if database delete fails
      }
    }

    // Always clear localStorage regardless of database operation result
    // This ensures the user can access the app even if there are network issues
    try {
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      // Also clear role/player session data
      localStorage.removeItem('poker_current_role');
      localStorage.removeItem('poker_current_player_id');
      localStorage.removeItem('poker_current_table_id');
    } catch (error) {
      console.error('⚠️ Falha ao limpar localStorage:', error);
    }
  },

  /**
   * Get current session from localStorage and validate
   */
  getCurrentSession: async (): Promise<AuthSession | null> => {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const userJson = localStorage.getItem(SESSION_USER_KEY);

    if (!token || !userJson) {
      return null;
    }

    if (!isSupabaseConfigured() || !supabase) {
      // Clear stale session data if Supabase is not configured
      // This prevents black screen when Supabase config is removed
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_USER_KEY);
      return null;
    }

    try {
      const user = JSON.parse(userJson) as User;

      // Validate session in database
      const { data: session, error } = await supabase
        .from('poker_user_sessions')
        .select('expires_at')
        .eq('session_token', token)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (error) {
        console.error('❌ Erro ao validar sessão:', error);
        // Clear invalid session
        await authService.logout();
        return null;
      }

      if (!session) {
        // Session not found in database - token is invalid
        console.log('🔄 Token de sessão inválido - limpando dados locais');
        await authService.logout();
        return null;
      }

      const expiresAt = new Date(session.expires_at);
      if (expiresAt <= new Date()) {
        // Session expired
        console.log('⏱️ Sessão expirada - solicitando novo login');
        await authService.logout();
        return null;
      }

      return {
        user,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('❌ Falha ao validar sessão:', error);
      // Clear invalid session to prevent black screen
      await authService.logout();
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const session = await authService.getCurrentSession();
    return session !== null;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<User | null> => {
    const session = await authService.getCurrentSession();
    return session ? session.user : null;
  }
};
