import React from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import ParentDashboard from './ParentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  // Route to appropriate dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    default:
      return <div>Role tidak dikenali</div>;
  }
}