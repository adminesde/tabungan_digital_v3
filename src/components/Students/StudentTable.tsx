import React from 'react';
import { Student } from '../../types';
import { User, DollarSign, Edit, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { User as SupabaseUser } from '../../types';
import { Button } from '../ui/button';
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
} from '../ui/alert-dialog'; // Import AlertDialog components

interface StudentTableProps {
  students: Student[];
  onView: (student: Student) => void;
  onEdit?: (student: Student) => void;
  onDelete?: (studentId: string, studentName: string) => void;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function StudentTable({ 
  students,
  onView, 
  onEdit, 
  onDelete,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}: StudentTableProps) {
  const [parents, setParents] = React.useState<SupabaseUser[]>([]);
  const [studentToDelete, setStudentToDelete] = React.useState<{ id: string; name: string } | null>(null);

  React.useEffect(() => {
    const fetchParents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'parent');
      if (error) {
        console.error("Error fetching parents:", error);
      } else {
        const fetchedParents: SupabaseUser[] = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          email: profile.email,
          role: profile.role as 'admin' | 'teacher' | 'parent',
          createdAt: profile.created_at,
          isActive: profile.is_active,
        }));
        setParents(fetchedParents);
      }
    };
    fetchParents();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setStudentToDelete({ id: studentId, name: studentName });
  };

  const handleConfirmDelete = () => {
    if (studentToDelete && onDelete) {
      onDelete(studentToDelete.id, studentToDelete.name);
      setStudentToDelete(null); // Clear the state after deletion
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada siswa ditemukan</h3>
        <p className="text-gray-500">Coba ubah kata kunci pencarian atau filter kelas</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Nama Siswa</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Kelas</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">NISN</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-900">Saldo</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-accent-blue" />
                    </div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">Kelas {student.class}</td>
                <td className="py-3 px-4 text-gray-600">{student.studentId}</td>
                <td className="py-3 px-4 text-right font-semibold text-accent-green">
                  {formatCurrency(student.balance)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center space-x-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(student)}
                        className="text-accent-blue hover:bg-blue-100"
                        title="Edit Siswa"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(student.id, student.name)}
                            className="text-accent-red hover:bg-red-100"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus siswa "{studentToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.
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
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            Menampilkan {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, students.length)} dari {students.length} siswa
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