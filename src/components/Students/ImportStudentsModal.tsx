import React, { useState } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import * as XLSX from 'xlsx';
import { useStudents } from '../../contexts/StudentsContext';
import { useAuth } from '../../contexts/Auth/AuthContext'; 
import { UploadCloud, FileText, Download, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Student } from '../../types'; 
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';
import { Button } from '../ui/button'; // Import Button component

interface ImportStudentsModalProps {
  onClose: () => void;
}

export default function ImportStudentsModal({ onClose }: ImportStudentsModalProps) {
  const { user } = useAuth();
  const { addMultipleStudents } = useStudents(); // Use addMultipleStudents from context
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    const accessDeniedContent = (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-theme-content-bg rounded-xl shadow-xl max-w-md w-full p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Ditolak</h3>
          <p className="text-gray-500">Anda tidak memiliki izin untuk mengakses fitur ini.</p>
          <Button onClick={onClose} className="mt-4" variant="accent-blue">
            Tutup
          </Button>
        </div>
      </div>
    );
    const modalRoot = document.getElementById('modal-root');
    return modalRoot ? ReactDOM.createPortal(accessDeniedContent, modalRoot) : null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportStatus('idle');
      setMessage('');
      setImportedCount(0);
      setSkippedCount(0);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setMessage('Pilih file XLSX terlebih dahulu.');
      setImportStatus('error');
      return;
    }

    setImportStatus('processing');
    setMessage('Memproses file...');
    setImportedCount(0);
    setSkippedCount(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const studentsToAdd: Omit<Student, 'id' | 'createdAt'>[] = [];
        let currentSkippedCount = 0;

        const { data: existingStudentsData, error: nisnError } = await supabase
          .from('students')
          .select('student_id');
        
        if (nisnError) {
          console.error("Error fetching existing NISN:", nisnError);
          showError("Gagal memverifikasi NISN yang sudah ada.");
          setImportStatus('error');
          setMessage('Gagal memverifikasi NISN yang sudah ada.');
          return;
        }
        const existingNisnSet = new Set(existingStudentsData.map(s => s.student_id));

        for (const row of json) {
          const name = row['Nama Siswa'];
          const nisn = row['NISN'] ? String(row['NISN']) : '';
          const studentClass = row['Kelas'] ? String(row['Kelas']) : '';

          // More permissive regex for name: allows letters, spaces, periods, apostrophes, hyphens, and common Indonesian characters
          const isValidName = typeof name === 'string' && /^[a-zA-Z\s.'-À-ÿ]+$/.test(name.trim());
          const isValidNisn = nisn.length === 10 && /^\d+$/.test(nisn);
          const isValidClass = typeof studentClass === 'string' && /^\d+$/.test(studentClass);

          // If user is teacher, ensure the class matches their assigned class
          const isClassAllowed = user.role === 'admin' || (user.role === 'teacher' && studentClass === user.class);

          if (isValidName && isValidNisn && isValidClass && isClassAllowed) {
            const isDuplicate = existingNisnSet.has(nisn);

            if (!isDuplicate) {
              studentsToAdd.push({
                name: name.trim(),
                studentId: nisn,
                class: studentClass,
                parentId: null, // Set parentId to null by default
                balance: 0,
              });
            } else {
              currentSkippedCount++;
            }
          } else {
            currentSkippedCount++;
            // Optionally, log or store reasons for skipping for more detailed feedback
            console.warn(`Skipped row: Name: ${name}, NISN: ${nisn}, Class: ${studentClass}. Reasons: 
              Valid Name: ${isValidName}, Valid NISN: ${isValidNisn}, Valid Class: ${isValidClass}, 
              Class Allowed: ${isClassAllowed}, Duplicate NISN: ${isDuplicate}`);
          }
        }

        if (studentsToAdd.length > 0) {
          const success = await addMultipleStudents(studentsToAdd); // Use context function
          if (success) {
            setImportedCount(studentsToAdd.length);
            setSkippedCount(currentSkippedCount);
            setImportStatus('success');
            setMessage(`Berhasil mengimpor ${studentsToAdd.length} siswa baru. ${currentSkippedCount} data dilewati (duplikat, tidak lengkap, atau kelas tidak sesuai).`);
          } else {
            setImportStatus('error');
            setMessage('Gagal mengimpor siswa ke database.');
          }
        } else {
          setSkippedCount(currentSkippedCount);
          setImportStatus('error');
          setMessage(`Tidak ada siswa baru yang diimpor. ${currentSkippedCount} data dilewati (duplikat, tidak lengkap, atau kelas tidak sesuai).`);
        }

      } catch (error) {
        console.error("Error reading XLSX file:", error);
        setImportStatus('error');
        setMessage('Gagal membaca file. Pastikan format file benar dan tidak rusak.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Nama Siswa": "Anang Yunarko", "NISN": "3329382372", "Kelas": "6" },
      { "Nama Siswa": "Budi Santoso", "NISN": "1234567890", "Kelas": "5" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    XLSX.writeFile(wb, "template_siswa.xlsx");
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-content-bg rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-gray-900">Import Data Siswa</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Unggah file XLSX untuk menambahkan banyak data siswa sekaligus. Pastikan file Anda memiliki kolom: <span className="font-semibold">Nama Siswa</span> (huruf), <span className="font-semibold">NISN</span> (10 digit angka), dan <span className="font-semibold">Kelas</span> (angka).
            {user.role === 'teacher' && (
              <span className="block mt-1 text-accent-orange">
                Catatan: Sebagai Guru, Anda hanya dapat mengimpor siswa untuk Kelas {user.class}.
              </span>
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-accent-blue file:text-white
                hover:file:bg-accent-blue"
            />
            <Button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2 text-sm w-full sm:w-auto justify-center"
              variant="accent-green"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template</span>
            </Button>
          </div>

          {file && (
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <FileText className="w-4 h-4" />
              <span>File terpilih: <span className="font-medium">{file.name}</span></span>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importStatus === 'processing'}
            className="w-full flex items-center justify-center space-x-2"
            variant="accent-blue"
          >
            {importStatus === 'processing' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                <span>Mulai Import</span>
              </>
            )}
          </Button>

          {message && (
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              importStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
              'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {importStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              <p className="text-sm">{message}</p>
            </div>
          )}
          {importStatus !== 'idle' && (importedCount > 0 || skippedCount > 0) && (
            <div className="text-sm text-gray-600 mt-2">
              <p>Siswa berhasil diimpor: <span className="font-semibold text-green-700">{importedCount}</span></p>
              <p>Data dilewati: <span className="font-semibold text-accent-orange">{skippedCount}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
}