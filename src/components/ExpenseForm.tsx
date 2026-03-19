import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, FileText, Loader2, X } from 'lucide-react';
import { extractExpenseFromText, extractExpensesFromDocument, extractExpensesFromTextContent, ExtractedExpense } from '../services/geminiService';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from './CategoryManager';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { FixedExpenseForm } from './FixedExpenseForm';

interface ExpenseFormProps {
  onSuccess: () => void;
  categories: string[];
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onSuccess, categories }) => {
  const [activeTab, setActiveTab] = useState<'variable' | 'fixed'>('variable');
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setLoading(true);
    try {
      const extracted = await extractExpenseFromText(textInput, categories);
      if (extracted) {
        await saveExpense(extracted, 'voice');
        setTextInput('');
        onSuccess();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        reader.onload = async () => {
          const text = reader.result as string;
          const extractedList = await extractExpensesFromTextContent(text, categories);
          for (const exp of extractedList) {
            await saveExpense(exp, 'statement');
          }
          onSuccess();
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const extractedList = await extractExpensesFromDocument(base64, file.type, categories);
          for (const exp of extractedList) {
            await saveExpense(exp, 'statement');
          }
          onSuccess();
        };
        reader.readAsDataURL(file);
      } else {
        alert('Formato de arquivo não suportado pela IA. Por favor, use Imagens, PDF ou CSV.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveExpense = async (data: ExtractedExpense, source: string) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'expenses'), {
        ...data,
        userId: auth.currentUser.uid,
        source,
        createdAt: serverTimestamp(),
        date: data.date || new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-900">Registrar Gasto</h2>
      </div>

      <div className="flex p-1 bg-zinc-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('variable')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'variable' 
              ? 'bg-white text-zinc-900 shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Gasto Variável
        </button>
        <button
          onClick={() => setActiveTab('fixed')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'fixed' 
              ? 'bg-white text-zinc-900 shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Gasto Fixo
        </button>
      </div>

      {activeTab === 'variable' ? (
        <div className="space-y-4">
          <form onSubmit={handleTextSubmit} className="relative">
            <input
              type="text"
              placeholder="Ex: 'Gastei 50 reais no posto de gasolina'"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              disabled={loading}
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
            </button>
          </form>

          <div className="flex gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-500 hover:border-emerald-500 hover:text-emerald-600 transition-all"
              disabled={loading}
            >
              <FileText size={20} />
              <span>Subir Extrato/Recibo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,application/pdf,text/csv"
            />
          </div>
        </div>
      ) : (
        <FixedExpenseForm onSuccess={onSuccess} categories={categories} />
      )}
    </div>
  );
};
