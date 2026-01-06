
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
    <div className="space-y-8 animate-fadeIn text-black">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">Summary center</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mt-3">
            <button 
              onClick={() => setActiveTab('fsr')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'fsr' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
            >
              <FileText size={16} /> Final summary
            </button>
            <button 
              onClick={() => setActiveTab('tsl')} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tsl' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
            >
              <BarChart size={16} /> Total student list & total income list (TSL, TIL)
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="month" 
              className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer focus:ring-0"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
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
        {activeTab === 'fsr' && (
          <div id="fsr-report-sheet" className="bg-white p-12 sm:p-16 min-h-[794px] w-[1122px] shadow-xl border border-slate-100 transition-all shrink-0">
            <h2 className="text-3xl font-bold text-center mb-12">Final summary report for ( {formatMonthYear(selectedMonth)} )</h2>
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Banknote className="text-slate-900" size={24} />
                  <h3 className="text-xl font-bold">In cash</h3>
                </div>
                <p className="text-base font-semibold">(Weekdays + weekends)</p>
                <div className="w-full border-t-2 border-l-2 border-black">
                  <div className="flex bg-slate-50">
                    {SUMMARY_LEVELS.map(lvl => (
                      <div key={lvl} className="flex-1 border-r-2 border-b-2 border-black p-3 text-center font-bold text-sm">{lvl}</div>
                    ))}
                  </div>
                  <div className="flex">
                    {SUMMARY_LEVELS.map(lvl => (
                      <div key={lvl} className="flex-1 border-r-2 border-b-2 border-black p-4 text-center text-lg font-semibold">
                        {fsrData.cashMap[lvl] || ''}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                   <div className="w-[350px] border-2 border-black">
                      <div className="flex border-b-2 border-black">
                        <div className="w-2/3 p-3 font-semibold border-r-2 border-black">Total students (in cash)</div>
                        <div className="w-1/3 p-3 text-center text-lg font-bold">{fsrData.cashTotalCount || ''}</div>
                      </div>
                      <div className="flex">
                        <div className="w-2/3 p-3 font-semibold border-r-2 border-black">Total amount (in cash)</div>
                        <div className="w-1/3 p-3 text-center text-lg font-bold">{fsrData.cashTotalAmount ? fsrData.cashTotalAmount.toLocaleString() : ''}</div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-slate-900" size={24} />
                  <h3 className="text-xl font-bold">In K-pay</h3>
                </div>
                <p className="text-base font-semibold">(Weekdays + weekends)</p>
                <div className="w-full border-t-2 border-l-2 border-black">
                  <div className="flex bg-slate-50">
                    {SUMMARY_LEVELS.map(lvl => (
                      <div key={lvl} className="flex-1 border-r-2 border-b-2 border-black p-3 text-center font-bold text-sm">{lvl}</div>
                    ))}
                  </div>
                  <div className="flex">
                    {SUMMARY_LEVELS.map(lvl => (
                      <div key={lvl} className="flex-1 border-r-2 border-b-2 border-black p-4 text-center text-lg font-semibold">
                        {fsrData.kpayMap[lvl] || ''}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                   <div className="w-[350px] border-2 border-black">
                      <div className="flex border-b-2 border-black">
                        <div className="w-2/3 p-3 font-semibold border-r-2 border-black">Total students (in K-pay)</div>
                        <div className="w-1/3 p-3 text-center text-lg font-bold">{fsrData.kpayTotalCount || ''}</div>
                      </div>
                      <div className="flex">
                        <div className="w-2/3 p-3 font-semibold border-r-2 border-black">Total amount (in K-pay)</div>
                        <div className="w-1/3 p-3 text-center text-lg font-bold">{fsrData.kpayTotalAmount ? fsrData.kpayTotalAmount.toLocaleString() : ''}</div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-8">
                 <div className="w-[500px] border-2 border-black">
                    <div className="flex border-b-2 border-black bg-slate-50">
                      <div className="w-2/3 p-3 font-bold text-lg border-r-2 border-black">Total student (cash + K-pay)</div>
                      <div className="w-1/3 p-3 text-center text-xl font-bold">{fsrData.cashTotalCount + fsrData.kpayTotalCount || ''}</div>
                    </div>
                    <div className="flex bg-slate-50">
                      <div className="w-2/3 p-3 font-bold text-lg border-r-2 border-black">Total income (cash + K-pay)</div>
                      <div className="w-1/3 p-3 text-center text-xl font-bold">{(fsrData.cashTotalAmount + fsrData.kpayTotalAmount).toLocaleString()}</div>
                    </div>
                 </div>
                 <div className="w-[300px] flex border-2 border-black h-fit">
                    <div className="w-1/3 p-3 font-semibold bg-slate-50 border-r-2 border-black">Date</div>
                    <div className="w-2/3 p-3 text-center font-semibold text-base">{new Date().toLocaleDateString('en-GB')}</div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tsl' && (
          <div id="tsl-report-sheet" className="bg-white p-8 sm:p-12 min-h-[794px] w-[1122px] shadow-xl border border-slate-100 transition-all shrink-0">
            <div className="space-y-6">
              <table className="w-full border-t-2 border-l-2 border-black text-sm text-center">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-r-2 border-b-2 border-black p-3 font-bold w-16">Sheet</th>
                    {SUMMARY_LEVELS.map(lvl => (
                      <th key={lvl} className="border-r-2 border-b-2 border-black p-3 font-bold">
                        {lvl}
                      </th>
                    ))}
                    <th className="border-r-2 border-b-2 border-black p-3 font-bold bg-lime-100">Total students</th>
                    <th className="border-r-2 border-b-2 border-black p-3 font-bold bg-lime-50">Total cash</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const sNo = i + 1;
                    const sheet = tilData[sNo] || {};
                    const totalStudents = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.count) || 0), 0);
                    const totalCash = Object.values(sheet).reduce((sum: number, lvl: any) => sum + (Number(lvl.amount) || 0), 0);
                    return (
                      <tr key={sNo} className="h-9">
                        <td className="border-r-2 border-b-2 border-black p-1 font-bold">{sNo}.</td>
                        {SUMMARY_LEVELS.map(lvl => (
                          <td key={lvl} className="border-r-2 border-b-2 border-black p-1">{sheet[lvl]?.count || ''}</td>
                        ))}
                        <td className="border-r-2 border-b-2 border-black p-1 font-semibold bg-lime-200/50">{totalStudents || ''}</td>
                        <td className="border-r-2 border-b-2 border-black p-1 font-semibold bg-lime-50">{totalCash ? totalCash.toLocaleString() : ''}</td>
                      </tr>
                    );
                  })}
                  <tr className="h-12 bg-lime-800/10">
                    <td className="border-r-2 border-b-2 border-black p-1"></td>
                    {SUMMARY_LEVELS.map(lvl => {
                      const colTotal = Array.from({length: 15}).reduce<number>((sum, _, i) => {
                        const count = tilData[i+1]?.[lvl]?.count;
                        return sum + (typeof count === 'number' ? count : 0);
                      }, 0);
                      return <td key={lvl} className="border-r-2 border-b-2 border-black p-1 font-bold text-base">{colTotal || ''}</td>;
                    })}
                    <td className="border-r-2 border-b-2 border-black p-1 font-bold text-lg bg-lime-800/20">
                      {Array.from({length: 15}).reduce<number>((sum, _, i) => {
                        const sheet = tilData[i+1] || {};
                        const sheetTotalCount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.count) || 0), 0);
                        return sum + (sheetTotalCount as number);
                      }, 0) || ''}
                    </td>
                    <td className="border-r-2 border-b-2 border-black p-1 font-bold text-lg bg-lime-100">
                      {Array.from({length: 15}).reduce<number>((sum, _, i) => {
                        const sheet = tilData[i+1] || {};
                        const sheetTotalAmount = Object.values(sheet).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0);
                        return sum + (sheetTotalAmount as number);
                      }, 0).toLocaleString() || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="flex justify-between items-center py-6">
                <div className="w-[600px] flex items-center border-2 border-black">
                   <div className="flex-1 p-4 text-center font-bold text-lg border-r-2 border-black bg-slate-50">Total income for ( {formatMonthYear(selectedMonth)} )</div>
                   <div className="w-[200px] p-4 font-bold text-xl text-center">
                     {Array.from({length: 15}).reduce<number>((sum, _, i) => sum + (Object.values(tilData[i+1] || {}).reduce<number>((s, l: any) => s + (Number(l?.amount) || 0), 0) as number), 0).toLocaleString()}
                   </div>
                </div>
              </div>
              <div className="flex flex-col items-start gap-12 mt-10">
                 <h2 className="text-2xl font-bold tracking-tight uppercase">Total student list & total income list (TSL, TIL)</h2>
                 <div className="w-[300px] flex border-2 border-black self-end">
                    <div className="w-1/3 p-3 font-semibold bg-slate-50 border-r-2 border-black">Date</div>
                    <div className="w-2/3 p-3 text-center font-semibold text-base">{new Date().toLocaleDateString('en-GB')}</div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
