import React, { useState } from 'react';
import { Lock, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminData {
  id: number;
  nome: string;
  email: string;
}

interface AdminLoginProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (token: string, admin: AdminData) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!email || !senha) {
      setErrorMsg('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha na autenticação.');
      }

      // Salvar token e dados do admin
      onLoginSuccess(data.token, data.admin);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao conectar ao servidor de login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-3 rounded-2xl shadow-xl shadow-teal-600/10">
            <Lock className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800 tracking-tight">
          Painel de Compliance
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Acesso restrito para comitês CIPA, SESMT e Compliance da empresa.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                E-mail Corporativo
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="nome@empresa.com.br"
                className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Senha Administrativa
              </label>
              <input 
                type="password" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required 
                placeholder="••••••••"
                className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-slate-500 select-none cursor-pointer">
                  Lembrar dispositivo
                </label>
              </div>
              
              <div className="text-xs">
                <button
                  type="button"
                  onClick={() => onNavigate('form')}
                  className="font-medium text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Voltar ao Canal
                </button>
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-gold w-full flex justify-center py-2.5 px-4 rounded-lg text-white font-bold text-sm shadow-md disabled:opacity-50"
              >
                {loading ? 'Validando acesso...' : 'Entrar no Painel'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            A trilha de logins é registrada para fins de auditoria interna da NR-1.
          </div>
          
        </div>
      </div>

    </div>
  );
};
