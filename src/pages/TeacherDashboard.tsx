import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext'; // Import useTransactions
import StatsCard from '../components/Dashboard/StatsCard';
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button'; // Import Button component
import { useNavigate } from 'react-router-dom'; // Import useNavigate

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { students: allStudents } = useStudents();
  const { transactions: allTransactions } = useTransactions(); // Get all transactions and fetchTransactions
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate(); // Initialize useNavigate

  if (!user || user.role !== 'teacher') return null;

  // Filter students by teacher's class
  const classStudents = allStudents.filter(student => student.class === user.class);
  const classStudentIds = classStudents.map(s => s.id);
  
  // Filter transactions for this class
  const classTransactions = allTransactions.filter(t => 
    classStudentIds.includes(t.studentId)
  );

  // Calculate daily statistics
  const todayTransactions = classTransactions.filter(t => 
    t.date.startsWith(selectedDate)
  );

  const totalStudents = classStudents.length;
  const totalClassBalance = classStudents.reduce((sum, student) => sum + student.balance, 0);
  const dailyDeposits = todayTransactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);
  const dailyWithdrawals = todayTransactions
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Guru</h1>
            <p className="text-gray-600">Selamat datang, {user.name}!</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Kelas yang Diajar:</p>
            <p className="text-lg font-semibold text-accent-green">Kelas {user.class}</p>
          </div>
        </div>
      </div>

      {/* Class Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Statistik Kelas {user.class} (Keseluruhan)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Siswa"
            value={totalStudents.toString()}
            icon={Users}
            color="blue"
            // trend={{ value: "siswa di kelas Anda", isPositive: true }} // Removed
          />
          
          <StatsCard
            title="Total Saldo Kelas"
            value={formatCurrency(totalClassBalance)}
            icon={DollarSign}
            color="green"
            // trend={{ value: "Jumlah saldo semua siswa", isPositive: true }} // Removed
          />
          
          <StatsCard
            title="Total Setoran Kelas"
            value={formatCurrency(classTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0))}
            icon={TrendingUp}
            color="blue"
            // trend={{ value: "Total uang masuk", isPositive: true }} // Removed
          />
          
          <StatsCard
            title="Total Penarikan Kelas"
            value={formatCurrency(classTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0))}
            icon={TrendingDown}
            color="orange"
            // trend={{ value: "Total uang keluar", isPositive: false }} // Removed
          />
        </div>
      </div>

      {/* Daily Statistics */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Statistik Harian Kelas {user.class}
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <label className="text-sm font-medium text-gray-700">Pilih Tanggal:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-green focus:border-transparent"
            />
            <button 
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-3 py-1 bg-accent-green text-white rounded-lg hover:bg-accent-green transition-colors text-sm"
            >
              Reset ke Hari Ini
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-icon-green-bg rounded-lg">
                <TrendingUp className="w-6 h-6 text-accent-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Setoran Harian</p>
                <p className="text-2xl font-bold text-accent-green">{formatCurrency(dailyDeposits)}</p>
                <p className="text-xs text-gray-500 mt-1">Total setoran hari ini</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-icon-red-bg rounded-lg">
                <TrendingDown className="w-6 h-6 text-accent-red" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Penarikan Harian</p>
                <p className="text-2xl font-bold text-accent-red">{formatCurrency(dailyWithdrawals)}</p>
                <p className="text-xs text-gray-500 mt-1">Total penarikan hari ini</p>
              </div>
            </div>
          </div>

          <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-icon-blue-bg rounded-lg">
                <DollarSign className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Bersih Harian</p>
                <p className={`text-2xl font-bold ${dailyDeposits - dailyWithdrawals >= 0 ? 'text-accent-blue' : 'text-accent-red'}`}>
                  {formatCurrency(dailyDeposits - dailyWithdrawals)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Perubahan saldo hari ini</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6"> {/* Added shadow-md */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Transaksi Terbaru (Kelas {user.class})
          </h2>
          {todayTransactions.length > 3 && ( // Show button only if there are more than 3 transactions
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
        
        {todayTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada transaksi terbaru untuk kelas ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTransactions.slice(0, 3).map((transaction) => { // Limit to 3 transactions
              const student = classStudents.find(s => s.id === transaction.studentId);
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'deposit' ? 'bg-icon-green-bg' : 'bg-icon-red-bg'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <TrendingUp className="w-4 h-4 text-accent-green" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-accent-red" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student?.name}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'deposit' ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saldo: {formatCurrency(transaction.balance)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}