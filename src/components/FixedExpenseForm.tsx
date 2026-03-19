import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { Loader2, Calendar, DollarSign, Tag } from 'lucide-react';

interface FixedExpenseFormProps {
  onSuccess: () => void;
  categories: string[];
}

export const FixedExpenseForm: React.FC<FixedExpenseFormProps> = ({ onSuccess, categories }) => {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Moradia');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        description,
        amount: parseFloat(amount),
        category,
        type: 'Necessidade Fixa',
        date: new Date().toISOString(),
        userId: auth.currentUser.uid,
        source: 'manual_fixed',
        createdAt: serverTimestamp()
      });
      setDescription('');
      setAmount('');
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descrição</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Ex: Aluguel, Internet, Academia"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Categoria</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Despesa Fixa'}
      </button>
    </form>
  );
};
