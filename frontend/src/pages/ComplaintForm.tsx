import React, { useState } from 'react';
import { FileUploader } from '../components/FileUploader';
import { ShieldCheck, CheckCircle2, Copy, Check, AlertTriangle } from 'lucide-react';

interface ComplaintFormProps {
  onNavigate: (page: string) => void;
}

interface SuccessData {
  protocolo: string;
  senha: string | null;
  deseja_retorno: boolean;
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({ onNavigate }) => {
  // Form State
  const [tipo, setTipo] = useState('');
  const [setor, setSetor] = useState('');
  const [dataFato, setDataFato] = useState('');
  const [descricao, setDescricao] = useState('');
  const [desejaRetorno, setDesejaRetorno] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  // UI Flow State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  
  // Copy feedback state
  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [copiedSenha, setCopiedSenha] = useState(false);

  const handleFilesChange = (updatedFiles: File[]) => {
    setFiles(updatedFiles);
  };

  const handleCopy = (text: string, type: 'proto' | 'pass') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'proto') {
        setCopiedProtocol(true);
        setTimeout(() => setCopiedProtocol(false), 2000);
      } else {
        setCopiedSenha(true);
        setTimeout(() => setCopiedSenha(false), 2000);
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (!tipo || !setor || !dataFato || !descricao) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios (*).');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('setor', setor);
      formData.append('data_fato', dataFato);
      formData.append('descricao', descricao);
      formData.append('deseja_retorno', desejaRetorno.toString());
      
      files.forEach((file) => {
        formData.append('anexos', file);
      });

      const response = await fetch('http://localhost:3000/api/denuncia', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro interno no servidor.');
      }

      setSuccessData({
        protocolo: data.protocolo,
        senha: data.senha,
        deseja_retorno: data.deseja_retorno
      });

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao enviar denúncia. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTipo('');
    setSetor('');
    setDataFato('');
    setDescricao('');
    setDesejaRetorno(false);
    setFiles([]);
    setSuccessData(null);
    setErrorMsg(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:py-12 animate-fade-in-up">
      
      {/* Banner / Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 uppercase tracking-widest gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" /> Anonimato Assegurado
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mt-4 tracking-tight">
          Canal de Denúncias <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">Leão Escuta</span>
        </h1>
        <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-base leading-relaxed">
          Sua manifestação contribui para a melhoria contínua da saúde ocupacional. Relate riscos, assédios ou não conformidades com garantia legal de <strong>não-retaliação</strong> (NR-1 e Lei nº 14.457/2022).
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-red-800">Não foi possível processar:</h4>
            <p className="text-sm mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {successData ? (
        <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-green-200 text-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-green-50 border border-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Denúncia Registrada com Sucesso!</h3>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            O relato foi registrado de forma segura. Seu IP não foi coletado. O comitê de ética analisará os fatos em conformidade com as diretrizes da CIPA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Protocolo */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Número do Protocolo</span>
                <div className="text-xl sm:text-2xl font-mono font-bold text-teal-600 mt-1">{successData.protocolo}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(successData.protocolo, 'proto')}
                className={`mt-4 w-full flex items-center justify-center py-2 px-3 font-semibold rounded-lg text-xs transition-colors ${
                  copiedProtocol 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-100 text-teal-700 hover:bg-slate-200 hover:text-teal-800'
                }`}
              >
                {copiedProtocol ? (
                  <><Check className="h-4 w-4 mr-1" /> Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-1" /> Copiar Protocolo</>
                )}
              </button>
            </div>

            {/* Senha */}
            {successData.deseja_retorno && successData.senha && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Senha de Acompanhamento</span>
                  <div className="text-xl sm:text-2xl font-mono font-bold text-teal-600 mt-1">{successData.senha}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(successData.senha!, 'pass')}
                  className={`mt-4 w-full flex items-center justify-center py-2 px-3 font-semibold rounded-lg text-xs transition-colors ${
                    copiedSenha 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-100 text-teal-700 hover:bg-slate-200 hover:text-teal-800'
                  }`}
                >
                  {copiedSenha ? (
                    <><Check className="h-4 w-4 mr-1" /> Copiado!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> Copiar Senha</>
                  )}
                </button>
              </div>
            )}
          </div>

          {successData.deseja_retorno ? (
            <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
              <strong>Atenção:</strong> Guarde estes dados em local seguro. Por motivos de privacidade estrita, nós não podemos recuperar ou redefinir esta senha caso seja perdida.
            </div>
          ) : (
            <div className="mt-6 p-3 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-500">
              Você optou por não receber feedback. Seu relato servirá para alimentar as análises estatísticas do PGR.
            </div>
          )}

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm font-semibold transition-colors text-slate-700"
            >
              Enviar Novo Relato
            </button>
            {successData.deseja_retorno && (
              <button
                onClick={() => onNavigate('track')}
                className="px-5 py-2.5 rounded-lg btn-gold text-sm font-semibold transition-colors"
              >
                Acompanhar Status
              </button>
            )}
          </div>

        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-10 rounded-2xl shadow-xl space-y-6">
          
          {/* Identificação */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">1. Identificação do Risco</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tipo de Risco / Denúncia <span className="text-red-500">*</span>
                </label>
                <select 
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  required 
                  className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                >
                  <option value="" disabled>Selecione uma opção...</option>
                  <option value="Risco Psicossocial (assédio, sobrecarga, violência)">Risco Psicossocial (assédio, sobrecarga, violência)</option>
                  <option value="Condição Insegura">Condição Insegura (risco físico, falta de EPI)</option>
                  <option value="Assédio Sexual">Assédio Sexual</option>
                  <option value="Outros Riscos Ocupacionais">Outros Riscos Ocupacionais</option>
                  <option value="Sugestão de Melhoria">Sugestão de Melhoria (Saúde/Segurança)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Setor / Local do Fato <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  required 
                  placeholder="Ex: Produção, Expedição, Escritório Central" 
                  className="input-field w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Data aproximada do ocorrido <span className="text-red-500">*</span>
              </label>
              <input 
                type="date" 
                value={dataFato}
                onChange={(e) => setDataFato(e.target.value)}
                required 
                className="input-field w-full max-w-xs px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">2. Detalhamento do Fato</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descrição detalhada <span className="text-red-500">*</span>
              </label>
              <textarea 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={6} 
                required 
                placeholder="Descreva o que ocorreu de forma clara. Sugerimos não incluir nomes que identifiquem você, a menos que deseje de forma voluntária." 
                className="input-field w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-800 leading-relaxed"
              />
            </div>
          </div>

          {/* Anexos */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">3. Anexar Evidências (Opcional)</h3>
            <FileUploader onFilesChange={handleFilesChange} />
          </div>

          {/* Acompanhamento */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">4. Deseja acompanhar este relato?</h3>
            
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="deseja_retorno"
                checked={desejaRetorno}
                onChange={(e) => setDesejaRetorno(e.target.checked)}
                className="mt-1 h-4.5 w-4.5 rounded border-slate-300 bg-white text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="deseja_retorno" className="text-sm text-slate-700 leading-normal select-none cursor-pointer">
                <strong>Desejo receber retorno da apuração.</strong> Marque para gerar senha de acompanhamento.
              </label>
            </div>

            {desejaRetorno && (
              <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                Após o envio, geraremos uma senha. Você deverá salvá-la para consultar o andamento da apuração. Como não arquivamos e-mail ou dados de contato pessoais do denunciante, <strong>é impossível restaurar a senha caso seja esquecida</strong>.
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-gold w-full sm:w-auto px-8 py-3 rounded-lg text-white font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando envio...' : 'Enviar Denúncia Anônima'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
