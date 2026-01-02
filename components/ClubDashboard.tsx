import React, { useState, useEffect } from 'react';
import { Club, GameState, ActionMessage, ClubManager, ClubManagerLoginLog } from '../types';
import DealerControls from './DealerControls';
import { clubService } from '../services/clubService';

interface ClubDashboardProps {
  club: Club;
  state: GameState;
  onDispatch: (action: ActionMessage) => void;
  isManager?: boolean;
  onBack: () => void;
  onLogout: () => void;
}

const ClubDashboard: React.FC<ClubDashboardProps> = ({ 
  club, 
  state, 
  onDispatch, 
  isManager = false,
  onBack,
  onLogout 
}) => {
  const [showManagersTab, setShowManagersTab] = useState(false);
  const [clubManagers, setClubManagers] = useState<ClubManager[]>([]);
  const [clubManagersLoading, setClubManagersLoading] = useState(false);
  const [managerLoginLogs, setManagerLoginLogs] = useState<ClubManagerLoginLog[]>([]);
  const [showCreateManager, setShowCreateManager] = useState(false);
  const [newManagerUsername, setNewManagerUsername] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [showManagerLogs, setShowManagerLogs] = useState(false);

  // Load managers when component mounts or managers tab is opened
  useEffect(() => {
    if (showManagersTab && clubManagers.length === 0 && !clubManagersLoading) {
      loadClubManagers();
    }
  }, [showManagersTab]);

  const loadClubManagers = async () => {
    setClubManagersLoading(true);
    try {
      const managers = await clubService.getClubManagers(club.id);
      setClubManagers(managers);
    } catch (error) {
      console.error('Error loading managers:', error);
    } finally {
      setClubManagersLoading(false);
    }
  };

  const loadManagerLoginLogs = async () => {
    try {
      const logs = await clubService.getManagerLoginLogs(club.id, 50);
      setManagerLoginLogs(logs);
    } catch (error) {
      console.error('Error loading login logs:', error);
    }
  };

  const closeCreateManagerModal = () => {
    setShowCreateManager(false);
    setNewManagerUsername('');
    setNewManagerPassword('');
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUsername = newManagerUsername.trim();
    const trimmedPassword = newManagerPassword.trim();
    
    if (!trimmedUsername || trimmedUsername.length < 3) {
      alert('Nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      alert('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsCreatingManager(true);
    
    try {
      const result = await clubService.createManager(club.id, trimmedUsername, trimmedPassword);

      if (result.success && result.manager) {
        alert('Gerente criado com sucesso!');
        closeCreateManagerModal();
        loadClubManagers();
      } else {
        alert(result.error || 'Erro ao criar gerente');
      }
    } catch (error) {
      console.error('Error creating manager:', error);
      alert('Erro ao criar gerente. Tente novamente.');
    } finally {
      setIsCreatingManager(false);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este gerente?')) {
      return;
    }

    try {
      const result = await clubService.deleteManager(managerId);
      
      if (result.success) {
        alert('Gerente excluído com sucesso!');
        loadClubManagers();
      } else {
        alert(result.error || 'Erro ao excluir gerente');
      }
    } catch (error) {
      console.error('Error deleting manager:', error);
      alert('Erro ao excluir gerente. Tente novamente.');
    }
  };

  // Calculate club stats
  const clubTournaments = state.tournaments.filter(t => t.clubId === club.id);
  const clubTables = new Set(clubTournaments.flatMap(t => t.assignedTableIds));
  const clubPlayers = state.players.filter(p => clubTournaments.some(t => t.id === p.tournamentId));

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header with Club Info */}
      <div className="border-b border-white/5 bg-black">
        <div className="px-6 py-4">
          {/* Top Row: Back button, Club info, Logout */}
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={onBack}
              className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest"
            >
              ← VOLTAR
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-white/40 hover:text-red-500 text-[10px] font-black uppercase transition-all tracking-widest"
            >
              LOGOUT
            </button>
          </div>

          {/* Club Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {club.profilePhotoUrl ? (
                <img 
                  src={club.profilePhotoUrl} 
                  alt={club.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-500 text-3xl font-black">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-outfit font-black text-white italic tracking-tight">
                  {club.name}
                </h1>
                <p className="text-white/40 text-xs">
                  {club.description || 'Gerenciamento de Clube'}
                  {isManager && <span className="ml-2 text-yellow-500/60">(Modo Gerente)</span>}
                </p>
              </div>
            </div>

            {/* Club Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-500">{clubTournaments.length}</div>
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Torneios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-blue-500">{clubTables.size}</div>
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Mesas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-500">{clubPlayers.length}</div>
                <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">Jogadores</div>
              </div>
            </div>
          </div>

          {/* Managers Tab Toggle (only for owners) */}
          {!isManager && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowManagersTab(false)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${
                  !showManagersTab 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                CONFIGURAÇÕES DO CLUBE
              </button>
              <button
                onClick={() => setShowManagersTab(true)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${
                  showManagersTab 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                👥 GERENTES
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {showManagersTab && !isManager ? (
          // Managers Management View
          <div className="h-full overflow-y-auto p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-outfit font-black text-white italic">Gerentes do Clube</h2>
                <p className="text-white/40 text-sm mt-2">
                  Gerentes podem criar e gerenciar torneios, mas não podem alterar configurações do clube
                </p>
              </div>
              <button
                onClick={() => setShowCreateManager(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all"
              >
                ➕ CRIAR GERENTE
              </button>
            </div>

            {/* Create Manager Modal */}
            {showCreateManager && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="glass p-10 rounded-[40px] max-w-md w-full mx-4 border border-white/20">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-outfit font-black text-white italic">Criar Gerente</h3>
                      <p className="text-white/40 text-sm mt-1">Para o clube: {club.name}</p>
                    </div>
                    <button 
                      onClick={closeCreateManagerModal}
                      className="text-white/40 hover:text-white text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleCreateManager} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2">
                        Nome de Usuário *
                      </label>
                      <input
                        type="text"
                        value={newManagerUsername}
                        onChange={(e) => setNewManagerUsername(e.target.value)}
                        placeholder="Ex: joao_admin"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all"
                        required
                        minLength={3}
                        disabled={isCreatingManager}
                      />
                      <p className="text-white/40 text-xs px-2">Mínimo 3 caracteres</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2">
                        Senha *
                      </label>
                      <input
                        type="password"
                        value={newManagerPassword}
                        onChange={(e) => setNewManagerPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-blue-500 transition-all"
                        required
                        minLength={6}
                        disabled={isCreatingManager}
                      />
                      <p className="text-white/40 text-xs px-2">Mínimo 6 caracteres</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={closeCreateManagerModal}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black py-4 rounded-2xl text-xs uppercase transition-all"
                        disabled={isCreatingManager}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs uppercase shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isCreatingManager}
                      >
                        {isCreatingManager ? 'CRIANDO...' : 'CRIAR GERENTE'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Managers List */}
            {clubManagersLoading && (
              <div className="glass rounded-2xl p-6 text-center">
                <div className="animate-pulse">
                  <div className="text-white/60 text-sm">Carregando gerentes...</div>
                </div>
              </div>
            )}
            
            {!clubManagersLoading && clubManagers.length === 0 && (
              <div className="glass rounded-2xl p-12 text-center border border-white/10">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-white/40 text-sm">
                  Nenhum gerente criado ainda. Crie o primeiro gerente para delegar o gerenciamento de torneios.
                </p>
              </div>
            )}

            {!clubManagersLoading && clubManagers.length > 0 && (
              <div className="space-y-4">
                {clubManagers.map((manager) => (
                  <div key={manager.id} className="glass rounded-2xl p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-500 text-2xl font-black">
                          {manager.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-black text-lg">{manager.username}</p>
                        <p className="text-white/40 text-xs">
                          Criado em {new Date(manager.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteManager(manager.id)}
                      className="p-3 rounded-xl text-white/20 hover:bg-red-600/20 hover:text-red-500 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manager Login Logs Section */}
            {clubManagers.length > 0 && (
              <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-lg">Logs de Acesso</h3>
                  <button
                    onClick={() => {
                      setShowManagerLogs(!showManagerLogs);
                      if (!showManagerLogs && managerLoginLogs.length === 0) {
                        loadManagerLoginLogs();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black uppercase transition-all"
                  >
                    {showManagerLogs ? 'OCULTAR' : 'MOSTRAR'}
                  </button>
                </div>
                
                {showManagerLogs && (
                  <div className="space-y-2 mt-4">
                    {managerLoginLogs.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">Nenhum log disponível</p>
                    ) : (
                      managerLoginLogs.map((log) => {
                        const manager = clubManagers.find(m => m.id === log.managerId);
                        return (
                          <div key={log.id} className="bg-white/5 rounded-xl p-3 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-blue-500 font-bold">{manager?.username || 'Unknown'}</span>
                              <span className="text-white/40">•</span>
                              <span className="text-white/60">
                                {new Date(log.loginTime).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            {log.ipAddress && (
                              <span className="text-white/30 text-xs font-mono">{log.ipAddress}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Regular Club Management (DealerControls)
          <DealerControls 
            state={state} 
            onDispatch={onDispatch} 
            isManager={isManager}
            hideClubsTab={true}
          />
        )}
      </div>
    </div>
  );
};

export default ClubDashboard;
