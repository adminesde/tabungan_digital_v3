import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext'; // Import useTransactions
import TransactionList from '../components/Transactions/TransactionList';
import TransactionForm from '../components/Transactions/TransactionForm';
import { Plus, Filter, Calendar, Trash2, GraduationCap } from 'lucide-react';
import { Transaction } from '../types';
import { Button } from '../components/ui/button'; // Import Button component
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

export default function Transactions() {
  const { user } = useAuth();
  const { students: allStudents } = useStudents(); // Renamed to avoid conflict
  const { transactions, addTransaction, resetTransactions, fetchTransactions } = useTransactions(); // Get from context
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState(''); // Changed to string for date input
  const [filterClass, setFilterClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchTransactions(); // Fetch transactions when component mounts
  }, [fetchTransactions]);

  if (!user) return null;

  // Filter students based on user role for the TransactionForm dropdown
  const studentsForForm = user.role === 'teacher' 
    ? allStudents.filter(s => s.class === user.class)
    : allStudents;

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    // Changed date filtering to match full date string (YYYY-MM-DD)
    const matchesDate = !filterDate || transaction.date.startsWith(filterDate); 

    // Filter by class for admin, or by teacher's own class for teacher
    const matchesClass = (user.role === 'admin' && (!filterClass || allStudents.some(s => s.id === transaction.studentId && s.class === filterClass))) ||
                         (user.role === 'teacher' && allStudents.some(s => s.id === transaction.studentId && s.class === user.class)) ||
                         (user.role === 'parent' && allStudents.some(s => s.id === transaction.studentId && s.parentId === user.id));
    
    return matchesType && matchesDate && matchesClass;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const classes = [...new Set(allStudents.map(s => s.class))].sort();

  const handleSubmitTransaction = async (data: {
    studentId: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    description: string;
  }) => {
    const success = await addTransaction(data, user.name, user.role as 'admin' | 'teacher');
    if (success) {
      setShowForm(false);
    }
  };

  const handleResetHistoryClick = () => {
    // This will be handled by AlertDialogAction
  };

  const handleConfirmResetHistory = async () => {
    const success = await resetTransactions();
    if (success) {
      // UI will update via real-time listener
    }
  };

  const canCreateTransaction = user.role === 'admin' || user.role === 'teacher';

  const getTitle = () => {
    switch (user.role) {
      case 'admin':
      case 'teacher':
        return 'Transaksi';
      case 'parent':
        return 'Riwayat Transaksi';
      default:
        return 'Transaksi';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600">
            {user.role === 'parent' 
              ? 'Riwayat setoran dan penarikan anak-anak Anda'
              : 'Kelola transaksi setoran dan penarikan siswa'
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {user.role === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleResetHistoryClick}
                  className="flex items-center space-x-2"
                  variant="accent-red"
                  title="Reset Histori"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Reset Histori</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Reset Riwayat Transaksi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan dan akan mereset semua saldo siswa menjadi nol.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmResetHistory} className="bg-accent-red hover:bg-red-700 text-white">
                    Reset Sekarang
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {canCreateTransaction && (
            <Button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2"
              variant="accent-blue"
              title="Transaksi Baru"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Transaksi Baru</span>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            >
              <option value="all">Semua Transaksi</option>
              <option value="deposit">Setoran</option>
              <option value="withdrawal">Penarikan</option>
            </select>
          </div>
          
          {(user.role === 'admin') && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <select
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              >
                <option value="">Semua Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>
        </div>

        <TransactionList 
          transactions={paginatedTransactions}
          students={allStudents}
          showStudentInfo={user.role !== 'parent'}
          showPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showForm && (
        <TransactionForm
          students={studentsForForm}
          onSubmit={handleSubmitTransaction}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}