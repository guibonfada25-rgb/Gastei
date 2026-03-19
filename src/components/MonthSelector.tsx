import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthSelectorProps {
  expenses: any[];
  selectedMonth: string | null;
  onSelectMonth: (month: string | null) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ expenses, selectedMonth, onSelectMonth }) => {
  // Extract unique months from expenses
  const months = Array.from(new Set(expenses.map(e => {
    const date = new Date(e.date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-emerald-500" size={20} />
        <h3 className="font-semibold text-zinc-900">Histórico por Mês</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onSelectMonth(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            selectedMonth === null 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Todos
        </button>
        
        {months.map((month) => (
          <button
            key={month}
            onClick={() => onSelectMonth(month)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
              selectedMonth === month 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {formatMonth(month)}
          </button>
        ))}
      </div>
    </div>
  );
};
