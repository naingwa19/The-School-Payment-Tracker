import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, CheckCircle2, X, Copy, Check, CalendarDays, Wallet, DollarSign, AlertTriangle, UserSearch, Calendar, FileText } from 'lucide-react';
import { Student, Payment, PaymentMethod, StudentLevel, AttendanceDay } from '../types';

const getFeeByLevel = (level: StudentLevel): number => {
  const l = level.toLowerCase();
  if (l.includes('ket') || l.includes('pet') || l.includes('fce')) return 70000;
  if (l.includes('math')) return 55000;
  return 65000;
};

// Fixed StudentLevel string values to match types.ts definition
const LEVELS: StudentLevel[] = [
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
  currentGlobalSheetNo?: number;
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
    return viewMode === 'monthly' 
      ? payments.filter(p => p.month === selectedMonth)
      : payments.filter(p => p.date === selectedDate);
  }, [payments, selectedMonth, selectedDate, viewMode]);

  const paidStudentIdsInMonth = useMemo(() => {
    return new Set(payments.filter(p => p.month === selectedMonth).map(p => p.studentId));
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
    const contactList = unpaidStudents.map(s => `${s.englishName}: ${s.parentPhone}`).join('\n');
    navigator.clipboard.writeText(contactList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openPaymentForStudent = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    setPaymentForm({ 
      ...paymentForm, 
      studentId, 
      date: today,
      dayType: student.dayType,
      amount: getFeeByLevel(student.category),
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
    return student?.englishName.toLowerCase().includes(historySearchTerm.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-sky-900 tracking-tight uppercase">Ledger</h1>
          <div className="flex bg-sky-100 p-1.5 rounded-2xl w-fit mt-4 border border-sky-200 shadow-sm">
            <button onClick={() => setViewMode('monthly')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-sky-500 text-white shadow-md shadow-sky-100' : 'text-sky-700 hover:bg-sky-200'}`}>Monthly</button>
            <button onClick={() => setViewMode('daily')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'daily' ? 'bg-sky-500 text-white shadow-md shadow-sky-100' : 'text-sky-700 hover:bg-sky-200'}`}>Daily</button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-4 px-6 py-3 bg-white border border-sky-100 rounded-2xl shadow-sm min-w-[220px]">
             <CalendarDays size={20} className="text-sky-400" />
             <input 
               type={viewMode === 'monthly' ? "month" : "date"}
               className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer w-full focus:ring-0 text-sky-900"
               value={viewMode === 'monthly' ? selectedMonth : selectedDate}
               onChange={(e) => viewMode === 'monthly' ? setSelectedMonth(e.target.value) : setSelectedDate(e.target.value)}
             />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white px-10 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-sky-100 text-xs uppercase tracking-widest">Manual entry</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-sky-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-sky-50 pb-6">
               <div>
                 <h3 className="font-black text-xs text-sky-900 uppercase tracking-widest text-black">Unpaid list</h3>
                 <p className="text-[10px] text-sky-400 font-bold mt-1 uppercase tracking-widest">{unpaidStudents.length} Outstanding</p>
               </div>
               <button onClick={handleCopyContacts} className="p-3 bg-sky-50 rounded-2xl text-sky-500 hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                 {copied ? <Check size={18} /> : <Copy size={18} />}
               </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-300" size={18} />
              <input 
                type="text"
                placeholder="Find student..."
                className="w-full pl-12 pr-4 py-4 bg-sky-50 border border-sky-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-sky-100 transition-all text-sky-900 uppercase"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {unpaidStudents.length === 0 ? (
                <div className="py-20 text-center">
                  <CheckCircle2 size={40} className="mx-auto text-sky-100 mb-4" />
                  <p className="text-[10px] font-black text-sky-300 uppercase tracking-widest">All accounts clear</p>
                </div>
              ) : (
                unpaidStudents.map(s => (
                  <div key={s.id} className="p-5 bg-sky-50/50 rounded-2xl border border-sky-50 flex justify-between items-center group transition-all hover:bg-sky-50 hover:border-sky-100">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-sky-900 text-sm truncate">{s.englishName}</p>
                      <p className="text-[10px] text-sky-400 font-black mt-1 uppercase tracking-widest">{s.category} • {s.dayType}</p>
                    </div>
                    <button 
                      onClick={() => openPaymentForStudent(s.id)} 
                      className="p-3 bg-white border border-sky-100 rounded-xl text-sky-300 hover:bg-sky-500 hover:text-white hover:border-sky-500 shadow-sm transition-all ml-4 shrink-0"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-sky-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
             <div className="relative flex-1 w-full">
               <UserSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-300" size={20} />
               <input 
                 type="text" 
                 placeholder="Search ledger records..." 
                 className="w-full pl-14 pr