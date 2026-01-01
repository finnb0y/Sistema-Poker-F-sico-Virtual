import React, { useState } from 'react';
import { Club } from '../types';

interface ClubCodeEntryProps {
  club: Club;
  onCodeSubmit: (code: string) => void;
  onBack: () => void;
  onManagerLogin: () => void;
}

const ClubCodeEntry: React.FC<ClubCodeEntryProps> = ({ 
  club, 
  onCodeSubmit, 
  onBack,
  onManagerLogin 
}) => {
  const [accessCodeInput, setAccessCodeInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCodeInput.trim()) {
      onCodeSubmit(accessCodeInput.toUpperCase().trim());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
      {/* Club Banner */}
      {club.bannerUrl && (
        <div className="w-full max-w-2xl mb-4 rounded-[40px] overflow-hidden">
          <img 
            src={club.bannerUrl} 
            alt={`${club.name} banner`}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl text-center border-white/20 border">
        <button 
          onClick={onBack}
          className="mb-6 px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black uppercase transition-all tracking-widest"
        >
          ← VOLTAR
        </button>

        {/* Club Info */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {club.profilePhotoUrl ? (
              <img 
                src={club.profilePhotoUrl} 
                alt={club.name}
                className="w-12 h-12 rounded-xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-500 text-2xl font-black">
                  {club.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h2 className="text-2xl font-outfit font-black text-white italic">
              {club.name}
            </h2>
          </div>
          {club.description && (
            <p className="text-white/40 text-xs">
              {club.description}
            </p>
          )}
        </div>

        <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">
          POKER<span className="text-yellow-500"> 2</span>
        </h1>
        <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">
          Gerenciador de Fichas & Suite Profissional
        </p>
        <p className="text-white/60 text-sm mb-8">Entre com o código da mesa</p>
        
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              maxLength={4} 
              value={accessCodeInput} 
              onChange={e => setAccessCodeInput(e.target.value.toUpperCase())} 
              placeholder="CÓDIGO" 
              className="w-full bg-black/40 border border-white/10 rounded-3xl p-6 text-center text-4xl font-black text-yellow-500 outline-none transition-all tracking-[12px] focus:border-yellow-500/50" 
            />
            <button 
              type="submit" 
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all"
            >
              ENTRAR
            </button>
          </form>
          
          <button 
            onClick={onManagerLogin}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white font-black py-3 rounded-2xl transition-all uppercase text-[10px] tracking-widest mt-6"
          >
            Entrar como Gerente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClubCodeEntry;
