import React, { useState } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, Info } from 'lucide-react';
import { Student, Payment } from '../types';
import { getPaymentInsights } from '../services/geminiService';

interface AIInsightsProps {
  students: Student[];
  payments: Payment[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ students, payments }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    const result = await getPaymentInsights(students, payments);
    setInsight(result || "No data available to analyze.");
    setIsLoading(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn text-slate-900 px-4 sm:px-0 pb-20">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-6 bg-sky-50 text-sky-500 rounded-[2.5rem] mb-2 shadow-inner border border-sky-100">
          <BrainCircuit size={48} className="sm:w-16 sm:h-16" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-sky-900 tracking-tighter uppercase">Audit Report</h1>
        <p className="text-sky-300 max-w-xl mx-auto text-xs sm:text-sm font-black uppercase tracking-[0.3em]">
          Smart insights for collection & revenue intelligence
        </p>
      </header>

      <div className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-xl shadow-sky-100/50 border border-sky-50">
        {!insight && !isLoading ? (
          <div className="py-8 sm:py-16 flex flex-col items-center text-center space-y-8 sm:space-y-10">
            <div className="p-8 bg-sky-50/50 rounded-full border border-sky-50 shadow-sm relative">
               <Sparkles size={64} className="text-sky-200 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-black text-sky-900 uppercase tracking-tight">Run Monthly Audit</h3>
              <p className="text-slate-400 max-w-sm mx-auto text-sm sm:text-base font-bold">AI will analyze records to identify missing payments and group them by level for parent follow-up.</p>
            </div>
            <button 
              onClick={fetchInsights}
              className="bg-sky-500 hover:bg-sky-600 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-sky-200 transition-all active:scale-95"
            >
              Start Intelligence Scan
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-24 sm:py-32 flex flex-col items-center space-y-10">
            <div className="relative">
               <div className="w-24 h-24 sm:w-32 sm:h-32 border-8 border-sky-50 border-t-sky-500 rounded-full animate-spin" />
               <BrainCircuit className="absolute inset-0 m-auto text-sky-500 animate-pulse" size={32} />
            </div>
            <p className="text-lg font-black text-sky-300 animate-pulse tracking-[0.5em] uppercase">Analyzing data...</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-sky-50 pb-8">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-sky-50 rounded-xl text-sky-500 border border-sky-100">
                  <Sparkles size={24} />
                </div>
                <div>
                   <span className="font-black text-sky-900 text-lg uppercase tracking-tight">Intelligence Output</span>
                   <p className="text-[10px] font-black text-sky-200 uppercase tracking-widest">Revenue Protection Audit</p>
                </div>
              </div>
              <button onClick={fetchInsights} className="p-3 bg-sky-50 text-sky-300 hover:text-sky-500 transition-all rounded-xl border border-sky-50 shadow-sm"><RefreshCw size={20} /></button>
            </div>
            <div className="bg-sky-50/20 p-8 sm:p-10 rounded-[2.5rem] border border-sky-50 whitespace-pre-wrap leading-relaxed text-sky-900 font-bold text-sm sm:text-base shadow-inner overflow-y-auto max-h-[600px] custom-scrollbar">
              {insight}
            </div>
            <div className="flex items-center gap-4 p-5 bg-sky-50/50 rounded-2xl text-sky-300 text-[10px] font-black tracking-[0.2em] uppercase">
              <Info size={18} className="shrink-0 text-sky-500" />
              Scan period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsights;