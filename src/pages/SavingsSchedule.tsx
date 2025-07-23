import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext';
import { useSavingsGoals } from '../contexts/SavingsGoalsContext';
import { useStudents } from '../contexts/StudentsContext';
import { Target, DollarSign, Calendar, CheckCircle, XCircle, Clock, Plus, Edit, Trash2, ArrowLeft, ArrowRight, GraduationCap, Users, RefreshCw } from 'lucide-react';
import SavingsGoalForm from '../components/Savings/SavingsGoalForm';
import { SavingsGoal, User as SupabaseUser } from '../types';
import { Button } from '../components/ui/button';
import { supabase } from '../integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'; // Corrected import path

export default function SavingsSchedule() {
  const { user } = useAuth();
  const { students: allStudents } = useStudents();
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, fetchSavingsGoals } = useSavingsGoals();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<{ id: string; name: string } | null>(null); // New state for goal to delete
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [allUsers, setAllUsers] = useState<SupabaseUser[]>([]);

  useEffect(() => {
    fetchSavingsGoals();
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for savings schedule:", error);
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
  }, [fetchSavingsGoals]);

  if (!user) return null;

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

  const getFilteredGoals = () => {
    let filtered = savingsGoals.filter(goal => goal.type === 'class');

    if (user.role === 'teacher') {
      filtered = filtered.filter(goal => goal.classId === user.class);
    }
    if (user.role === 'parent') {
      const childrenClasses = [...new Set(allStudents.filter(s => s.parentId === user.id).map(s => s.class))];
      filtered = filtered.filter(goal => goal.classId && childrenClasses.includes(goal.classId));
    }

    return filtered.map(goal => {
      const studentsInClass = allStudents.filter(s => s.class === goal.classId);
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

  const filteredGoals = getFilteredGoals();

  // Pagination
  const totalPages = Math.ceil(filteredGoals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGoals = filteredGoals.slice(startIndex, startIndex + itemsPerPage);

  const handleAddGoal = () => {
    setEditingGoal(null);
    setShowForm(true);
  };

  const handleSubmitGoal = async (data: {
    classId: string;
    goalName: string; 
    goalAmount: number; 
    targetDate: string;
    dayOfWeek: string;
  }) => {
    let success = false;
    if (editingGoal) {
      const updatedGoal: SavingsGoal = {
        ...editingGoal,
        ...data,
        goalAmount: data.goalAmount,
      };
      success = await updateSavingsGoal(updatedGoal);
    } else {
      success = await addSavingsGoal(data);
    }
    if (success) {
      setShowForm(false);
    }
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDeleteClick = (goalId: string, goalName: string) => {
    setGoalToDelete({ id: goalId, name: goalName });
  };

  const handleConfirmDelete = async () => {
    if (goalToDelete) {
      const success = await deleteSavingsGoal(goalToDelete.id);
      if (success) {
        // UI will update via real-time listener
      }
      setGoalToDelete(null); // Clear the state after deletion
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jadwal Menabung</h1>
          <p className="text-gray-600">
            {user.role === 'parent' 
              ? 'Pantau tujuan tabungan kelas anak Anda'
              : 'Kelola dan pantau tujuan tabungan per kelas'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchSavingsGoals}
            className="flex items-center space-x-2"
            variant="outline"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {user.role === 'admin' && (
            <Button 
              onClick={handleAddGoal}
              className="flex items-center space-x-2"
              variant="accent-blue"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Tujuan</span>
            </Button>
          )}
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada tujuan tabungan kelas</h3>
          <p className="text-gray-500">Tujuan tabungan kelas akan muncul di sini setelah dibuat oleh admin.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedGoals.map((goal) => (
              <div key={goal.id} className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-icon-blue-bg rounded-lg">
                      <Target className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{goal.goalName}</h3>
                      <p className="text-sm text-gray-500 flex items-center space-x-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>Kelas {goal.classId}</span>
                      </p>
                      {(user.role === 'admin' || user.role === 'teacher') && (
                        <p className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
                          <Users className="w-3 h-3" />
                          <span>Guru: {goal.teacherName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.status === 'completed' ? 'bg-green-100 text-accent-green' :
                      goal.status === 'on-track' ? 'bg-blue-100 text-accent-blue' :
                      'bg-red-100 text-accent-red'
                    }`}>
                      {goal.status === 'completed' ? 'Selesai' :
                       goal.status === 'on-track' ? 'Sesuai Target' : 'Tertinggal'}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  {user.role === 'admin' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>Target:</span>
                        </div>
                        <span className="font-semibold text-accent-blue">{formatCurrency(goal.goalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>Terkumpul:</span>
                        </div>
                        <span className="font-semibold text-accent-green">{formatCurrency(goal.currentSavedAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Target Tanggal:</span>
                        </div>
                        <span className="font-semibold">{formatDate(goal.targetDate)}</span>
                      </div>
                    </>
                  )}
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

                {user.role === 'admin' && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-accent-blue h-2.5 rounded-full"
                        style={{ width: `${Math.min(100, (goal.currentSavedAmount / goal.goalAmount) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs text-gray-500 mt-1">
                      {Math.round((goal.currentSavedAmount / goal.goalAmount) * 100)}% tercapai
                    </p>
                  </div>
                )}

                {user.role === 'admin' && (
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      onClick={() => handleEditGoal(goal)}
                      className="text-sm flex items-center space-x-1"
                      variant="accent-blue"
                      size="sm"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          onClick={() => handleDeleteClick(goal.id, goal.goalName)}
                          className="text-sm flex items-center space-x-1"
                          variant="accent-red"
                          size="sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus tujuan "{goalToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={handleConfirmDelete} className="bg-accent-red hover:bg-red-700 text-white">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-4 py-3 bg-theme-content-bg border border-theme-border-light rounded-lg">
              <div className="text-sm text-gray-700">
                Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredGoals.length)} dari {filteredGoals.length} tujuan
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-sm"
                  variant="outline"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="text-sm"
                  variant="outline"
                  size="sm"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showForm && (
        <SavingsGoalForm
          goal={editingGoal}
          onSubmit={handleSubmitGoal}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}