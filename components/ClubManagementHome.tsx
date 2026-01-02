import React, { useState } from 'react';
import { Club } from '../types';
import { clubService } from '../services/clubService';
import { authService } from '../services/authService';
import { useNotification } from '../contexts/NotificationContext';

interface ClubManagementHomeProps {
  clubs: Club[];
  currentUserId: string;
  onClubSelect: (club: Club) => void;
  onClubCreated: (club: Club) => void;
  onClubDeleted?: (clubId: string) => void;
  onLogout: () => void;
}

const ClubManagementHome: React.FC<ClubManagementHomeProps> = ({ 
  clubs, 
  currentUserId, 
  onClubSelect, 
  onClubCreated,
  onClubDeleted,
  onLogout 
}) => {
  const { showNotification, showConfirm } = useNotification();
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  // Filter clubs owned by current user
  const myClubs = clubs.filter(club => club.ownerUserId === currentUserId);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = newClubName.trim();
    if (!trimmedName || trimmedName.length < 3) {
      alert('Nome do clube deve ter pelo menos 3 caracteres');
      return;
    }

    setIsCreatingClub(true);
    
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        alert('Você precisa estar logado para criar um clube');
        return;
      }

      const result = await clubService.createClub(
        trimmedName,
        session.user.id,
        newClubDescription.trim() || undefined
      );

      if (result.success && result.club) {
        onClubCreated(result.club);
        setNewClubName('');
        setNewClubDescription('');
        setShowCreateClub(false);
        showNotification('Clube criado com sucesso!', 'success');
      } else {
        showNotification(result.error || 'Erro ao criar clube', 'error');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      showNotification('Erro ao criar clube. Tente novamente.', 'error');
    } finally {
      setIsCreatingClub(false);
    }
  };

  const handleDeleteClub = async (club: Club, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent club selection when clicking delete
    
    const confirmed = await showConfirm({
      title: 'Excluir Clube',
      message: `Tem certeza que deseja excluir o clube "${club.name}"? Todos os torneios e dados associados serão permanentemente removidos. Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const result = await clubService.deleteClub(club.id);
      
      if (result.success) {
        showNotification('Clube excluído com sucesso!', 'success');
        if (onClubDeleted) {
          onClubDeleted(club.id);
        }
      } else {
        showNotification(result.error || 'Erro ao excluir clube', 'error');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      showNotification('Erro ao excluir clube. Tente novamente.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-white/5 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center font-black text-black text-xl">
              D
            </div>
            <div>
              <h1 className="text-2xl font-outfit font-black text-white italic tracking-tight uppercase">
                Gerenciamento de Clubes
              </h1>
              <p className="text-white/40 text-xs">Selecione um clube para começar</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-6 py-2 rounded-xl bg-white/5 hover:bg-red-600/20 text-white/40 hover:text-red-500 text-[10px] font-black uppercase transition-all tracking-widest"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-10">
          {/* Header Section */}
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-outfit font-black text-white italic">Meus Clubes</h2>
              <p className="text-white/30 text-xs font-bold uppercase mt-2 tracking-widest">
                Selecione um clube para gerenciar torneios e mesas
              </p>
            </div>
            <button 
              onClick={() => setShowCreateClub(true)}
              className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all"
            >
              ➕ CRIAR NOVO CLUBE
            </button>
          </div>

          {/* Create Club Modal */}
          {showCreateClub && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="glass p-10 rounded-[40px] max-w-2xl w-full mx-4 border border-white/20">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-outfit font-black text-white italic">Criar Novo Clube</h3>
                    <p className="text-white/40 text-sm mt-2">Configure seu clube para organizar torneios</p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowCreateClub(false);
                      setNewClubName('');
                      setNewClubDescription('');
                    }}
                    className="text-white/40 hover:text-white text-2xl"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateClub} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2">
                      Nome do Clube *
                    </label>
                    <input
                      type="text"
                      value={newClubName}
                      onChange={(e) => setNewClubName(e.target.value)}
                      placeholder="Ex: Poker Club São Paulo"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-yellow-500 transition-all"
                      required
                      minLength={3}
                      disabled={isCreatingClub}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      value={newClubDescription}
                      onChange={(e) => setNewClubDescription(e.target.value)}
                      placeholder="Ex: Clube de poker profissional com torneios semanais"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-yellow-500 transition-all resize-none"
                      rows={3}
                      disabled={isCreatingClub}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateClub(false);
                        setNewClubName('');
                        setNewClubDescription('');
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black py-4 rounded-2xl text-xs uppercase transition-all"
                      disabled={isCreatingClub}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl text-xs uppercase shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCreatingClub}
                    >
                      {isCreatingClub ? 'CRIANDO...' : 'CRIAR CLUBE'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Clubs Grid */}
          {myClubs.length === 0 ? (
            <div className="glass p-12 rounded-[40px] text-center border border-white/10">
              <div className="text-6xl mb-4">🏛️</div>
              <h3 className="text-2xl font-black text-white mb-3">Nenhum clube criado ainda</h3>
              <p className="text-white/40 text-sm mb-6">
                Crie seu primeiro clube para organizar torneios de forma profissional
              </p>
              <button 
                onClick={() => setShowCreateClub(true)}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase shadow-lg transition-all"
              >
                CRIAR PRIMEIRO CLUBE
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => onClubSelect(club)}
                  className="glass rounded-[40px] border border-white/10 overflow-hidden hover:border-yellow-500/50 hover:bg-white/5 transition-all text-left group"
                >
                  {/* Club Banner/Header */}
                  {club.bannerUrl ? (
                    <div className="h-32 w-full overflow-hidden">
                      <img 
                        src={club.bannerUrl} 
                        alt={club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                      <span className="text-yellow-500/30 text-6xl font-black">
                        {club.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Club Content */}
                  <div className="p-8">
                    <div className="flex items-start gap-4 mb-4">
                      {club.profilePhotoUrl ? (
                        <img 
                          src={club.profilePhotoUrl} 
                          alt={club.name}
                          className="w-16 h-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-500 text-3xl font-black">
                            {club.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl font-black text-white truncate group-hover:text-yellow-500 transition-colors">
                          {club.name}
                        </h3>
                        <p className="text-white/40 text-xs">
                          Criado em {new Date(club.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {club.description && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">
                        {club.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-yellow-500 font-black text-xs uppercase tracking-widest group-hover:text-yellow-400 transition-colors">
                        Gerenciar →
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteClub(club, e)}
                          className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500 flex items-center justify-center transition-colors group/delete"
                          title="Excluir clube"
                        >
                          <span className="text-red-500 group-hover/delete:text-white font-black">🗑️</span>
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                          <span className="text-yellow-500 group-hover:text-black font-black">▶</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Help Section */}
          <div className="glass p-8 rounded-[40px] border border-white/10">
            <h3 className="text-white font-black text-xl mb-4">💡 Como usar o sistema de clubes</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl">1️⃣</span>
                  <p className="text-white/70">
                    <strong className="text-white">Crie um clube</strong> para organizar seus torneios de forma profissional
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl">2️⃣</span>
                  <p className="text-white/70">
                    <strong className="text-white">Clique no clube</strong> para acessar o painel de gerenciamento
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl">3️⃣</span>
                  <p className="text-white/70">
                    <strong className="text-white">Gerencie torneios</strong>, mesas, jogadores e adicione gerentes
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-yellow-500 text-xl">4️⃣</span>
                  <p className="text-white/70">
                    <strong className="text-white">Jogadores acessam</strong> através da seleção de clubes na tela inicial
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClubManagementHome;
