import React, { useState } from 'react';
import { Bell, Search, Menu, User, Settings, LogOut, Camera } from 'lucide-react';
import { useAuth } from '../../contexts/Auth/AuthContext'; // Updated path
// import { useNotifications } from '../../contexts/NotificationContext'; // Removed
import ProfileDropdown from './ProfileDropdown';
// import NotificationList from '../Notifications/NotificationList'; // Removed
import ProfileModal from './ProfileModal'; // Import ProfileModal
import { Button } from '../ui/button'; // Import Button component

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  className?: string; // New prop to accept dynamic classes
}

export default function Header({ title, onMenuClick, className }: HeaderProps) {
  const { user, logout } = useAuth();
  // const { notifications } = useNotifications(); // Removed
  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  // const [showNotificationDropdown, setShowNotificationDropdown] = useState(false); // Removed
  const [showProfileModal, setShowProfileModal] = useState(false); // New state for ProfileModal
  const [initialModalTab, setInitialModalTab] = useState<'profile' | 'password' | 'delete'>('profile'); // New state for initial tab

  // const unreadCount = notifications.filter(n => !n.isRead).length; // Removed

  const getUserDisplayName = () => {
    if (user?.role === 'parent' && user.studentInfo) {
      return user.studentInfo.name;
    }
    return user?.name;
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return '';
    }
  };

  const handleOpenProfileModal = (tab: 'profile' | 'password' | 'delete') => {
    setInitialModalTab(tab);
    setShowProfileModal(true);
    setShowProfileDropdown(false); // Close dropdown when modal opens
  };

  return (
    <header className={`${className} px-6 py-4`}> {/* Apply dynamic className here */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden text-gray-300 hover:bg-theme-light-bg hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-sm text-gray-300 capitalize">
              Selamat datang, <span className="hidden sm:inline">{user?.name}</span>
              <span className="inline sm:hidden">{user?.name.split(' ')[0]}</span> {/* Show first name on small screens */}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search bar removed as per request */}
          
          {/* Removed Notification Bell and Dropdown */}
          {/* <div className="relative group">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="relative text-gray-300 hover:text-white hover:bg-theme-light-bg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full flex items-center justify-center text-xs text-white">
                  {unreadCount}
                </span>
              )}
              <span className="hidden lg:hidden group-hover:block absolute top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Notifikasi</span>
            </Button>
            {showNotificationDropdown && (
              <NotificationList onClose={() => setShowNotificationDropdown(false)} />
            )}
          </div> */}
          
          <div className="relative group"> {/* Added group for hover effect */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="w-8 h-8 bg-accent-blue rounded-full flex items-center justify-center hover:bg-accent-blue transition-colors p-0" // p-0 to allow img to fill
            >
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-sm font-medium text-white">
                  {user?.name.charAt(0)}
                </span>
              )}
              <span className="hidden lg:hidden group-hover:block absolute top-full mt-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">Profil</span> {/* Hover text */}
            </Button>
            
            {showProfileDropdown && (
              <ProfileDropdown 
                onClose={() => setShowProfileDropdown(false)}
                onOpenProfileModal={handleOpenProfileModal} // Pass the new handler
              />
            )}
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          initialTab={initialModalTab} 
        />
      )}
    </header>
  );
}