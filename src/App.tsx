import React, { useState, useEffect } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  User,
  signOut
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { ExpenseForm } from './components/ExpenseForm';
import { Dashboard } from './components/Dashboard';
import { InsightCard } from './components/InsightCard';
import { CategoryManager, DEFAULT_CATEGORIES } from './components/CategoryManager';
import { MonthSelector } from './components/MonthSelector';
import { IncomeForm } from './components/IncomeForm';
import { getFinancialInsight } from './services/geminiService';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { 
  Wallet, 
  LogOut, 
  TrendingUp, 
  History, 
  Sparkles,
  Loader2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryNames, setCategoryNames] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [generatingInsight, setGeneratingInsight] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'expenses');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncomes(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incomes');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'categories'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setCategories(data);
      if (data.length > 0) {
        // Use a Set to ensure unique names
        const names = Array.from(new Set(data.map(cat => cat.name as string)));
        setCategoryNames(names);
      } else {
        setCategoryNames(DEFAULT_CATEGORIES);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => signOut(auth);

  const handleResetHistory = async () => {
    if (!user) return;
    setResetting(true);
    try {
      const batch = writeBatch(db);
      
      // Fetch all expenses for the user
      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', user.uid));
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Fetch all incomes for the user
      const incomesQuery = query(collection(db, 'incomes'), where('userId', '==', user.uid));
      const incomesSnapshot = await getDocs(incomesQuery);
      incomesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      setInsight('');
      setShowResetConfirm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'history');
    } finally {
      setResetting(false);
    }
  };

  const handleCategoryChange = async (expenseId: string, newCategory: string) => {
    try {
      await updateDoc(doc(db, 'expenses', expenseId), {
        category: newCategory
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `expenses/${expenseId}`);
    }
  };

  const generateInsight = async () => {
    if (filteredExpenses.length === 0) return;
    setGeneratingInsight(true);
    try {
      const res = await getFinancialInsight(filteredExpenses.slice(0, 10), 3000);
      setInsight(res);
    } catch (error) {
      console.error(error);
    } finally {
      setGeneratingInsight(false);
    }
  };

  const filteredExpenses = selectedMonth 
    ? expenses.filter(e => {
        const date = new Date(e.date);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === selectedMonth;
      })
    : expenses;

  const filteredIncomes = selectedMonth
    ? incomes.filter(i => {
        const date = new Date(i.date);
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthStr === selectedMonth;
      })
    : incomes;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200">
              <Wallet className="text-white" size={40} />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-zinc-900">Gastei</h1>
            <p className="text-zinc-500">Gestão financeira de elite com inteligência artificial.</p>
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            <span>Entrar com Google</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Wallet size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight">Gastei</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-zinc-500">Premium Member</p>
            </div>
            <button 
              onClick={() => setShowResetConfirm(true)}
              title="Resetar Histórico"
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-zinc-400 hover:text-red-500"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-400 hover:text-red-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Top Section: Form and Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExpenseForm onSuccess={() => {}} categories={categoryNames} />
              <IncomeForm onSuccess={() => {}} />
            </div>
            <MonthSelector 
              expenses={expenses} 
              selectedMonth={selectedMonth} 
              onSelectMonth={setSelectedMonth} 
            />
            <Dashboard expenses={filteredExpenses} incomes={filteredIncomes} />
          </div>
          
          <div className="space-y-6">
            <CategoryManager />
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="text-emerald-500" size={18} />
                  Insights IA
                </h3>
                <button 
                  onClick={generateInsight}
                  disabled={generatingInsight || expenses.length === 0}
                  className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {generatingInsight ? 'Analisando...' : 'Gerar Novo'}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {insight ? (
                  <motion.div
                    key="insight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <InsightCard insight={insight} />
                  </motion.div>
                ) : (
                  <div className="py-12 text-center text-zinc-400 text-sm italic">
                    {expenses.length === 0 
                      ? "Adicione gastos para receber insights." 
                      : "Clique em 'Gerar Novo' para análise."}
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={18} />
                Metas Mensais
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-500">Orçamento</span>
                    <span className="font-medium">R$ 3.000,00</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${Math.min((expenses.reduce((s, e) => s + e.amount, 0) / 3000) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <History className="text-zinc-400" size={18} />
              Atividade Recente
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="px-6 py-4 font-medium">Data</th>
                  <th className="px-6 py-4 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={expense.category}
                        onChange={(e) => handleCategoryChange(expense.id, e.target.value)}
                        className="text-xs font-medium bg-zinc-100 text-zinc-800 px-2 py-1 rounded-full border-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:bg-zinc-200 transition-colors"
                      >
                        {categoryNames.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        {!categoryNames.includes(expense.category) && (
                          <option value={expense.category}>{expense.category}</option>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-right text-zinc-900">
                      R$ {expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">
                      Nenhum gasto registrado para este período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-black/5"
            >
              <div className="flex items-center gap-4 text-red-600 mb-4">
                <div className="p-3 bg-red-50 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-xl font-bold">Resetar Histórico?</h3>
              </div>
              <p className="text-zinc-600 mb-8 leading-relaxed">
                Esta ação irá apagar permanentemente todos os seus gastos e ganhos registrados. Esta operação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={resetting}
                  className="flex-1 py-3 px-4 bg-zinc-100 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetHistory}
                  disabled={resetting}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
                >
                  {resetting ? <Loader2 className="animate-spin" size={20} /> : 'Sim, Apagar Tudo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
