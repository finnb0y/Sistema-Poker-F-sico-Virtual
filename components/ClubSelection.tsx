import React, { useState, useEffect } from 'react';
import { Club } from '../types';
import { clubService } from '../services/clubService';
import { useNotification } from '../contexts/NotificationContext';

interface ClubSelectionProps {
  userId: string;
  onClubSelect: (club: Club) => void;
  onBack: () => void;
}

const ClubSelection: React.FC<ClubSelectionProps> = ({ userId, onClubSelect, onBack }) => {
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadMyClubs();
  }, [userId]);

  const loadMyClubs = async () => {
    // Skip loading "my clubs" for guest users (not authenticated)
    // Guest users can only search for clubs, not create or own them
    if (userId === 'guest') {
      setMyClubs([]);
      return;
    }
    
    const clubs = await clubService.getClubsByOwner(userId);
    setMyClubs(clubs);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = await clubService.searchClubs(term);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClubName.trim()) {
      showNotification('Nome do clube é obrigatório', 'warning');
      return;
    }

    setIsCreating(true);
    const result = await clubService.createClub(
      newClubName.trim(),
      userId,
      newClubDescription.trim() || undefined
    );

    if (result.success && result.club) {
      setMyClubs([result.club, ...myClubs]);
      setShowCreateForm(false);
      setNewClubName('');
      setNewClubDescription('');
      showNotification('Clube criado com sucesso!', 'success');
    } else {
      showNotification(result.error || 'Erro ao criar clube', 'error');
    }
    setIsCreating(false);
  };

  const displayedClubs = searchTerm.length >= 2 ? searchResults : myClubs;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
      <div className="w-full max-w-2xl glass p-10 rounded-[40px] shadow-2xl border-white/20 border">
        <button 
          onClick={onBack}
          className="mb-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest"
        >
          ← VOLTAR
        </button>

        <div className="text-center mb-8">
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">
            POKER<span className="text-yellow-500"> 2</span>
          </h1>
          <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">
            Gerenciador de Fichas & Suite Profissional
          </p>
          <p className="text-white/60 text-sm">Selecione um Clube</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar clubes..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
          />
          {isSearching && (
            <p className="text-white/40 text-xs mt-2">Buscando...</p>
          )}
        </div>

        {/* Create Club Button - Only for authenticated users */}
        {!showCreateForm && searchTerm.length < 2 && userId !== 'guest' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full mb-6 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 font-black py-3 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
          >
            + Criar Novo Clube
          </button>
        )}

        {/* Create Club Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateClub} className="mb-6 p-6 bg-black/40 rounded-2xl border border-white/10">
            <h3 className="text-white font-black text-lg mb-4">Criar Novo Clube</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                placeholder="Nome do Clube"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none transition-all focus:border-yellow-500/50"
                maxLength={50}
              />
              <textarea
                value={newClubDescription}
                onChange={(e) => setNewClubDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none transition-all focus:border-yellow-500/50 resize-none"
                rows={3}
                maxLength={200}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50"
                >
                  {isCreating ? 'CRIANDO...' : 'CRIAR'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewClubName('');
                    setNewClubDescription('');
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black py-3 rounded-xl transition-all"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Clubs List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {displayedClubs.length === 0 && searchTerm.length >= 2 && !isSearching && (
            <div className="text-center py-8">
              <p className="text-white/40 text-sm">Nenhum clube encontrado</p>
            </div>
          )}
          
          {displayedClubs.length === 0 && searchTerm.length < 2 && (
            <div className="text-center py-8">
              {userId === 'guest' ? (
                <>
                  <p className="text-white/40 text-sm">Busque por um clube usando a barra de pesquisa</p>
                  <p className="text-white/30 text-xs mt-2">Digite pelo menos 2 caracteres para começar</p>
                </>
              ) : (
                <>
                  <p className="text-white/40 text-sm">Você ainda não tem clubes</p>
                  <p className="text-white/30 text-xs mt-2">Crie um clube para começar</p>
                </>
              )}
            </div>
          )}

          {displayedClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onClubSelect(club)}
              className="w-full p-4 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-yellow-500/30 rounded-2xl transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-500 text-2xl font-black">
                    {club.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-black group-hover:text-yellow-500 transition-colors">
                    {club.name}
                  </h3>
                  {club.description && (
                    <p className="text-white/40 text-xs mt-1 line-clamp-1">
                      {club.description}
                    </p>
                  )}
                </div>
                <div className="text-white/30 group-hover:text-yellow-500 transition-colors">
                  →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClubSelection;
