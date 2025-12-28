import React, { useState } from 'react';
import { authService, AuthSession } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (session: AuthSession) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Registration
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setIsLoading(false);
          return;
        }

        const result = await authService.register(username, password);
        if (result.success && result.session) {
          onLoginSuccess(result.session);
        } else {
          setError(result.error || 'Falha ao registrar');
        }
      } else {
        // Login
        const result = await authService.login(username, password);
        if (result.success && result.session) {
          onLoginSuccess(result.session);
        } else {
          setError(result.error || 'Falha ao fazer login');
        }
      }
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 poker-felt">
      <div className="w-full max-w-md glass p-10 rounded-[40px] shadow-2xl border-white/20 border">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-outfit font-black text-white mb-2 italic tracking-tighter">
            POKER<span className="text-yellow-500"> 2</span>
          </h1>
          <p className="text-white/40 mb-2 text-[10px] font-bold tracking-[6px] uppercase">
            Gerenciador de Fichas & Suite Profissional
          </p>
          <p className="text-white/60 text-sm font-semibold mt-6">
            {isRegistering ? 'Criar Conta' : 'Entrar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
              disabled={isLoading}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          {isRegistering && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar senha"
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none transition-all focus:border-yellow-500/50"
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-3xl text-xl shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processando...' : isRegistering ? 'REGISTRAR' : 'ENTRAR'}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setPassword('');
              setConfirmPassword('');
            }}
            disabled={isLoading}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest disabled:opacity-50"
          >
            {isRegistering ? 'JÁ TEM CONTA? ENTRAR' : 'CRIAR CONTA'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <p className="text-blue-300 text-xs text-center">
            ℹ️ Autenticação requer Supabase configurado
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
