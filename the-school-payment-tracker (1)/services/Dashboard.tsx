
import React, { useMemo, useState } from 'react';
import { Users, DollarSign, Calendar, CreditCard, CheckCircle2, AlertCircle, BarChart3, Phone, Trash2, X, AlertTriangle } from 'lucide-react';
import { AppData, PaymentMethod } from '../types';
import { Logo } from '../App';

interface DashboardProps {
  data: AppData;
  onClearPayments: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onClearPayments }) => {
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const stats = useMemo(() => {
    const activeStudents = data.students.filter(s => s.isActive);
    const totalStudentsCount = activeStudents.length || 1;
    
    const monthPayments = data.payments.filter(p => p.month === currentMonth);
    const paidStudentIds = new Set(monthPayments.map(p => p.studentId));
    
    const totalAmountCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaymentsCount = monthPayments.length;
    
    const kpayCount = monthPayments.filter(p => p.method === PaymentMethod.KPAY).length;
    const cashCount = monthPayments.filter(p => p.method === PaymentMethod.CASH).length;
    
    const unpaidStudentsList = activeStudents.filter(s => !paidStudentIds.has(s.id));
    const pendingCount = unpaidStudentsList.length;

    const weekdayCount = activeStudents.filter(s => s.dayType === 'Weekday').length;
    const weekendCount = activeStudents.filter(s => s.dayType === 'Weekend').length;
    
    const paidStudents = activeStudents.filter(s => paidStudentIds.has(s.id));
    const weekdayPaidCount = paidStudents.filter(s => s.dayType === 'Weekday').length;
    const weekendPaidCount = paidStudents.filter(s => s.dayType === 'Weekend').length;

    const weekdayUnpaidCount = unpaidStudentsList.filter(s => s.dayType === 'Weekday').length;
    const weekendUnpaidCount = unpaidStudentsList.filter(s => s.dayType === 'Weekend').length;

    const classGroups: Record<string, number> = {};
    activeStudents.forEach(s => {
      classGroups[s.category] = (classGroups[s.category] || 0) + 1;
    });

    const uniquePaidStudents = paidStudentIds.size;

    return { 
      totalAmountCollected,
      paidCount: totalPaymentsCount, 
      pendingCount, 
      totalStudents: activeStudents.length,
      unpaidStudents: unpaidStudentsList,
      kpayCount,
      cashCount,
      weekdayPercent: Math.round((weekdayCount / totalStudentsCount) * 100),
      weekendPercent: Math.round((weekendCount / totalStudentsCount) * 100),
      paidPercent: Math.round((uniquePaidStudents / totalStudentsCount) * 100),
      unpaidPercent: Math.round((pendingCount / totalStudentsCount) * 100),
      weekdayPaidPercent: Math.round((weekdayPaidCount / totalStudentsCount) * 100),
      weekendPaidPercent: Math.round((weekendPaidCount / totalStudentsCount) * 100),
      weekdayUnpaidPercent: Math.round((weekdayUnpaidCount / totalStudentsCount) * 100),
      weekendUnpaidPercent: Math.round((weekendUnpaidCount / totalStudentsCount) * 100),
      classGroups
    };
  }, [data, currentMonth]);

  const handleClearConfirm = () => {
    onClearPayments();
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-fadeIn text-black pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            <Logo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-black tracking-tight">Overview</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-xs sm:text-base font-semibold">
              <Calendar size={14} className="text-slate-400 sm:w-4 sm:h-4" />
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 w-full sm:w-auto text-center md:text-left">
             <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 mb-1">Active students</p>
             <p className="text-xl sm:text-2xl font-black text-black leading-none">{stats.totalStudents}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <SplitStatCard 
          icon={<Users className="text-slate-600" size={18} />}
          label="Total enrollment"
          value={stats.totalStudents}
          subLabel1="Weekdays"
          subValue1={stats.weekdayPercent}
          subLabel2="Weekends"
          subValue2={stats.weekendPercent}
          isPercentageSub={true}
        />
        <SplitStatCard 
          icon={<CreditCard className="text-slate-500" size={18} />}
          label="Payments received"
          value={stats.paidCount}
          subLabel1="K-pay"
          subValue1={stats.kpayCount}
          subLabel2="Cash"
          subValue2={stats.cashCount}
          isPercentageSub={false}
        />
        <SplitStatCard 
          icon={<CheckCircle2 className="text-slate-600" size={18} />}
          label="Paid rate"
          value={`${stats.paidPercent}%`}
          subLabel1="Weekdays"
          subValue1={stats.weekdayPaidPercent}
          subLabel2="Weekends"
          subValue2={stats.weekendPaidPercent}
          isPercentageSub={true}
          accentColor="text-emerald-600"
        />
        <SplitStatCard 
          icon={<AlertCircle className="text-slate-400" size={18} />}
          label="Pending rate"
          value={`${stats.unpaidPercent}%`}
          subLabel1="Weekdays"
          subValue1={stats.weekdayUnpaidPercent}
          subLabel2="Weekends"
          subValue2={stats.weekendUnpaidPercent}
          isPercentageSub={true}
          accentColor="text-rose-500"
        />
      </div>

      <div className="bg-slate-900 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 transition-all hover:border-slate-700">
        <div className="flex items-center gap-4 sm:gap-8 w-full md:w-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
            <DollarSign className="text-sky-400 w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1">Revenue current month</p>
            <h4 className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{stats.totalAmountCollected.toLocaleString()} Ks</h4>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
           <div className="flex-1 md:flex-none px-6 sm:px-8 py-3 sm:py-4 bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-700">
             <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 mb-1">Settled</p>
             <p className="text-xl sm:text-2xl font-black text-white">{stats.paidCount}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="font-bold text-black mb-6 sm:mb-8 text-sm sm:text-base flex items-center gap-3">
            <BarChart3 size={18} className="text-slate-400" />
            Class distribution
          </h3>
          <div className="space-y-4 sm:space-y-6 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(stats.classGroups).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([className, count]) => (
              <div key={className} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                  <span>{className}</span>
                  <span className="text-black">{count}</span>
                </div>
                <div className="h-1.5 sm:h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-1000"
                    style={{ width: `${((count as number) / (stats.totalStudents || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200">
          <h3 className="font-bold text-black mb-6 sm:mb-8 text-sm sm:text-base flex items-center gap-3">
            <AlertCircle size={18} className="text-slate-400" />
            Unpaid students
          </h3>
          <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.unpaidStudents.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <CheckCircle2 className="mx-auto text-slate-200 mb-4" size={40} />
                <p className="text-slate-400 font-bold text-sm">Accounts settled</p>
              </div>
            ) : (
              stats.unpaidStudents.map((s) => (
                <div key={s.id} className="p-4 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-slate-200 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-black truncate">{s.englishName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{s.category} • {s.dayType}</p>
                  </div>
                  <a href={`tel:${s.parentPhone}`} className="p-2.5 sm:p-3 bg-white text-slate-400 hover:text-black rounded-lg sm:rounded-xl border border-slate-100 transition-all shadow-sm shrink-0 ml-4">
                    <Phone size={14} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-rose-100 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <Trash2 size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="font-bold text-black text-lg sm:text-xl">System Maintenance</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Clear all payment history and reset sheet records for a new month.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsClearModalOpen(true)}
            className="w-full sm:w-auto px-10 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-lg text-sm uppercase tracking-widest"
          >
            Clear Data
          </button>
        </div>
      </div>

      {isClearModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-md shadow-2xl p-10 sm:p-12 text-center border border-slate-200 animate-scaleIn">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-black mb-2">Reset ledger?</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium">This will delete all current payments and reset sheet numbers to 1. Student directory will remain unchanged.</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleClearConfirm} 
                className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl sm:rounded-2xl tracking-widest text-xs uppercase transition-all hover:bg-rose-600 shadow-lg"
              >
                Yes, clear payments
              </button>
              <button 
                onClick={() => setIsClearModalOpen(false)} 
                className="w-full py-4 bg-slate-50 text-slate-400 font-bold rounded-xl sm:rounded-2xl text-xs tracking-widest uppercase transition-all hover:bg-slate-100"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SplitStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subLabel1: string;
  subValue1: number;
  subLabel2: string;
  subValue2: number;
  isPercentageSub?: boolean;
  accentColor?: string;
}

const SplitStatCard: React.FC<SplitStatCardProps> = ({ 
  icon, label, value, subLabel1, subValue1, subLabel2, subValue2, isPercentageSub, accentColor = "text-black" 
}) => (
  <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:border-slate-300 transition-all group">
    <div className="p-6 sm:p-8 flex-1 border-b border-slate-50">
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-5">
         <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
           {icon}
         </div>
         <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 leading-none">{label}</p>
      </div>
      <h4 className={`text-xl sm:text-3xl font-black ${accentColor} leading-tight tracking-tight`}>{value}</h4>
    </div>
    <div className="grid grid-cols-2">
      <div className="p-3 sm:p-5 bg-slate-50 border-r border-slate-100 group-hover:bg-slate-100/50 transition-colors">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mb-0.5">{subLabel1}</p>
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className="text-base sm:text-xl font-black text-black">{subValue1}</span>
          {isPercentageSub && <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">%</span>}
        </div>
      </div>
      <div className="p-3 sm:p-5 bg-slate-50 group-hover:bg-slate-100/50 transition-colors">
        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mb-0.5">{subLabel2}</p>
        <div className="flex items-baseline gap-0.5 sm:gap-1">
          <span className="text-base sm:text-xl font-black text-black">{subValue2}</span>
          {isPercentageSub && <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">%</span>}
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
