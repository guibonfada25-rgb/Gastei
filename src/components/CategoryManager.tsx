import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Plus, Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export const DEFAULT_CATEGORIES = [
  "Alimentação", 
  "Transporte", 
  "Lazer", 
  "Saúde", 
  "Educação", 
  "Moradia", 
  "Outros"
];

interface CategoryManagerProps {}

export const CategoryManager: React.FC<CategoryManagerProps> = () => {
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewCategory('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
      <form onSubmit={handleAddCategory} className="flex gap-2">
        <input
          type="text"
          placeholder="Nova categoria..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !newCategory.trim()}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
        </button>
      </form>
    </div>
  );
};
