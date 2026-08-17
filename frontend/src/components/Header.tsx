import React from 'react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  adminName?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, adminName, onLogout }) => {
  return (
    <header className="glass-panel sticky top-0 z-50 border-b border-slate-200/80 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            onClick={() => onNavigate('form')} 
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-2.5 rounded-xl shadow-lg shadow-teal-600/10 group-hover:scale-105 transition-transform duration-300">
              <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2-2 0-3 .9-3 3H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-teal-600 transition-colors duration-300">
                Leão <span className="text-teal-600 font-extrabold">Escuta</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Canal Anônimo NR-1</span>
            </div>
          </div>
          <nav className="flex items-center space-x-1 sm:space-x-4">
            {!adminName ? (
              <>
                <button 
                  onClick={() => onNavigate('form')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 'form' 
                      ? 'text-teal-700 bg-teal-50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Denunciar
                </button>
                <button 
                  onClick={() => onNavigate('track')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 'track' 
                      ? 'text-teal-700 bg-teal-50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Acompanhar
                </button>
                <div className="h-5 w-[1px] bg-slate-200 mx-2"></div>
                <button 
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 border border-slate-200 hover:border-teal-500/40 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                >
                  Painel Admin
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    currentPage === 'dashboard' || currentPage === 'detail'
                      ? 'text-teal-700 bg-teal-50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dashboard
                </button>
                <div className="h-5 w-[1px] bg-slate-200 mx-2"></div>
                <div className="hidden sm:flex flex-col items-end text-xs mr-2">
                  <span className="font-semibold text-slate-800">{adminName}</span>
                  <span className="text-[10px] text-slate-500">Administrador</span>
                </div>
                <button 
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600"
                >
                  Sair
                </button>
              </>
            )}
          </nav>
          
        </div>
      </div>
    </header>
  );
};
