import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Student } from '../types';
import { supabase } from '../integrations/supabase/client';
import { showError, showSuccess } from '../utils/toast';
import { useAuth } from './Auth/AuthContext'; // Import useAuth

interface StudentsContextType {
  students: Student[];
  addStudent: (newStudent: Omit<Student, 'id' | 'createdAt'>) => Promise<boolean>;
  addMultipleStudents: (newStudents: Omit<Student, 'id' | 'createdAt'>[]) => Promise<boolean>;
  updateStudent: (updatedStudent: Student) => Promise<boolean>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  fetchStudents: () => Promise<void>; // Add fetchStudents to context
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const { user, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading state

  const fetchStudents = useCallback(async () => {
    if (isAuthLoading) { // Wait for auth to finish loading
      console.log("StudentsContext: Auth still loading, deferring fetchStudents.");
      return;
    }
    if (!user) { // Only fetch if user is logged in
      console.log("StudentsContext: No user logged in, clearing students.");
      setStudents([]);
      return;
    }
    console.log("StudentsContext: Fetching students for user:", user.id, "role:", user.role, "studentInfo:", user.studentInfo); // Added log
    const { data, error } = await supabase
      .from('students')
      .select('*');

    if (error) {
      console.error("StudentsContext: Error fetching students:", error);
      showError("Gagal memuat data siswa.");
    } else {
      const fetchedStudents: Student[] = data.map(s => ({
        id: s.id,
        name: s.name,
        class: s.class,
        studentId: s.student_id,
        parentId: s.parent_id,
        balance: s.balance,
        createdAt: s.created_at,
      }));
      setStudents(fetchedStudents);
      console.log("StudentsContext: Fetched students count:", fetchedStudents.length);
      console.log("StudentsContext: Fetched students data:", fetchedStudents);
    }
  }, [user, isAuthLoading]); // Dependencies for useCallback

  useEffect(() => {
    // Initial fetch when component mounts and auth is ready
    if (!isAuthLoading && user) {
      fetchStudents();
    }
    
    // Setup real-time listener for students table
    const channel = supabase
      .channel('students_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, payload => {
        console.log("StudentsContext: Realtime change detected, re-fetching students.");
        fetchStudents(); // Re-fetch students on any change
      })
      .subscribe();

    return () => {
      console.log("StudentsContext: Unsubscribing from realtime listener.");
      supabase.removeChannel(channel);
    };
  }, [fetchStudents, user, isAuthLoading]); // Add fetchStudents to dependency array

  const addStudent = async (newStudentData: Omit<Student, 'id' | 'createdAt'>): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .insert({
        name: newStudentData.name,
        class: newStudentData.class,
        student_id: newStudentData.studentId,
        parent_id: newStudentData.parentId,
        balance: newStudentData.balance,
      });

    if (error) {
      console.error("Error adding student:", error);
      showError("Gagal menambahkan siswa baru.");
      return false;
    } else {
      showSuccess("Siswa baru berhasil ditambahkan.");
      // fetchStudents() will be triggered by real-time listener
      return true;
    }
  };

  const addMultipleStudents = async (newStudentsData: Omit<Student, 'id' | 'createdAt'>[]): Promise<boolean> => {
    const studentsToInsert = newStudentsData.map(data => ({
      name: data.name,
      class: data.class,
      student_id: data.studentId,
      parent_id: data.parentId,
      balance: data.balance,
    }));

    console.log("StudentsContext: Attempting to insert multiple students:", studentsToInsert);
    const { error } = await supabase
      .from('students')
      .insert(studentsToInsert);

    if (error) {
      console.error("StudentsContext: Error adding multiple students:", error);
      showError("Gagal mengimpor beberapa siswa.");
      return false;
    } else {
      console.log("StudentsContext: Multiple students successfully imported.");
      showSuccess("Beberapa siswa berhasil diimpor.");
      // fetchStudents() will be triggered by real-time listener
      return true;
    }
  };

  const updateStudent = async (updatedStudent: Student): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .update({
        name: updatedStudent.name,
        class: updatedStudent.class,
        student_id: updatedStudent.studentId,
        // balance and parent_id are updated via other means or not directly editable here
      })
      .eq('id', updatedStudent.id);

    if (error) {
      console.error("Error updating student:", error);
      showError("Gagal memperbarui data siswa.");
      return false;
    } else {
      showSuccess("Data siswa berhasil diperbarui.");
      // fetchStudents() will be triggered by real-time listener
      return true;
    }
  };

  const deleteStudent = async (studentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (error) {
      console.error("Error deleting student:", error);
      showError("Gagal menghapus siswa.");
      return false;
    } else {
      showSuccess("Siswa berhasil dihapus.");
      // fetchStudents() will be triggered by real-time listener
      return true;
    }
  };

  return (
    <StudentsContext.Provider value={{ students, addStudent, addMultipleStudents, updateStudent, deleteStudent, fetchStudents }}>
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudents() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error('useStudents must be used within a StudentsProvider');
  }
  return context;
}