import React, { useState } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM
import { X, Mail, Send } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';
import { useAuth } from '../../contexts/Auth/AuthContext'; 
import { Button } from '../ui/button'; // Corrected import path

interface ForgotPasswordFormProps {
  onClose: () => void;
}

export default function ForgotPasswordForm({ onClose }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth(); 
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    const success = await resetPassword(email);

    if (success) {
      showSuccess('Link reset password telah dikirim ke email Anda.');
      setMessage('Jika email Anda terdaftar, link reset password telah dikirim.');
      setEmail('');
    } else {
      showError('Gagal mengirim link reset password. Pastikan email benar.');
      setMessage('Gagal mengirim link reset password. Pastikan email benar.');
    }
    setIsLoading(false);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-content-bg rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-theme-border-light">
          <h2 className="text-xl font-bold text-gray-900">Lupa Password</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Masukkan alamat email Anda dan kami akan mengirimkan link untuk mereset password Anda.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan alamat email Anda"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-blue focus:border-transparent"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('Gagal') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1"
              variant="gray-outline"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center space-x-2"
              variant="accent-blue"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Link Reset</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const modalRoot = document.getElementById('modal-root');
  return modalRoot ? ReactDOM.createPortal(modalContent, modalRoot) : null;
}
