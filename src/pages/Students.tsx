import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/Auth/AuthContext'; // Updated path
import { useStudents } from '../contexts/StudentsContext';
import StudentTable from '../components/Students/StudentTable';
import StudentForm from '../components/Students/StudentForm';
import ImportStudentsModal from '../components/Students/ImportStudentsModal'; // Import the new modal
import { Plus, Search, Filter, UploadCloud, RefreshCw } from 'lucide-react'; // Add UploadCloud icon
import { Student } from '../types';
import { Button } from '../components/ui/button'; // Import Button component

export default function Students() {
  const { user } = useAuth();
  const { students, addStudent, updateStudent, deleteStudent, fetchStudents } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // New state for import modal
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchStudents(); // Ensure students are fetched when component mounts
  }, [fetchStudents]);

  if (!user) return null;

  // RLS on Supabase ensures only relevant data is fetched based on user role.
  // Client-side filtering is now only for search/class filters, not for role-based access.
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If user is a teacher, automatically filter by their class.
    // Otherwise, apply the selectedClass filter (only visible for admin).
    const matchesClass = (user.role === 'teacher' && student.class === user.class) ||
                         (user.role === 'admin' && (!selectedClass || student.class === selectedClass)) ||
                         (user.role === 'parent' && student.parentId === user.id);
    
    return matchesSearch && matchesClass;
  }).sort((a, b) => a.name.localeCompare(b.name)); // Sort by name alphabetically

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  const classes = [...new Set(students.map(s => s.class))].sort();

  const handleViewStudent = (student: Student) => {
    console.log('View student details:', student);
    // In a real app, this might open a modal or navigate to a detail page
  };

  const handleAddStudent = () => {
    setEditingStudent(undefined);
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus siswa ${studentName}? Tindakan ini tidak dapat dibatalkan.`)) {
      const success = await deleteStudent(studentId);
      if (success) {
        // UI will update via real-time listener
      }
    }
  };

  const handleSubmitStudent = async (data: Omit<Student, 'id' | 'createdAt'>) => {
    let success = false;
    if (editingStudent) {
      // For update, ensure ID and createdAt are preserved from the original student object
      success = await updateStudent({ ...data, id: editingStudent.id, createdAt: editingStudent.createdAt, balance: editingStudent.balance, parentId: editingStudent.parentId });
    } else {
      success = await addStudent(data);
    }
    if (success) {
      setShowForm(false);
    }
  };

  const getTitle = () => {
    switch (user.role) {
      case 'admin': return 'Kelola Siswa';
      case 'teacher': return 'Data Siswa';
      case 'parent': return 'Data Anak';
      default: return 'Data Siswa';
    }
  };

  const canImportStudents = user.role === 'admin' || user.role === 'teacher';
  const canManageStudents = user.role === 'admin' || user.role === 'teacher'; // New permission check

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle()}</h1>
          <p className="text-gray-600">
            {user.role === 'parent' 
              ? 'Informasi tabungan anak-anak Anda'
              : 'Kelola data siswa dan tabungan mereka'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchStudents} // Refresh button
            className="flex items-center space-x-2"
            variant="outline"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canImportStudents && (
            <Button 
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2"
              variant="accent-green"
              title="Import Siswa" // Added title for hover
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Import Siswa</span> {/* Hide text on small screens */}
            </Button>
          )}
          {canManageStudents && ( // Changed from user.role === 'admin'
            <Button 
              onClick={handleAddStudent}
              className="flex items-center space-x-2"
              variant="accent-blue"
              title="Tambah Siswa" // Added title for hover
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Siswa</span> {/* Hide text on small screens */}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>
          {(user.role === 'admin') && ( // Only admin can filter by class
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
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
          {/* Removed class filter for teacher role as it's now automatically filtered */}
        </div>

        <StudentTable
          students={paginatedStudents}
          onView={handleViewStudent}
          onEdit={canManageStudents ? handleEditStudent : undefined} // Allow teacher to edit
          onDelete={canManageStudents ? handleDeleteStudent : undefined} // Allow teacher to delete
          showPagination={true}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent}
          onSubmit={handleSubmitStudent}
          onClose={() => setShowForm(false)}
        />
      )}

      {showImportModal && (
        <ImportStudentsModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}