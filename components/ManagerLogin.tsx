import React, { useState } from 'react';
import { Club } from '../types';
import { clubService, ClubManagerSession } from '../services/clubService';

interface ManagerLoginProps {
  club: Club;
  onLoginSuccess: (session: ClubManagerSession) => void;
  onBack: () => void;
}

const ManagerLogin: React.FC<ManagerLoginProps> = ({ club, onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setIsLoading(true);
    const result = await clubService.managerLogin(club.id, username.trim(), password);
    setIsLoading(false);

    if (result.success && result.session) {
      onLoginSuccess(result.session);
    } else {
      setError(result.error || 'Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
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
        </div>

        <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">
          POKER<span className="text-yellow-500"> 2</span>
        </h1>
        <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">
          Login de Gerente
        </p>
        <p className="text-white/60 text-sm mb-8">Entre com suas credenciais</p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nome de usuário"
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
            autoComplete="username"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all disabled:opacity-50"
          >
            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerLogin;
