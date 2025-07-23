import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext'; // Import useTransactions
import { useSavingsGoals } from '../contexts/SavingsGoalsContext'; // Import useSavingsGoals
import StatsCard from '../components/Dashboard/StatsCard';
import TransactionList from '../components/Transactions/TransactionList';
import { Users, DollarSign, TrendingUp, TrendingDown, Target, Calendar, Clock, GraduationCap, RefreshCw } from 'lucide-react'; // Add new icons
import { SavingsGoal, User as SupabaseUser } from '../types'; // Import SavingsGoal type and User as SupabaseUser
import { Button } from '../components/ui/button'; // Import Button component
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '../integrations/supabase/client'; // Import supabase

export default function ParentDashboard() {
  const { user } = useAuth();
  const { students: allStudents, fetchStudents } = useStudents(); // Get fetchStudents
  const { transactions: allTransactions, fetchTransactions } = useTransactions(); // Get all transactions and fetchTransactions
  const { savingsGoals, fetchSavingsGoals } = useSavingsGoals(); // Get savings goals and fetchSavingsGoals
  const navigate = useNavigate(); // Initialize useNavigate
  const [allUsers, setAllUsers] = useState<SupabaseUser[]>([]); // New state for all users

  useEffect(() => {
    fetchStudents();
    fetchTransactions();
    fetchSavingsGoals(); // Fetch savings goals
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for parent dashboard:", error);
      } else {
        const fetchedUsers: SupabaseUser[] = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          role: profile.role as 'admin' | 'teacher' | 'parent',
          class: profile.class || undefined,
          createdAt: profile.created_at,
          isActive: profile.is_active,
        }));
        setAllUsers(fetchedUsers);
      }
    };
    fetchUsers();
  }, [fetchStudents, fetchTransactions, fetchSavingsGoals]); // Added fetchSavingsGoals to dependencies

  if (!user || user.role !== 'parent') return null;

  // RLS on Supabase ensures only children's data is fetched for parents.
  // No need for client-side filtering here.
  const childrenStudents = allStudents; 
  const childrenTransactions = allTransactions;

  const totalBalance = childrenStudents.reduce((sum, student) => sum + student.balance, 0);
  
  const totalDeposits = childrenTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalWithdrawals = childrenTransactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const translateDayOfWeek = (day: string) => {
    switch (day) {
      case 'Monday': return 'Senin';
      case 'Tuesday': return 'Selasa';
      case 'Wednesday': return 'Rabu';
      case 'Thursday': return 'Kamis';
      case 'Friday': return 'Jumat';
      case 'Saturday': return 'Sabtu';
      case 'Sunday': return 'Minggu';
      default: return day;
    }
  };

  const getRecentTransactions = () => {
    return childrenTransactions.slice(0, 3); // Limit to 3 transactions
  };

  const getFilteredAndCalculatedGoals = () => {
    const childrenClasses = [...new Set(childrenStudents.map(s => s.class))];
    
    return savingsGoals
      .filter(goal => goal.type === 'class' && goal.classId && childrenClasses.includes(goal.classId))
      .map(goal => {
        const studentsInClass = allStudents.filter(s => s.class === goal.classId); // Use allStudents to get all students in class
        const currentSaved = studentsInClass.reduce((sum, s) => sum + s.balance, 0);
        let status: 'on-track' | 'behind' | 'completed' = 'on-track';
        if (currentSaved >= goal.goalAmount) {
          status = 'completed';
        } else if (currentSaved < goal.goalAmount * 0.8 && currentSaved < goal.goalAmount) {
          status = 'behind';
        } else {
          status = 'on-track';
        }

        // Find the teacher for this class
        const teacher = allUsers.find(u => u.role === 'teacher' && u.class === goal.classId);
        const teacherName = teacher ? teacher.name : 'Tidak Diketahui';

        return { ...goal, currentSavedAmount: currentSaved, status, teacherName };
      });
  };

  const parentClassGoals = getFilteredAndCalculatedGoals();

  return (
    <div className="space-y-6">
      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Orang Tua</h1>
        <p className="text-gray-600">Pantau tabungan anak-anak Anda</p>
      </div>

      {/* New Section: Data Anak (moved here) */}
      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Data Anak
        </h2>
        <div className="space-y-3">
          {childrenStudents
            .sort((a, b) => b.balance - a.balance)
            .map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">NISN: {student.studentId} • Kelas {student.class}</p>
                  <p className="text-xs text-gray-500">Orang Tua: {user.name}</p> {/* Display parent's name */}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-accent-green">
                    {formatCurrency(student.balance)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Tabungan Anak"
          value={formatCurrency(totalBalance)}
          icon={DollarSign}
          color="green"
        />
        
        <StatsCard
          title="Total Setoran"
          value={formatCurrency(totalDeposits)}
          icon={TrendingUp}
          color="blue"
        />
        
        <StatsCard
          title="Total Penarikan"
          value={formatCurrency(totalWithdrawals)}
          icon={TrendingDown}
          color="orange"
        />
      </div>

      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaksi Terbaru
          </h2>
          {childrenTransactions.length > 3 && ( // Show button only if there are more than 3 transactions
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => navigate('/transactions')}
              className="text-accent-blue hover:underline p-0 h-auto"
            >
              Lihat Semua
            </Button>
          )}
        </div>
        <TransactionList 
          transactions={getRecentTransactions()}
          students={allStudents}
          showStudentInfo={false}
        />
      </div>

      {/* Existing Jadwal Menabung Kelas Anak */}
      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Jadwal Menabung Kelas Anak
          </h2>
          <Button 
            onClick={fetchSavingsGoals} // Refresh button
            className="flex items-center space-x-2"
            variant="outline"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
        {parentClassGoals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada jadwal menabung kelas untuk anak Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentClassGoals.map((goal) => (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-theme-border-light p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-icon-blue-bg rounded-lg">
                      <Target className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tabungan Kelas</h3> {/* Fixed title */}
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>Kelas {goal.classId}</span>
                      </p>
                      <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                        <Users className="w-3 h-3" />
                        <span>Guru: {goal.teacherName}</span>
                      </p>
                    </div>
                  </div>
                  {/* Removed status display */}
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  {/* Removed Target, Terkumpul, Target Tanggal */}
                  {goal.dayOfWeek && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>Hari Rutin:</span>
                      </div>
                      <span className="font-semibold">{translateDayOfWeek(goal.dayOfWeek)}</span>
                    </div>
                  )}
                </div>

                {/* Removed progress bar */}
                {/* Removed edit/delete buttons */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}