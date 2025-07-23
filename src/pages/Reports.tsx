import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import { useStudents } from '../contexts/StudentsContext';
import { useTransactions } from '../contexts/TransactionsContext'; // Import useTransactions
import { Plus, Filter, Calendar, Trash2, GraduationCap, Download, ArrowLeft, ArrowRight, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { jsPDF } from 'jspdf'; // Import jsPDF
import { supabase } from '../integrations/supabase/client';
import { User } from '../types';
import { Button } from '../components/ui/button'; // Import Button component

export default function Reports() {
  const { user } = useAuth();
  const { students: allStudents } = useStudents();
  const { transactions: allTransactions } = useTransactions(); // Import allTransactions
  const [allUsers, setAllUsers] = useState<User[]>([]); // To get parent names
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for reports:", error);
      } else {
        const fetchedUsers: User[] = data.map(profile => ({
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
  }, []);

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
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFilteredData = () => {
    let students = allStudents;
    let transactions = allTransactions;

    // Filter by date range
    if (startDate && endDate) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return transactionDate >= start && transactionDate <= end;
      });
    }
    if (user.role === 'parent') {
      const childrenIds = students.filter(s => s.parentId === user.id).map(s => s.id);
      students = students.filter(s => s.parentId === user.id);
      transactions = transactions.filter(t => childrenIds.includes(t.studentId));
    }
    if (user.role === 'teacher') {
      const teacherClass = user.class;
      const classStudentIds = students.filter(s => s.class === teacherClass).map(s => s.id);
      students = students.filter(s => s.class === teacherClass);
      transactions = transactions.filter(t => classStudentIds.includes(t.studentId));
    }

    if (selectedClass) {
      const classStudentIds = students.filter(s => s.class === selectedClass).map(s => s.id);
      transactions = transactions.filter(t => classStudentIds.includes(t.studentId));
    }

    return { students, transactions };
  };

  const { students, transactions } = getFilteredData();

  const totalDeposits = transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = students.reduce((sum, s) => sum + s.balance, 0);

  const classes = [...new Set(allStudents.map(s => s.class))].sort();

  const getStudentSummary = () => {
    return students.map(student => {
      const studentTransactions = transactions.filter(t => t.studentId === student.id);
      const deposits = studentTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      const withdrawals = studentTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...student,
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        transactionCount: studentTransactions.length,
      };
    });
  };

  const studentSummary = getStudentSummary();

  // Pagination for student summary
  const totalPages = Math.ceil(studentSummary.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudentSummary = studentSummary.slice(startIndex, startIndex + itemsPerPage);
  
  const getTitle = () => {
    switch (user.role) {
      case 'admin': return 'Laporan';
      case 'teacher': return 'Rekapitulasi';
      case 'parent': return 'Riwayat Transaksi';
      default: return 'Laporan';
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const lineHeight = 7;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Print Date in top right
    doc.setFontSize(8);
    doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' });
    y += 10; // Adjust y after adding print date

    doc.setFontSize(16);
    doc.text('Laporan Tabungan Siswa', pageWidth / 2, y, { align: 'center' });
    y += 10;
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    if (selectedClass) {
      doc.text(`Kelas: ${selectedClass}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
    }
    y += 15;

    doc.setFontSize(12);
    doc.text('Ringkasan Global:', margin, y);
    y += lineHeight;
    doc.setFontSize(10);
    doc.text(`Total Setoran: ${formatCurrency(totalDeposits)}`, margin, y);
    y += lineHeight;
    doc.text(`Total Penarikan: ${formatCurrency(totalWithdrawals)}`, margin, y);
    y += lineHeight;
    doc.text(`Saldo Total: ${formatCurrency(totalBalance)}`, margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.text('Ringkasan per Siswa:', margin, y);
    y += lineHeight;

    studentSummary.forEach(s => {
      if (y + 5 * lineHeight > doc.internal.pageSize.height - margin - 20) { // Adjusted for footer
        doc.addPage();
        y = margin;
        // Print Date on new page
        doc.setFontSize(8);
        doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' });
        y += 10;
        doc.setFontSize(12);
        doc.text('Ringkasan per Siswa (Lanjutan):', margin, y);
        y += lineHeight;
      }
      doc.setFontSize(10);
      doc.text(`Nama: ${s.name} (Kelas ${s.class})`, margin, y);
      y += lineHeight;
      doc.text(`  Saldo: ${formatCurrency(s.balance)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`  Total Setoran: ${formatCurrency(s.totalDeposits)}`, margin + 5, y);
      y += lineHeight;
      doc.text(`  Total Penarikan: ${formatCurrency(s.totalWithdrawals)}`, margin + 5, y);
      y += lineHeight * 2; // Add extra space between students
    });

    // Footer
    doc.setFontSize(8);
    doc.text('SIBUDIS - Anang Creative Production', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Laporan_Tabungan_Siswa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600">
            {user.role === 'parent' 
              ? 'Ringkasan aktivitas tabungan anak-anak Anda'
              : 'Analisis dan rekapitulasi data tabungan siswa'
            }
          </p>
        </div>
        {user.role !== 'parent' && ( // Hide for parent role
          <Button 
            onClick={handleExportPDF}
            className="flex items-center space-x-2 sm:w-auto w-full justify-center"
            variant="accent-green"
            title="Export PDF" // Added title for hover
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">Export</span>
          </Button>
        )}
      </div>

      {user.role !== 'parent' && (
        <div className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Laporan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                placeholder="Tanggal Mulai"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                placeholder="Tanggal Akhir"
              />
            </div>
            {(user.role === 'admin') && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                >
                  <option value="">Semua Kelas</option>
                  {classes.map(cls => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedClass('');
                setCurrentPage(1);
              }}
              className="w-full"
              variant="gray-light"
            >
              Reset Filter
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-green-bg rounded-lg">
              <TrendingUp className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Setoran</p>
              <p className="text-2xl font-bold text-accent-green">{formatCurrency(totalDeposits)}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-red-bg rounded-lg">
              <TrendingDown className="w-6 h-6 text-accent-red" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Penarikan</p>
              <p className="text-2xl font-bold text-accent-red">{formatCurrency(totalWithdrawals)}</p>
            </div>
          </div>
        </div>

        <div className="bg-theme-content-bg rounded-xl shadow-md border border-theme-border-light p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-icon-blue-bg rounded-lg">
              <BarChart3 className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-accent-blue">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {user.role === 'parent' ? 'Ringkasan per Anak' : 'Ringkasan per Siswa'}
        </h2>
        
        {/* Mobile horizontal scroll container */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Nama</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Kelas</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Saldo</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Setoran</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Penarikan</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudentSummary.map((student) => (
                <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{student.name}</td>
                  <td className="py-3 px-4 text-gray-600">{student.class}</td>
                  <td className="py-3 px-4 text-right font-semibold text-accent-blue">
                    {formatCurrency(student.balance)}
                  </td>
                  <td className="py-3 px-4 text-right text-accent-green">
                    {formatCurrency(student.totalDeposits)}
                  </td>
                  <td className="py-3 px-4 text-right text-accent-red">
                    {formatCurrency(student.totalWithdrawals)}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">
                    {student.transactionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-4 py-3 bg-theme-content-bg border border-theme-border-light rounded-lg">
            <div className="text-sm text-gray-700">
              Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, studentSummary.length)} dari {studentSummary.length} siswa
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
      </div>
    </div>
  );
}