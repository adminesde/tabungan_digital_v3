import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Transaction } from '../types';
import { useStudents } from './StudentsContext';
// import { useNotifications } from './NotificationContext'; // Removed
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext'; // Import useAuth

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (newTransaction: Omit<Transaction, 'id' | 'date' | 'performedBy' | 'performedByRole' | 'balance'>, performedBy: string, performedByRole: 'admin' | 'teacher') => Promise<boolean>;
  resetTransactions: () => Promise<boolean>;
  fetchTransactions: () => Promise<void>; // Add fetchTransactions
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export function TransactionsProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { students, updateStudent, fetchStudents } = useStudents(); // Get fetchStudents
  // const { addNotification } = useNotifications(); // Removed
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading state

  const fetchTransactions = useCallback(async () => {
    if (isAuthLoading) { // Wait for auth to finish loading
      console.log("TransactionsContext: Auth still loading, deferring fetchTransactions.");
      return;
    }
    if (!user) { // Only fetch if user is logged in
      console.log("TransactionsContext: No user logged in, clearing transactions.");
      setTransactions([]);
      return;
    }
    console.log("TransactionsContext: Fetching transactions for user:", user.id, "role:", user.role, "studentInfo:", user.studentInfo); // Added log
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("TransactionsContext: Error fetching transactions:", error);
      showError("Gagal memuat data transaksi.");
    } else {
      const fetchedTransactions: Transaction[] = data.map(t => ({
        id: t.id,
        studentId: t.student_id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        performedBy: t.performed_by,
        performedByRole: t.performed_by_role,
        date: t.date,
        balance: t.balance,
      }));
      setTransactions(fetchedTransactions);
    }
  }, [user, isAuthLoading]); // Dependencies for useCallback

  useEffect(() => {
    // Initial fetch when component mounts and auth is ready
    if (!isAuthLoading && user) {
      fetchTransactions();
    }
    
    // Setup real-time listener for transactions table
    const channel = supabase
      .channel('transactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, payload => {
        console.log("TransactionsContext: Realtime change detected, re-fetching transactions.");
        console.log("TransactionsContext: Realtime payload received:", payload); // NEW LOG: Log the full payload
        fetchTransactions(); // Re-fetch transactions on any change
        // if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') { // Removed notification logic
        //   const newTransaction = payload.new as Transaction;
        //   const student = students.find(s => s.id === newTransaction.student_id);
        //   if (student) {
        //     console.log("TransactionsContext: Student found for notification:", student.id, student.name, student.class);
        //     addNotification({
        //       type: 'transaction',
        //       message: `${student.name}: ${newTransaction.type === 'deposit' ? 'Setoran' : 'Penarikan'} ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(newTransaction.amount)}`,
        //       link: `/transactions?studentId=${student.id}`,
        //       transactionType: newTransaction.type,
        //       studentId: student.id,
        //       studentClass: student.class,
        //     });
        //   }
        // }
      })
      .subscribe();

    return () => {
      console.log("TransactionsContext: Unsubscribing from realtime listener.");
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, user, students, isAuthLoading]); // Removed addNotification from dependencies

  const addTransaction = async (
    newTransactionData: Omit<Transaction, 'id' | 'date' | 'performedBy' | 'performedByRole' | 'balance'>,
    performedBy: string,
    performedByRole: 'admin' | 'teacher'
  ): Promise<boolean> => {
    const student = students.find(s => s.id === newTransactionData.studentId);
    if (!student) {
      console.error("Student not found for transaction:", newTransactionData.studentId);
      showError("Siswa tidak ditemukan untuk transaksi ini.");
      return false;
    }

    let newBalance = student.balance;
    if (newTransactionData.type === 'deposit') {
      newBalance += newTransactionData.amount;
    } else {
      newBalance -= newTransactionData.amount;
    }

    // Insert transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        student_id: newTransactionData.studentId,
        type: newTransactionData.type,
        amount: newTransactionData.amount,
        description: newTransactionData.description,
        performed_by: performedBy,
        performed_by_role: performedByRole,
        date: new Date().toISOString(),
        balance: newBalance, // Store calculated balance
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error adding transaction:", transactionError);
      showError("Gagal menambahkan transaksi.");
      return false;
    }

    // Update student's balance
    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', student.id);

    if (studentUpdateError) {
      console.error("Error updating student balance:", studentUpdateError);
      showError("Transaksi berhasil, tetapi gagal memperbarui saldo siswa.");
      return false;
    }

    showSuccess("Transaksi berhasil disimpan!");
    // Real-time listeners will trigger fetchTransactions and fetchStudents
    // Notification is now handled by the real-time listener
    return true;
  };

  const resetTransactions = async (): Promise<boolean> => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan.')) {
      return false;
    }
    // Delete all records from transactions table
    const { error } = await supabase
      .from('transactions')
      .delete()
      .not('id', 'is.null'); // Use .not('id', 'is.null') to delete all rows

    if (error) {
      console.error("Error resetting transactions:", error);
      showError("Gagal mereset riwayat transaksi.");
      return false;
    } else {
      showSuccess("Riwayat transaksi berhasil direset.");
      // Also reset all student balances to 0
      const { error: studentResetError } = await supabase
        .from('students')
        .update({ balance: 0 })
        .not('id', 'is.null'); // Use .not('id', 'is.null') to update all students

      if (studentResetError) {
        console.error("Error resetting student balances:", studentResetError);
        showError("Riwayat transaksi direset, tetapi gagal mereset saldo siswa.");
        return false;
      }
      // Real-time listeners will trigger fetchTransactions and fetchStudents
      return true;
    }
  };

  return (
    <TransactionsContext.Provider value={{ transactions, addTransaction, resetTransactions, fetchTransactions }}>
      {children}
    </TransactionsContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
}