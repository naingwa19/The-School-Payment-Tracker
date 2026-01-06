import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, CreditCard, BrainCircuit, Menu, X, FileText, LayoutPanelTop } from 'lucide-react';
import { Student, Payment, AppData } from './types';
import { loadData, saveData } from './utils/storage';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import PaymentTracker from './components/PaymentTracker';
import DailyRecord from './components/DailyRecord';
import Summary from './components/Summary';
import AIInsights from './components/AIInsights';

export const Logo = ({ className }: { className?: string }) => (
  <img 
    src="logo.png" 
    alt="The School Logo" 
    className={`${className} object-contain select-none pointer-events-none`}
    onError={(e) => {
      e.currentTarget.src = "https://placehold.co/400x400/ffffff/0ea5e9?text=The+School";
    }}
  />
);

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(loadData());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'payments' | 'daily-record' | 'summary' | 'insights'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const addStudent = (student: Student) => {
    setData(prev => ({ ...prev, students: [...prev.students, student] }));
  };

  const updateStudent = (updatedStudent: Student) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    }));
  };

  const deleteStudent = (id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id),
      payments: prev.payments.filter(p => p.studentId !== id)
    }));
  };

  const recordPayment = (payment: Payment) => {
    setData(prev => ({ ...prev, payments: [...prev.payments, payment] }));
  };

  const deletePayment = (id: string) => {
    setData(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
  };

  const updateSheetNo = (newNo: number) => {
    setData(prev => ({ ...prev, sheetNo: newNo }));
  };

  const clearPayments = () => {
    setData(prev => ({
      ...prev,
      payments: [],
      sheetNo: 1
    }));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'daily-record', label: 'Daily record', icon: FileText },
    { id: 'summary', label: 'Summary', icon: LayoutPanelTop },
    { id: 'insights', label: 'Ai audit', icon: BrainCircuit },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F0F9FF] text-slate-900">
      <div className="md:hidden bg-white border-b border-sky-100 p-4 flex justify-between items-center sticky top-0 z-50 print:hidden">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center border border-sky-50 shrink-0">
            <Logo className="w-full h-full p-1" />
          </div>
          <span className="ml-3 font-black text-sky-900 tracking-tight text-sm uppercase">The school</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-sky-900 hover:bg-sky-50 rounded-lg transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-full sm:w-72 bg-white/90 backdrop-blur-xl transition-transform duration-300 transform 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col border-r border-sky-100 print:hidden
      `}>
        <div className="p-8 flex flex-col items-center">
          <div className="relative w-full flex justify-center">
            <div className="w-32 h-32 aspect-square rounded-3xl bg-white shadow-sm border border-sky-50 flex items-center justify-center overflow-hidden transition-all duration-500 hover:scale-[1.03]">
              <Logo className="w-full h-full p-4" />
            </div>
          </div>
          <div className="mt-6 text-center">
             <h2 className="text-sky-900 font-black text-lg uppercase tracking-tight">The school</h2>
             <p className="text-sky-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Payment Tracker</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-sky-500 text-white font-bold shadow-lg shadow-sky-100' 
                  : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'}
              `}
            >
              <item.icon size={18} />
              <span className="text-xs font-bold uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-sky-900/10 backdrop-blur-sm z-30 md:hidden print:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <main className="flex-1 overflow-auto relative custom-scrollbar print:overflow-visible print:bg-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-8 md:p-12 print:p-0">
          {activeTab === 'dashboard' && <Dashboard data={data} onClearPayments={clearPayments} />}
          {activeTab === 'students' && <StudentList students={data.students} onAdd={addStudent} onUpdate={updateStudent} onDelete={deleteStudent} />}
          {activeTab === 'payments' && <PaymentTracker students={data.students} payments={data.payments} onRecord={recordPayment} onDelete={deletePayment} currentGlobalSheetNo={data.sheetNo} />}
          {activeTab === 'daily-record' && <DailyRecord students={data.students} payments={data.payments} sheetNo={data.sheetNo} onUpdateSheetNo={updateSheetNo} />}
          {activeTab === 'summary' && <Summary students={data.students} payments={data.payments} />}
          {activeTab === 'insights' && <AIInsights students={data.students} payments={data.payments} />}
        </div>
      </main>
    </div>
  );
};

export default App;