import React, { useState, useEffect } from 'react';
import { GameState, ActionMessage, TournamentConfig, Player, RegisteredPerson, Tournament, RoomTable, BlindInterval, BlindLevel, Club, ClubManager, ClubManagerLoginLog } from '../types';
import TableView from './TableView';
import BlindStructureManager from './BlindStructureManager';
// TODO: TournamentBlindTimer is ready for integration but requires careful JSX structure modification
// The component is imported and ready to display the automatic blind timer when a tournament is started
// To integrate: Add <TournamentBlindTimer tournament={currentTourney} state={state} onDispatch={onDispatch} />
// in the active tournament section (around line 465-475) where tournament details are shown
import TournamentBlindTimer from './TournamentBlindTimer';
import { createDefaultBlindStructure } from '../utils/blindStructure';
import { handleNumericInput, DEFAULT_BREAK_DURATION } from '../utils/inputHelpers';
import { clubService } from '../services/clubService';
import { authService } from '../services/authService';

interface DealerControlsProps {
  state: GameState;
  onDispatch: (action: ActionMessage) => void;
  isManager?: boolean;
}

const ToggleSlider: React.FC<{ checked: boolean, onChange: (val: boolean) => void, colorClass?: string }> = ({ checked, onChange, colorClass = 'bg-yellow-500' }) => (
  <button 
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-14 h-7 rounded-full relative transition-all duration-300 border border-white/10 ${checked ? colorClass : 'bg-white/5'}`}
  >
    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${checked ? 'left-8' : 'left-1'}`} />
  </button>
);

const DealerControls: React.FC<DealerControlsProps> = ({ state, onDispatch, isManager = false }) => {
  // Default to 'clubes' tab for admins, 'torneios' for managers
  const [activeTab, setActiveTab] = useState<'torneios' | 'salao' | 'registry' | 'tv' | 'clubes'>(isManager ? 'torneios' : 'clubes');
  const [editingTourney, setEditingTourney] = useState<Partial<Tournament> | null>(null);
  const [activeTourneyId, setActiveTourneyId] = useState<string | null>(state.activeTournamentId);
  const [regName, setRegName] = useState('');
  const [regNick, setRegNick] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration "Cart" State
  const [registeringPerson, setRegisteringPerson] = useState<RegisteredPerson | null>(null);
  const [cartEntryType, setCartEntryType] = useState<'buyIn' | 'reentry'>('buyIn');
  const [cartRebuys, setCartRebuys] = useState(0);
  const [cartAddon, setCartAddon] = useState(false);
  
  // Table Details Modal State
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  
  // Blind Structure Manager State
  const [showBlindStructureManager, setShowBlindStructureManager] = useState(false);
  
  // Club Management State
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [editingClub, setEditingClub] = useState<Partial<Club> | null>(null);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  
  // Manager Management State
  const [clubManagers, setClubManagers] = useState<Record<string, ClubManager[]>>({});
  const [managerLoginLogs, setManagerLoginLogs] = useState<Record<string, ClubManagerLoginLog[]>>({});
  const [showCreateManager, setShowCreateManager] = useState<string | null>(null); // clubId
  const [newManagerUsername, setNewManagerUsername] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [showManagerLogs, setShowManagerLogs] = useState<string | null>(null); // clubId

  useEffect(() => {
    setActiveTourneyId(state.activeTournamentId);
  }, [state.activeTournamentId]);

  const currentTourney = state.tournaments.find(t => t.id === activeTourneyId);

  // Filter data by active club
  const activeClubId = state.activeClubId;
  const filteredTournaments = state.tournaments.filter(t => !activeClubId || t.clubId === activeClubId);
  const filteredRoomTables = state.roomTables.filter(rt => !activeClubId || rt.clubId === activeClubId);
  const filteredRegistry = state.registry.filter(r => !activeClubId || r.clubId === activeClubId);

  const handleRegisterPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName) return;
    // Capitalize first letter of name
    const capitalizedName = regName.charAt(0).toUpperCase() + regName.slice(1);
    onDispatch({ 
      type: 'REGISTER_PERSON', 
      payload: { 
        name: capitalizedName, 
        nickname: regNick,
        clubId: activeClubId || undefined
      }, 
      senderId: 'DIR' 
    });
    setRegName(''); setRegNick('');
  };

  const handleSaveTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTourney?.name || !editingTourney?.acronym) return;
    
    const action = editingTourney.id ? 'UPDATE_TOURNAMENT' : 'CREATE_TOURNAMENT';
    onDispatch({ 
      type: action as any, 
      payload: {
        ...editingTourney,
        acronym: editingTourney.acronym.substring(0, 3).toUpperCase()
      }, 
      senderId: 'DIR' 
    });
    setEditingTourney(null);
  };

  const startTourneyForm = (t?: Tournament) => {
    if (t) {
      setEditingTourney({ ...t });
    } else {
      const defaultStructure = createDefaultBlindStructure();
      setEditingTourney({
        name: '',
        acronym: '',
        guaranteed: 0,
        config: {
          buyIn: { enabled: true, price: 50, chips: 10000 },
          rebuy: { enabled: false, price: 50, chips: 10000, maxCount: 3, threshold: 10000 },
          reentry: { enabled: false, price: 50, chips: 10000 },
          addon: { enabled: false, active: false, price: 50, chips: 20000 },
          maxSeats: 9,
          blindStructure: {
            intervals: defaultStructure.intervals,
            levels: defaultStructure.levels,
            breakEnabled: false,
            breakDuration: DEFAULT_BREAK_DURATION,
            breakFrequency: 0
          }
        },
        assignedTableIds: []
      });
    }
  };

  // Fix: Added missing toggleTableSelection function to handle table allocation
  const toggleTableSelection = (tableId: number) => {
    if (!editingTourney) return;
    const currentIds = editingTourney.assignedTableIds || [];
    const newIds = currentIds.includes(tableId)
      ? currentIds.filter(id => id !== tableId)
      : [...currentIds, tableId];
    setEditingTourney({ ...editingTourney, assignedTableIds: newIds });
  };

  const finalizeRegistration = () => {
    if (!registeringPerson || !activeTourneyId) return;
    onDispatch({
      type: 'REGISTER_PLAYER_TO_TOURNAMENT',
      payload: {
        personId: registeringPerson.id,
        tournamentId: activeTourneyId,
        entryType: cartEntryType,
        rebuys: cartRebuys,
        addon: cartAddon
      },
      senderId: 'DIR'
    });
    setRegisteringPerson(null);
    setCartRebuys(0);
    setCartAddon(false);
  };

  const handleSaveBlindStructure = (
    intervals: BlindInterval[], 
    levels: BlindLevel[], 
    breakEnabled: boolean, 
    breakDuration: number, 
    breakFrequency: number
  ) => {
    if (editingTourney) {
      setEditingTourney({
        ...editingTourney,
        config: {
          ...editingTourney.config!,
          blindStructure: {
            intervals,
            levels,
            breakEnabled,
            breakDuration,
            breakFrequency
          }
        }
      });
    }
    setShowBlindStructureManager(false);
  };

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
        // Dispatch action to add club to local state
        onDispatch({
          type: 'CREATE_CLUB',
          payload: {
            id: result.club.id,
            name: result.club.name,
            ownerUserId: result.club.ownerUserId,
            profilePhotoUrl: result.club.profilePhotoUrl,
            bannerUrl: result.club.bannerUrl,
            description: result.club.description,
            createdAt: result.club.createdAt.toISOString(),
            updatedAt: result.club.updatedAt.toISOString()
          },
          senderId: 'DIR'
        });
        
        setNewClubName('');
        setNewClubDescription('');
        setShowCreateClub(false);
        alert('Clube criado com sucesso!');
      } else {
        alert(result.error || 'Erro ao criar clube');
      }
    } catch (error) {
      console.error('Error creating club:', error);
      alert('Erro ao criar clube. Tente novamente.');
    } finally {
      setIsCreatingClub(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Tem certeza que deseja excluir este clube? Todos os torneios associados também serão removidos.')) {
      return;
    }

    try {
      const result = await clubService.deleteClub(clubId);
      
      if (result.success) {
        onDispatch({
          type: 'DELETE_CLUB',
          payload: { id: clubId },
          senderId: 'DIR'
        });
        alert('Clube excluído com sucesso!');
      } else {
        alert(result.error || 'Erro ao excluir clube');
      }
    } catch (error) {
      console.error('Error deleting club:', error);
      alert('Erro ao excluir clube. Tente novamente.');
    }
  };

  // Load managers for a club
  const loadClubManagers = async (clubId: string) => {
    try {
      const managers = await clubService.getClubManagers(clubId);
      setClubManagers(prev => ({ ...prev, [clubId]: managers }));
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  // Load manager login logs for a club
  const loadManagerLoginLogs = async (clubId: string) => {
    try {
      const logs = await clubService.getManagerLoginLogs(clubId, 50);
      setManagerLoginLogs(prev => ({ ...prev, [clubId]: logs }));
    } catch (error) {
      console.error('Error loading login logs:', error);
    }
  };

  // Create a new manager
  const handleCreateManager = async (e: React.FormEvent, clubId: string) => {
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
      const result = await clubService.createManager(clubId, trimmedUsername, trimmedPassword);

      if (result.success && result.manager) {
        alert('Gerente criado com sucesso!');
        setNewManagerUsername('');
        setNewManagerPassword('');
        setShowCreateManager(null);
        
        // Reload managers list
        loadClubManagers(clubId);
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

  // Delete a manager
  const handleDeleteManager = async (managerId: string, clubId: string) => {
    if (!confirm('Tem certeza que deseja excluir este gerente?')) {
      return;
    }

    try {
      const result = await clubService.deleteManager(managerId);
      
      if (result.success) {
        alert('Gerente excluído com sucesso!');
        // Reload managers list
        loadClubManagers(clubId);
      } else {
        alert(result.error || 'Erro ao excluir gerente');
      }
    } catch (error) {
      console.error('Error deleting manager:', error);
      alert('Erro ao excluir gerente. Tente novamente.');
    }
  };

  // Handle starting a tournament
  const handleStartTournament = (tournamentId: string) => {
    if (!confirm('Tem certeza que deseja iniciar este torneio? Os blinds começarão a contar automaticamente.')) {
      return;
    }

    onDispatch({
      type: 'START_TOURNAMENT',
      payload: { tournamentId },
      senderId: 'DIR'
    });
  };

  // Handle stopping a tournament
  const handleStopTournament = (tournamentId: string) => {
    if (!confirm('Tem certeza que deseja pausar este torneio?')) {
      return;
    }

    onDispatch({
      type: 'STOP_TOURNAMENT',
      payload: { tournamentId },
      senderId: 'DIR'
    });
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Primary Sidebar */}
      <div className="lg:w-72 bg-black flex flex-col border-r border-white/5">
        <div className="flex flex-col p-4 gap-2">
           {[
             { id: 'torneios', label: 'Torneios', icon: '🏆' },
             { id: 'salao', label: 'Salão (Mesas)', icon: '🏢' },
             { id: 'registry', label: 'Jogadores', icon: '👤' },
             { id: 'tv', label: 'Modo TV', icon: '📡' },
             // Only show Clubes tab for owners, not for managers
             ...(!isManager ? [{ id: 'clubes', label: 'Clubes', icon: '🏛️' }] : [])
           ].map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-yellow-500 text-black font-black' : 'text-white/40 hover:text-white'}`}>
               <span className="text-xl">{tab.icon}</span>
               <span className="text-xs uppercase tracking-widest">{tab.label}</span>
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#080808]">
        
        {/* TOURNAMENTS TAB */}
        {activeTab === 'torneios' && (
          <div className="p-10 space-y-10 animate-in fade-in">
             {!editingTourney ? (
               <>
                 <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-4xl font-outfit font-black text-white italic">Gestão de Torneios</h2>
                      <p className="text-white/30 text-xs font-bold uppercase mt-2 tracking-widest">Controle seus eventos ativos</p>
                    </div>
                    <button onClick={() => startTourneyForm()} className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all">CRIAR NOVO EVENTO</button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredTournaments.map(t => (
                      <div key={t.id} className={`p-8 rounded-[40px] glass border-2 transition-all ${activeTourneyId === t.id ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/5'}`}>
                         <div className="flex justify-between items-start mb-6">
                            <div>
                               <div className="flex items-center gap-3 flex-wrap">
                                 <h3 className="text-2xl font-black text-white">{t.name}</h3>
                                 <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-lg font-black text-xs">{t.acronym}</span>
                                 {t.isStarted && (
                                   <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-lg font-black text-xs animate-pulse" title="Torneio em andamento">
                                     ▶ Em Andamento
                                   </span>
                                 )}
                                 {!t.clubId && (
                                   <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-lg font-black text-xs" title="Este torneio não está associado a nenhum clube">
                                     ⚠️ Sem clube
                                   </span>
                                 )}
                                 {t.clubId && state.clubs.find(c => c.id === t.clubId) && (
                                   <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg font-black text-xs" title={`Clube: ${state.clubs.find(c => c.id === t.clubId)?.name}`}>
                                     🏛️ {state.clubs.find(c => c.id === t.clubId)?.name}
                                   </span>
                                 )}
                               </div>
                               <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">
                                 {t.guaranteed ? `Garantido: $${t.guaranteed.toLocaleString()}` : 'Sem Garantido'} • {t.assignedTableIds.length} Mesas
                               </p>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => { setActiveTourneyId(t.id); onDispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: { id: t.id }, senderId: 'DIR' }); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTourneyId === t.id ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}>Selecionar</button>
                               <button onClick={() => startTourneyForm(t)} className="p-2 text-white/40 hover:text-white">✏️</button>
                               <button onClick={() => onDispatch({ type: 'DELETE_TOURNAMENT', payload: { id: t.id }, senderId: 'DIR' })} className="p-2 text-white/10 hover:text-red-500">🗑️</button>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-2 mb-4">
                            {t.config.buyIn.enabled && <span className="text-[8px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black uppercase">Buy-in OK</span>}
                            {t.config.reentry.enabled && <span className="text-[8px] bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full font-black uppercase">Re-entry OK</span>}
                            {t.config.rebuy.enabled && <span className="text-[8px] bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-black uppercase">Rebuy OK</span>}
                            {t.config.addon.enabled && <span className="text-[8px] bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full font-black uppercase">Add-on OK</span>}
                         </div>
                         
                         <div className="mt-4">
                           {!t.isStarted ? (
                             <button 
                               onClick={() => handleStartTournament(t.id)}
                               className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg transition-all"
                             >
                               ▶ Iniciar Torneio
                             </button>
                           ) : (
                             <button 
                               onClick={() => handleStopTournament(t.id)}
                               className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg transition-all"
                             >
                               ⏸ Pausar Torneio
                             </button>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>

                 {activeTourneyId && currentTourney && (
                   <div className="flex flex-col xl:flex-row gap-8">
                     <div className="flex-1 glass p-10 rounded-[50px] space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-2xl font-black text-white italic">Jogadores Disponíveis: {currentTourney.name}</h3>
                           <button onClick={() => onDispatch({ type: 'AUTO_BALANCE', payload: { tournamentId: activeTourneyId }, senderId: 'DIR' })} className="bg-white text-black font-black px-6 py-2 rounded-xl text-[10px] uppercase">Balancear Agora</button>
                        </div>
                        
                        <div className="space-y-4">
                           <input type="text" placeholder="Filtrar por nome ou apelido..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 outline-none focus:border-yellow-500 font-bold" />
                           <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
                              {filteredRegistry.filter(per => !state.players.find(p => p.personId === per.id && p.tournamentId === activeTourneyId)).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(person => (
                                <div key={person.id} className="p-4 bg-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                                   <div>
                                     <div className="font-bold text-white">{person.name}</div>
                                     <div className="text-[10px] text-yellow-500/60 font-black uppercase">{person.nickname || 'Sem Apelido'}</div>
                                   </div>
                                   <button onClick={() => setRegisteringPerson(person)} className="bg-yellow-600 hover:bg-yellow-500 text-white font-black px-6 py-3 rounded-xl text-[9px] uppercase shadow-lg transition-all">INSCREVER</button>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* Registration Cart / Side Menu */}
                     {registeringPerson && (
                       <div className="xl:w-[400px] glass p-10 rounded-[50px] space-y-8 animate-in slide-in-from-right-10 border-yellow-500/20 border">
                          <div className="flex justify-between items-start">
                             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Checkout Inscrição</h3>
                             <button onClick={() => setRegisteringPerson(null)} className="text-white/20 hover:text-white">✕</button>
                          </div>
                          <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                             <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Jogador</div>
                             <div className="text-xl font-black text-white">{registeringPerson.name}</div>
                          </div>

                          <div className="space-y-6">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">Tipo de Entrada</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-2xl">
                                   <button onClick={() => setCartEntryType('buyIn')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${cartEntryType === 'buyIn' ? 'bg-white text-black' : 'text-white/30'}`}>Buy-in</button>
                                   <button onClick={() => setCartEntryType('reentry')} className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${cartEntryType === 'reentry' ? 'bg-white text-black' : 'text-white/30'}`}>Re-entry</button>
                                </div>
                             </div>

                             {currentTourney.config.rebuy.enabled && (
                               <div className="space-y-3">
                                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">Recompras Iniciais</label>
                                  <div className="flex items-center gap-4">
                                     <button onClick={() => setCartRebuys(Math.max(0, cartRebuys - 1))} className="w-10 h-10 rounded-xl bg-white/5 text-white font-black hover:bg-white/10 transition-all">-</button>
                                     <span className="flex-1 text-center text-2xl font-black text-white">{cartRebuys}</span>
                                     <button onClick={() => setCartRebuys(cartRebuys + 1)} className="w-10 h-10 rounded-xl bg-white/5 text-white font-black hover:bg-white/10 transition-all">+</button>
                                  </div>
                               </div>
                             )}

                             {currentTourney.config.addon.enabled && (
                               <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl">
                                  <span className="text-[10px] font-black text-white/60 uppercase">Add-on Inicial</span>
                                  <ToggleSlider checked={cartAddon} onChange={setCartAddon} colorClass="bg-purple-600" />
                               </div>
                             )}
                          </div>

                          <div className="pt-4 border-t border-white/5">
                             <button onClick={finalizeRegistration} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-3xl text-sm uppercase shadow-2xl transition-all tracking-widest">CONFIRMAR E PAGAR</button>
                          </div>
                       </div>
                     )}
                   </div>
                 )}
               </>
             ) : (
               /* CREATE / EDIT FORM with SLIDERS & ACRO */
               <form onSubmit={handleSaveTournament} className="max-w-5xl mx-auto space-y-10 animate-in zoom-in-95">
                  <div className="flex justify-between items-center">
                    <h2 className="text-4xl font-outfit font-black text-white italic tracking-tighter uppercase">{editingTourney.id ? 'Ajustar Evento' : 'Novo Evento Profissional'}</h2>
                    <button type="button" onClick={() => setEditingTourney(null)} className="text-white/40 uppercase font-black text-[10px] tracking-widest bg-white/5 px-6 py-2 rounded-xl hover:bg-white/10 transition-all">Descartar</button>
                  </div>

                  <div className="glass p-10 rounded-[50px] space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Nome do Torneio</label>
                           <input type="text" value={editingTourney.name} onChange={e => setEditingTourney({...editingTourney, name: e.target.value})} className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-xl font-black text-white outline-none focus:border-yellow-500" required />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Sigla (3 Letras)</label>
                           <input type="text" maxLength={3} value={editingTourney.acronym} onChange={e => setEditingTourney({...editingTourney, acronym: e.target.value.toUpperCase()})} className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-xl font-black text-yellow-500 text-center outline-none focus:border-yellow-500" placeholder="EX: ME1" required />
                        </div>
                     </div>

                     {/* Club Association */}
                     {state.clubs.length > 0 && (
                       <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-6">
                         <div className="flex items-start gap-4">
                           <span className="text-3xl">🏛️</span>
                           <div className="flex-1">
                             <label className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mb-3 block">
                               Clube Associado
                             </label>
                             <select 
                               value={editingTourney.clubId || state.activeClubId || ''}
                               onChange={e => setEditingTourney({...editingTourney, clubId: e.target.value || undefined})}
                               className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-yellow-500 font-bold"
                             >
                               <option value="">Sem clube (não recomendado)</option>
                               {state.clubs.map(club => (
                                 <option key={club.id} value={club.id}>
                                   {club.name} {state.activeClubId === club.id ? '(Ativo)' : ''}
                                 </option>
                               ))}
                             </select>
                             <p className="text-white/40 text-xs mt-3">
                               {editingTourney.clubId || state.activeClubId
                                 ? '✓ Este torneio será associado ao clube selecionado'
                                 : '⚠️ Recomendamos associar o torneio a um clube para melhor organização'
                               }
                             </p>
                           </div>
                         </div>
                       </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Premiação Garantida ($)</label>
                           <input type="number" value={editingTourney.guaranteed || ''} onChange={e => setEditingTourney({...editingTourney, guaranteed: handleNumericInput(e.target.value)})} placeholder="0" className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-xl font-black text-green-500 outline-none focus:border-yellow-500" />
                        </div>
                        <div className="space-y-2 p-6 bg-black/40 rounded-3xl flex flex-col justify-center">
                           <div className="flex justify-between items-center mb-2">
                              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Players-Max (Mesa)</label>
                              <span className="text-2xl font-black text-white">{editingTourney.config?.maxSeats}-MAX</span>
                           </div>
                           <input 
                              type="range" min="2" max="10" 
                              value={editingTourney.config?.maxSeats} 
                              onChange={e => setEditingTourney({...editingTourney, config: {...editingTourney.config!, maxSeats: Number(e.target.value)}})}
                              className="w-full h-2 bg-white/10 rounded-full appearance-none accent-yellow-500"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                           { key: 'buyIn', label: 'Buy-in', color: 'bg-green-600' },
                           { key: 'reentry', label: 'Re-entry', color: 'bg-orange-600' },
                           { key: 'rebuy', label: 'Rebuy', color: 'bg-blue-600' },
                           { key: 'addon', label: 'Add-on', color: 'bg-purple-600' }
                        ].map(opt => (
                           <div key={opt.key} className="p-6 bg-white/5 rounded-3xl space-y-4 border border-white/5 hover:border-white/10 transition-all">
                              <div className="flex justify-between items-center">
                                 <span className="font-black text-white text-[10px] uppercase italic tracking-widest">{opt.label}</span>
                                 <ToggleSlider 
                                    checked={(editingTourney.config as any)[opt.key].enabled || (editingTourney.config as any)[opt.key].active} 
                                    onChange={val => {
                                      const field = opt.key === 'addon' ? 'enabled' : 'enabled';
                                      setEditingTourney({...editingTourney, config: {...editingTourney.config!, [opt.key]: {...(editingTourney.config as any)[opt.key], [field]: val}}})
                                    }} 
                                    colorClass={opt.color} 
                                 />
                              </div>
                              <div className="space-y-3">
                                 <div className="space-y-1"><label className="text-[7px] font-black text-white/20 uppercase">Valor ($)</label><input type="number" value={(editingTourney.config as any)[opt.key].price || ''} onChange={e => setEditingTourney({...editingTourney, config: {...editingTourney.config!, [opt.key]: {...(editingTourney.config as any)[opt.key], price: handleNumericInput(e.target.value)}}})} placeholder="0" className="w-full bg-black/40 p-3 rounded-xl text-xs font-bold text-white" /></div>
                                 <div className="space-y-1"><label className="text-[7px] font-black text-white/20 uppercase">Fichas</label><input type="number" value={(editingTourney.config as any)[opt.key].chips || ''} onChange={e => setEditingTourney({...editingTourney, config: {...editingTourney.config!, [opt.key]: {...(editingTourney.config as any)[opt.key], chips: handleNumericInput(e.target.value)}}})} placeholder="0" className="w-full bg-black/40 p-3 rounded-xl text-xs font-bold text-white" /></div>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Blind Structure Configuration */}
                     <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl p-8 border border-blue-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="text-xl font-black text-white mb-2">Estrutura de Blinds</h4>
                            <p className="text-white/40 text-xs font-bold">
                              {editingTourney.config?.blindStructure?.levels?.length || 0} níveis configurados
                              {editingTourney.config?.blindStructure?.breakEnabled && 
                                ` • Breaks a cada ${editingTourney.config.blindStructure.breakFrequency} níveis`
                              }
                            </p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setShowBlindStructureManager(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl text-sm uppercase shadow-lg transition-all"
                          >
                            ⚙️ Gerenciar Estrutura
                          </button>
                        </div>
                        
                        {/* Quick Preview */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                          {editingTourney.config?.blindStructure?.levels?.filter(l => !l.isBreak).slice(0, 4).map((level, idx) => (
                            <div key={idx} className="bg-black/40 rounded-xl p-3 border border-white/5">
                              <div className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Nível {idx + 1}</div>
                              <div className="text-sm font-black text-yellow-500">{level.smallBlind}/{level.bigBlind}</div>
                              <div className="text-[6px] font-black text-blue-400 mt-1">Ante: {level.ante}</div>
                            </div>
                          ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Alocar Mesas Disponíveis</h4>
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                           {filteredRoomTables.map(rt => {
                             const isAssignedToMe = editingTourney.assignedTableIds?.includes(rt.id);
                             const otherTourney = state.tournaments.find(t => t.id !== editingTourney.id && t.assignedTableIds.includes(rt.id));
                             return (
                               <button 
                                 type="button" 
                                 key={rt.id} 
                                 disabled={!!otherTourney}
                                 onClick={() => toggleTableSelection(rt.id)} 
                                 className={`h-14 rounded-2xl font-black transition-all border flex flex-col items-center justify-center relative overflow-hidden ${isAssignedToMe ? 'bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/20' : otherTourney ? 'bg-red-500/10 border-red-500/30 text-red-500/40 cursor-not-allowed' : 'bg-white/5 border-white/5 text-white/20 hover:border-white/20'}`}
                               >
                                  <span className="text-sm">{rt.id}</span>
                                  {otherTourney && <span className="text-[6px] absolute bottom-1 font-black uppercase">{otherTourney.acronym}</span>}
                               </button>
                             );
                           })}
                        </div>
                     </div>

                     <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-8 rounded-[40px] text-xl shadow-2xl transition-all uppercase tracking-tighter">EFETIVAR CONFIGURAÇÕES</button>
                  </div>
               </form>
             )}
          </div>
        )}

        {/* ROOM MANAGEMENT (SALAO) */}
        {activeTab === 'salao' && (
          <div className="p-10 space-y-10 animate-in fade-in">
             <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-4xl font-outfit font-black text-white italic">Gestão de Salão</h2>
                   <p className="text-white/30 text-xs font-bold uppercase mt-2 tracking-widest">Layout físico de mesas do estabelecimento</p>
                </div>
                <button onClick={() => onDispatch({ type: 'ADD_ROOM_TABLE', payload: { clubId: activeClubId || undefined }, senderId: 'DIR' })} className="bg-white text-black font-black px-10 py-5 rounded-3xl text-[10px] uppercase shadow-lg hover:bg-yellow-500 transition-all">NOVA MESA FÍSICA</button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredRoomTables.map(rt => {
                  const tourneyAtTable = state.tournaments.find(t => t.assignedTableIds.includes(rt.id));
                  const playersAtTable = state.players.filter(p => p.tableId === rt.id);
                  return (
                    <div 
                      key={rt.id} 
                      onClick={() => tourneyAtTable && setSelectedTableId(rt.id)}
                      className={`glass p-10 rounded-[50px] flex flex-col items-center justify-center relative group transition-all border-2 ${tourneyAtTable ? 'border-green-500 bg-green-500/5 cursor-pointer hover:bg-green-500/10' : 'border-white/5'}`}
                    >
                       <span className={`text-5xl font-black mb-2 ${tourneyAtTable ? 'text-green-500' : 'text-white/10'}`}>{rt.id}</span>
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Mesa {rt.id}</span>
                       {tourneyAtTable && (
                         <>
                           <div className="mt-4 bg-green-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase">
                             ATIVO: {tourneyAtTable.acronym}
                           </div>
                           <div className="mt-2 text-white/60 text-[10px] font-black">
                             {playersAtTable.length} jogador{playersAtTable.length !== 1 ? 'es' : ''}
                           </div>
                         </>
                       )}
                       {!tourneyAtTable && (
                         <button onClick={() => onDispatch({ type: 'REMOVE_ROOM_TABLE', payload: { id: rt.id }, senderId: 'DIR' })} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">🗑️</button>
                       )}
                    </div>
                  );
                })}
             </div>

             {/* Table Details Modal */}
             {selectedTableId && (
               <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-8 animate-in fade-in" onClick={() => { setSelectedTableId(null); setSelectedPlayer(null); }}>
                 <div className="glass max-w-4xl w-full max-h-[90vh] rounded-[50px] p-10 border-2 border-white/10 overflow-y-auto animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                   {(() => {
                     const tableData = state.roomTables.find(t => t.id === selectedTableId);
                     const tableTourney = state.tournaments.find(t => t.assignedTableIds.includes(selectedTableId));
                     const tablePlayers = state.players.filter(p => p.tableId === selectedTableId);
                     const tableState = state.tableStates.find(ts => ts.id === selectedTableId);
                     
                     return (
                       <>
                         <div className="flex justify-between items-start mb-8">
                           <div>
                             <h3 className="text-3xl font-black text-white italic">Mesa {selectedTableId}</h3>
                             <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1">
                               {tableTourney?.name} • {tablePlayers.length} jogador{tablePlayers.length !== 1 ? 'es' : ''}
                             </p>
                             {tableState?.dealerAccessCode && (
                               <div className="mt-3 inline-block bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-xl">
                                 <span className="text-blue-400 text-xs font-black uppercase tracking-widest">
                                   Código Dealer: <span className="text-blue-300 text-lg tracking-[6px]">{tableState.dealerAccessCode}</span>
                                 </span>
                               </div>
                             )}
                           </div>
                           <div className="flex gap-3">
                             <button 
                               onClick={() => { setActiveTourneyId(tableTourney?.id || null); setActiveTab('tv'); setSelectedTableId(null); }}
                               className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase shadow-lg transition-all"
                             >
                               📡 VER MODO TV
                             </button>
                             <button onClick={() => setSelectedTableId(null)} className="text-white/40 hover:text-white text-2xl">✕</button>
                           </div>
                         </div>

                         <div className="space-y-4">
                           {tablePlayers.length === 0 ? (
                             <div className="text-center py-20 text-white/20 font-black uppercase tracking-[10px]">
                               Nenhum jogador na mesa
                             </div>
                           ) : (
                             tablePlayers.map(player => (
                               <div key={player.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all">
                                 <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-6">
                                     <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                                       <span className="text-xl font-black text-yellow-500">{player.seatNumber}</span>
                                     </div>
                                     <div>
                                       <div className="font-black text-white text-lg">{player.name}</div>
                                       <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest mt-1">
                                         <span className="text-green-500">Stack: ${player.balance}</span>
                                         <span className="text-white/40">Código: {player.accessCode}</span>
                                         <span className="text-white/40">Investido: ${player.totalInvested}</span>
                                       </div>
                                     </div>
                                   </div>
                                   <button 
                                     onClick={() => setSelectedPlayer(selectedPlayer?.id === player.id ? null : player)}
                                     className="px-6 py-3 rounded-xl bg-white/5 hover:bg-yellow-500 hover:text-black text-white/60 font-black text-[10px] uppercase transition-all"
                                   >
                                     {selectedPlayer?.id === player.id ? 'FECHAR' : 'AÇÕES'}
                                   </button>
                                 </div>

                                 {/* Player Actions Menu */}
                                 {selectedPlayer?.id === player.id && (
                                   <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                                     <button 
                                       onClick={() => {
                                         onDispatch({ type: 'REMOVE_PLAYER', payload: { playerId: player.id }, senderId: 'DIR' });
                                         setSelectedPlayer(null);
                                       }}
                                       className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
                                     >
                                       🗑️ Remover
                                     </button>
                                     
                                     {tableTourney && tableTourney.assignedTableIds.length > 1 && (
                                       <div className="relative">
                                         <button 
                                           onClick={() => setShowMoveMenu(!showMoveMenu)}
                                           className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-500 hover:text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
                                         >
                                           🔄 Mover
                                         </button>
                                         {showMoveMenu && (
                                           <div className="absolute top-full mt-2 left-0 bg-black border border-white/10 rounded-2xl p-2 min-w-[150px] z-10">
                                             {tableTourney.assignedTableIds.filter(tid => tid !== selectedTableId).map(tid => (
                                               <button
                                                 key={tid}
                                                 onClick={() => {
                                                   onDispatch({ type: 'MOVE_PLAYER', payload: { playerId: player.id, targetTableId: tid }, senderId: 'DIR' });
                                                   setSelectedPlayer(null);
                                                   setShowMoveMenu(false);
                                                 }}
                                                 className="w-full text-left px-4 py-2 hover:bg-white/10 rounded-xl text-white text-[10px] font-black"
                                               >
                                                 Para Mesa {tid}
                                               </button>
                                             ))}
                                           </div>
                                         )}
                                       </div>
                                     )}
                                     
                                     {tableTourney?.config.rebuy.enabled && player.rebuysCount < tableTourney.config.rebuy.maxCount && (
                                       <button 
                                         onClick={() => {
                                           onDispatch({ type: 'REBUY_PLAYER', payload: { playerId: player.id }, senderId: 'DIR' });
                                           setSelectedPlayer(null);
                                         }}
                                         className="bg-purple-600/20 hover:bg-purple-600 text-purple-500 hover:text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
                                       >
                                         💰 Recompra
                                       </button>
                                     )}
                                     
                                     {tableTourney?.config.reentry.enabled && player.balance === 0 && (
                                       <button 
                                         onClick={() => {
                                           onDispatch({ type: 'REENTRY_PLAYER', payload: { playerId: player.id }, senderId: 'DIR' });
                                           setSelectedPlayer(null);
                                         }}
                                         className="bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase transition-all"
                                       >
                                         🔁 Re-entry
                                       </button>
                                     )}
                                   </div>
                                 )}
                               </div>
                             ))
                           )}
                         </div>
                       </>
                     );
                   })()}
                 </div>
               </div>
             )}
          </div>
        )}

        {/* PLAYER REGISTRY */}
        {activeTab === 'registry' && (
          <div className="p-10 max-w-5xl mx-auto space-y-10 animate-in fade-in">
             <h2 className="text-4xl font-outfit font-black text-white italic">Base Geral de Jogadores</h2>
             <form onSubmit={handleRegisterPerson} className="glass p-10 rounded-[50px] flex flex-col md:flex-row gap-6 items-end border-white/10 border shadow-2xl">
                <div className="flex-1 space-y-2 w-full"><label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Nome Completo</label><input type="text" value={regName} onChange={e => setRegName(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-3xl p-5 outline-none focus:border-yellow-500 text-white font-bold" /></div>
                <div className="flex-1 space-y-2 w-full"><label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4">Apelido (Nickname)</label><input type="text" value={regNick} onChange={e => setRegNick(e.target.value)} className="w-full bg-black/60 border border-white/5 rounded-3xl p-5 outline-none focus:border-yellow-500 text-white font-bold" /></div>
                <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-black px-12 py-5 rounded-3xl uppercase text-xs tracking-widest shadow-xl transition-all">CADASTRAR</button>
             </form>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRegistry.map(p => (
                  <div key={p.id} className="p-8 bg-white/5 rounded-[40px] border border-white/5 group hover:bg-white/10 transition-all flex justify-between items-center">
                     <div>
                        <div className="font-bold text-white text-lg">{p.name}</div>
                        <div className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">{p.nickname || 'Sem Apelido'}</div>
                     </div>
                     <button onClick={() => onDispatch({ type: 'DELETE_PERSON', payload: { personId: p.id }, senderId: 'DIR' })} className="text-white/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TV MODE */}
        {activeTab === 'tv' && (
          <div className="h-full w-full bg-[#050505] relative flex flex-col">
             <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100] flex flex-wrap gap-2 glass p-2 rounded-full border-white/10 max-w-[90%] justify-center">
                {filteredTournaments.filter(t => t.isActive).map(t => (
                  t.assignedTableIds.map(tid => (
                    <button 
                      key={`${t.id}-${tid}`} 
                      onClick={() => { setActiveTourneyId(t.id); onDispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: { id: t.id }, senderId: 'DIR' }); }}
                      className={`px-6 py-2 rounded-full font-black text-[9px] uppercase transition-all tracking-widest border ${currentTourney?.assignedTableIds.includes(tid) ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-white/5 text-white/30 border-transparent'}`}
                    >
                      {t.acronym} - Mesa {tid}
                    </button>
                  ))
                ))}
             </div>
             
             {/* List tables of active tournament */}
             <div className="flex-1 p-20 flex flex-wrap gap-10 justify-center overflow-y-auto">
                {currentTourney ? currentTourney.assignedTableIds.map(tid => (
                  <div key={tid} className="w-full max-w-4xl h-[500px] glass rounded-[100px] border-2 border-white/5 relative group overflow-hidden">
                     <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/20 font-black uppercase tracking-widest text-[10px] z-50">Transmissão Mesa {tid} • {currentTourney.acronym}</div>
                     <TableView state={state} tableId={tid} showEmptySeats={false} />
                  </div>
                )) : (
                  <div className="h-full w-full flex items-center justify-center text-white/5 text-4xl font-black uppercase tracking-[20px]">Nenhuma Mesa Ativa</div>
                )}
             </div>
          </div>
        )}

        {/* CLUBES TAB */}
        {activeTab === 'clubes' && !isManager && (
          <div className="p-10 space-y-10 animate-in fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-outfit font-black text-white italic">Meus Clubes</h2>
                <p className="text-white/30 text-xs font-bold uppercase mt-2 tracking-widest">Organize seus torneios em clubes</p>
              </div>
              <button 
                onClick={() => setShowCreateClub(true)}
                className="bg-green-600 hover:bg-green-500 text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-lg transition-all"
              >
                CRIAR NOVO CLUBE
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

            {/* Clubs List */}
            {state.clubs.length === 0 ? (
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
              <div className="space-y-6">
                {state.clubs.map((club) => {
                  const isExpanded = expandedClubId === club.id;
                  const clubTournaments = state.tournaments.filter(t => t.clubId === club.id);
                  const clubTables = new Set(clubTournaments.flatMap(t => t.assignedTableIds));
                  
                  return (
                    <div key={club.id} className="glass rounded-[40px] border border-white/10 overflow-hidden">
                      {/* Club Header */}
                      <div className="p-8">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            {club.profilePhotoUrl ? (
                              <img 
                                src={club.profilePhotoUrl} 
                                alt={club.name}
                                className="w-20 h-20 rounded-2xl object-cover"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-yellow-500 text-4xl font-black">
                                  {club.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-3xl font-black text-white">{club.name}</h3>
                                {state.activeClubId === club.id && (
                                  <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg font-black text-xs">
                                    ATIVO
                                  </span>
                                )}
                              </div>
                              {club.description && (
                                <p className="text-white/50 text-sm mb-2">{club.description}</p>
                              )}
                              <p className="text-white/30 text-xs">
                                Criado em {new Date(club.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                onDispatch({
                                  type: 'SET_ACTIVE_CLUB',
                                  payload: { id: club.id },
                                  senderId: 'DIR'
                                });
                              }}
                              className={`px-6 py-3 rounded-xl font-black text-xs uppercase transition-all tracking-widest ${
                                state.activeClubId === club.id
                                  ? 'bg-yellow-500 text-black'
                                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {state.activeClubId === club.id ? 'ATIVO' : 'ATIVAR'}
                            </button>
                            <button
                              onClick={() => setExpandedClubId(isExpanded ? null : club.id)}
                              className="px-4 py-3 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"
                            >
                              {isExpanded ? '▲' : '▼'}
                            </button>
                            <button
                              onClick={() => handleDeleteClub(club.id)}
                              className="px-4 py-3 rounded-xl bg-white/5 text-white/20 hover:bg-red-600/20 hover:text-red-500 transition-all"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Club Stats */}
                        <div className="mt-6 pt-6 border-t border-white/5">
                          <div className="grid grid-cols-3 gap-6">
                            <div className="bg-black/40 p-4 rounded-2xl">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Torneios</p>
                              <p className="text-white font-black text-3xl">{clubTournaments.length}</p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-2xl">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Mesas Usadas</p>
                              <p className="text-white font-black text-3xl">{clubTables.size}</p>
                            </div>
                            <div className="bg-black/40 p-4 rounded-2xl">
                              <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Jogadores</p>
                              <p className="text-white font-black text-3xl">
                                {state.players.filter(p => clubTournaments.some(t => t.id === p.tournamentId)).length}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Club Details */}
                      {isExpanded && (
                        <div className="px-8 pb-8 space-y-6 border-t border-white/5 pt-6">
                          {/* Tournaments Section */}
                          <div>
                            <h4 className="text-white font-black text-xl mb-4">Torneios deste Clube</h4>
                            {clubTournaments.length === 0 ? (
                              <div className="bg-white/5 rounded-2xl p-6 text-center">
                                <p className="text-white/40 text-sm">
                                  Nenhum torneio criado ainda. Crie um torneio e ele será automaticamente associado ao clube ativo.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {clubTournaments.map(tournament => (
                                  <div key={tournament.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                      <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-lg font-black text-xs">
                                        {tournament.acronym}
                                      </span>
                                      <div>
                                        <p className="text-white font-bold">{tournament.name}</p>
                                        <p className="text-white/40 text-xs">
                                          {tournament.assignedTableIds.length} mesas • {state.players.filter(p => p.tournamentId === tournament.id).length} jogadores
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setActiveTab('torneios');
                                          setActiveTourneyId(tournament.id);
                                          onDispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: { id: tournament.id }, senderId: 'DIR' });
                                        }}
                                        className="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white text-xs font-black uppercase transition-all"
                                      >
                                        Gerenciar
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Tem certeza que deseja excluir este torneio?')) {
                                            onDispatch({ type: 'DELETE_TOURNAMENT', payload: { id: tournament.id }, senderId: 'DIR' });
                                          }
                                        }}
                                        className="p-2 text-white/20 hover:text-red-500 transition-all"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Manager Management Section */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-white font-black text-xl">Gerentes do Clube</h4>
                              <button
                                onClick={() => {
                                  setShowCreateManager(club.id);
                                  // Load managers when opening this section
                                  if (!clubManagers[club.id]) {
                                    loadClubManagers(club.id);
                                  }
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase shadow-lg transition-all"
                              >
                                ➕ Criar Gerente
                              </button>
                            </div>
                            
                            <p className="text-white/60 text-sm mb-4">
                              Gerentes podem criar e gerenciar torneios, mas não podem alterar configurações do clube.
                            </p>

                            {/* Create Manager Modal */}
                            {showCreateManager === club.id && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                                <div className="glass p-10 rounded-[40px] max-w-md w-full mx-4 border border-white/20">
                                  <div className="flex justify-between items-start mb-6">
                                    <div>
                                      <h3 className="text-2xl font-outfit font-black text-white italic">Criar Gerente</h3>
                                      <p className="text-white/40 text-sm mt-1">Para o clube: {club.name}</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setShowCreateManager(null);
                                        setNewManagerUsername('');
                                        setNewManagerPassword('');
                                      }}
                                      className="text-white/40 hover:text-white text-2xl"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <form onSubmit={(e) => handleCreateManager(e, club.id)} className="space-y-4">
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
                                        onClick={() => {
                                          setShowCreateManager(null);
                                          setNewManagerUsername('');
                                          setNewManagerPassword('');
                                        }}
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
                            {!clubManagers[club.id] && (
                              <button
                                onClick={() => loadClubManagers(club.id)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold py-3 rounded-xl text-sm transition-all"
                              >
                                Carregar gerentes
                              </button>
                            )}
                            
                            {clubManagers[club.id] && clubManagers[club.id].length === 0 && (
                              <div className="bg-white/5 rounded-2xl p-6 text-center">
                                <p className="text-white/40 text-sm">
                                  Nenhum gerente criado ainda. Crie o primeiro gerente para delegar o gerenciamento de torneios.
                                </p>
                              </div>
                            )}

                            {clubManagers[club.id] && clubManagers[club.id].length > 0 && (
                              <div className="space-y-3">
                                {clubManagers[club.id].map((manager) => (
                                  <div key={manager.id} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <span className="text-blue-500 text-xl font-black">
                                          {manager.username.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-white font-bold">{manager.username}</p>
                                        <p className="text-white/40 text-xs">
                                          Criado em {new Date(manager.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteManager(manager.id, club.id)}
                                      className="p-2 text-white/20 hover:text-red-500 transition-all"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Instructions */}
            <div className="glass p-8 rounded-[40px] border border-white/10">
              <h3 className="text-white font-black text-xl mb-4">💡 Como usar o sistema de clubes</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl">1️⃣</span>
                    <p className="text-white/70">
                      <strong className="text-white">Crie clubes</strong> para organizar seus torneios de forma profissional
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl">2️⃣</span>
                    <p className="text-white/70">
                      <strong className="text-white">Ative um clube</strong> antes de criar torneios - eles serão automaticamente associados
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-yellow-500 text-xl">3️⃣</span>
                    <p className="text-white/70">
                      <strong className="text-white">Adicione gerentes</strong> para delegar o gerenciamento de torneios
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

            {/* Orphaned Tournaments Warning */}
            {state.tournaments.some(t => !t.clubId) && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div>
                    <h4 className="text-orange-400 font-black text-lg mb-2">Torneios sem clube detectados</h4>
                    <p className="text-white/70 text-sm mb-4">
                      Existem {state.tournaments.filter(t => !t.clubId).length} torneio(s) criado(s) antes da introdução do sistema de clubes.
                      Estes torneios não estão associados a nenhum clube.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('torneios');
                      }}
                      className="bg-orange-600 hover:bg-orange-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase shadow-lg transition-all"
                    >
                      Ver Torneios
                    </button>
                    <p className="text-white/50 text-xs mt-3">
                      💡 Dica: Você pode editar esses torneios para associá-los a um clube ou excluí-los se não forem mais necessários.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Blind Structure Manager Modal */}
      {showBlindStructureManager && editingTourney?.config?.blindStructure && (
        <BlindStructureManager
          initialIntervals={editingTourney.config.blindStructure.intervals}
          initialLevels={editingTourney.config.blindStructure.levels}
          breakEnabled={editingTourney.config.blindStructure.breakEnabled}
          breakDuration={editingTourney.config.blindStructure.breakDuration}
          breakFrequency={editingTourney.config.blindStructure.breakFrequency}
          onSave={handleSaveBlindStructure}
          onClose={() => setShowBlindStructureManager(false)}
        />
      )}
    </div>
  );
};

export default DealerControls;
