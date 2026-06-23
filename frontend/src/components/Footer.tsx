import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 mt-12 py-8 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-slate-600">
          
          {/* Bloco Institucional / Lei */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Conformidade Legal & Integridade</span>
            </div>
            <p className="leading-relaxed text-[13px]">
              Este canal atende os requisitos do <strong>Programa de Gerenciamento de Riscos (PGR)</strong> da <strong>NR-1</strong> e da <strong>Lei nº 14.457/2022</strong>, garantindo um canal de recebimento e apuração de denúncias de assédio e outras irregularidades ocupacionais.
            </p>
          </div>

          {/* Bloco Segurança / Anonimato */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Garantia de Anonimato</span>
            </div>
            <p className="leading-relaxed text-[13px]">
              Não salvamos ou rastreamos o seu endereço IP nem metadados de rede. Seu relato é totalmente confidencial e seguro contra retaliações corporativas.
            </p>
          </div>

          {/* Bloco Canal Integrado */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-800 font-semibold">
              <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Trilha de Auditoria do PGR</span>
            </div>
            <p className="leading-relaxed text-[13px]">
              As denúncias fornecem dados essenciais para mapeamento de perigos psicossociais e físicos e implementação de medidas corretivas na Comissão Interna de Prevenção de Acidentes (CIPA).
            </p>
          </div>

        </div>

        <hr className="border-slate-200 my-6" />

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <div>
            © 2026 Leão Escuta - Canal de Denúncias Anônimas NR-1. Todos os direitos reservados.
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-400">Políticas de Privacidade</a>
            <span>•</span>
            <a href="#" className="hover:text-slate-400">Termos de Uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
