import React, { useEffect, useState } from 'react';
import { FileDown, Search, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface Metrics {
  total: number;
  recebidas: number;
  em_analise: number;
  em_apuracao: number;
  concluídas: number;
}

interface Denuncia {
  id: number;
  protocolo: string;
  tipo: string;
  setor: string;
  data_fato: string;
  status: string;
  deseja_retorno: boolean;
  data_criacao: string;
}

interface AdminDashboardProps {
  token: string;
  onNavigateDetail: (id: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onNavigateDetail }) => {
  // Stats & Listing States
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, recebidas: 0, em_analise: 0, em_apuracao: 0, concluídas: 0 });
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters State
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('');
  const [tipo, setTipo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const queryParams = new URLSearchParams();
      if (busca) queryParams.append('busca', busca);
      if (status) queryParams.append('status', status);
      if (tipo) queryParams.append('tipo', tipo);
      if (dataInicio) queryParams.append('data_inicio', dataInicio);
      if (dataFim) queryParams.append('data_fim', dataFim);

      const response = await fetch(`http://localhost:3000/api/admin/dashboard?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar dados do painel.');
      }

      setMetrics(data.metrics);
      setDenuncias(data.denuncias);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro de conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleResetFilters = () => {
    setBusca('');
    setStatus('');
    setTipo('');
    setDataInicio('');
    setDataFim('');
    // Forçar recarga após o reset do estado.
    setTimeout(() => {
      fetchDashboardData();
    }, 0);
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (status) queryParams.append('status', status);
      if (tipo) queryParams.append('tipo', tipo);
      if (dataInicio) queryParams.append('data_inicio', dataInicio);
      if (dataFim) queryParams.append('data_fim', dataFim);

      const response = await fetch(`http://localhost:3000/api/admin/exportar/csv?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao baixar CSV.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'relatorio_denuncias_pgr.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Erro ao exportar o relatório CSV.');
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
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Widget Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total de Casos</span>
          <span className="text-3xl font-extrabold text-slate-800 mt-2">{metrics.total}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-blue-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recebidas</span>
          <span className="text-3xl font-extrabold text-blue-600 mt-2">{metrics.recebidas || 0}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-yellow-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Em Análise</span>
          <span className="text-3xl font-extrabold text-yellow-800 mt-2">{metrics.em_analise || 0}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Em Apuração</span>
          <span className="text-3xl font-extrabold text-amber-600 mt-2">{metrics.em_apuracao || 0}</span>
        </div>
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between border-l-4 border-l-green-500">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concluídas</span>
          <span className="text-3xl font-extrabold text-green-600 mt-2">{metrics.concluídas || 0}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="glass-panel p-6 rounded-2xl mb-8">
        <form onSubmit={handleFilterSubmit} className="space-y-4 lg:space-y-0 lg:flex lg:items-end lg:gap-4">
          
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Buscar</label>
            <div className="relative">
              <input 
                type="text" 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Protocolo, setor ou termo..." 
                className="input-field w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          <div className="w-full lg:w-48">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
            >
              <option value="">Todos</option>
              <option value="Recebida">Recebida</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Em Apuração">Em Apuração</option>
              <option value="Concluída">Concluída</option>
            </select>
          </div>

          <div className="w-full lg:w-64">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Risco</label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
            >
              <option value="">Todos</option>
              <option value="Risco Psicossocial (assédio, sobrecarga, violência)">Risco Psicossocial</option>
              <option value="Condição Insegura">Condição Insegura</option>
              <option value="Assédio Sexual">Assédio Sexual</option>
              <option value="Outros Riscos Ocupacionais">Outros Riscos</option>
              <option value="Sugestão de Melhoria">Sugestão de Melhoria</option>
            </select>
          </div>

          <div className="w-full lg:w-40">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Data Início</label>
            <input 
              type="date" 
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-field w-full px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
            />
          </div>

          <div className="w-full lg:w-40">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Data Fim</label>
            <input 
              type="date" 
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input-field w-full px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
            />
          </div>

          <div className="flex space-x-2 w-full lg:w-auto pt-2 lg:pt-0">
            <button type="submit" className="w-full lg:w-auto px-5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors">
              Filtrar
            </button>
            <button 
              type="button" 
              onClick={handleResetFilters}
              className="w-full lg:w-auto px-5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 border border-slate-200 font-semibold text-sm transition-colors"
            >
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Listagem */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base">Relação de Relatos</h3>
          
          <button 
            type="button" 
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 text-xs font-semibold transition-colors"
          >
            <FileDown className="h-4 w-4" />
            <span>Exportar Relatório (PGR)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider text-left border-b border-slate-200/80">
              <tr>
                <th scope="col" className="px-6 py-3.5">Protocolo</th>
                <th scope="col" className="px-6 py-3.5">Data Entrada</th>
                <th scope="col" className="px-6 py-3.5">Tipo de Risco</th>
                <th scope="col" className="px-6 py-3.5">Setor</th>
                <th scope="col" className="px-6 py-3.5">Retorno</th>
                <th scope="col" className="px-6 py-3.5 text-center">Status</th>
                <th scope="col" className="px-6 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Buscando dados do servidor...
                  </td>
                </tr>
              ) : denuncias.length > 0 ? (
                denuncias.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-teal-600">
                      {d.protocolo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {new Date(d.data_criacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      <span className="block truncate max-w-[200px]" title={d.tipo}>{d.tipo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {d.setor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {d.deseja_retorno ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">Sim</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyle(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => onNavigateDetail(d.id)}
                        className="inline-flex items-center space-x-1 text-teal-600 hover:text-teal-700 font-bold transition-colors"
                      >
                        <span>Analisar</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Nenhum relato localizado para os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
