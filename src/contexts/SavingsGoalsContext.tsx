import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SavingsGoal } from '../types';
import { useStudents } from './StudentsContext';
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext'; // Import useAuth

interface SavingsGoalsContextType {
  savingsGoals: SavingsGoal[];
  addSavingsGoal: (newGoal: Omit<SavingsGoal, 'id' | 'status' | 'currentSavedAmount' | 'studentId' | 'type'> & { classId: string; goalName: string; goalAmount: number; targetDate: string; dayOfWeek: string }) => Promise<boolean>;
  updateSavingsGoal: (updatedGoal: SavingsGoal) => Promise<boolean>;
  deleteSavingsGoal: (goalId: string) => Promise<boolean>;
  fetchSavingsGoals: () => Promise<void>; // Add fetchSavingsGoals
}

const SavingsGoalsContext = createContext<SavingsGoalsContextType | undefined>(undefined);

export function SavingsGoalsProvider({ children }: { children: ReactNode }) {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const { students } = useStudents(); // Students needed for currentSavedAmount calculation
  const { user } = useAuth(); // Get user from AuthContext

  const fetchSavingsGoals = useCallback(async () => {
    if (!user) { // Only fetch if user is logged in
      setSavingsGoals([]); // Clear goals if no user
      return;
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('type', 'class'); // Only fetch class goals

    if (error) {
      console.error("Error fetching savings goals:", error);
      showError("Gagal memuat tujuan tabungan.");
    } else {
      const fetchedGoals: SavingsGoal[] = data.map(g => ({
        id: g.id,
        classId: g.class_id,
        type: g.type,
        goalName: g.goal_name,
        goalAmount: g.goal_amount,
        currentSavedAmount: 0, // Will be calculated dynamically
        targetDate: g.target_date,
        status: 'on-track', // Will be calculated dynamically
        dayOfWeek: g.day_of_week, // Fetch day_of_week
      }));
      setSavingsGoals(fetchedGoals);
    }
  }, [user]); // Dependencies for useCallback

  useEffect(() => {
    // Initial fetch when component mounts and user is available
    if (user) {
      fetchSavingsGoals();
    }
    
    // Setup real-time listener for savings_goals table
    const channel = supabase
      .channel('savings_goals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals' }, payload => {
        fetchSavingsGoals(); // Re-fetch goals on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSavingsGoals, user]); // Add fetchSavingsGoals to dependency array

  const addSavingsGoal = async (
    newGoalData: Omit<SavingsGoal, 'id' | 'status' | 'currentSavedAmount' | 'studentId' | 'type'> & { classId: string; goalName: string; goalAmount: number; targetDate: string; dayOfWeek: string }
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .insert({
        class_id: newGoalData.classId,
        type: 'class', // Ensure type is 'class' for class goals
        goal_name: newGoalData.goalName,
        goal_amount: newGoalData.goalAmount,
        target_date: newGoalData.targetDate,
        day_of_week: newGoalData.dayOfWeek, // Insert day_of_week
      });

    if (error) {
      console.error("Error adding savings goal:", error);
      showError("Gagal menambahkan tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil ditambahkan.");
      // fetchSavingsGoals() will be triggered by real-time listener
      return true;
    }
  };

  const updateSavingsGoal = async (updatedGoal: SavingsGoal): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .update({
        goal_name: updatedGoal.goalName,
        goal_amount: updatedGoal.goalAmount,
        target_date: updatedGoal.targetDate,
        day_of_week: updatedGoal.dayOfWeek, // Update day_of_week
        // class_id, type, current_saved_amount, status are not directly updated here
      })
      .eq('id', updatedGoal.id);

    if (error) {
      console.error("Error updating savings goal:", error);
      showError("Gagal memperbarui tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil diperbarui.");
      // fetchSavingsGoals() will be triggered by real-time listener
      return true;
    }
  };

  const deleteSavingsGoal = async (goalId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      console.error("Error deleting savings goal:", error);
      showError("Gagal menghapus tujuan tabungan.");
      return false;
    } else {
      showSuccess("Tujuan tabungan berhasil dihapus.");
      // fetchSavingsGoals() will be triggered by real-time listener
      return true;
    }
  };

  return (
    <SavingsGoalsContext.Provider value={{ savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, fetchSavingsGoals }}>
      {children}
    </SavingsGoalsContext.Provider>
  );
}

export function useSavingsGoals() {
  const context = useContext(SavingsGoalsContext);
  if (context === undefined) {
    throw new Error('useSavingsGoals must be used within a SavingsGoalsProvider');
  }
  return context;
}