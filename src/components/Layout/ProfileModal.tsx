import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/Auth/AuthContext';
import { X, User, Lock, Save, AlertCircle, Hash, Eye, EyeOff } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';
import { supabase } from '../../integrations/supabase/client';
import { Button } from '../ui/button';

interface ProfileModalProps {
  onClose: () => void;
  initialTab?: 'profile' | 'password';
}

export default function ProfileModal({ onClose, initialTab = 'profile' }: ProfileModalProps) {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>(initialTab);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    nip: user?.nip || '',
  });
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        nip: user.nip || '',
      });
    }
  }, [user]);

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setIsSubmittingProfile(true);

    const success = await updateUser({
      name: formData.name,
      email: formData.email,
      nip: formData.nip,
    });

    if (success) {
      setProfileMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      showSuccess('Profil berhasil diperbarui!');
    } else {
      setProfileMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
      showError('Gagal memperbarui profil.');
    }
    setIsSubmittingProfile(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setIsResettingPassword(true);

    if (passwordFormData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      setIsResettingPassword(false);
      return;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok.' });
      setIsResettingPassword(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-user-password', {
        body: { userId: user.id, newPassword: passwordFormData.newPassword },
      });

      if (error) {
        console.error("Error calling update-user-password edge function:", error);
        setPasswordMessage({ type: 'error', text: 'Gagal mereset password: ' + error.message });
        showError('Gagal mereset password.');
      } else if (data && data.message) {
        setPasswordMessage({ type: 'success', text: 'Password Anda berhasil diperbarui!' });
        showSuccess('Password berhasil diperbarui!');
        setPasswordFormData({ newPassword: '', confirmNewPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: 'Gagal mereset password. Respon tidak valid.' });
        showError('Gagal mereset password.');
      }
    } catch (err: any) {
      console.error("Unexpected error during password reset:", err);
      setPasswordMessage({ type: 'error', text: 'Terjadi kesalahan tak terduga saat mereset password: ' + err.message });
      showError('Terjadi kesalahan tak terduga.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'teacher': return 'Guru';
      case 'parent': return 'Orang Tua';
      default: return role;
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-content-bg rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-gray-900">Profil Saya</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-accent-blue" 
                />
              ) : (
                <div className="w-20 h-20 bg-accent-blue rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-white">
                    {user.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              onClick={() => { setActiveTab('profile'); setProfileMessage(null); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-theme-content-bg text-accent-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profil
            </Button>
            <Button
              variant="ghost"
              onClick={() => { setActiveTab('password'); setPasswordMessage(null); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'password'
                  ? 'bg-theme-content-bg text-accent-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </Button>
          </div>

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {profileMessage && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  profileMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                  'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{profileMessage.text}</p>
                </div>
              )}
              
              {user.role === 'parent' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Orang Tua
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      required
                      disabled
                    />
                  </div>
                  {user.studentInfo && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Anak
                        </label>
                        <input
                          type="text"
                          value={user.studentInfo.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          NISN Anak
                        </label>
                        <input
                          type="text"
                          value={user.studentInfo.studentId}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          disabled
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Masukkan alamat email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      required
                      disabled
                    />
                  </div>

                  {(user.role === 'admin' || user.role === 'teacher') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Hash className="w-4 h-4 inline mr-1" />
                        NIP (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.nip}
                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                        placeholder="Masukkan NIP"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                      />
                    </div>
                  )}

                  {user.role === 'teacher' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kelas yang Diajar
                      </label>
                      <input
                        type="text"
                        value={user.class ? `Kelas ${user.class}` : ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        disabled
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleLabel(user.role)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                />
              </div>

              <Button
                type="submit"
                className="w-full flex items-center justify-center space-x-2"
                variant="accent-blue"
                disabled={isSubmittingProfile}
              >
                {isSubmittingProfile ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </Button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {passwordMessage && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  passwordMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
                  'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{passwordMessage.text}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    placeholder="Masukkan password baru"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    value={passwordFormData.confirmNewPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, confirmNewPassword: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
                    placeholder="Konfirmasi password baru"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isResettingPassword}
                className="w-full flex items-center justify-center space-x-2"
                variant="accent-blue"
              >
                {isResettingPassword ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Password Baru</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
}
