import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Student } from '../types';

interface UseNisnLookupResult {
  nisn: string;
  setNisn: (nisn: string) => void;
  nisnStudentInfo: { name: string; class: string; id: string; parentId: string | null } | null;
  nisnError: string;
  isLoadingNisnLookup: boolean;
}

export function useNisnLookup(): UseNisnLookupResult {
  const [nisn, setNisn] = useState('');
  const [nisnStudentInfo, setNisnStudentInfo] = useState<{ name: string; class: string; id: string; parentId: string | null } | null>(null);
  const [nisnError, setNisnError] = useState('');
  const [isLoadingNisnLookup, setIsLoadingNisnLookup] = useState(false);

  useEffect(() => {
    const lookupStudent = async () => {
      if (nisn.length === 10 && /^\d+$/.test(nisn)) {
        setIsLoadingNisnLookup(true);
        setNisnError('');
        
        console.log("useNisnLookup: Querying for student_id:", nisn);

        const { data, error } = await supabase
          .from('students')
          .select('id, name, class, parent_id')
          .eq('student_id', nisn)
          .limit(1); // Added limit(1) instead of single()

        if (error) {
          console.error("useNisnLookup: Error looking up NISN:", error);
          setNisnStudentInfo(null);
          setNisnError('Terjadi kesalahan saat mencari NISN: ' + error.message);
        } else if (data && data.length > 0) {
          const studentData = data[0];
          setNisnStudentInfo({ 
            id: studentData.id, 
            name: studentData.name, 
            class: studentData.class, 
            parentId: studentData.parent_id 
          });
          console.log("useNisnLookup: Student found:", studentData);
        } else {
          setNisnStudentInfo(null);
          setNisnError('NISN tidak ditemukan.');
          console.log("useNisnLookup: NISN not found.");
        }
        setIsLoadingNisnLookup(false);
      } else if (nisn.length > 0 && nisn.length !== 10) {
        setNisnStudentInfo(null);
        setNisnError('NISN harus 10 digit angka.');
      } else if (nisn.length > 0 && !/^\d+$/.test(nisn)) {
        setNisnStudentInfo(null);
        setNisnError('NISN hanya boleh berisi angka.');
      } else {
        setNisnStudentInfo(null);
        setNisnError('');
      }
    };

    const debounceTimeout = setTimeout(() => {
      lookupStudent();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [nisn]);

  return { nisn, setNisn, nisnStudentInfo, nisnError, isLoadingNisnLookup };
}