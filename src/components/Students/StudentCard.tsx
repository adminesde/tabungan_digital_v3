import React from 'react';
import { Student } from '../../types';
import { User, DollarSign } from 'lucide-react';
import { Button } from '../ui/button'; // Import Button component

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit?: (student: Student) => void;
}

export default function StudentCard({ student, onView, onEdit }: StudentCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-theme-content-bg rounded-xl shadow-sm border border-theme-border-light p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
            <p className="text-sm text-gray-500">Kelas {student.class} • NISN {student.studentId}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-accent-green">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">{formatCurrency(student.balance)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Saldo Tabungan</p>
        </div>
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Button
          onClick={() => onView(student)}
          className="flex-1 text-sm font-medium"
          variant="accent-blue"
        >
          Lihat Detail
        </Button>
        {onEdit && (
          <Button
            onClick={() => onEdit(student)}
            className="text-sm font-medium"
            variant="gray-outline"
          >
            Edit
          </Button>
        )}
      </div>
    </div>
  );
}