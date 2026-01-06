import React, { useState, useMemo } from 'react';
import { Calendar, Download, RefreshCcw, Loader2, ListChecks, Banknote, Wallet, FileText, User } from 'lucide-react';
import { Student, Payment, StudentLevel, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Component to handle daily financial records and exports
interface DailyRecordProps {
  students: Student[];
  payments: Payment[];
  sheetNo: number;
  onUpdateSheetNo: (no: number) => void;
}

const formatDateIntl = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d} / ${m} / ${y.slice(2)}`;
};

const DailyRecord: React.FC<DailyRecordProps> = ({ students, payments, sheetNo, onUpdateSheetNo }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState<'cash' | 'kpay' | 'all'>('cash');
  const [isExporting, setIsExporting] = useState(false);

  // Calculate stats for cash payments
  const cashStats = useMemo(() => {
    const dailyCashPayments = payments.filter(p => 
      p.date === selectedDate && 
      p.method === PaymentMethod.CASH && 
      p.sheetNo === sheetNo
    );
    
    const results: Record<string, { count: number; cash: number }> = {};
    const allLevels: StudentLevel[] = [
      'Pre-Starters', 'Starters 1', 'Starters 2', 'Movers 1', 'Movers 2', 
      'Pre-flyers', 'Flyers1', 'Flyers2', 'Flyers', 'KET-1', 'KET-2', 'PET', 'FCE', 
      'Math-1', 'Math-4', 'Math-6', 'Starters', 'Movers'
    ];
    
    allLevels.forEach(lvl => { results[lvl] = { count: 0, cash: 0 }; });
    
    dailyCashPayments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      if (student) {
        let targetCategory = student.category;
        // Logic refinement: Group Pre-flyers into Flyers for specific reporting requirements
        if (targetCategory === 'Pre-flyers') targetCategory = 'Flyers';
        
        if (results[targetCategory]) {
          results[targetCategory].count += 1;
          results[targetCategory].cash += p.amount;
        }
      }
    });
    
    return { 
      results, 
      totalStudents: dailyCashPayments.length, 
      totalCash: dailyCashPayments.reduce((sum, p) => sum + p.amount, 0) 
    };
  }, [selectedDate, payments, students, sheetNo]);

  // Calculate stats for K-pay payments
  const { kpayStats, totalKpayAmount } = useMemo(() => {
    const dailyKpayPayments = payments.filter(p => p.date === selectedDate && p.method === PaymentMethod.KPAY);
    const amount = dailyKpayPayments.reduce((sum, p) => sum + p.amount, 0);
    const stats = dailyKpayPayments.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return {
        name: student?.englishName || 'Unknown',
        class: student?.category || 'N/A',
        schedule: student?.dayType === 'Weekday' ? 'WD' : 'WE',
        date: formatDateIntl(selectedDate)
      };
    });
    return { kpayStats: stats, totalKpayAmount: amount };
  }, [selectedDate, payments, students]);

  // Export the selected report as PDF
  const handleExport = async () => {
    const elementId = activeTab === 'cash' ? 'cash-report-sheet' : 
                      activeTab === 'kpay' ? 'kpay-report-sheet' : 'all-paid-sheet';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const orientation = (activeTab === 'cash' || activeTab === 'all') ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Daily_Record_${activeTab}_${selectedDate}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to aggregate levels for common base categories (e.g., Starters 1 + Starters 2)
  const getCombinedLevel = (base: string) => {
    const filtered = Object.entries(cashStats.results).filter(([key]) => key.startsWith(base)) as [string, { count: number; cash: number }][];
    return {
      count: filtered.reduce((sum, [_, val]) => sum + val.count, 0),
      cash: filtered.reduce((sum, [_, val]) => sum + val.cash, 0)
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-sky-900 uppercase tracking-tight">Daily Record</h1>
          <div className="flex bg-sky-50 border border-sky-100 p-1.5 rounded-2xl w-fit mt-4 shadow-sm">
            <button onClick={() => setActiveTab('cash')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cash' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100/50'}`}>
              <Banknote size={16} /> Cash
            </button>
            <button onClick={() => setActiveTab('kpay')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'kpay' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100/50'}`}>
              <Wallet size={16} /> K-pay
            </button>
            <button onClick={() => setActiveTab('all')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100/50'}`}>
              <ListChecks size={16} /> History
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-black">
          {activeTab === 'cash' && (
            <div className="flex items-center gap-4 px-6 py-2.5 bg-sky-50/50 border border-sky-100 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest">Sheet</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  className="w-10 bg-transparent border-none outline-none font-black text-sky-900 text-center focus:ring-0" 
                  value={sheetNo} 
                  onChange={(e) => onUpdateSheetNo(parseInt(e.target.value) || 1)} 
                />
                <button onClick={() => onUpdateSheetNo(sheetNo >= 20 ? 1 : sheetNo + 1)} className="p-1 text-sky-200 hover:text-sky-500 transition-all">
                  <RefreshCcw size={14} />
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-4 px-6 py-3 bg-sky-50/50 border border-sky-100 rounded-2xl shadow-sm min-w-[220px]">
            <Calendar size={20} className="text-sky-300 shrink-0" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer w-full focus:ring-0 text-sky-900" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-3 bg-sky-500 text-white px-10 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-sky-200/50 text-xs uppercase tracking-widest disabled:opacity-50">
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{isExporting ? 'Processing...' : 'Export PDF'}</span>
          </button>
        </div>
      </header>

      <div className="bg-sky-50/20 rounded-[2.5rem] p-4 sm:p-10 border border-sky-100 overflow-x-auto custom-scrollbar flex flex-col items-start shadow-sm text-black">
        <div className="min-w-fit flex flex-col items-start pb-6 w-full">
          {activeTab === 'cash' && (
            <div id="cash-report-sheet" className="bg-white p-16 sm:p-20 w-[1122px] border border-sky-200 shrink-0 ml-2 shadow-2xl text-black rounded-[2rem]">
              <div className="space-y-12">
                <div className="flex items-center justify-between border-b-4 border-sky-100 pb-4">
                  <div className="flex items-center gap-6">
                    <FileText size={48} className="text-sky-900" />
                    <h2 className="text-4xl font-black text-sky-900 uppercase tracking-tighter">Daily Cash Collection</h2>
                  </div>
                  <div className="border-4 border-sky-500 p-4 text-center min-w-[180px] rounded-xl">
                    <span className="text-2xl font-black text-sky-900 uppercase">Sheet {sheetNo}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-12">
                  <div className="w-full border-t border-l border-sky-200">
                    <div className="flex bg-sky-50/50">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 text-center font-bold text-sky-900 uppercase tracking-widest text-xs">Classes</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Pre-Starters</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Starters</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Movers</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Flyers</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">KET</div>
                    </div>
                    <div className="flex">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 font-bold bg-sky-50/20 text-sky-900">Total Students</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['Pre-Starters'].count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{getCombinedLevel('Starters').count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{getCombinedLevel('Movers').count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{getCombinedLevel('Flyers').count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{getCombinedLevel('KET').count || ''}</div>
                    </div>
                    <div className="flex">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 font-bold bg-sky-50/20 text-sky-900">Total Cash</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['Pre-Starters'].cash ? cashStats.results['Pre-Starters'].cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{getCombinedLevel('Starters').cash ? getCombinedLevel('Starters').cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{getCombinedLevel('Movers').cash ? getCombinedLevel('Movers').cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{getCombinedLevel('Flyers').cash ? getCombinedLevel('Flyers').cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{getCombinedLevel('KET').cash ? getCombinedLevel('KET').cash.toLocaleString() : ''}</div>
                    </div>
                  </div>
                  <div className="w-full border-t border-l border-sky-200">
                    <div className="flex bg-sky-50/50">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 text-center font-bold text-sky-900 uppercase tracking-widest text-xs">Classes</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">PET</div>
                      <div className="flex-1 border-r border-b border- sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">FCE</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Math-1</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Math-4</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] uppercase text-sky-400 tracking-widest">Math-6</div>
                    </div>
                    <div className="flex">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 font-bold bg-sky-50/20 text-sky-900">Total Student</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['PET']?.count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['FCE']?.count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['Math-1']?.count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['Math-4']?.count || ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-3xl font-black text-sky-900">{cashStats.results['Math-6']?.count || ''}</div>
                    </div>
                    <div className="flex">
                      <div className="w-[20%] border-r border-b border-sky-200 p-4 font-bold bg-sky-50/20 text-sky-900">Total Cash</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['PET']?.cash ? cashStats.results['PET'].cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-200 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['FCE']?.cash ? cashStats.results['FCE'].cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-100 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['Math-1']?.cash ? cashStats.results['Math-1'].cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-100 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['Math-4']?.cash ? cashStats.results['Math-4'].cash.toLocaleString() : ''}</div>
                      <div className="flex-1 border-r border-b border-sky-100 p-4 text-center text-xl font-bold text-sky-600">{cashStats.results['Math-6']?.cash ? cashStats.results['Math-6'].cash.toLocaleString() : ''}</div>
                    </div>
                  </div>
                </div>
                <div className="flex border-4 border-sky-900 min-h-[220px] rounded-[2rem] overflow-hidden">
                  <div className="w-1/2 p-10 space-y-8 border-r-4 border-sky-900 bg-sky-50/30">
                    <div className="text-2xl font-black text-sky-900">Total Students (Cash) - <span className="ml-4 text-4xl">{cashStats.totalStudents || '0'}</span></div>
                    <div className="text-2xl font-black text-sky-900">Total Cash Collected - <span className="ml-4 text-4xl text-sky-600">{cashStats.totalCash ? `${cashStats.totalCash.toLocaleString()} Ks` : '0 Ks'}</span></div>
                  </div>
                  <div className="w-1/2 p-10 flex flex-col justify-between bg-white">
                    <div className="text-2xl font-black text-sky-900 uppercase opacity-20 italic">Audit verification</div>
                    <div className="text-2xl font-black text-sky-900 text-right uppercase tracking-tighter">{formatDateIntl(selectedDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kpay' && (
            <div id="kpay-report-sheet" className="bg-white p-12 sm:p-16 min-h-[1122px] w-[794px] border border-sky-200 shrink-0 ml-2 shadow-2xl text-black rounded-[2rem]">
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-center border-b-4 border-sky-500 pb-2 mb-8 tracking-widest text-sky-900 uppercase">K-pay Transactions</h2>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-sky-200 p-4 rounded-xl bg-sky-50/30">
                    <span className="text-xl font-black text-sky-900 uppercase tracking-tight">Count: {kpayStats.length || '0'}</span>
                  </div>
                  <div className="border border-sky-200 p-4 rounded-xl bg-sky-50/30">
                    <span className="text-xl font-black text-sky-600 uppercase tracking-tight">Total: {totalKpayAmount.toLocaleString()} Ks</span>
                  </div>
                </div>
                <table className="w-full border-t border-l border-sky-200 table-fixed rounded-xl overflow-hidden text-black">
                  <thead>
                    <tr className="bg-sky-500 text-white">
                      <th className="border-r border-b border-sky-500 p-3 text-left w-12 font-bold text-sm">No.</th>
                      <th className="border-r border-b border-sky-500 p-3 text-left font-bold text-sm">Name</th>
                      <th className="border-r border-b border-sky-500 p-3 text-left w-32 font-bold text-sm">Class</th>
                      <th className="border-r border-b border-sky-500 p-3 text-center w-20 font-bold text-sm">Sch</th>
                      <th className="border-r border-b border-sky-500 p-3 text-left w-32 font-bold text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <tr key={i} className={`h-10 ${i % 2 === 0 ? 'bg-white' : 'bg-sky-50/20'}`}>
                        <td className="border-r border-b border-sky-100 px-3 text-sm font-bold text-sky-300">{i + 1}.</td>
                        <td className="border-r border-b border-sky-100 px-3 text-sm font-black text-sky-900 truncate">{kpayStats[i]?.name || ''}</td>
                        <td className="border-r border-b border-sky-100 px-3 text-sm font-bold text-slate-400 truncate">{kpayStats[i]?.class || ''}</td>
                        <td className="border-r border-b border-sky-100 px-3 text-sm text-center font-black text-sky-500">{kpayStats[i]?.schedule || ''}</td>
                        <td className="border-r border-b border-sky-100 px-3 text-sm text-slate-400">{kpayStats[i] ? kpayStats[i].date : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'all' && (
            <div id="all-paid-sheet" className="bg-white p-12 sm:p-16 min-h-[794px] w-[1122px] border border-sky-200 shrink-0 ml-2 shadow-2xl text-black rounded-[2rem]">
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b-4 border-sky-500 pb-4 mb-4">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-sky-900">Audit History</h2>
                  <div className="text-right">
                    <p className="text-xl font-black text-sky-500">{formatDateIntl(selectedDate)}</p>
                    <p className="text-sm font-bold text-slate-300">Transaction Log</p>
                  </div>
                </div>
                <table className="w-full text-left border-collapse text-black">
                  <thead>
                    <tr className="bg-sky-50 text-sky-900 text-xs font-black uppercase tracking-widest border-b border-sky-100">
                      <th className="p-4">Student</th>
                      <th className="p-4">Level</th>
                      <th className="p-4">Method</th>
                      <th className="p-4 text-center">Sheet</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.filter(p => p.date === selectedDate).sort((a,b) => a.method.localeCompare(b.method)).map(p => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id} className="border-b border-sky-50 hover:bg-sky-50/30 transition-colors">
                          <td className="p-4 font-black text-sky-900">{student?.englishName || 'Unknown'}</td>
                          <td className="p-4 text-slate-400 font-bold">{student?.category || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${p.method === PaymentMethod.KPAY ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {p.method}
                            </span>
                          </td>
                          <td className="p-4 text-center font-black text-sky-300">#{p.sheetNo}</td>
                          <td className="p-4 text-right font-black text-sky-900">{p.amount.toLocaleString()} Ks</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyRecord;