import React, { useState, useMemo } from 'react';
import { Calendar, Download, FileText, BarChart, Banknote, Smartphone, Loader2, Wallet } from 'lucide-react';
import { Student, Payment, StudentLevel, PaymentMethod } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SummaryProps {
  students: Student[];
  payments: Payment[];
}

const SUMMARY_LEVELS = [
  'Pre-starters', 'Starters', 'Movers', 'Flyers', 'KET', 'PET', 'FCE', 'Math-1', 'Math-4', 'Math-6'
];

const mapLevelToSummary = (level: StudentLevel): string => {
  const l = level.toLowerCase();
  if (l.includes('pre-starters')) return 'Pre-starters';
  if (l.includes('starters')) return 'Starters';
  if (l.includes('movers')) return 'Movers';
  if (l.includes('flyers')) return 'Flyers'; 
  if (l.includes('ket')) return 'KET';
  if (l.includes('pet')) return 'PET';
  if (l.includes('fce')) return 'FCE';
  if (l === 'math-1') return 'Math-1';
  if (l === 'math-4') return 'Math-4';
  if (l === 'math-6') return 'Math-6';
  return 'Other';
};

const formatMonthYear = (monthStr: string) => {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const Summary: React.FC<SummaryProps> = ({ students, payments }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<'fsr' | 'tsl'>('fsr');
  const [isExporting, setIsExporting] = useState(false);

  const monthPayments = useMemo(() => {
    return payments.filter(p => p.month === selectedMonth);
  }, [payments, selectedMonth]);

  const fsrData = useMemo(() => {
    const cashMap: Record<string, number> = {};
    const kpayMap: Record<string, number> = {};
    SUMMARY_LEVELS.forEach(l => { cashMap[l] = 0; kpayMap[l] = 0; });

    let cashTotalAmount = 0;
    let kpayTotalAmount = 0;
    let cashTotalCount = 0;
    let kpayTotalCount = 0;

    monthPayments.forEach(p => {
      const student = students.find(s => s.id === p.studentId);
      if (!student) return;

      const summaryLvl = mapLevelToSummary(student.category);
      if (p.method === PaymentMethod.CASH) {
        if (SUMMARY_LEVELS.includes(summaryLvl)) {
          cashMap[summaryLvl] = (cashMap[summaryLvl] || 0) + 1;
        }
        cashTotalAmount += p.amount;
        cashTotalCount += 1;
      } else {
        if (SUMMARY_LEVELS.includes(summaryLvl)) {
          kpayMap[summaryLvl] = (kpayMap[summaryLvl] || 0) + 1;
        }
        kpayTotalAmount += p.amount;
        kpayTotalCount += 1;
      }
    });

    return { cashMap, kpayMap, cashTotalAmount, kpayTotalAmount, cashTotalCount, kpayTotalCount };
  }, [monthPayments, students]);

  const tilData = useMemo(() => {
    const sheetRecords: Record<number, Record<string, { count: number; amount: number }>> = {};
    for (let i = 1; i <= 20; i++) {
      sheetRecords[i] = {};
      SUMMARY_LEVELS.forEach(l => {
        sheetRecords[i][l] = { count: 0, amount: 0 };
      });
    }

    monthPayments.forEach(p => {
      if (p.method !== PaymentMethod.CASH) return;
      const student = students.find(s => s.id === p.studentId);
      if (!student) return;

      const summaryLvl = mapLevelToSummary(student.category);
      const sheetNum = Number(p.sheetNo);
      
      if (sheetRecords[sheetNum] && SUMMARY_LEVELS.includes(summaryLvl)) {
        sheetRecords[sheetNum][summaryLvl].count += 1;
        sheetRecords[sheetNum][summaryLvl].amount += p.amount;
      }
    });

    return sheetRecords;
  }, [monthPayments, students]);

  const handleExport = async () => {
    const elementId = activeTab === 'fsr' ? 'fsr-report-sheet' : 'tsl-report-sheet';
    const element = document.getElementById(elementId);
    if (!element) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Monthly_Summary_${activeTab}_${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-10 px-4 sm:px-0">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-sky-900 uppercase tracking-tight">Summary center</h1>
          <div className="flex bg-sky-50 border border-sky-100 p-1.5 rounded-2xl w-fit mt-4 shadow-sm">
            <button onClick={() => setActiveTab('fsr')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fsr' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100/50'}`}>
              <FileText size={16} /> Final summary
            </button>
            <button onClick={() => setActiveTab('tsl')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'tsl' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100/50'}`}>
              <BarChart size={16} /> TSL and TIL
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-sky-50/50 border border-sky-100 rounded-2xl shadow-sm min-w-[220px]">
            <Calendar size={20} className="text-sky-300" />
            <input type="month" className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer focus:ring-0 text-sky-900" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-3 bg-sky-500 text-white px-10 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-sky-200/50 text-xs uppercase tracking-widest disabled:opacity-50">
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            <span>{isExporting ? 'Export PDF' : 'Export PDF'}</span>
          </button>
        </div>
      </header>

      <div className="bg-sky-50/50 rounded-[2.5rem] p-4 sm:p-10 border border-sky-100 overflow-x-auto custom-scrollbar flex flex-col items-start shadow-sm">
        <div className="min-w-fit flex flex-col items-start pb-6">
          {activeTab === 'fsr' && (
            <div id="fsr-report-sheet" className="bg-white p-16 sm:p-20 w-[1122px] border border-sky-200 shrink-0 print:shadow-none ml-2 text-sky-900 shadow-2xl rounded-[2rem]">
              <h2 className="text-4xl font-black text-center mb-16 uppercase tracking-tighter underline underline-offset-8 decoration-sky-100 text-sky-900">Final Monthly Summary: {formatMonthYear(selectedMonth)}</h2>
              <div className="space-y-16 text-black">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-sky-50 text-sky-600 p-4 w-fit rounded-xl border border-sky-100">
                    <Banknote size={28} />
                    <h3 className="text-2xl font-black uppercase tracking-widest text-sky-900">In Cash Settlement</h3>
                  </div>
                  <p className="text-sm font-bold text-slate-400 italic">(Weekday + Weekend Integrated Volume)</p>
                  <div className="w-full border-t border-l border-sky-200">
                    <div className="flex bg-sky-50/50">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] leading-tight uppercase text-sky-400 tracking-widest">
                           {lvl}
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r border-b border-sky-200 p-6 text-center text-3xl font-black text-sky-900">
                          {fsrData.cashMap[lvl] || ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <div className="w-[450px] border border-sky-200 bg-sky-50/30 rounded-2xl overflow-hidden">
                        <div className="flex border-b border-sky-200">
                          <div className="w-2/3 p-6 font-black text-xl border-r border-sky-200 uppercase tracking-tight text-sky-600">Total Students (Cash)</div>
                          <div className="w-1/3 p-6 text-center text-3xl font-black text-sky-900">{fsrData.cashTotalCount || ''}</div>
                        </div>
                        <div className="flex">
                          <div className="w-2/3 p-6 font-black text-xl border-r border-sky-200 uppercase tracking-tight text-sky-600">Total Amount (Ks)</div>
                          <div className="w-1/3 p-6 text-center text-2xl font-black text-sky-900">{fsrData.cashTotalAmount ? fsrData.cashTotalAmount.toLocaleString() : '0'}</div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-sky-50 text-sky-600 p-4 w-fit rounded-xl border border-sky-100">
                    <Wallet size={28} />
                    <h3 className="text-2xl font-black uppercase tracking-widest text-sky-900">In K-pay Settlement</h3>
                  </div>
                  <div className="w-full border-t border-l border-sky-200">
                    <div className="flex bg-sky-50/50">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r border-b border-sky-200 p-4 text-center font-black text-[10px] leading-tight uppercase text-sky-400 tracking-widest">
                           {lvl}
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r border-b border-sky-200 p-6 text-center text-3xl font-black text-sky-900">
                          {fsrData.kpayMap[lvl] || ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <div className="w-[450px] border border-sky-200 bg-sky-50/30 rounded-2xl overflow-hidden">
                        <div className="flex border-b border-sky-200">
                          <div className="w-2/3 p-6 font-black text-xl border-r border-sky-200 uppercase tracking-tight text-sky-600">Total Students (K-pay)</div>
                          <div className="w-1/3 p-6 text-center text-3xl font-black text-sky-900">{fsrData.kpayTotalCount || ''}</div>
                        </div>
                        <div className="flex">
                          <div className="w-2/3 p-6 font-black text-xl border-r border-sky-200 uppercase tracking-tight text-sky-600">Total Amount (Ks)</div>
                          <div className="w-1/3 p-6 text-center text-2xl font-black text-sky-900">{fsrData.kpayTotalAmount ? fsrData.kpayTotalAmount.toLocaleString() : '0'}</div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-12">
                   <div className="w-[600px] border border-sky-100 bg-white rounded-3xl overflow-hidden shadow-xl">
                      <div className="flex border-b border-sky-100 bg-sky-500 text-white">
                        <div className="w-2/3 p-8 font-black text-2xl border-r border-white/20 uppercase tracking-tighter">Net Student Enrollment</div>
                        <div className="w-1/3 p-8 text-center text-5xl font-black">{fsrData.cashTotalCount + fsrData.kpayTotalCount || '0'}</div>
                      </div>
                      <div className="flex bg-sky-50">
                        <div className="w-2/3 p-8 font-black text-2xl border-r border-sky-100 uppercase tracking-tighter text-sky-900">Gross Monthly Revenue (Ks)</div>
                        <div className="w-1/3 p-8 text-center text-4xl font-black text-sky-500">{(fsrData.cashTotalAmount + fsrData.kpayTotalAmount).toLocaleString()}</div>
                      </div>
                   </div>
                   <div className="w-[350px] border border-sky-100 rounded-3xl bg-white p-4 shadow-sm">
                      <div className="flex border-b border-sky-50 p-4">
                        <div className="w-1/3 font-black text-[10px] text-sky-300 uppercase tracking-[0.2em]">Period</div>
                        <div className="w-2/3 text-center font-black text-xl text-sky-900">{formatMonthYear(selectedMonth)}</div>
                      </div>
                      <div className="flex p-4">
                        <div className="w-1/3 font-black text-[10px] text-sky-300 uppercase tracking-[0.2em]">Generated</div>
                        <div className="w-2/3 text-center font-bold text-lg text-slate-400">{new Date().toLocaleDateString('en-GB')}</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tsl' && (
            <div id="tsl-report-sheet" className="bg-white p-12 sm:p-16 w-[1122px] border border-sky-100 shrink-0 print:shadow-none ml-2 text-sky-900 shadow-2xl rounded-[2rem] text-black">
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b-2 border-sky-50 pb-4 mb-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-sky-900">TSL and TIL</h2>
                  <div className="text-right">
                    <p className="text-xl font-black text-sky-300 uppercase tracking-widest">{formatMonthYear(selectedMonth)}</p>
                  </div>
                </div>

                <table className="w-full border-t border-l border-sky-100 text-center text-sm table-fixed rounded-2xl overflow-hidden text-sky-900 font-bold">
                  <thead>
                    <tr className="bg-sky-500 text-white font-bold uppercase tracking-widest">
                      <th className="border-r border-b border-sky-400 p-4 w-16">Sh#</th>
                      {SUMMARY_LEVELS.map(lvl => (
                        <th key={lvl} className="border-r border-b border-sky-400 p-4 text-[9px] uppercase tracking-tighter leading-tight">
                          {lvl}
                        </th>
                      ))}
                      <th className="border-r border-b border-sky-400 p-4 bg-sky-600 w-24">Student</th>
                      <th className="border-r border-b border-sky-400 p-4 bg-sky-700 w-64">Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 20 }).map((_, i) => {
                      const sNo = i + 1;
                      const sheet = tilData[sNo] || {};
                      const totalStudents = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.count) || 0), 0);
                      const totalCash = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.amount) || 0), 0);
                      return (
                        <tr key={sNo} className="h-10 hover:bg-sky-50 transition-colors">
                          <td className="border-r border-b border-sky-50 p-2 font-black text-base bg-sky-50/30 text-sky-300">{sNo}</td>
                          {SUMMARY_LEVELS.map(lvl => (
                            <td key={lvl} className="border-r border-b border-sky-50 p-2 text-slate-400 font-medium">{sheet[lvl]?.count || ''}</td>
                          ))}
                          <td className="border-r border-b border-sky-50 p-2 font-black text-xl bg-sky-50/50 text-sky-900">{totalStudents || ''}</td>
                          <td className="border-r border-b border-sky-50 p-2 font-bold text-sm bg-sky-50/80 text-sky-900">{totalCash ? totalCash.toLocaleString() : ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="h-16 bg-sky-500 text-white font-black uppercase tracking-widest">
                      <td className="border-r border-sky-400 p-4 text-xs">Total</td>
                      {SUMMARY_LEVELS.map(lvl => {
                        const colTotal = Array.from({length: 20}).reduce<number>((sum, _, i) => {
                          const count = tilData[i+1]?.[lvl]?.count;
                          return sum + (Number(count) || 0);
                        }, 0);
                        return <td key={lvl} className="border-r border-sky-400 p-4 font-black text-xl">{colTotal || ''}</td>;
                      })}
                      <td className="border-r border-sky-400 p-4 font-black text-3xl bg-sky-500 border-white/20">
                        {Array.from({length: 20}).reduce<number>((sum, _, i) => {
                          const sheet = tilData[i+1] || {};
                          const sheetTotalCount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.count) || 0), 0);
                          return sum + sheetTotalCount;
                        }, 0) || ''}
                      </td>
                      <td className="p-4 font-black text-xl bg-sky-500 border-white/20">
                        {Array.from({length: 20}).reduce<number>((sum, _, i) => {
                          const sheet = tilData[i+1] || {};
                          const sheetTotalAmount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0);
                          return sum + sheetTotalAmount;
                        }, 0).toLocaleString() || ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-between items-center py-10">
                  <div className="w-[700px] flex items-center border-4 border-sky-100 bg-sky-50/30 rounded-3xl overflow-hidden shadow-sm">
                     <div className="flex-1 p-8 text-center font-black text-2xl border-r border-sky-100 uppercase tracking-tighter text-sky-900">Consolidated Gross Volume (Cash)</div>
                     <div className="w-[250px] p-8 font-black text-4xl text-center bg-white text-sky-500">
                       {Array.from({length: 20}).reduce<number>((sum, _, i) => sum + (Object.values(tilData[i+1] || {}).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0) as number), 0).toLocaleString()}
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-sky-900 opacity-20 tracking-tight italic">End of Ledger Audit</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summary;