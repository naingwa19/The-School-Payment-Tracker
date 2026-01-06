import React, { useState, useMemo } from 'react';
import { Calendar, Download, CreditCard, Banknote, RefreshCcw, Loader2, ListChecks, Wallet } from 'lucide-react';
import { Student, Payment, StudentLevel, PaymentMethod } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DailyRecordProps {
  students: Student[];
  payments: Payment[];
  sheetNo: number;
  onUpdateSheetNo: (no: number) => void;
}

const getFeeByLevel = (level: StudentLevel): number => {
  const l = level.toLowerCase();
  if (l.includes('ket') || l.includes('pet') || l.includes('fce')) return 70000;
  if (l.includes('math')) return 55000;
  return 65000;
};

const formatDateIntl = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d} / ${m} / ${y.slice(2)}`;
};

const DailyRecord: React.FC<DailyRecordProps> = ({ students, payments, sheetNo, onUpdateSheetNo }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeTab, setActiveTab] = useState<'cash' | 'kpay' | 'all'>('cash');
  const [isExporting, setIsExporting] = useState(false);

  const cashStats = useMemo(() => {
    const dailyCashPayments = payments.filter(p => 
      p.date === selectedDate && 
      p.method === PaymentMethod.CASH && 
      p.sheetNo === sheetNo
    );
    const results: Record<string, { count: number; cash: number }> = {};
    // Fixed StudentLevel string values to match types.ts definition
    const allLevels: StudentLevel[] = [
      'Pre-Starters', 
      'Starters 1', 'Starters 2', 
      'Movers 1', 'Movers 2', 
      'Pre-flyers', 
      'Flyers1', 'Flyers2', 
      'KET-1', 'KET-2', 
      'PET', 'FCE', 
      'Math-1', 'Math-4', 'Math-6'
    ];
    allLevels.forEach(lvl => { results[lvl] = { count: 0, cash: 0 }; });
    dailyCashPayments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      if (student) {
        const fee = getFeeByLevel(student.category);
        results[student.category].count += 1;
        results[student.category].cash += fee;
      }
    });
    return { 
      results, 
      totalStudents: dailyCashPayments.length, 
      totalCash: dailyCashPayments.reduce((sum, p) => sum + p.amount, 0) 
    };
  }, [selectedDate, payments, students, sheetNo]);

  const { kpayStats, totalKpayAmount } = useMemo(() => {
    const dailyKpayPayments = payments.filter(p => 
      p.date === selectedDate && 
      p.method === PaymentMethod.KPAY
    );
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

  const paidTodayList = useMemo(() => {
    return payments
      .filter(p => p.date === selectedDate)
      .map(p => {
        const student = students.find(s => s.id === p.studentId);
        return {
          ...p,
          studentName: student?.englishName || 'Unknown',
          studentClass: student?.category || 'N/A'
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }, [payments, selectedDate, students]);

  const handleExport = async () => {
    let elementId = '';
    if (activeTab === 'cash') elementId = 'cash-report-sheet';
    else if (activeTab === 'kpay') elementId = 'kpay-report-sheet';
    else elementId = 'all-paid-sheet';

    const element = document.getElementById(elementId);
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const orientation = (activeTab === 'cash' || activeTab === 'all') ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Daily_Record_${activeTab.toUpperCase()}_${selectedDate}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNextSheet = () => {
    const next = sheetNo >= 20 ? 1 : sheetNo + 1;
    onUpdateSheetNo(next);
  };

  const getCombinedLevel = (base: string) => {
    const filtered = Object.entries(cashStats.results).filter(([key]) => key.startsWith(base)) as [string, { count: number; cash: number }][];
    return {
      count: filtered.reduce((sum, [_, val]) => sum + val.count, 0),
      cash: filtered.reduce((sum, [_, val]) => sum + val.cash, 0)
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn text-black">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">Daily records</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mt-3">
            <button 
              onClick={() => setActiveTab('cash')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'cash' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
            >
              <Banknote size={16} /> Cash
            </button>
            <button 
              onClick={() => setActiveTab('kpay')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'kpay' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
            >
              <CreditCard size={16} /> K-pay
            </button>
            <button 
              onClick={() => setActiveTab('all')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
            >
              <ListChecks size={16} /> Paid list
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'cash' && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sheet</span>
              <input 
                type="number" 
                className="w-10 bg-transparent border-none outline-none font-bold text-black focus:ring-0" 
                value={sheetNo} 
                onChange={(e) => onUpdateSheetNo(parseInt(e.target.value) || 1)}
              />
              <button onClick={handleNextSheet} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-black transition-colors">
                <RefreshCcw size={14} />
              </button>
            </div>
          )}
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm min-w-[180px]">
            <Calendar size={18} className="text-slate-400 shrink-0" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer w-full focus:ring-0"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </header>

      <div className="overflow-x-auto pb-8 custom-scrollbar flex flex-col items-center">
        {activeTab === 'cash' && (
          <div id="cash-report-sheet" className="bg-white p-12 sm:p-16 min-h-[794px] w-[1122px] shadow-xl border border-slate-100 transition-all shrink-0">
            <div className="space-y-8">
              <div className="w-fit border-2 border-black p-4 min-w-[200px]">
                <span className="text-xl font-bold uppercase tracking-tight">Sheet No. {sheetNo}</span>
              </div>
              <div className="grid grid-cols-1 gap-8">
                <div className="w-full border-t-2 border-l-2 border-black">
                  <div className="flex bg-slate-50">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-lg">Classes</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Pre-Starters</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Starters</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Movers</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Flyers</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">KET</div>
                  </div>
                  <div className="flex">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 font-bold text-base">Total Students</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Pre-Starters'].count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Starters').count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Movers').count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Flyers').count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('KET').count || ''}</div>
                  </div>
                  <div className="flex">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 font-bold text-base">Total Cash</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Pre-Starters'].cash ? cashStats.results['Pre-Starters'].cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Starters').cash ? getCombinedLevel('Starters').cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Movers').cash ? getCombinedLevel('Movers').cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('Flyers').cash ? getCombinedLevel('Flyers').cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{getCombinedLevel('KET').cash ? getCombinedLevel('KET').cash.toLocaleString() : ''}</div>
                  </div>
                </div>
                <div className="w-full border-t-2 border-l-2 border-black">
                  <div className="flex bg-slate-50">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-lg">Classes</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">PET</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">FCE</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Math-1</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Math-4</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center font-bold text-base">Math-6</div>
                  </div>
                  <div className="flex">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 font-bold text-base">Total Students</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['PET'].count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['FCE'].count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-1'].count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-4'].count || ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-6'].count || ''}</div>
                  </div>
                  <div className="flex">
                    <div className="w-[20%] border-r-2 border-b-2 border-black p-3 font-bold text-base">Total Cash</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['PET'].cash ? cashStats.results['PET'].cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['FCE'].cash ? cashStats.results['FCE'].cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-1'].cash ? cashStats.results['Math-1'].cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-4'].cash ? cashStats.results['Math-4'].cash.toLocaleString() : ''}</div>
                    <div className="w-[16%] border-r-2 border-b-2 border-black p-3 text-center text-lg">{cashStats.results['Math-6'].cash ? cashStats.results['Math-6'].cash.toLocaleString() : ''}</div>
                  </div>
                </div>
              </div>
              <div className="flex border-2 border-black min-h-[220px] mt-8">
                <div className="w-1/2 p-8 space-y-6 border-r-2 border-black">
                  <div className="text-xl font-bold">Total students (cash) - <span className="ml-4 text-2xl font-black">{cashStats.totalStudents || ''}</span></div>
                  <div className="text-xl font-bold">Total cash collected - <span className="ml-4 text-2xl font-black">{cashStats.totalCash ? `${cashStats.totalCash.toLocaleString()} Ks` : ''}</span></div>
                  <div className="text-xl font-bold pt-10">Signature -</div>
                </div>
                <div className="w-1/2 p-8 flex flex-col justify-between">
                  <div className="text-xl font-bold">Remark-</div>
                  <div className="text-xl font-bold text-right">Date: {formatDateIntl(selectedDate)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kpay' && (
          <div id="kpay-report-sheet" className="bg-white p-12 sm:p-16 min-h-[1122px] w-[794px] shadow-xl border border-slate-100 transition-all relative font-serif shrink-0">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-center border-b-4 border-black pb-2 mb-8 tracking-widest">K-pay list</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border-2 border-black p-4">
                  <span className="text-xl font-bold uppercase tracking-tight">Total Students- {kpayStats.length || ''}</span>
                </div>
                <div className="border-2 border-black p-4">
                  <span className="text-xl font-bold uppercase tracking-tight">Total K-pay- {totalKpayAmount.toLocaleString() || '0'} Ks</span>
                </div>
              </div>

              <table className="w-full border-t-2 border-l-2 border-black table-fixed">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-r-2 border-b-2 border-black p-3 text-left w-12 font-bold text-base">No.</th>
                    <th className="border-r-2 border-b-2 border-black p-3 text-left font-bold text-base">Student's Name</th>
                    <th className="border-r-2 border-b-2 border-black p-3 text-left w-32 font-bold text-base">Class</th>
                    <th className="border-r-2 border-b-2 border-black p-3 text-center w-20 font-bold text-base">WD/WE</th>
                    <th className="border-r-2 border-b-2 border-black p-3 text-left w-32 font-bold text-base">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 30 }).map((_, i) => (
                    <tr key={i} className="h-9">
                      <td className="border-r-2 border-b-2 border-black px-3 text-base font-bold">{i + 1}.</td>
                      <td className="border-r-2 border-b-2 border-black px-3 text-base truncate">{kpayStats[i]?.name || ''}</td>
                      <td className="border-r-2 border-b-2 border-black px-3 text-base truncate">{kpayStats[i]?.class || ''}</td>
                      <td className="border-r-2 border-b-2 border-black px-3 text-base text-center font-bold">{kpayStats[i]?.schedule || ''}</td>
                      <td className="border-r-2 border-b-2 border-black px-3 text-base">{kpayStats[i] ? kpayStats[i].date : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div id="all-paid-sheet" className="bg-white p-12 sm:p-16 min-h-[794px] w-[1122px] shadow-xl border border-slate-100 transition-all shrink-0">
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b-4 border-black pb-4">
                <h2 className="text-3xl font-black uppercase tracking-widest">Paid Students List</h2>
                <span className="text-xl font-bold">Date: {formatDateIntl(selectedDate)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRecord;