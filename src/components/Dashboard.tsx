import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DashboardProps {
  expenses: any[];
  incomes: any[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Dashboard: React.FC<DashboardProps> = ({ expenses, incomes }) => {
  const categoryData = expenses.reduce((acc: any[], curr) => {
    const existing = acc.find(i => i.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const balance = totalIncome - totalExpenses;

  // Budgeting Division (e.g., 50/30/20 rule)
  const budgetDivision = [
    { name: 'Necessidades (50%)', target: totalIncome * 0.5, current: expenses.filter(e => e.type === 'Necessidade Fixa').reduce((s, e) => s + e.amount, 0), color: '#10b981' },
    { name: 'Desejos (30%)', target: totalIncome * 0.3, current: expenses.filter(e => e.type === 'Desejo Pessoal').reduce((s, e) => s + e.amount, 0), color: '#3b82f6' },
    { name: 'Dívidas/Invest. (20%)', target: totalIncome * 0.2, current: expenses.filter(e => e.type === 'Dívida/Investimento').reduce((s, e) => s + e.amount, 0), color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Entrada Total</p>
          <p className="text-2xl font-bold text-emerald-600">R$ {totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saída Total</p>
          <p className="text-2xl font-bold text-rose-600">R$ {totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saldo</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            R$ {balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Budgeting Division */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
        <h3 className="text-lg font-semibold mb-6 text-zinc-900">Divisão Sugerida (50/30/20)</h3>
        <div className="space-y-6">
          {budgetDivision.map((item) => {
            const percentage = totalIncome > 0 ? (item.current / item.target) * 100 : 0;
            const isOver = item.current > item.target;
            
            return (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-700">{item.name}</span>
                  <span className="text-zinc-500">
                    R$ {item.current.toFixed(2)} / <span className="font-semibold">R$ {item.target.toFixed(2)}</span>
                  </span>
                </div>
                <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOver ? '#ef4444' : item.color
                    }}
                  />
                </div>
                {isOver && (
                  <p className="text-[10px] text-rose-500 font-medium uppercase tracking-tight">
                    Atenção: Você ultrapassou o limite sugerido para esta categoria!
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {totalIncome === 0 && (
          <p className="mt-4 text-sm text-zinc-400 italic text-center">
            Adicione sua renda para ver a divisão sugerida.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
          <h3 className="text-lg font-semibold mb-4 text-zinc-900">Gastos por Categoria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {categoryData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-zinc-600">{item.name}</span>
                </div>
                <span className="font-medium text-zinc-900">R$ {item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 flex flex-col justify-center items-center text-center space-y-4">
          <div className="p-4 bg-emerald-50 rounded-full">
            <TrendingUp className="text-emerald-600" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Saúde Financeira</h3>
            <p className="text-sm text-zinc-500 mt-1">
              {balance > 0 
                ? "Parabéns! Você está gastando menos do que recebe." 
                : "Atenção: Seus gastos estão superando sua renda este mês."}
            </p>
          </div>
          <div className="w-full pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">Saldo Atual</p>
            <p className={`text-3xl font-black mt-1 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
