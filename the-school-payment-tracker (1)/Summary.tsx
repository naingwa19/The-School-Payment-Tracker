import React, { useState, useMemo } from 'react';
import { Calendar, Download, FileText, BarChart, Banknote, Smartphone, Loader2 } from 'lucide-react';
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
        cashMap[summaryLvl] = (cashMap[summaryLvl] || 0) + 1;
        cashTotalAmount += p.amount;
        cashTotalCount += 1;
      } else {
        kpayMap[summaryLvl] = (kpayMap[summaryLvl] || 0) + 1;
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
      if (sheetRecords[p.sheetNo]) {
        sheetRecords[p.sheetNo][summaryLvl].count += 1;
        sheetRecords[p.sheetNo][summaryLvl].amount += p.amount;
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
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Summary_${activeTab.toUpperCase()}_${selectedMonth}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to generate PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-black pb-10 px-4 sm:px-0">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Summary center</h1>
          <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit mt-4">
            <button 
              onClick={() => setActiveTab('fsr')} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'fsr' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}
            >
              <FileText size={16} /> Final summary
            </button>
            <button 
              onClick={() => setActiveTab('tsl')} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'tsl' ? 'bg-white text-black shadow-lg' : 'text-slate-500'}`}
            >
              <BarChart size={16} /> Total list (TSL, TIL)
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm min-w-[200px]">
            <Calendar size={20} className="text-slate-400" />
            <input 
              type="month" 
              className="bg-transparent border-none outline-none font-black text-sm cursor-pointer focus:ring-0"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl text-sm disabled:opacity-50 uppercase tracking-widest"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={20} />}
            <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </header>

      {/* Scrollable Container - Using items-start ensures the left edge is visible */}
      <div className="bg-slate-100/50 rounded-[2.5rem] p-4 sm:p-10 border border-slate-200 overflow-x-auto custom-scrollbar flex flex-col items-start">
        <div className="min-w-fit flex flex-col items-start pb-6">
          {activeTab === 'fsr' && (
            <div id="fsr-report-sheet" className="bg-white p-12 sm:p-20 w-[1122px] shadow-2xl transition-all border border-slate-100 shrink-0 print:shadow-none ml-2">
              <h2 className="text-4xl font-black text-center mb-16 uppercase tracking-tighter underline underline-offset-8">Final Monthly Summary: {formatMonthYear(selectedMonth)}</h2>
              <div className="space-y-16">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-900 text-white p-4 w-fit rounded-lg">
                    <Banknote size={28} />
                    <h3 className="text-2xl font-black uppercase tracking-widest">In Cash Settlement</h3>
                  </div>
                  <p className="text-lg font-bold text-slate-400 italic">(Weekday + Weekend Integrated Volume)</p>
                  <div className="w-full border-t-4 border-l-4 border-black">
                    <div className="flex bg-slate-100">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r-4 border-b-4 border-black p-4 text-center font-black text-base">{lvl}</div>
                      ))}
                    </div>
                    <div className="flex">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r-4 border-b-4 border-black p-6 text-center text-3xl font-black">
                          {fsrData.cashMap[lvl] || ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <div className="w-[450px] border-4 border-black bg-slate-50/50">
                        <div className="flex border-b-4 border-black">
                          <div className="w-2/3 p-5 font-black text-xl border-r-4 border-black uppercase tracking-tight">Total Headcount (Cash)</div>
                          <div className="w-1/3 p-5 text-center text-3xl font-black">{fsrData.cashTotalCount || ''}</div>
                        </div>
                        <div className="flex bg-slate-100/50">
                          <div className="w-2/3 p-5 font-black text-xl border-r-4 border-black uppercase tracking-tight">Total Volume (Cash)</div>
                          <div className="w-1/3 p-5 text-center text-2xl font-black">{fsrData.cashTotalAmount ? fsrData.cashTotalAmount.toLocaleString() : ''} <span className="text-xs">Ks</span></div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-slate-800 text-white p-4 w-fit rounded-lg">
                    <Smartphone size={28} />
                    <h3 className="text-2xl font-black uppercase tracking-widest">In K-Pay Settlement</h3>
                  </div>
                  <p className="text-lg font-bold text-slate-400 italic">(Weekday + Weekend Integrated Volume)</p>
                  <div className="w-full border-t-4 border-l-4 border-black">
                    <div className="flex bg-slate-100">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r-4 border-b-4 border-black p-4 text-center font-black text-base">{lvl}</div>
                      ))}
                    </div>
                    <div className="flex">
                      {SUMMARY_LEVELS.map(lvl => (
                        <div key={lvl} className="flex-1 border-r-4 border-b-4 border-black p-6 text-center text-3xl font-black">
                          {fsrData.kpayMap[lvl] || ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                     <div className="w-[450px] border-4 border-black bg-slate-50/50">
                        <div className="flex border-b-4 border-black">
                          <div className="w-2/3 p-5 font-black text-xl border-r-4 border-black uppercase tracking-tight">Total Headcount (K-pay)</div>
                          <div className="w-1/3 p-5 text-center text-3xl font-black">{fsrData.kpayTotalCount || ''}</div>
                        </div>
                        <div className="flex bg-slate-100/50">
                          <div className="w-2/3 p-5 font-black text-xl border-r-4 border-black uppercase tracking-tight">Total Volume (K-pay)</div>
                          <div className="w-1/3 p-5 text-center text-2xl font-black">{fsrData.kpayTotalAmount ? fsrData.kpayTotalAmount.toLocaleString() : ''} <span className="text-xs">Ks</span></div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-12">
                   <div className="w-[600px] border-8 border-black shadow-xl">
                      <div className="flex border-b-8 border-black bg-slate-900 text-white">
                        <div className="w-2/3 p-6 font-black text-2xl border-r-8 border-white uppercase tracking-tighter">Net Student Enrollment</div>
                        <div className="w-1/3 p-6 text-center text-4xl font-black">{fsrData.cashTotalCount + fsrData.kpayTotalCount || ''}</div>
                      </div>
                      <div className="flex bg-slate-200">
                        <div className="w-2/3 p-6 font-black text-2xl border-r-8 border-black uppercase tracking-tighter">Gross Revenue (MMK)</div>
                        <div className="w-1/3 p-6 text-center text-3xl font-black">{(fsrData.cashTotalAmount + fsrData.kpayTotalAmount).toLocaleString()}</div>
                      </div>
                   </div>
                   <div className="w-[350px] border-4 border-black h-fit">
                      <div className="flex border-b-4 border-black bg-slate-50">
                        <div className="w-1/3 p-4 font-black text-sm uppercase tracking-widest border-r-4 border-black">Period</div>
                        <div className="w-2/3 p-4 text-center font-black text-xl uppercase tracking-widest">{formatMonthYear(selectedMonth)}</div>
                      </div>
                      <div className="flex">
                        <div className="w-1/3 p-4 font-black text-sm uppercase tracking-widest border-r-4 border-black">Generated</div>
                        <div className="w-2/3 p-4 text-center font-black text-lg">{new Date().toLocaleDateString('en-GB')}</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tsl' && (
            <div id="tsl-report-sheet" className="bg-white p-12 sm:p-16 w-[1122px] shadow-2xl transition-all border border-slate-100 shrink-0 print:shadow-none ml-2">
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b-8 border-black pb-4 mb-4">
                  <h2 className="text-4xl font-black uppercase tracking-tighter">Consolidated Ledger List (TSL/TIL)</h2>
                  <div className="text-right">
                    <p className="text-xl font-black">{formatMonthYear(selectedMonth)}</p>
                    <p className="text-sm font-bold text-slate-400">Sheet-based Distribution Audit</p>
                  </div>
                </div>

                <table className="w-full border-t-4 border-l-4 border-black text-center text-sm table-fixed">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="border-r-4 border-b-4 border-black p-4 font-black w-16">SH#</th>
                      {SUMMARY_LEVELS.map(lvl => (
                        <th key={lvl} className="border-r-4 border-b-4 border-black p-4 font-black text-xs uppercase tracking-tighter">
                          {lvl}
                        </th>
                      ))}
                      <th className="border-r-4 border-b-4 border-black p-4 font-black bg-emerald-700 text-white">TOTAL STU.</th>
                      <th className="border-r-4 border-b-4 border-black p-4 font-black bg-emerald-800 text-white">TOTAL CASH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 15 }).map((_, i) => {
                      const sNo = i + 1;
                      const sheet = tilData[sNo] || {};
                      const totalStudents = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.count) || 0), 0);
                      const totalCash = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.amount) || 0), 0);
                      return (
                        <tr key={sNo} className="h-10 hover:bg-slate-50 transition-colors">
                          <td className="border-r-4 border-b-4 border-black p-2 font-black text-lg bg-slate-50">{sNo}</td>
                          {SUMMARY_LEVELS.map(lvl => (
                            <td key={lvl} className="border-r-4 border-b-4 border-black p-2 font-bold text-base">{sheet[lvl]?.count || ''}</td>
                          ))}
                          <td className="border-r-4 border-b-4 border-black p-2 font-black text-xl bg-emerald-50">{totalStudents || ''}</td>
                          <td className="border-r-4 border-b-4 border-black p-2 font-black text-lg bg-emerald-50">{totalCash ? totalCash.toLocaleString() : ''}</td>
                        </tr>
                      );
                    })}
                    <tr className="h-16 bg-slate-900 text-white">
                      <td className="border-r-4 border-b-4 border-black p-4"></td>
                      {SUMMARY_LEVELS.map(lvl => {
                        const colTotal = Array.from({length: 15}).reduce<number>((sum, _, i) => {
                          const count = tilData[i+1]?.[lvl]?.count;
                          return sum + (typeof count === 'number' ? count : 0);
                        }, 0);
                        return <td key={lvl} className="border-r-4 border-b-4 border-black p-4 font-black text-xl">{colTotal || ''}</td>;
                      })}
                      <td className="border-r-4 border-b-4 border-black p-4 font-black text-3xl bg-emerald-600">
                        {Array.from({length: 15}).reduce<number>((sum, _, i) => {
                          const sheet = tilData[i+1] || {};
                          const sheetTotalCount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.count) || 0), 0);
                          return sum + (sheetTotalCount as number);
                        }, 0) || ''}
                      </td>
                      <td className="border-r-4 border-b-4 border-black p-4 font-black text-2xl bg-emerald-700">
                        {Array.from({length: 15}).reduce<number>((sum, _, i) => {
                          const sheet = tilData[i+1] || {};
                          const sheetTotalAmount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0);
                          return sum + (sheetTotalAmount as number);
                        }, 0).toLocaleString() || ''}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex justify-between items-center py-10">
                  <div className="w-[700px] flex items-center border-8 border-black bg-slate-50">
                     <div className="flex-1 p-8 text-center font-black text-3xl border-r-8 border-black uppercase tracking-tighter">Gross Monthly Income (Cash)</div>
                     <div className="w-[250px] p-8 font-black text-4xl text-center bg-emerald-50">
                       {Array.from({length: 15}).reduce<number>((sum, _, i) => sum + (Object.values(tilData[i+1] || {}).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0) as number), 0).toLocaleString()}
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.5em] mb-8">Auditor Authorization</p>
                    <div className="w-64 border-b-4 border-black h-4 mb-2"></div>
                    <p className="font-black">The School Finance Dept.</p>
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