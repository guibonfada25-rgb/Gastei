import React, { useState } from 'react';
import { Plus, Wallet, Loader2, X } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

interface IncomeFormProps {
  onSuccess: () => void;
}

export const IncomeForm: React.FC<IncomeFormProps> = ({ onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'incomes'), {
        description: description.trim(),
        amount: parseFloat(amount),
        userId: auth.currentUser.uid,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
      setDescription('');
      setAmount('');
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'incomes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="text-emerald-500" size={20} />
          <h2 className="text-lg font-semibold text-zinc-900">Entrada de Dinheiro</h2>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
        >
          {isOpen ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Salário, Freelance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Registrar Entrada'}
          </button>
        </form>
      )}
      
      {!isOpen && (
        <p className="text-sm text-zinc-500 italic">
          Registre seu salário ou outras rendas para ver o balanço mensal.
        </p>
      )}
    </div>
  );
};
