import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, FileText, Download, Clock, AlertCircle } from 'lucide-react';

interface Denuncia {
  id: number;
  protocolo: string;
  tipo: string;
  setor: string;
  data_fato: string;
  descricao: string;
  status: string;
  deseja_retorno: boolean;
  data_criacao: string;
  data_atualizacao: string;
}

interface Anexo {
  id: number;
  nome_original: string;
  tamanho: number;
  data_criacao: string;
}

interface HistoricoItem {
  id: number;
  acao: string;
  comentario: string;
  data_criacao: string;
  admin_nome: string | null;
}

interface AdminDetailProps {
  id: number;
  token: string;
  onNavigateBack: () => void;
}

export const AdminDetail: React.FC<AdminDetailProps> = ({ id, token, onNavigateBack }) => {
  const [denuncia, setDenuncia] = useState<Denuncia | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const [statusNovo, setStatusNovo] = useState('');
  const [comentarioStatus, setComentarioStatus] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [notaInterna, setNotaInterna] = useState('');
  const [loadingNota, setLoadingNota] = useState(false);

  const fetchDetailData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/denuncia/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar os detalhes do relato.');
      }

      setDenuncia(data.denuncia);
      setAnexos(data.anexos);
      setHistorico(data.historico);
      setStatusNovo(data.denuncia.status);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  const handleDownloadAttachment = async (anexoId: number, filename: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/anexo/baixar/${anexoId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao baixar anexo.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert('Erro ao fazer download do anexo.');
    }
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusNovo || !comentarioStatus) return;

    setLoadingStatus(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/denuncia/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status_novo: statusNovo, comentario: comentarioStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao atualizar status.');
      }

      setComentarioStatus('');
      await fetchDetailData(); // Recarregar dados com novo histórico
      alert('Status atualizado com sucesso!');

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao processar atualização.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleNotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaInterna.trim()) return;

    setLoadingNota(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/denuncia/${id}/comentario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comentario: notaInterna })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar nota interna.');
      }

      setNotaInterna('');
      await fetchDetailData(); // Recarregar dados
      alert('Nota de auditoria adicionada!');

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao salvar comentário interno.');
    } finally {
      setLoadingNota(false);
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

  if (loading && !denuncia) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-600">
        Buscando ficha de denúncia do servidor...
      </div>
    );
  }

  if (errorMsg || !denuncia) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-center space-x-2 justify-center">
          <AlertCircle className="h-5 w-6 text-red-600" />
          <span>{errorMsg || 'Denúncia não localizada.'}</span>
        </div>
        <button onClick={onNavigateBack} className="px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm hover:bg-slate-200">
          Voltar para Lista
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      <div className="hidden print-only p-8 border-b-2 border-slate-300 mb-8">
        <h1 className="text-2xl font-bold">Relatório de Auditoria Ocupacional (PGR/NR-1)</h1>
        <p className="text-sm">Gerado pelo sistema **NR1** em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex justify-between items-center mb-6 no-print">
        <button 
          onClick={onNavigateBack}
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Voltar para a lista</span>
        </button>

        <button 
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-sm"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir para Relatório PGR</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          
          <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-lg">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 mb-6 gap-2">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Protocolo</span>
                <h2 className="text-2xl font-mono font-bold text-teal-600">{denuncia.protocolo}</h2>
              </div>
              
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold border uppercase tracking-widest ${getStatusStyle(denuncia.status)}`}>
                {denuncia.status}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mb-6 pb-6 border-b border-slate-100">
              <div>
                <span className="text-slate-500 block mb-1">Tipo de Risco / Denúncia:</span>
                <span className="font-bold text-slate-800 text-base">{denuncia.tipo}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Setor / Local do Fato:</span>
                <span className="font-bold text-slate-800 text-base">{denuncia.setor}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Data Estimada do Ocorrido:</span>
                <span className="font-bold text-slate-800 text-base">{new Date(denuncia.data_fato).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Data de Entrada no Sistema:</span>
                <span className="font-bold text-slate-800 text-base">
                  {new Date(denuncia.data_criacao).toLocaleDateString('pt-BR')} às {new Date(denuncia.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-2 text-sm font-semibold">Descrição Detalhada do Relato:</span>
              <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-xl text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                {denuncia.descricao}
              </div>
            </div>

          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-md">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center">
              <FileText className="h-5 w-5 text-teal-600 mr-2" />
              Evidências e Documentos Anexados
            </h3>

            {anexos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {anexos.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center space-x-3 min-w-0">
                      <FileText className="h-8 w-8 text-slate-400 flex-shrink-0" />
                      <div className="truncate">
                        <span className="block truncate text-sm font-semibold text-slate-800" title={file.nome_original}>
                          {file.nome_original}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(file.tamanho / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDownloadAttachment(file.id, file.nome_original)}
                      className="no-print p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Nenhum anexo enviado com esta denúncia.</p>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-6 border-b border-slate-100 pb-2">
              Trilha de Auditoria (NR-1 Compliance)
            </h3>
            
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {historico.length > 0 ? (
                historico.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 bg-white border-2 border-teal-600 rounded-full h-4 w-4"></div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{item.acao}</span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-500 text-xs font-mono">
                        {new Date(item.data_criacao).toLocaleDateString('pt-BR')} às {new Date(item.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.admin_nome && (
                        <>
                          <span className="text-slate-400 text-xs">•</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">Por: {item.admin_nome}</span>
                        </>
                      )}
                    </div>
                    <p className="text-slate-700 text-sm mt-1.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                      {item.comentario}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Nenhum histórico registrado.</p>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-6 no-print">
          
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">
              Alterar Status da Apuração
            </h3>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Novo Status
                </label>
                <select 
                  value={statusNovo}
                  onChange={(e) => setStatusNovo(e.target.value)}
                  required 
                  className="input-field w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm"
                >
                  <option value="Recebida">Recebida</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Em Apuração">Em Apuração</option>
                  <option value="Concluída">Concluída</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Justificativa / Feedback de Retorno
                </label>
                <textarea 
                  value={comentarioStatus}
                  onChange={(e) => setComentarioStatus(e.target.value)}
                  rows={4} 
                  required 
                  placeholder="Justifique a mudança de status. Caso o denunciante tenha pedido retorno, esta mensagem ficará visível para ele." 
                  className="input-field w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed"
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingStatus}
                className="btn-gold w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md disabled:opacity-50"
              >
                {loadingStatus ? 'Salvando...' : 'Salvar Alteração de Status'}
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 border-b border-slate-100 pb-2">
              Nota de Auditoria Interna (CIPA)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apenas visível para investigadores. Permite registrar o andamento interno das averiguações para compliance da NR-1, sem mostrar ao denunciante.
            </p>

            <form onSubmit={handleNotaSubmit} className="space-y-4">
              <div>
                <textarea 
                  value={notaInterna}
                  onChange={(e) => setNotaInterna(e.target.value)}
                  rows={4} 
                  required 
                  placeholder="Digite sua nota interna..." 
                  className="input-field w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed"
                />
              </div>

              <button 
                type="submit" 
                disabled={loadingNota}
                className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm border border-slate-200 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingNota ? 'Registrando...' : 'Registrar Nota Interna'}
              </button>
            </form>
          </div>

          <div className="glass-panel p-4 rounded-xl bg-slate-50 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Conformidade Legal</h4>
            <p><strong>Retorno habilitado:</strong> {denuncia.deseja_retorno ? 'Sim' : 'Não'}</p>
            <p><strong>IP do denunciante:</strong> Isento (Não coletado)</p>
            <p><strong>Trilha auditada:</strong> Sim (Segurança do PGR)</p>
          </div>

        </div>

      </div>

    </div>
  );
};

