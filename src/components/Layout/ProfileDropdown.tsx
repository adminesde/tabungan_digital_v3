import React, { useState } from 'react';
import { useAuth } from '../../contexts/Auth/AuthContext'; 
import { User, Settings, LogOut, Camera, Lock, Edit, Trash2 } from 'lucide-react'; // Import Trash2
import { Button } from '../ui/button'; // Import Button component

interface ProfileDropdownProps {
  onClose: () => void;
  onOpenProfileModal: (tab: 'profile' | 'password') => void; // Removed 'delete' from initialTab
}

export default function ProfileDropdown({ onClose, onOpenProfileModal }: ProfileDropdownProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleProfileClick = () => {
    onOpenProfileModal('profile');
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

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

  return (
    <>
      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent-blue rounded-full flex items-center justify-center relative">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover" 
                />
              ) : (
                <span className="text-lg font-medium text-white">
                  {user.name.charAt(0)}
                </span>
              )}
              {/* Removed avatar upload icon */}
            </div>
            <div>
              <p className="font-medium text-gray-900 capitalize">{getRoleLabel(user.role)}</p> {/* Role on first line */}
              <p className="text-sm text-gray-700">{getUserDisplayName()}</p> {/* Name/Child's Name on second line */}
              {user.class && user.role === 'teacher' && ( // Only show class for teacher
                <p className="text-xs text-accent-blue">Kelas {user.class}</p>
              )}
            </div>
          </div>
        </div>

        <div className="py-2">
          <Button
            variant="ghost"
            onClick={handleProfileClick}
            className="w-full flex items-center justify-start space-x-3 px-4 py-2"
          >
            <User className="w-4 h-4" />
            <span>Profil Saya</span>
          </Button>
          
          {/* Removed Reset Password button */}
          {/* Removed Hapus Akun button */}
          
          {/* Removed Pengaturan button */}
        </div>

        <div className="border-t border-gray-200 py-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full flex items-center justify-start space-x-3 px-4 py-2 text-accent-red hover:text-accent-red"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </>
  );
}