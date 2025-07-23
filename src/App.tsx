import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/Auth/AuthContext';
import { TransactionsProvider } from './contexts/TransactionsContext';
import { SavingsGoalsProvider } from './contexts/SavingsGoalsContext';
import { StudentsProvider } from './contexts/StudentsContext';
// import { NotificationProvider } from './contexts/NotificationContext'; // Removed
import Login from './pages/Login'; // Updated import path and component name
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Transactions from './pages/Transactions';
import Reports from '././pages/Reports';
import UserManagement from './components/Users/UserManagement';
import SavingsSchedule from './pages/SavingsSchedule';
import ErrorBoundary from './components/ErrorBoundary';
import UpdatePassword from './pages/UpdatePassword';
import Recapitulasi from './pages/Recapitulasi';

function AppContent() {
  const { user, isLoading } = useAuth(); // Get isLoading from useAuth
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Show loading spinner while authentication is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user is not logged in, only show Login or UpdatePassword page
  if (!user) {
    return (
      <Routes>
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="*" element={<Login />} /> {/* Use the new Login component */}
      </Routes>
    );
  }

  const getPageTitle = () => {
    // Map current path to a title
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/students':
        return user.role === 'parent' ? 'Data Anak' : 'Manajemen Siswa';
      case '/transactions':
        return user.role === 'parent' ? 'Riwayat Transaksi' : 'Transaksi';
      case '/reports':
        return user.role === 'teacher' ? 'Rekapitulasi' : user.role === 'parent' ? 'Riwayat Transaksi' : 'Laporan';
      case '/users':
        return 'Manajemen Pengguna';
      case '/schedule':
        return 'Jadwal Menabung';
      case '/recapitulasi':
        return 'Rekapitulasi';
      default:
        return 'Dashboard'; // Fallback
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:inset-0 lg:w-64 lg:translate-x-0
        w-64
      `}>
        <Sidebar sidebarOpen={sidebarOpen} />
      </div>

      {/* Main content */}
      <div className={`
        flex-1 flex flex-col overflow-y-auto
        transition-all duration-300 ease-in-out
      `}>
        <Header 
          title={getPageTitle()}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-30" // Make header sticky
        />
        <main className="flex-1">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              {/* Authenticated routes */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/schedule" element={<SavingsSchedule />} />
              <Route path="/recapitulasi" element={<Recapitulasi />} />
              {/* Redirect root to dashboard if authenticated */}
              <Route path="/" element={<Dashboard />} />
              {/* Fallback for any other path within authenticated area */}
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
        {/* Global Footer */}
        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-card">
          SIBUDIS - Anang Creative Production
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StudentsProvider>
          {/* <NotificationProvider> */} {/* Removed NotificationProvider */}
            <TransactionsProvider>
              <SavingsGoalsProvider>
                <ErrorBoundary>
                  <AppContent />
                </ErrorBoundary>
              </SavingsGoalsProvider>
            </TransactionsProvider>
          {/* </NotificationProvider> */} {/* Removed NotificationProvider */}
        </StudentsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;