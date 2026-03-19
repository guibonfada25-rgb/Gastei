import React from 'react';
import Markdown from 'react-markdown';
import { Sparkles, Lightbulb } from 'lucide-react';

interface InsightCardProps {
  insight: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  if (!insight) return null;

  return (
    <div className="bg-zinc-900 text-white rounded-2xl p-6 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles size={120} />
      </div>
      
      <div className="flex items-center gap-2 mb-6 text-emerald-400">
        <Lightbulb size={24} />
        <h3 className="text-xl font-bold uppercase tracking-wider">Análise SmartSpend</h3>
      </div>

      <div className="markdown-body prose prose-invert max-w-none prose-p:text-zinc-300 prose-headings:text-white prose-strong:text-emerald-400">
        <Markdown>{insight}</Markdown>
      </div>
    </div>
  );
};
