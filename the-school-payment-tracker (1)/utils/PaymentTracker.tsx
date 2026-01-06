import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, CheckCircle2, X, Copy, Check, CalendarDays, Wallet, DollarSign, AlertTriangle, UserSearch, Calendar, FileText } from 'lucide-react';
import { Student, Payment, PaymentMethod, StudentLevel, AttendanceDay } from '../types';

const getFeeByLevel = (level: StudentLevel): number => {
  const l = level.toLowerCase();
  if (l.includes('ket') || l.includes('pet') || l.includes('fce')) return 70000;
  if (l.includes('math')) return 55000;
  return 65000;
};

// Fixed LEVELS array to match StudentLevel type definition exactly
const LEVELS: StudentLevel[] = [
  /* Fixed level names to match StudentLevel type definition in types.ts */
  'Pre-Starters', 
  'Starters 1', 'Starters 2', 
  'Movers 1', 'Movers 2', 
  'Pre-flyers', 
  'Flyers1', 'Flyers2', 
  'KET-1', 'KET-2', 
  'PET', 'FCE', 
  'Math-1', 'Math-4', 'Math-6'
];

interface PaymentTrackerProps {
  students: Student[];
  payments: Payment[];
  onRecord: (p: Payment) => void;
  onDelete: (id: string) => void;
  currentGlobalSheetNo?: number; // Added to default new payments
}

const PaymentTracker: React.FC<PaymentTrackerProps> = ({ students, payments, onRecord, onDelete, currentGlobalSheetNo = 1 }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly');
  
  const [levelFilter, setLevelFilter] = useState<StudentLevel | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState<{
    studentId: string;
    amount: number;
    date: string;
    method: PaymentMethod;
    dayType: AttendanceDay;
    sheetNo: number;
    notes: string;
  }>({
    studentId: '',
    amount: 65000,
    date: today,
    method: PaymentMethod.KPAY,
    dayType: 'Weekday',
    sheetNo: currentGlobalSheetNo,
    notes: '',
  });

  // Keep form sheetNo in sync with global default when modal opens
  useEffect(() => {
    if (isModalOpen && !paymentForm.studentId) {
      setPaymentForm(prev => ({ ...prev, sheetNo: currentGlobalSheetNo }));
    }
  }, [isModalOpen, currentGlobalSheetNo]);

  useEffect(() => {
    if (paymentForm.studentId) {
      const student = students.find(s => s.id === paymentForm.studentId);
      if (student) {
        setPaymentForm(prev => ({ 
          ...prev, 
          amount: getFeeByLevel(student.category),
          dayType: student.dayType
        }));
      }
    }
  }, [paymentForm.studentId, students]);

  const displayedPayments = useMemo(() => {
    let list = viewMode === 'monthly' 
      ? payments.filter(p => p.month === selectedMonth)
      : payments.filter(p => p.date === selectedDate);
    
    return list;
  }, [payments, selectedMonth, selectedDate, viewMode]);

  const paidStudentIdsInMonth = useMemo(() => {
    const monthP = payments.filter(p => p.month === selectedMonth);
    return new Set(monthP.map(p => p.studentId));
  }, [payments, selectedMonth]);

  const unpaidStudents = useMemo(() => {
    let list = students.filter(s => s.isActive && !paidStudentIdsInMonth.has(s.id));
    if (levelFilter !== 'All') list = list.filter(s => s.category === levelFilter);
    if (studentSearchTerm) {
      list = list.filter(s => 
        s.englishName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        s.burmeseName.toLowerCase().includes(studentSearchTerm.toLowerCase())
      );
    }
    return list;
  }, [students, paidStudentIdsInMonth, levelFilter, studentSearchTerm]);

  const handleCopyContacts = () => {
    const contactList = unpaidStudents
      .map(s => `${s.englishName}: ${s.parentPhone}`)
      .join('\n');
    navigator.clipboard.writeText(contactList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPaymentForStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setPaymentForm({ 
      ...paymentForm, 
      studentId, 
      date: today,
      dayType: student?.dayType || 'Weekday',
      amount: student ? getFeeByLevel(student.category) : 65000,
      sheetNo: currentGlobalSheetNo
    });
    setIsModalOpen(true);
  };

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId) return;
    
    onRecord({
      id: Math.random().toString(36).substring(2, 11),
      studentId: paymentForm.studentId,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      month: paymentForm.date.slice(0, 7),
      method: paymentForm.method,
      dayType: paymentForm.dayType,
      sheetNo: paymentForm.sheetNo,
      notes: paymentForm.notes
    });
    
    setIsModalOpen(false);
    setPaymentForm({ ...paymentForm, studentId: '', notes: '' });
  };

  const confirmDelete = (id: string) => {
    setPaymentToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const filteredHistory = displayedPayments.filter(p => {
    const student = students.find(s => s.id === p.studentId);
    const matchesSearch = student?.englishName.toLowerCase().includes(historySearchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-10 animate-fadeIn text-black">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">Ledger</h1>
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit mt-3 sm:mt-4">
            <button onClick={() => setViewMode('monthly')} className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'monthly' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>Monthly</button>
            <button onClick={() => setViewMode('daily')} className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all ${viewMode === 'daily' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}>Daily</button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
             <CalendarDays size={18} className="text-slate-400" />
             <input 
               type={viewMode === 'monthly' ? "month" : "date"}
               className="bg-transparent border-none outline-none text-sm font-semibold text-black cursor-pointer flex-1"
               value={viewMode === 'monthly' ? selectedMonth : selectedDate}
               onChange={(e) => viewMode === 'monthly' ? setSelectedMonth(e.target.value) : setSelectedDate(e.target.value)}
             />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 hover:bg-black text-white px-8 py-4 sm:py-3 rounded-xl font-bold text-sm shadow-xl transition-all">Manual entry</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
               <div>
                 <h3 className="font-bold text-black text-sm">Unpaid students</h3>
                 <p className="text-xs text-slate-500 font-semibold mt-1">{unpaidStudents.length} Outstanding</p>
               </div>
               <button onClick={handleCopyContacts} title="Copy contacts" className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors shadow-sm border border-slate-50">
                 {copied ? <Check size={18} className="text-black" /> : <Copy size={18} />}
               </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text"
                placeholder="Find and record..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-black outline-none focus:bg-white transition-all"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {unpaidStudents.length === 0 ? (
                <div className="py-16 sm:py-20 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-xs font-bold text-slate-300">All accounts settled</p>
                </div>
              ) : (
                unpaidStudents.map(s => (
                  <div key={s.id} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group transition-all hover:border-slate-200">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-black text-sm truncate">{s.englishName}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">{s.category} • {s.dayType}</p>
                    </div>
                    <button 
                      onClick={() => openPaymentForStudent(s.id)} 
                      className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-black hover:shadow-sm transition-all shrink-0 ml-4"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
             <div className="relative flex-1">
               <UserSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
               <input 
                 type="text" 
                 placeholder="Search transaction history..." 
                 className="w-full pl-14 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-medium text-black outline-none focus:bg-white transition-all"
                 value={historySearchTerm}
                 onChange={(e) => setHistorySearchTerm(e.target.value)}
               />
             </div>
             <div className="flex items-center gap-3">
                <select 
                  className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-semibold text-slate-700 outline-none"
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value as any)}
                >
                  <option value="All">All classes</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
             </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[600px] sm:min-w-0">
                <thead className="bg-slate-50 text-slate-500 text-[10px] sm:text-xs font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 sm:px-10 py-5 sm:py-6">Transaction</th>
                    <th className="px-6 sm:px-10 py-5 sm:py-6 text-center">Sheet</th>
                    <th className="px-6 sm:px-10 py-5 sm:py-6">Method</th>
                    <th className="px-6 sm:px-10 py-5 sm:py-6 text-center">Schedule</th>
                    <th className="px-6 sm:px-10 py-5 sm:py-6 text-right">Amount</th>
                    <th className="px-6 sm:px-10 py-5 sm:py-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs sm:text-sm">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 sm:px-10 py-16 sm:py-24 text-center text-slate-200 font-bold">No records found</td>
                    </tr>
                  ) : (
                    filteredHistory.map(p => {
                      const student = students.find(s => s.id === p.studentId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/30 group transition-colors">
                          <td className="px-6 sm:px-10 py-5 sm:py-6">
                            <p className="font-bold text-black truncate max-w-[150px] sm:max-w-none">{student?.englishName || 'Deleted student'}</p>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{p.date}</p>
                          </td>
                          <td className="px-6 sm:px-10 py-5 sm:py-6 text-center">
                             <span className="text-[10px] font-black text-slate-400">#{p.sheetNo}</span>
                          </td>
                          <td className="px-6 sm:px-10 py-5 sm:py-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                              {p.method === PaymentMethod.KPAY ? <Wallet size={14} /> : <DollarSign size={14} />}
                              {p.method}
                            </span>
                          </td>
                          <td className="px-6 sm:px-10 py-5 sm:py-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400">
                              <Calendar size={14} />
                              {p.dayType}
                            </span>
                          </td>
                          <td className="px-6 sm:px-10 py-5 sm:py-6 text-right font-black text-black">{p.amount.toLocaleString()} Ks</td>
                          <td className="px-6 sm:px-10 py-5 sm:py-6 text-right">
                            <button onClick={() => confirmDelete(p.id)} className="p-2.5 text-slate-200 hover:text-black opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn my-8">
            <div className="p-8 sm:p-12 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Record receipt</h3>
                <p className="text-slate-400 text-xs mt-1">Transaction log</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors shrink-0"><X size={32} /></button>
            </div>
            <form onSubmit={handleRecord} className="p-8 sm:p-12 space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500">Student account</label>
                <select required className="w-full px-6 py-4 border border-slate-100 bg-slate-50 rounded-2xl font-bold text-black outline-none appearance-none cursor-pointer focus:bg-white transition-all text-sm" value={paymentForm.studentId} onChange={(e) => setPaymentForm({...paymentForm, studentId: e.target.value})}>
                  <option value="">Select a student...</option>
                  {students.filter(s => s.isActive).sort((a,b) => a.englishName.localeCompare(b.englishName)).map(s => (
                    <option key={s.id} value={s.id}>{s.englishName} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <p className="text-sm font-black text-black">{paymentForm.studentId ? paymentForm.dayType : 'Auto'}</p>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sheet No.</p>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    <input 
                      type="number" 
                      min="1" 
                      max="20"
                      className="bg-transparent border-none outline-none font-black text-black text-sm w-full"
                      value={paymentForm.sheetNo}
                      onChange={(e) => setPaymentForm({...paymentForm, sheetNo: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-500">Payment method</label>
                <div className="flex gap-4">
                  {(Object.values(PaymentMethod)).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentForm({...paymentForm, method})}
                      className={`flex-1 py-5 rounded-2xl text-xs font-bold tracking-tight transition-all flex flex-col items-center justify-center gap-3 border-2 ${paymentForm.method === method ? 'bg-white border-slate-900 text-black shadow-xl scale-[1.02]' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}
                    >
                      {method === PaymentMethod.KPAY ? <Wallet size={24} /> : <DollarSign size={24} />}
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500">Amount (Ks)</label>
                <input required type="number" className="w-full px-8 py-5 border border-slate-100 bg-slate-50 rounded-2xl font-black text-black text-2xl outline-none focus:bg-white transition-all" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} />
              </div>

              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-2xl transition-all hover:bg-black text-sm uppercase tracking-widest">Finalize transaction</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-sm shadow-2xl p-10 sm:p-12 text-center border border-slate-200 animate-scaleIn">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Void record?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">This transaction will be permanently removed from the ledger records.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { if (paymentToDelete) onDelete(paymentToDelete); setIsDeleteConfirmOpen(false); }} 
                className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl sm:rounded-2xl tracking-widest text-xs uppercase transition-all hover:bg-rose-600 shadow-lg"
              >
                Confirm deletion
              </button>
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)} 
                className="w-full py-4 bg-slate-50 text-slate-400 font-bold rounded-xl sm:rounded-2xl text-xs tracking-widest uppercase transition-all hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTracker;