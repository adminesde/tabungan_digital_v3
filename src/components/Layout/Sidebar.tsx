import React from 'react';
import { 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LogOut,
  GraduationCap,
  TrendingUp,
  UploadCloud,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Link, useLocation } from 'react-router-dom'; // Import Link and useLocation

interface SidebarProps {
  sidebarOpen: boolean; // New prop to control text visibility
  className?: string; // New prop to accept dynamic classes
}

const menuItems = {
  admin: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'recap', label: 'Rekapitulasi', icon: BarChart3, path: '/recapitulasi' }, // Changed path to /recapitulasi
    { id: 'transactions', label: 'Transaksi', icon: CreditCard, path: '/transactions' },
    { id: 'schedule', label: 'Jadwal Menabung', icon: TrendingUp, path: '/schedule' },
    { id: 'users', label: 'Manajemen Pengguna', icon: Users, path: '/users' },
  ],
  teacher: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'students', label: 'Manajemen Siswa', icon: Users, path: '/students' },
    { id: 'savings', label: 'Tabungan Siswa', icon: CreditCard, path: '/transactions' },
    { id: 'schedule', label: 'Jadwal Menabung', icon: TrendingUp, path: '/schedule' }, // Re-added for teacher role
    { id: 'recap', label: 'Rekapitulasi', icon: BarChart3, path: '/recapitulasi' }, // Added for teacher
  ],
  parent: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    // Removed 'Data Anak' menu item as per request
    // { id: 'children', label: 'Data Anak', icon: Users, path: '/students' },
    { id: 'reports', label: 'Riwayat Transaksi', icon: TrendingUp, path: '/transactions' }, // Parent's 'reports' maps to transactions
    // { id: 'schedule', label: 'Jadwal Menabung', icon: TrendingUp, path: '/schedule' }, // Removed for parent
  ],
};

export default function Sidebar({ sidebarOpen, className }: SidebarProps) { // Added sidebarOpen prop and className
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation(); // Get current location

  if (!user) return null;

  const items = menuItems[user.role] || [];

  const getUserDisplayName = () => {
    if (user.role === 'parent' && user.studentInfo) {
      return user.studentInfo.name;
    }
    return user.name;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return role;
    }
  };

  const isParent = user?.role === 'parent';

  return (
    <div className={`${className} bg-card text-card-foreground shadow-lg h-full flex flex-col`}> {/* Apply dynamic className here */}
      <div className={`p-6 border-b border-border flex items-center justify-between`}>
        <div className={`flex items-center space-x-3 ${sidebarOpen ? 'flex' : 'hidden lg:flex'}`}> {/* Conditionally hide on mobile when closed */}
          <div className={`w-10 h-10 ${isParent ? 'bg-accent-green' : 'bg-primary'} rounded-full flex items-center justify-center`}>
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground whitespace-nowrap">
              <span className="hidden sm:inline">Tabungan Digital</span>
              <span className="inline sm:hidden">SIBUDIS</span> {/* Shorter text for mobile */}
            </h2>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              <span className="hidden sm:inline">SD Negeri Dukuhwaru 01</span>
              <span className="inline sm:hidden">SDN Dukuhwaru 01</span> {/* Shorter text for mobile */}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <nav className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path; // Check if current path matches item's path
            return (
              <Link
                key={item.id}
                to={item.path} // Use Link to navigate
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  group
                `}
              >
                <Icon className="w-5 h-5" />
                <span className={`
                  font-medium whitespace-nowrap ${sidebarOpen ? 'block' : 'hidden lg:block'}
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`p-4 border-t border-border`}>
        <div className="mb-4">
          <button
            onClick={toggleTheme}
            className={`
              w-full flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors
            `}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            </span>
          </button>
        </div>
        <div className={`flex items-center space-x-3 mb-4 ${sidebarOpen ? 'flex' : 'hidden lg:flex'}`}> {/* Conditionally hide on mobile when closed */}
          <div className={`w-8 h-8 ${isParent ? 'bg-accent-green' : 'bg-primary'} rounded-full flex items-center justify-center`}>
            <span className="text-sm font-medium text-primary-foreground">
              {user.name.charAt(0)}
            </span>
          </div>
          <div className={`flex-1 min-w-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}> {/* Conditionally hide on mobile when closed */}
            <p className="text-sm font-medium text-foreground capitalize">{getRoleLabel(user.role)}</p> {/* Role on first line */}
            <p className="text-xs text-muted-foreground truncate">{getUserDisplayName()}</p> {/* Name/Child's Name on second line */}
          </div>
        </div>
        <button
          onClick={logout}
          className={`
            w-full flex items-center space-x-3 px-4 py-2 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors
          `}
        >
          <LogOut className="w-4 h-4" />
          <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>Keluar</span> {/* Conditionally hide on mobile when closed */}
        </button>
      </div>
    </div>
  );
}