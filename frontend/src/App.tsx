import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ComplaintForm } from './pages/ComplaintForm';
import { TrackComplaint } from './pages/TrackComplaint';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDetail } from './pages/AdminDetail';

interface AdminData {
  id: number;
  nome: string;
  email: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('form');
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminData | null>(null);

  // Carregar token e dados do admin se salvos localmente
  useEffect(() => {
    const savedToken = localStorage.getItem('leao_admin_token');
    const savedAdmin = localStorage.getItem('leao_admin_data');
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLoginSuccess = (newToken: string, adminData: AdminData) => {
    setToken(newToken);
    setAdmin(adminData);
    localStorage.setItem('leao_admin_token', newToken);
    localStorage.setItem('leao_admin_data', JSON.stringify(adminData));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('leao_admin_token');
    localStorage.removeItem('leao_admin_data');
    setCurrentPage('form');
  };

  const navigateTo = (page: string) => {
    // Proteger rotas admin se não autenticado
    if ((page === 'dashboard' || page === 'detail') && !token) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
    setSelectedComplaintId(null);
  };

  const navigateToDetail = (id: number) => {
    if (!token) {
      setCurrentPage('login');
      return;
    }
    setSelectedComplaintId(id);
    setCurrentPage('detail');
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'form':
        return <ComplaintForm onNavigate={navigateTo} />;
      case 'track':
        return <TrackComplaint />;
      case 'login':
        return <AdminLogin onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return token ? (
          <AdminDashboard token={token} onNavigateDetail={navigateToDetail} />
        ) : (
          <AdminLogin onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />
        );
      case 'detail':
        return token && selectedComplaintId !== null ? (
          <AdminDetail 
            id={selectedComplaintId} 
            token={token} 
            onNavigateBack={() => navigateTo('dashboard')} 
          />
        ) : (
          <AdminLogin onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} />
        );
      default:
        return <ComplaintForm onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 flex flex-col min-h-screen">
      <Header 
        currentPage={currentPage} 
        onNavigate={navigateTo} 
        adminName={admin?.nome} 
        onLogout={handleLogout} 
      />
      <main className="flex-grow">
        {renderActivePage()}
      </main>
      <Footer />
    </div>
  );
}
