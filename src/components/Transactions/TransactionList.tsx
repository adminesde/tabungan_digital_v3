import React from 'react';
import { Transaction, Student } from '../../types';
import { ArrowUpCircle, ArrowDownCircle, Calendar, User, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { useStudents } from '../../contexts/StudentsContext';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { jsPDF } from 'jspdf'; // Import jsPDF
import { supabase } from '../../integrations/supabase/client';
import { User as SupabaseUser } from '../../types'; // Import User type from types/index.ts
import { Button } from '../ui/button'; // Import Button component
import { useIsMobile } from '../../hooks/useIsMobile'; // Import useIsMobile

interface TransactionListProps {
  transactions: Transaction[];
  students?: Student[];
  showStudentInfo?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TransactionList({ 
  transactions, 
  students: propStudents,
  showStudentInfo = true,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: TransactionListProps) {
  const { students } = useStudents();
  const { user } = useAuth();
  const [allUsers, setAllUsers] = React.useState<SupabaseUser[]>([]);
  const isMobile = useIsMobile(); // Use the hook

  React.useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("Error fetching users for transaction list:", error);
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
  }, []);

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.name} (${student.class})` : 'Siswa tidak ditemukan';
  };

  const getPerformedByName = (performedByEmail: string) => {
    const performer = allUsers.find(u => u.email === performedByEmail);
    return performer ? performer.name : performedByEmail; // Fallback to email if name not found
  };

  const getTeacherNameByClass = (studentClass: string) => {
    const teacher = allUsers.find(u => u.role === 'teacher' && u.class === studentClass);
    return teacher ? teacher.name : 'Guru Kelas';
  };

  const getParentNameById = (parentId: string) => {
    const parent = allUsers.find(u => u.id === parentId);
    return parent ? parent.name : 'Orang Tua';
  };

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

  const generatePDF = (transaction: Transaction) => {
    try {
      const student = students.find(s => s.id === transaction.studentId);
      if (!student) {
        console.error("Student not found for PDF generation.");
        showError("Gagal membuat bukti PDF: Siswa tidak ditemukan.");
        return;
      }

      const doc = new jsPDF();
      let y = 20; // Initial Y position
      const margin = 20;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Print Date in top right
      doc.setFontSize(8);
      doc.text(`Tanggal Cetak: ${formatDate(new Date().toISOString())}`, pageWidth - margin, y, { align: 'right' });
      y += 10; // Adjust y after adding print date

      doc.setFontSize(16);
      doc.text(`BUKTI ${transaction.type === 'deposit' ? 'SETORAN' : 'PENARIKAN'}`, pageWidth / 2, y, { align: 'center' });
      y += 20;

      doc.setFontSize(10);
      doc.text(`ID Transaksi: ${transaction.id}`, margin, y); // Add Transaction ID
      y += lineHeight * 2; // Add extra space after ID

      doc.setFontSize(12);
      doc.text('Detail Siswa:', margin, y);
      y += lineHeight;
      doc.text(`Nama Siswa: ${student.name}`, margin, y);
      y += lineHeight;
      doc.text(`Kelas: ${student.class}`, margin, y);
      y += lineHeight;
      doc.text(`NISN: ${student.studentId}`, margin, y);
      y += 15;

      doc.text('Detail Transaksi:', margin, y);
      y += lineHeight;
      doc.text(`Tanggal: ${formatDate(transaction.date)}`, margin, y);
      y += lineHeight;
      doc.text(`Jumlah: ${formatCurrency(transaction.amount)}`, margin, y);
      y += lineHeight;
      doc.text(`Keterangan: ${transaction.description}`, margin, y);
      y += lineHeight;
      doc.text(`Saldo Setelah Transaksi: ${formatCurrency(transaction.balance)}`, margin, y);
      y += 15;

      doc.text(`Dilakukan oleh: ${getPerformedByName(transaction.performedBy)}`, margin, y);
      y += lineHeight;
      doc.text(`Peran: ${transaction.performedByRole === 'admin' ? 'Admin' : 'Guru'}`, margin, y);
      y += 20;

      // Signature Section
      const signatureY = y + 20; // Start signatures a bit lower
      const col1X = pageWidth / 4; // Left quarter
      const col2X = pageWidth * 3 / 4; // Right quarter

      doc.setFontSize(10);
      doc.text('Mengetahui:', col1X, signatureY, { align: 'center' });
      doc.text('Orang Tua', col2X, signatureY, { align: 'center' });
      
      doc.text(`Guru Kelas ${student.class}`, col1X, signatureY + lineHeight, { align: 'center' });

      doc.text(getTeacherNameByClass(student.class), col1X, signatureY + lineHeight * 6, { align: 'center' }); // Teacher Name
      doc.text(getParentNameById(student.parentId), col2X, signatureY + lineHeight * 6, { align: 'center' }); // Centered Parent Name

      // Footer
      doc.setFontSize(8);
      doc.text('SIBUDIS - Anang Creative Production', pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Terimakasih telah menggunakan layanan kami.', pageWidth / 2, pageHeight - 5, { align: 'center' }); // New thank you message

      // Conditional download based on device
      if (isMobile) {
        window.open(doc.output('bloburl'), '_blank');
      } else {
        doc.save(`Bukti_Transaksi_${transaction.id}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF for transaction:", error);
      showError("Gagal mengunduh bukti transaksi PDF. Silakan coba lagi.");
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowUpCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada transaksi</h3>
        <p className="text-gray-500">Transaksi akan muncul di sini setelah dibuat</p>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile horizontal scroll container */}
      <div className="overflow-x-auto">
        <div className="min-w-full space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow min-w-[600px] md:min-w-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'deposit' 
                      ? 'bg-icon-green-bg'
                      : 'bg-icon-red-bg'
                  }`}>
                    {transaction.type === 'deposit' ? (
                      <ArrowUpCircle className="w-5 h-5 text-accent-green" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-accent-red" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {showStudentInfo && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                        <User className="w-4 h-4" />
                        <span className="truncate">{getStudentName(transaction.studentId)}</span>
                      </div>
                    )}
                    <h4 className="font-semibold text-gray-900">
                      {transaction.type === 'deposit' ? 'Setoran' : 'Penarikan'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 truncate">{transaction.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      <span className="truncate">oleh {getPerformedByName(transaction.performedBy)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <div>
                    <p className={`text-lg font-bold ${
                      transaction.type === 'deposit' ? 'text-accent-green' : 'text-accent-red'
                    }`}>
                      {transaction.type === 'deposit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Saldo: {formatCurrency(transaction.balance)}
                    </p>
                  </div>
                  {(user?.role === 'admin' || user?.role === 'teacher') && ( // Conditionally render download button
                    <Button
                      onClick={() => generatePDF(transaction)}
                      className="flex items-center space-x-1 px-2 py-1 text-xs"
                      variant="gray-light"
                    >
                      <Download className="w-3 h-3" />
                      <span>Cetak Bukti {transaction.type === 'deposit' ? 'Setoran' : 'Penarikan'}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            Menampilkan {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, transactions.length)} dari {transactions.length} transaksi
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onPageChange?.(currentPage - 1)}
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
              onClick={() => onPageChange?.(currentPage + 1)}
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
  );
}