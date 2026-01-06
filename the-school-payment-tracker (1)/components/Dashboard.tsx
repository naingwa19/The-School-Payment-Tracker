import React, { useMemo, useState } from 'react';
import { Users, DollarSign, Calendar, CreditCard, CheckCircle2, AlertCircle, BarChart3, Phone, Trash2, AlertTriangle } from 'lucide-react';
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
    const totalStudentsCount = activeStudents.length || 0;
    
    const weekdayTotal = activeStudents.filter(s => s.dayType === 'Weekday').length;
    const weekendTotal = activeStudents.filter(s => s.dayType === 'Weekend').length;

    const monthPayments = data.payments.filter(p => p.month === currentMonth);
    const paidStudentIds = new Set(monthPayments.map(p => p.studentId));
    const paidCount = paidStudentIds.size;
    const totalAmountCollected = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const kpayCount = monthPayments.filter(p => p.method === PaymentMethod.KPAY).length;
    const cashCount = monthPayments.filter(p => p.method === PaymentMethod.CASH).length;
    
    const unpaidStudentsList = activeStudents.filter(s => !paidStudentIds.has(s.id));
    const pendingCount = unpaidStudentsList.length;

    const weekdayPaidCount = activeStudents.filter(s => s.dayType === 'Weekday' && paidStudentIds.has(s.id)).length;
    const weekendPaidCount = activeStudents.filter(s => s.dayType === 'Weekend' && paidStudentIds.has(s.id)).length;

    const weekdayUnpaidCount = weekdayTotal - weekdayPaidCount;
    const weekendUnpaidCount = weekendTotal - weekendPaidCount;

    const weekdayUnpaidRate = weekdayTotal > 0 ? Math.round((weekdayUnpaidCount / weekdayTotal) * 100) : 0;
    const weekendUnpaidRate = weekendTotal > 0 ? Math.round((weekendUnpaidCount / weekendTotal) * 100) : 0;

    const classGroups: Record<string, number> = {};
    activeStudents.forEach(s => { classGroups[s.category] = (classGroups[s.category] || 0) + 1; });

    const overallPaidRate = totalStudentsCount > 0 ? Math.round((paidCount / totalStudentsCount) * 100) : 0;
    const overallUnpaidRate = totalStudentsCount > 0 ? Math.round((pendingCount / totalStudentsCount) * 100) : 0;
    
    const weekdayPaidRate = weekdayTotal > 0 ? Math.round((weekdayPaidCount / weekdayTotal) * 100) : 0;
    const weekendPaidRate = weekendTotal > 0 ? Math.round((weekendPaidCount / weekendTotal) * 100) : 0;

    return { 
      totalAmountCollected,
      paidCount, 
      pendingCount, 
      totalStudents: totalStudentsCount,
      unpaidStudents: unpaidStudentsList,
      kpayCount,
      cashCount,
      weekdayPercent: totalStudentsCount > 0 ? Math.round((weekdayTotal / totalStudentsCount) * 100) : 0,
      weekendPercent: totalStudentsCount > 0 ? Math.round((weekendTotal / totalStudentsCount) * 100) : 0,
      overallPaidRate,
      overallUnpaidRate,
      weekdayPaidRate,
      weekendPaidRate,
      weekdayUnpaidRate,
      weekendUnpaidRate,
      classGroups
    };
  }, [data, currentMonth]);

  const handleClearConfirm = () => {
    onClearPayments();
    setIsClearModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 border border-sky-100 shadow-sm rounded-[2.5rem]">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 border border-sky-50 rounded-[2rem] bg-white flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <Logo className="w-full h-full p-2" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-sky-900 tracking-tighter uppercase">Dashboard</h1>
            <p className="mt-1 flex items-center gap-2 text-base font-black text-sky-300 uppercase tracking-[0.2em]">
              <Calendar size={18} className="text-sky-500" />
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="px-10 py-5 bg-sky-50/50 border border-sky-100 rounded-3xl text-center md:text-left shadow-inner">
          <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] mb-1">Total Students</p>
          <p className="text-5xl font-black text-sky-600">{stats.totalStudents}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users size={20} />}
          label="Enrollment"
          value={stats.totalStudents}
          sub1="Weekdays" subValue1={stats.weekdayPercent}
          sub2="Weekends" subValue2={stats.weekendPercent}
        />
        <StatCard 
          icon={<CreditCard size={20} />}
          label="Receipts"
          value={stats.paidCount}
          sub1="Cash" subValue1={stats.cashCount}
          sub2="Kpay" subValue2={stats.kpayCount}
          isNotPercent
        />
        <StatCard 
          icon={<CheckCircle2 size={20} />}
          label="Paid rate"
          value={`${stats.overallPaidRate}%`}
          sub1="Weekdays" subValue1={stats.weekdayPaidRate}
          sub2="Weekends" subValue2={stats.weekendPaidRate}
          accent="text-emerald-500"
        />
        <StatCard 
          icon={<AlertCircle size={20} />}
          label="Pending"
          value={`${stats.overallUnpaidRate}%`}
          sub1="Weekdays" subValue1={stats.weekdayUnpaidRate}
          sub2="Weekends" subValue2={stats.weekendUnpaidRate}
          accent="text-rose-500"
        />
      </div>

      <div className="bg-sky-500 p-10 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-sky-200/50 border border-sky-400 text-white">
        <div className="flex items-center gap-8 w-full md:w-auto">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
            <DollarSign className="text-white w-10 h-10" />
          </div>
          <div>
            <p className="text-xs font-black text-white/60 mb-1 uppercase tracking-widest">Monthly Collection</p>
            <h4 className="text-5xl font-black text-white tracking-tighter">{stats.totalAmountCollected.toLocaleString()} <span className="text-xl opacity-60 font-bold uppercase">MMK</span></h4>
          </div>
        </div>
        <div className="px-10 py-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl text-center md:text-left min-w-[200px]">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] mb-1">Settled Accounts</p>
          <p className="text-4xl font-black text-white">{stats.paidCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm">
          <h3 className="font-black mb-8 text-xl flex items-center gap-4 text-sky-900 uppercase tracking-tight">
            <BarChart3 size={24} className="text-sky-300" />
            Class distribution
          </h3>
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar text-black">
            {Object.entries(stats.classGroups).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([className, count]) => (
              <div key={className} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">{className}</span>
                  <span className="text-sky-900">{count} Stu.</span>
                </div>
                <div className="h-2.5 bg-sky-50 rounded-full overflow-hidden border border-sky-100/50">
                  <div className="h-full bg-sky-500 rounded-full shadow-inner shadow-white/20 transition-all duration-1000" style={{ width: `${((count as number) / (stats.totalStudents || 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-sky-100 shadow-sm">
          <h3 className="font-black mb-8 text-xl flex items-center gap-4 text-sky-900 uppercase tracking-tight">
            <AlertCircle size={24} className="text-sky-300" />
            Unpaid Students
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {stats.unpaidStudents.length === 0 ? (
              <div className="py-20 text-center font-black text-sky-100 uppercase tracking-[0.5em]">No pending</div>
            ) : (
              stats.unpaidStudents.map((s) => (
                <div key={s.id} className="p-6 bg-sky-50/20 border border-sky-50 rounded-[2rem] flex items-center justify-between group hover:bg-sky-50 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-sky-900 truncate tracking-tight">{s.englishName}</p>
                    <p className="text-[10px] font-black text-sky-300 mt-0.5 uppercase tracking-widest">
                      {s.category} • {s.dayType === 'Weekday' ? 'Weekdays' : 'Weekends'}
                    </p>
                  </div>
                  <a href={`tel:${s.parentPhone}`} className="p-4 bg-white border border-sky-100 text-sky-500 hover:bg-sky-500 hover:text-white hover:shadow-xl hover:shadow-sky-100 rounded-2xl transition-all shrink-0">
                    <Phone size={20} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-rose-50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:border-rose-100">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 border border-rose-100 rounded-[1.5rem] bg-rose-50 flex items-center justify-center shrink-0">
            <Trash2 size={32} className="text-rose-400" />
          </div>
          <div>
            <h3 className="font-black text-2xl text-rose-500 tracking-tighter uppercase">Maintenance</h3>
            <p className="text-slate-400 text-sm font-bold mt-0.5">Purge payment history for next billing cycle</p>
          </div>
        </div>
        <button onClick={() => setIsClearModalOpen(true)} className="w-full sm:w-auto px-12 py-5 bg-rose-50 text-rose-500 font-black rounded-2xl transition-all hover:bg-rose-500 hover:text-white uppercase tracking-widest text-xs">Execute Clear</button>
      </div>

      {isClearModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-900/10 backdrop-blur-sm">
          <div className="bg-white border border-sky-100 rounded-[3rem] w-full max-w-md p-12 text-center animate-scaleIn shadow-2xl text-black">
            <AlertTriangle size={64} className="mx-auto mb-8 text-rose-400" />
            <h3 className="text-3xl font-black mb-4 text-sky-900 uppercase tracking-tight">Purge Records?</h3>
            <p className="text-slate-400 font-bold mb-10 text-sm">Transfers and receipts will be permanently cleared. Directory is safe.</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleClearConfirm} className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl shadow-xl hover:bg-rose-600 transition-all uppercase tracking-widest text-xs">Reset ledger</button>
              <button onClick={() => setIsClearModalOpen(false)} className="w-full py-4 font-black text-sky-200 hover:text-sky-500 transition-all uppercase tracking-widest text-xs text-black">Go back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub1, subValue1, sub2, subValue2, accent = "text-sky-900", isNotPercent = false }: any) => (
  <div className="bg-white border border-sky-100 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all text-black">
    <div className="p-8 border-b border-sky-50">
       <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-sky-50 rounded-2xl text-sky-500 border border-sky-100/50">{icon}</div>
          <span className="text-[10px] font-black text-sky-300 uppercase tracking-[0.3em]">{label}</span>
       </div>
       <p className={`text-5xl font-black ${accent} tracking-tighter`}>{value}</p>
    </div>
    <div className="grid grid-cols-2 bg-sky-50/30">
       <div className="p-5 border-r border-sky-50 text-center">
          <p className="text-[9px] font-black text-sky-300 uppercase mb-1">{sub1}</p>
          <p className="text-xl font-black text-sky-900 leading-tight">{subValue1}{!isNotPercent && <span className="text-sm opacity-30">%</span>}</p>
       </div>
       <div className="p-5 text-center">
          <p className="text-[9px] font-black text-sky-300 uppercase mb-1">{sub2}</p>
          <p className="text-xl font-black text-sky-900 leading-tight">{subValue2}{!isNotPercent && <span className="text-sm opacity-30">%</span>}</p>
       </div>
    </div>
  </div>
);

export default Dashboard;