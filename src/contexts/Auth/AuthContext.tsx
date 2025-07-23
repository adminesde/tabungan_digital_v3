import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../../types';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthContext: Setting up onAuthStateChange listener.");
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("AuthContext: onAuthStateChange event:", event, "session:", session);
      if (session) {
        // Fetch user profile from public.profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && !profileError) {
          console.log("AuthContext: Profile fetched successfully:", profile);
          let studentInfo = undefined;
          let userName = `${profile.first_name} ${profile.last_name || ''}`.trim();

          if (profile.role === 'parent') {
            const { data: studentDataArray, error: studentError } = await supabase
              .from('students')
              .select('id, name, class, student_id')
              .eq('parent_id', session.user.id)
              .limit(1);

            if (studentDataArray && studentDataArray.length > 0 && !studentError) {
              const student = studentDataArray[0];
              studentInfo = {
                id: student.id,
                name: student.name,
                class: student.class,
                studentId: student.student_id,
              };
              console.log("AuthContext: Student info for parent fetched:", studentInfo);
            } else if (studentError) {
              console.error("AuthContext: Error fetching student for parent:", studentError);
            } else {
              console.warn("AuthContext: No student found linked to this parent ID.");
            }
          }

          const newUser: User = {
            id: profile.id,
            name: userName,
            email: profile.email,
            role: profile.role as 'admin' | 'teacher' | 'parent',
            class: profile.class || undefined,
            avatarUrl: profile.avatar_url || undefined,
            createdAt: profile.created_at,
            isActive: profile.is_active,
            nip: profile.nip || undefined,
            studentInfo: studentInfo,
          };
          setUser(newUser);
          console.log("AuthContext: User state set to:", newUser);
          setIsLoading(false);
          console.log("AuthContext: isLoading set to false after user state update.");
        } else {
          console.error("AuthContext: Error fetching profile:", profileError);
          setUser(null);
          setIsLoading(false);
          console.log("AuthContext: isLoading set to false after profile fetch error.");
        }
      } else {
        console.log("AuthContext: No session found, setting user to null.");
        setUser(null);
        setIsLoading(false);
        console.log("AuthContext: isLoading set to false after no session found.");
        navigate('/login');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("AuthContext: Initial getSession result:", session);
      if (session) {
        console.log("AuthContext: Session found on initial load, onAuthStateChange will handle.");
      } else {
        setIsLoading(false);
        console.log("AuthContext: No session on initial load, isLoading set to false.");
      }
    });

    return () => {
      console.log("AuthContext: Unsubscribing from auth listener.");
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (credential: string, password: string, role: 'admin' | 'teacher' | 'parent'): Promise<boolean> => {
    setIsLoading(true);
    console.log("AuthContext: Attempting login for role:", role, "credential:", credential, "isLoading set to true.");

    let emailToLogin = credential;
    let authSuccess = false;

    try {
      if (role === 'parent') {
        const edgeFunctionUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_REF}.supabase.co/functions/v1/get-parent-email-by-student-id`;
        console.log("AuthContext: Parent login flow - calling Edge Function at URL:", edgeFunctionUrl); // Log the URL
        const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('get-parent-email-by-student-id', {
          body: { studentId: credential },
        });

        if (edgeFunctionError) {
          console.error("AuthContext: Error calling get-parent-email-by-student-id edge function:", edgeFunctionError);
          showError(edgeFunctionError.message || "Gagal menemukan akun orang tua terkait. Silakan coba lagi atau daftar.");
          setIsLoading(false);
          return false;
        }
        
        if (edgeFunctionData && edgeFunctionData.email) {
          emailToLogin = edgeFunctionData.email;
          console.log("AuthContext: Parent email found via Edge Function:", emailToLogin);
        } else {
          console.error("AuthContext: Edge function returned no email data.");
          showError("Gagal menemukan akun orang tua terkait. Respon tidak valid dari server.");
          setIsLoading(false);
          return false;
        }
      }

      console.log("AuthContext: Calling signInWithPassword for email:", emailToLogin);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToLogin,
        password: password,
      });

      if (error) {
        console.error("AuthContext: signInWithPassword error:", error);
        authSuccess = false;
      } else if (data.user) {
        console.log("AuthContext: signInWithPassword successful, user:", data.user);
        authSuccess = true;
      } else {
        console.log("AuthContext: signInWithPassword returned no user data.");
        authSuccess = false;
      }
      return authSuccess;
    } catch (err: any) {
      console.error("AuthContext: Unexpected error during login:", err);
      showError("Terjadi kesalahan tak terduga saat login. Silakan coba lagi.");
      return false;
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Login attempt finished, isLoading set to false.");
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    console.log("AuthContext: Attempting logout, isLoading set to true.");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("AuthContext: Error logging out:", error);
        showError("Gagal keluar: " + error.message);
      } else {
        console.log("AuthContext: Logout successful.");
        showSuccess("Berhasil keluar!");
      }
    } catch (err: any) {
      console.error("AuthContext: Unexpected error during logout:", err);
      showError("Terjadi kesalahan tak terduga saat keluar: " + err.message);
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Logout finished, isLoading set to false.");
    }
  };

  const updateUser = async (updatedUserData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    setIsLoading(true);
    console.log("AuthContext: Attempting to update user profile for ID:", user.id, "with data:", updatedUserData, "isLoading set to true.");

    const [firstName, ...lastNameParts] = updatedUserData.name?.split(' ') || [];
    const lastName = lastNameParts.join(' ');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          first_name: firstName, 
          last_name: lastName, 
          email: updatedUserData.email, 
          class: updatedUserData.class, 
          is_active: updatedUserData.isActive,
          avatar_url: updatedUserData.avatarUrl,
          nip: updatedUserData.nip
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("AuthContext: Error updating profile:", error);
        return false;
      }

      if (data) {
        console.log("AuthContext: Profile updated successfully in DB:", data);
        let studentInfo = undefined;
        let updatedUserName = `${data.first_name} ${data.last_name || ''}`.trim();

        if (data.role === 'parent') {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('id, name, class, student_id')
            .eq('parent_id', data.id)
            .limit(1);

          if (studentData && studentData.length > 0 && !studentError) {
            const student = studentData[0];
            studentInfo = {
              id: student.id,
              name: student.name,
              class: student.class,
              studentId: student.student_id,
            };
            console.log("AuthContext: Student info for updated parent profile fetched:", studentInfo);
          } else if (studentError) {
            console.error("AuthContext: Error fetching student for updated parent profile:", studentError);
          } else {
            console.warn("AuthContext: No student found linked to this updated parent ID.");
          }
        }

        const updatedUser: User = {
          id: data.id,
          name: updatedUserName,
          email: data.email,
          role: data.role as 'admin' | 'teacher' | 'parent',
          class: data.class || undefined,
          avatarUrl: data.avatar_url || undefined, 
          createdAt: data.created_at,
          isActive: data.is_active,
          nip: data.nip || undefined,
          studentInfo: studentInfo, 
        };
        setUser(updatedUser);
        console.log("AuthContext: User state updated to:", updatedUser);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error("AuthContext: Unexpected error during profile update:", err);
      return false;
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Update user finished, isLoading set to false.");
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    console.log("AuthContext: Attempting to send password reset email to:", email, "isLoading set to true.");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, 
      });
      if (error) {
        console.error("AuthContext: resetPasswordForEmail error:", error);
        showError("Gagal mengirim link reset password: " + error.message);
      } else {
        console.log("AuthContext: resetPasswordForEmail successful.");
      }
      return !error;
    } catch (err: any) {
      console.error("AuthContext: Unexpected error during password reset:", err);
      showError("Terjadi kesalahan tak terduga saat reset password: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Reset password finished, isLoading set to false.");
    }
  };

  const deleteAccount = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    console.log("AuthContext: Attempting to delete user account for ID:", userId, "isLoading set to true.");
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) {
        console.error("AuthContext: Error calling delete-user edge function:", error);
        showError("Gagal menghapus akun: " + error.message);
        return false;
      } else if (data && data.message) {
        console.log("AuthContext: Account deleted successfully via edge function.");
        showSuccess("Akun berhasil dihapus.");
        await supabase.auth.signOut();
        return true;
      } else {
        showError("Gagal menghapus akun. Respon tidak valid.");
        return false;
      }
    } catch (err: any) {
      console.error("AuthContext: Unexpected error during account deletion:", err);
      showError("Terjadi kesalahan tak terduga saat menghapus akun: " + err.message);
      return false;
    } finally {
      setIsLoading(false);
      console.log("AuthContext: Delete account finished, isLoading set to false.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, updateUser, resetPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}