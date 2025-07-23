import React, { useState } from 'react';
import { X, User, Mail, Lock, GraduationCap, LogIn, Hash, ArrowLeft, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff
import { useAuth } from '../../contexts/Auth/AuthContext';
import { useStudents } from '../../contexts/StudentsContext'; 
import { useNisnLookup } from '../../hooks/useNisnLookup'; // Import the new hook
import { Button } from '../ui/button'; // Import Button component
import { showSuccess, showError } from '../../utils/toast';
import { supabase } from '../../integrations/supabase/client'; // Import supabase client

interface RegisterFormContentProps {
  onSuccess?: () => void;
  onCancel: () => void;
  initialRole: 'teacher' | 'parent';
}

export default function RegisterFormContent({ onSuccess, onCancel, initialRole }: RegisterFormContentProps) {
  const { login } = useAuth(); // Only need login, not registerUser anymore
  const { students } = useStudents(); 
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'parent'>(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    class: '',
    parentName: '', // New: for parent registration
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // New state

  const { nisn, setNisn, nisnStudentInfo, nisnError, isLoadingNisnLookup } = useNisnLookup(); // Removed students prop

  const classes = ['1', '2', '3', '4', '5', '6']; 

  const handleNisnInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNisn(e.target.value);
    setError(''); // Clear general error when NISN changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter.');
      setIsLoading(false);
      return;
    }

    if (selectedRole === 'parent' && (!nisnStudentInfo || nisnError)) {
      setError(nisnError || 'NISN tidak valid atau tidak ditemukan.');
      setIsLoading(false);
      return;
    }
    if (selectedRole === 'parent' && !formData.parentName) {
      setError('Nama Lengkap Orang Tua harus diisi.');
      setIsLoading(false);
      return;
    }

    try {
      let success = false;
      let emailToRegister = formData.email;
      let firstName = '';
      let lastName = '';
      let userClass = formData.class;
      let userNisn = nisn;

      if (selectedRole === 'teacher') {
        if (!formData.name || !formData.email || !formData.class) {
          setError('Semua kolom harus diisi.');
          setIsLoading(false);
          return;
        }
        const nameParts = formData.name.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (selectedRole === 'parent') {
        const parentNameParts = formData.parentName.split(' ');
        firstName = parentNameParts[0];
        lastName = parentNameParts.slice(1).join(' ');
        emailToRegister = `${nisn}@parent.com`; // Generate email for parent
        userClass = ''; // Parents don't have a class
      }

      // Call the create-user Edge Function
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('create-user', {
        body: {
          email: emailToRegister,
          password: formData.password,
          first_name: firstName,
          last_name: lastName,
          role: selectedRole,
          class: userClass,
          nisn: userNisn, // Pass NISN for parent linking
        },
      });

      if (edgeFunctionError) {
        console.error("Error calling create-user edge function:", edgeFunctionError);
        showError("Pendaftaran gagal: " + edgeFunctionError.message);
        setError("Pendaftaran gagal: " + edgeFunctionError.message);
      } else if (data && data.user) {
        showSuccess('Pendaftaran berhasil! Silakan masuk.');
        onSuccess?.();
      } else {
        showError("Pendaftaran gagal. Respon tidak valid.");
        setError("Pendaftaran gagal. Respon tidak valid.");
      }
    } catch (err) {
      showError('Terjadi kesalahan saat pendaftaran.');
      setError('Terjadi kesalahan saat pendaftaran.');
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full text-foreground">
      <h2 className="text-xl font-bold text-foreground mb-4">Daftar Akun Baru</h2>
      <Button
        type="button"
        onClick={onCancel}
        variant="ghost"
        className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground mb-4 p-0 h-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Login</span>
      </Button>

      <form onSubmit={handleSubmit} className="space-y-2 overflow-y-auto flex-grow">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {selectedRole === 'teacher' && (
          <>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Masukkan alamat email"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Kelas yang Diajar
              </label>
              <select
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map(cls => (
                  <option key={cls} value={cls}>Kelas {cls}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {selectedRole === 'parent' && (
          <>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                <Hash className="w-4 h-4 inline mr-1" />
                NISN Anak
              </label>
              <input
                type="text"
                value={nisn}
                onChange={handleNisnInputChange}
                placeholder="Masukkan NISN anak (10 digit)"
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                maxLength={10}
                required
              />
              {isLoadingNisnLookup && <p className="text-sm text-muted-foreground mt-1">Mencari siswa...</p>}
              {nisnStudentInfo && (
                <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
                  <p><span className="font-semibold">{nisnStudentInfo.name}</span></p>
                  <p><span className="font-semibold">{nisnStudentInfo.class}</span></p>
                </div>
              )}
              {nisnError && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <p>{nisnError}</p>
                </div>
              )}
            </div>
            {nisnStudentInfo && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Nama Lengkap Orang Tua
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Masukkan nama lengkap Anda"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            <Lock className="w-4 h-4 inline mr-1" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle type
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Masukkan password"
              className="w-full px-3 pr-10 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            <Lock className="w-4 h-4 inline mr-1" />
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'} // Toggle type
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Konfirmasi password"
              className="w-full px-3 pr-10 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1"
            variant="gray-outline"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading || (selectedRole === 'parent' && (!nisnStudentInfo || isLoadingNisnLookup || !formData.parentName))}
            className="flex-1 flex items-center justify-center space-x-2"
            variant={selectedRole === 'parent' ? 'accent-green' : 'accent-blue'}
          >
            {isLoading || isLoadingNisnLookup ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Daftar</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}