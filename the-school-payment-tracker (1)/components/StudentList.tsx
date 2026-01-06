import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit3, UserPlus, Phone, X, ListPlus, AlertTriangle, ArrowLeft, Loader2, Calendar, User, ChevronRight } from 'lucide-react';
import { Student, StudentLevel, AttendanceDay } from '../types';
import { extractStudentsFromText } from '../services/geminiService';

const getTeacherName = (level: StudentLevel, day: AttendanceDay): string => {
  if (day === 'Weekend') {
    switch (level) {
      case 'Pre-Starters': return 'Tr. Phoo';
      case 'Starters 1': return 'Tr. Phyo';
      case 'Starters 2': return 'Tr. Yadanar';
      case 'Movers 1': return 'Tr. Nyein';
      case 'Movers 2': return 'Tr. Athena';
      case 'Pre-flyers': return 'Tr. Elora';
      case 'Flyers': return 'Tr. Yamin';
      case 'KET-1': return 'Tr. Samuel';
      case 'KET-2': return 'Tr. Athena';
      case 'PET': return 'Tr. Ei Phyo';
      case 'FCE': return 'Tr. Ko Myo';
      case 'Math-1': return 'Tr. Sweety';
      case 'Math-4': return 'Tr. Khat';
      case 'Math-6': return 'Tr. Su Htet';
      default: return '—';
    }
  } else {
    switch (level) {
      case 'Pre-Starters': return 'Tr. Phoo';
      case 'Starters': return 'Tr. Phyo';
      case 'Movers': return 'Tr. Nyein';
      case 'Flyers1': return 'Tr. Ko Myo';
      case 'Flyers2': return 'Tr. Shwe Sin';
      case 'KET-1': return 'Tr. Phoo Phoo';
      case 'KET-2': return 'Tr. Yadanar';
      case 'PET': return 'Tr. Ko Myo';
      case 'Pre-flyers': return 'Tr. Elora';
      default: return '—';
    }
  }
};

const getAvailableLevels = (day: AttendanceDay): StudentLevel[] => {
  if (day === 'Weekday') {
    return ['Pre-Starters', 'Starters', 'Movers', 'Flyers1', 'Flyers2', 'Pre-flyers', 'KET-1', 'KET-2', 'PET'];
  } else {
    return ['Pre-Starters', 'Starters 1', 'Starters 2', 'Movers 1', 'Movers 2', 'Flyers', 'Pre-flyers', 'KET-1', 'KET-2', 'PET', 'FCE', 'Math-1', 'Math-4', 'Math-6'];
  }
};

const generateSafeId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

interface StudentListProps {
  students: Student[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState(1);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<AttendanceDay>('Weekday');
  const [levelFilter, setLevelFilter] = useState<StudentLevel>('Pre-Starters');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [bulkConfig, setBulkConfig] = useState<{
    dayType: AttendanceDay;
    level: StudentLevel;
  }>({
    dayType: 'Weekday',
    level: 'Pre-Starters'
  });

  const [formData, setFormData] = useState({
    englishName: '',
    burmeseName: '',
    parentPhone: '',
    category: levelFilter,
    dayType: dayFilter,
    joinDate: new Date().toISOString().slice(0, 10),
    isActive: true,
  });

  useEffect(() => {
    const avail = getAvailableLevels(dayFilter);
    if (!avail.includes(levelFilter)) {
      setLevelFilter(avail[0]);
    }
  }, [dayFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      onUpdate({ ...editingStudent, ...formData });
    } else {
      onAdd({ id: generateSafeId(), ...formData });
    }
    closeModal();
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setIsProcessing(true);
    try {
      const extracted = await extractStudentsFromText(bulkText);
      if (extracted && Array.isArray(extracted)) {
        extracted.forEach((s: any) => {
          onAdd({
            id: generateSafeId(),
            englishName: s.englishName || "Unknown",
            burmeseName: s.burmeseName || "",
            parentPhone: s.parentPhone || "N/A",
            category: bulkConfig.level,
            dayType: bulkConfig.dayType,
            joinDate: new Date().toISOString().slice(0, 10),
            isActive: true
          });
        });
        setIsBulkAddOpen(false);
        setBulkStep(1);
        setBulkText('');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({
      englishName: '',
      burmeseName: '',
      parentPhone: '',
      category: levelFilter,
      dayType: dayFilter,
      joinDate: new Date().toISOString().slice(0, 10),
      isActive: true,
    });
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.burmeseName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && s.dayType === dayFilter && s.category === levelFilter;
  }).sort((a, b) => a.englishName.localeCompare(b.englishName));

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-sky-900 uppercase">Registry</h1>
          <p className="text-sky-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Enrollment Directory</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setBulkStep(1); setIsBulkAddOpen(true); }} className="flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all">
            <ListPlus size={18} /> Bulk Add
          </button>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-sky-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all">
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-sky-50 flex flex-col md:flex-row items-center gap-6">
        <div className="flex bg-sky-50 p-1.5 rounded-2xl border border-sky-100/50">
          {(['Weekday', 'Weekend'] as const).map(type => (
            <button key={type} onClick={() => setDayFilter(type)} className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-all ${dayFilter === type ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:bg-sky-100'}`}>
              {type}
            </button>
          ))}
        </div>
        <select className="px-6 py-3 bg-sky-50/50 border border-sky-50 rounded-2xl text-xs font-black text-sky-900 outline-none cursor-pointer uppercase" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value as StudentLevel)}>
          {getAvailableLevels(dayFilter).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
        </select>
        <div className="md:ml-auto relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-200" size={18} />
          <input type="text" placeholder="Search directory..." className="w-full pl-12 pr-4 py-4 bg-sky-50/30 border border-sky-50 rounded-2xl text-xs font-bold outline-none focus:bg-white text-sky-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sky-50/50 border-b border-sky-100 text-[10px] font-black uppercase text-sky-300">
              <tr>
                <th className="px-10 py-6">Student details</th>
                <th className="px-10 py-6">Class teacher</th>
                <th className="px-10 py-6 text-center">Day type</th>
                <th className="px-10 py-6">Parent contact</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50 text-black">
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="px-10 py-24 text-center text-sky-100 font-bold italic text-xl uppercase tracking-widest">No entries found</td></tr>
              ) : (
                filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-sky-50/20 transition-colors group">
                    <td className="px-10 py-8">
                      <p className="font-black text-sky-900 text-lg">{s.englishName}</p>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">{s.burmeseName || '—'}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-sky-500" />
                        <span className="font-bold text-sm text-sky-900">{getTeacherName(s.category, s.dayType)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-sky-50 text-sky-500">
                        <Calendar size={12} /> {s.dayType}
                      </span>
                    </td>
                    <td className="px-10 py-8">
                      <a href={`tel:${s.parentPhone}`} className="font-bold text-slate-500 hover:text-sky-600 flex items-center gap-2">
                        <Phone size={14} /> {s.parentPhone}
                      </a>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingStudent(s); setFormData(s); setIsModalOpen(true); }} className="p-3 bg-white border border-sky-100 rounded-xl text-sky-300 hover:bg-sky-500 hover:text-white transition-all shadow-sm"><Edit3 size={18} /></button>
                        <button onClick={() => { setStudentToDelete(s.id); setIsDeleteConfirmOpen(true); }} className="p-3 bg-white border border-sky-100 rounded-xl text-sky-200 hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isBulkAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-900/10 backdrop-blur-sm">
          <div className="bg-white border border-sky-100 rounded-[3rem] w-full max-w-xl p-10 shadow-2xl animate-scaleIn text-black">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-sky-900 uppercase">Bulk Enrollment</h3>
              <button onClick={() => setIsBulkAddOpen(false)} className="text-slate-300 hover:text-sky-900"><X size={32} /></button>
            </div>
            
            {bulkStep === 1 ? (
              <div className="space-y-8">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Step 1: Assign Class Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-sky-400 ml-1">Schedule</label>
                    <div className="flex bg-sky-50 p-1.5 rounded-2xl border border-sky-100">
                      {(['Weekday', 'Weekend'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setBulkConfig({ ...bulkConfig, dayType: type, level: getAvailableLevels(type)[0] })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${bulkConfig.dayType === type ? 'bg-sky-500 text-white shadow-md' : 'text-sky-300 hover:bg-sky-100'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-sky-400 ml-1">Class Level</label>
                    <select 
                      className="w-full px-6 py-3.5 bg-sky-50 border border-sky-100 rounded-2xl text-xs font-black text-sky-900 outline-none uppercase"
                      value={bulkConfig.level}
                      onChange={(e) => setBulkConfig({ ...bulkConfig, level: e.target.value as StudentLevel })}
                    >
                      {getAvailableLevels(bulkConfig.dayType).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setBulkStep(2)}
                  className="w-full py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl hover:bg-sky-600 transition-all uppercase text-xs flex items-center justify-center gap-3"
                >
                  Configure and Continue <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Step 2: Provide Student Records</p>
                   <span className="px-3 py-1 bg-sky-50 text-sky-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">Target: {bulkConfig.level} ({bulkConfig.dayType})</span>
                </div>
                <textarea 
                  className="w-full h-64 p-6 bg-sky-50/50 border border-sky-100 rounded-3xl text-sm font-bold text-sky-900 outline-none focus:bg-white transition-all"
                  placeholder="Paste text records here... AI will extract student details (Names and Phones)."
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={() => setBulkStep(1)} className="flex-1 py-5 bg-sky-50 text-sky-400 font-black rounded-2xl hover:bg-sky-100 transition-all uppercase text-xs flex items-center justify-center gap-2">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    onClick={handleBulkAdd}
                    disabled={isProcessing || !bulkText.trim()}
                    className="flex-[2] py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl hover:bg-sky-600 transition-all uppercase text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <ListPlus size={18} />}
                    Run Importer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-900/10 backdrop-blur-sm">
          <div className="bg-white border border-sky-100 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn my-8 text-black">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black text-sky-900 uppercase tracking-tight">{editingStudent ? 'Edit student' : 'New enrollment'}</h3>
                 <button onClick={closeModal} className="text-slate-300 hover:text-sky-900 transition-colors"><X size={32} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex gap-2 p-1.5 bg-sky-50 rounded-2xl border border-sky-100/50">
                    {(['Weekday', 'Weekend'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, dayType: type})}
                        className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.dayType === type ? 'bg-sky-500 text-white shadow-sm' : 'text-sky-300 hover:bg-sky-100'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {getAvailableLevels(formData.dayType).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setFormData({...formData, category: lvl})}
                        className={`px-3 py-4 rounded-xl text-[10px] font-black uppercase transition-all border ${formData.category === lvl ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-sky-300 border-sky-100 hover:border-sky-200'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <input required className="w-full p-5 bg-sky-50/50 border border-sky-50 rounded-2xl font-bold text-sky-900 outline-none text-sm" placeholder="English name" value={formData.englishName} onChange={(e) => setFormData({...formData, englishName: e.target.value})} />
                    <input className="w-full p-5 bg-sky-50/50 border border-sky-50 rounded-2xl font-bold text-sky-900 outline-none text-sm" placeholder="Burmese name" value={formData.burmeseName} onChange={(e) => setFormData({...formData, burmeseName: e.target.value})} />
                    <input required className="w-full p-5 bg-sky-50/50 border border-sky-50 rounded-2xl font-bold text-sky-900 outline-none text-sm" placeholder="Phone number" value={formData.parentPhone} onChange={(e) => setFormData({...formData, parentPhone: e.target.value})} />
                  </div>
                </div>
                
                <button type="submit" className="w-full py-5 bg-sky-500 text-white font-black rounded-2xl shadow-xl hover:bg-sky-600 transition-all uppercase text-xs">Save record</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-sky-900/10 backdrop-blur-sm">
          <div className="bg-white border border-sky-100 rounded-[3rem] w-full max-sm p-12 text-center shadow-2xl animate-scaleIn text-black">
            <AlertTriangle size={48} className="mx-auto mb-6 text-rose-500" />
            <h3 className="text-xl font-black mb-4 text-sky-900 uppercase">Purge student?</h3>
            <p className="text-sm text-slate-400 mb-8 font-bold">This student and all their history will be permanently deleted.</p>
            <div className="flex flex-col gap-4">
              <button onClick={() => { if (studentToDelete) onDelete(studentToDelete); setIsDeleteConfirmOpen(false); }} className="w-full py-4 bg-rose-500 text-white font-black text-xs uppercase rounded-2xl shadow-lg hover:bg-rose-600 transition-all">Confirm Delete</button>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full py-2 font-black text-[10px] uppercase text-slate-300 hover:text-sky-900 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;