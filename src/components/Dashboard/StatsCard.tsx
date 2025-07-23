import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red';
  // trend?: { // Removed trend prop
  //   value: string;
  //   isPositive: boolean;
  // };
}

const colorVariants = {
  blue: 'bg-accent-blue text-white', // Solid background, white text
  green: 'bg-accent-green text-white',
  orange: 'bg-accent-orange text-white',
  red: 'bg-accent-red text-white',
};

const iconColorVariants = {
  blue: 'bg-icon-blue-bg text-accent-blue', // Light background, accent text
  green: 'bg-icon-green-bg text-accent-green',
  orange: 'bg-icon-orange-bg text-accent-orange',
  red: 'bg-icon-red-bg text-accent-red',
};

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) { // Removed trend from destructuring
  return (
    <div className={`p-6 rounded-2xl shadow-lg ${colorVariants[color]} transition-all hover:scale-[1.02]`}> {/* More rounded, stronger shadow, no border */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p> {/* Larger value font */}
          {/* {trend && ( // Removed trend rendering
            <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-200' : 'text-red-200'}`}>
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </p>
          )} */}
        </div>
        <div className={`p-3 rounded-lg ${iconColorVariants[color]}`}>
          <Icon className="w-5 h-5" /> {/* Slightly smaller icon */}
        </div>
      </div>
    </div>
  );
}