import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Club, ClubManager, ClubManagerLoginLog } from '../types';

export interface ClubManagerSession {
  manager: ClubManager;
  clubId: string;
  token: string;
  expiresAt: Date;
}

const MANAGER_SESSION_TOKEN_KEY = 'poker_manager_session_token';
const MANAGER_SESSION_DATA_KEY = 'poker_manager_session_data';

/**
 * Hash a password using Web Crypto API (SHA-256)
 * 
 * ⚠️ SECURITY WARNING: This implementation uses SHA-256 which is NOT secure for production.
 * See authService.ts for details on production-ready alternatives.
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

export const clubService = {
  /**
   * Create a new club
   */
  createClub: async (
    name: string,
    ownerUserId: string,
    description?: string,
    profilePhotoUrl?: string,
    bannerUrl?: string
  ): Promise<{ success: boolean; error?: string; club?: Club }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado. Entre em contato com o administrador.' 
      };
    }

    if (!name || name.length < 3) {
      return { success: false, error: 'Nome do clube deve ter pelo menos 3 caracteres' };
    }

    try {
      const { data: newClub, error: createError } = await supabase
        .from('poker_clubs')
        .insert({
          name,
          owner_user_id: ownerUserId,
          description,
          profile_photo_url: profilePhotoUrl,
          banner_url: bannerUrl
        })
        .select('*')
        .single();

      if (createError || !newClub) {
        console.error('Failed to create club:', createError);
        return { success: false, error: 'Falha ao criar clube' };
      }

      const club: Club = {
        id: newClub.id,
        name: newClub.name,
        ownerUserId: newClub.owner_user_id,
        profilePhotoUrl: newClub.profile_photo_url,
        bannerUrl: newClub.banner_url,
        description: newClub.description,
        createdAt: new Date(newClub.created_at),
        updatedAt: new Date(newClub.updated_at)
      };

      return { success: true, club };
    } catch (error) {
      console.error('Error creating club:', error);
      return { success: false, error: 'Erro ao criar clube' };
    }
  },

  /**
   * Get clubs by owner user ID
   */
  getClubsByOwner: async (ownerUserId: string): Promise<Club[]> => {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('poker_clubs')
        .select('*')
        .eq('owner_user_id', ownerUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clubs:', error);
        return [];
      }

      return (data || []).map(club => ({
        id: club.id,
        name: club.name,
        ownerUserId: club.owner_user_id,
        profilePhotoUrl: club.profile_photo_url,
        bannerUrl: club.banner_url,
        description: club.description,
        createdAt: new Date(club.created_at),
        updatedAt: new Date(club.updated_at)
      }));
    } catch (error) {
      console.error('Error loading clubs:', error);
      return [];
    }
  },

  /**
   * Search clubs by name
   */
  searchClubs: async (searchTerm: string): Promise<Club[]> => {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('poker_clubs')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error searching clubs:', error);
        return [];
      }

      return (data || []).map(club => ({
        id: club.id,
        name: club.name,
        ownerUserId: club.owner_user_id,
        profilePhotoUrl: club.profile_photo_url,
        bannerUrl: club.banner_url,
        description: club.description,
        createdAt: new Date(club.created_at),
        updatedAt: new Date(club.updated_at)
      }));
    } catch (error) {
      console.error('Error searching clubs:', error);
      return [];
    }
  },

  /**
   * Get a single club by ID
   */
  getClubById: async (clubId: string): Promise<Club | null> => {
    if (!isSupabaseConfigured() || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('poker_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        ownerUserId: data.owner_user_id,
        profilePhotoUrl: data.profile_photo_url,
        bannerUrl: data.banner_url,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error fetching club:', error);
      return null;
    }
  },

  /**
   * Update club information
   */
  updateClub: async (
    clubId: string,
    updates: Partial<Pick<Club, 'name' | 'description' | 'profilePhotoUrl' | 'bannerUrl'>>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado' 
      };
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.profilePhotoUrl !== undefined) updateData.profile_photo_url = updates.profilePhotoUrl;
      if (updates.bannerUrl !== undefined) updateData.banner_url = updates.bannerUrl;

      const { error } = await supabase
        .from('poker_clubs')
        .update(updateData)
        .eq('id', clubId);

      if (error) {
        console.error('Failed to update club:', error);
        return { success: false, error: 'Falha ao atualizar clube' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating club:', error);
      return { success: false, error: 'Erro ao atualizar clube' };
    }
  },

  /**
   * Delete a club
   */
  deleteClub: async (clubId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado' 
      };
    }

    try {
      const { error } = await supabase
        .from('poker_clubs')
        .delete()
        .eq('id', clubId);

      if (error) {
        console.error('Failed to delete club:', error);
        return { success: false, error: 'Falha ao deletar clube' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting club:', error);
      return { success: false, error: 'Erro ao deletar clube' };
    }
  },

  /**
   * Create a manager for a club
   */
  createManager: async (
    clubId: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; manager?: ClubManager }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado' 
      };
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

      // Check if username already exists for this club
      const { data: existingManager } = await supabase
        .from('poker_club_managers')
        .select('id')
        .eq('club_id', clubId)
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existingManager) {
        return { success: false, error: 'Nome de usuário já existe neste clube' };
      }

      // Create manager
      const { data: newManager, error: createError } = await supabase
        .from('poker_club_managers')
        .insert({
          club_id: clubId,
          username: username.toLowerCase(),
          password_hash: passwordHash
        })
        .select('id, club_id, username, created_at')
        .single();

      if (createError || !newManager) {
        console.error('Failed to create manager:', createError);
        return { success: false, error: 'Falha ao criar gerente' };
      }

      const manager: ClubManager = {
        id: newManager.id,
        clubId: newManager.club_id,
        username: newManager.username,
        createdAt: new Date(newManager.created_at)
      };

      return { success: true, manager };
    } catch (error) {
      console.error('Error creating manager:', error);
      return { success: false, error: 'Erro ao criar gerente' };
    }
  },

  /**
   * Login as a club manager
   */
  managerLogin: async (
    clubId: string,
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string; session?: ClubManagerSession }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado' 
      };
    }

    if (!username || !password) {
      return { success: false, error: 'Nome de usuário e senha são obrigatórios' };
    }

    try {
      // Hash the password
      const passwordHash = await hashPassword(password);

      // Find manager
      const { data: manager, error: managerError } = await supabase
        .from('poker_club_managers')
        .select('id, club_id, username, created_at')
        .eq('club_id', clubId)
        .eq('username', username.toLowerCase())
        .eq('password_hash', passwordHash)
        .single();

      if (managerError || !manager) {
        return { success: false, error: 'Nome de usuário ou senha inválidos' };
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error: sessionError } = await supabase
        .from('poker_club_manager_sessions')
        .insert({
          manager_id: manager.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (sessionError) {
        console.error('Failed to create manager session:', sessionError);
        return { success: false, error: 'Falha ao criar sessão' };
      }

      // Log the login attempt
      try {
        await supabase
          .from('poker_club_manager_login_logs')
          .insert({
            manager_id: manager.id,
            club_id: manager.club_id,
            login_time: new Date().toISOString()
            // Note: IP address and user agent would require server-side implementation
            // or could be added from client if acceptable
          });
      } catch (logError) {
        // Don't fail login if logging fails
        console.warn('Failed to log manager login:', logError);
      }

      const managerObj: ClubManager = {
        id: manager.id,
        clubId: manager.club_id,
        username: manager.username,
        createdAt: new Date(manager.created_at)
      };

      const session: ClubManagerSession = {
        manager: managerObj,
        clubId: manager.club_id,
        token: sessionToken,
        expiresAt
      };

      // Save session to localStorage
      localStorage.setItem(MANAGER_SESSION_TOKEN_KEY, sessionToken);
      localStorage.setItem(MANAGER_SESSION_DATA_KEY, JSON.stringify(session));

      return { success: true, session };
    } catch (error) {
      console.error('Manager login error:', error);
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  /**
   * Get current manager session
   */
  getCurrentManagerSession: async (): Promise<ClubManagerSession | null> => {
    const token = localStorage.getItem(MANAGER_SESSION_TOKEN_KEY);
    const sessionJson = localStorage.getItem(MANAGER_SESSION_DATA_KEY);

    if (!token || !sessionJson) {
      return null;
    }

    if (!isSupabaseConfigured() || !supabase) {
      localStorage.removeItem(MANAGER_SESSION_TOKEN_KEY);
      localStorage.removeItem(MANAGER_SESSION_DATA_KEY);
      return null;
    }

    try {
      const session = JSON.parse(sessionJson) as ClubManagerSession;

      // Validate session in database
      const { data, error } = await supabase
        .from('poker_club_manager_sessions')
        .select('expires_at')
        .eq('session_token', token)
        .eq('manager_id', session.manager.id)
        .maybeSingle();

      if (error || !data) {
        await clubService.managerLogout();
        return null;
      }

      const expiresAt = new Date(data.expires_at);
      if (expiresAt <= new Date()) {
        await clubService.managerLogout();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to validate manager session:', error);
      await clubService.managerLogout();
      return null;
    }
  },

  /**
   * Logout manager
   */
  managerLogout: async (): Promise<void> => {
    const token = localStorage.getItem(MANAGER_SESSION_TOKEN_KEY);

    if (token && isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('poker_club_manager_sessions')
          .delete()
          .eq('session_token', token);
      } catch (error) {
        console.error('Failed to delete manager session:', error);
      }
    }

    localStorage.removeItem(MANAGER_SESSION_TOKEN_KEY);
    localStorage.removeItem(MANAGER_SESSION_DATA_KEY);
  },

  /**
   * Get managers for a club
   */
  getClubManagers: async (clubId: string): Promise<ClubManager[]> => {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('poker_club_managers')
        .select('id, club_id, username, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching managers:', error);
        return [];
      }

      return (data || []).map(manager => ({
        id: manager.id,
        clubId: manager.club_id,
        username: manager.username,
        createdAt: new Date(manager.created_at)
      }));
    } catch (error) {
      console.error('Error loading managers:', error);
      return [];
    }
  },

  /**
   * Delete a manager
   */
  deleteManager: async (managerId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) {
      return { 
        success: false, 
        error: 'Sistema não está configurado' 
      };
    }

    try {
      const { error } = await supabase
        .from('poker_club_managers')
        .delete()
        .eq('id', managerId);

      if (error) {
        console.error('Failed to delete manager:', error);
        return { success: false, error: 'Falha ao deletar gerente' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting manager:', error);
      return { success: false, error: 'Erro ao deletar gerente' };
    }
  },

  /**
   * Get manager login logs for a club
   */
  getManagerLoginLogs: async (clubId: string, limit: number = 50): Promise<ClubManagerLoginLog[]> => {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('poker_club_manager_login_logs')
        .select(`
          id,
          manager_id,
          club_id,
          login_time,
          ip_address,
          user_agent
        `)
        .eq('club_id', clubId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching manager login logs:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        managerId: log.manager_id,
        clubId: log.club_id,
        loginTime: new Date(log.login_time),
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    } catch (error) {
      console.error('Error loading manager login logs:', error);
      return [];
    }
  },

  /**
   * Get login logs for a specific manager
   */
  getManagerLoginLogsByManager: async (managerId: string, limit: number = 50): Promise<ClubManagerLoginLog[]> => {
    if (!isSupabaseConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('poker_club_manager_login_logs')
        .select(`
          id,
          manager_id,
          club_id,
          login_time,
          ip_address,
          user_agent
        `)
        .eq('manager_id', managerId)
        .order('login_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching manager login logs:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        managerId: log.manager_id,
        clubId: log.club_id,
        loginTime: new Date(log.login_time),
        ipAddress: log.ip_address,
        userAgent: log.user_agent
      }));
    } catch (error) {
      console.error('Error loading manager login logs:', error);
      return [];
    }
  }
};
