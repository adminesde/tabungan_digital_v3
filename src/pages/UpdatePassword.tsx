import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Lock, CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff
import { showSuccess, showError } from '../utils/toast';
import { Button } from '../components/ui/button'; // Import Button component

export default function UpdatePassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false); // New state
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false); // New state

  useEffect(() => {
    const type = searchParams.get('type');
    const accessToken = searchParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      // Supabase automatically sets the session when redirected with access_token
      // We just need to ensure the user is logged in to update their password.
      // The session should already be set by the time this component renders.
      // We can optionally verify the session here if needed, but usually not required.
    } else {
      setMessage({ type: 'error', text: 'Link reset password tidak valid atau sudah kedaluwarsa.' });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok.' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Error updating password:", error);
        setMessage({ type: 'error', text: 'Gagal memperbarui password: ' + error.message });
        showError('Gagal memperbarui password.');
      } else if (data.user) {
        setMessage({ type: 'success', text: 'Password Anda berhasil diperbarui! Anda akan diarahkan ke halaman login.' });
        showSuccess('Password berhasil diperbarui!');
        
        // Explicitly sign out to clear the session completely
        await supabase.auth.signOut();

        setTimeout(() => {
          navigate('/login', { replace: true }); // Redirect to login page
        }, 3000);
      }
    } catch (err) {
      console.error("Unexpected error during password update:", err);
      setMessage({ type: 'error', text: 'Terjadi kesalahan tak terduga.' });
      showError('Terjadi kesalahan tak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Atur Ulang Password</h1>
        
        {message && (
          <div className={`p-3 rounded-lg flex items-center space-x-2 mb-4 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Baru
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showNewPassword ? 'text' : 'password'} // Toggle type
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                type={showConfirmNewPassword ? 'text' : 'password'} // Toggle type
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
            disabled={isLoading}
            className="w-full py-3 px-4 flex items-center justify-center space-x-2"
            variant="accent-blue"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Atur Ulang Password</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
