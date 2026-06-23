import React, { useState } from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface Denuncia {
  id: number;
  protocolo: string;
  tipo: string;
  setor: string;
  status: string;
  deseja_retorno: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface HistoricoItem {
  acao: string;
  comentario: string;
  data_criacao: string;
}

export const TrackComplaint: React.FC = () => {
  const [protocolo, setProtocolo] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    setDenuncia(null);
    setHistorico([]);

    if (!protocolo || !senha) {
      setErrorMsg('Por favor, informe tanto o protocolo quanto a senha de acompanhamento.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/acompanhar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocolo, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar consulta.');
      }

      setDenuncia(data.denuncia);
      setHistorico(data.historico);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao consultar protocolo. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Recebida':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Em Análise':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'Em Apuração':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Concluída':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:py-12 animate-fade-in-up">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Acompanhar <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">Apuração</span>
        </h1>
        <p className="text-slate-600 mt-2 text-sm max-w-xl mx-auto">
          Insira o código do protocolo e a senha recebida ao finalizar o envio da denúncia.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSearch} className="glass-panel p-6 rounded-2xl shadow-lg space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Número do Protocolo
            </label>
            <input 
              type="text" 
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value)}
              required 
              placeholder="Ex: LEAO-2026-00001" 
              className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-sm uppercase"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Senha de Acompanhamento
            </label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required 
              placeholder="Digite a senha de 8 dígitos" 
              className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-gold px-6 py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Consultar Andamento'}
          </button>
        </div>
      </form>

      {/* Resultados */}
      {denuncia && (
        <div className="space-y-6">
          
          {/* Card Detalhes */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-100 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-4 gap-2">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Protocolo de Registro</span>
                <h2 className="text-xl font-mono font-bold text-slate-800">{denuncia.protocolo}</h2>
              </div>
              
              <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest ${getStatusStyle(denuncia.status)}`}>
                {denuncia.status}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block">Tipo de Risco:</span>
                <span className="font-medium text-slate-800">{denuncia.tipo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Setor/Local:</span>
                <span className="font-medium text-slate-800">{denuncia.setor}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registrado em:</span>
                <span className="font-medium text-slate-800">
                  {new Date(denuncia.data_criacao).toLocaleDateString('pt-BR')} às {new Date(denuncia.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Última atualização:</span>
                <span className="font-medium text-slate-800">
                  {new Date(denuncia.data_atualizacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline Histórico */}
          <div className="glass-panel p-6 rounded-2xl shadow-md">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Histórico de Andamento (Trilha PGR)</h3>
            
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {historico.length > 0 ? (
                historico.map((item, idx) => (
                  <div key={idx} className="relative">
                    {/* TimeLine Dot */}
                    <div className="absolute -left-[31px] top-1.5 bg-white border-2 border-teal-600 rounded-full h-4 w-4"></div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{item.acao}</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-500 text-xs font-mono">
                        {new Date(item.data_criacao).toLocaleDateString('pt-BR')} às {new Date(item.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      {item.comentario}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Nenhuma movimentação de status encontrada.</p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
