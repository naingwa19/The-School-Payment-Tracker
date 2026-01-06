
import React, { useState, useEffect } from 'react';
import { Search, Trash2, Edit3, UserPlus, Phone, X, ListPlus, AlertTriangle, ArrowLeft, Loader2, Calendar } from 'lucide-react';
import { Student, StudentLevel, AttendanceDay } from '../types';
import { extractStudentsFromText } from '../services/geminiService';

// Fixed level names to match StudentLevel type definition in types.ts
const LEVELS: StudentLevel[] = [
  'Pre-Starters', 'Starters 1', 'Starters 2', 'Movers 1', 'Movers 2', 'Pre-flyers', 
  'Flyers1', 'Flyers2', 
  'KET-1', 'KET-2', 
  'PET', 'FCE', 
  'Math-1', 'Math-4', 'Math-6'
];

const generateSafeId = () => {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

interface StudentListProps {
  students: Student[];
  onAdd: (s: Student) => void;
  onUpdate: (s: Student) => void;
  onDelete: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState(1);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState<AttendanceDay>('Weekday');
  // Fixed initial level filter to match StudentLevel type
  const [levelFilter, setLevelFilter] = useState<StudentLevel>('Pre-Starters');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    englishName: '',
    burmeseName: '',
    parentPhone: '',
    category: levelFilter,
    dayType: dayFilter,
    joinDate: new Date().toISOString().slice(0, 10),
    isActive: true,
  });

  const [bulkConfig, setBulkConfig] = useState({
    category: levelFilter,
    dayType: dayFilter,
  });

  const getAvailableLevels = (day: AttendanceDay) => {
    if (day === 'Weekday') {
      return LEVELS.filter(l => !l.startsWith('Math') && !['Flyers1', 'Flyers2'].includes(l));
    } else {
      return LEVELS.filter(l => !['Flyers1', 'Flyers2'].includes(l));
    }
  };

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
      onAdd({
        id: generateSafeId(),
        ...formData,
      });
    }
    closeModal();
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;
    setIsProcessing(true);
    try {
      const extracted = await extractStudentsFromText(bulkText);
      if (extracted && Array.isArray(extracted) && extracted.length > 0) {
        extracted.forEach((s: any) => {
          onAdd({
            id: generateSafeId(),
            englishName: s.englishName || "Unknown",
            burmeseName: s.burmeseName || "",
            parentPhone: s.parentPhone || "N/A",
            category: bulkConfig.category,
            dayType: bulkConfig.dayType,
            joinDate: new Date().toISOString().slice(0, 10),
            isActive: true
          });
        });
        closeBulkAdd();
      } else {
        throw new Error("AI failed to find any students. Please check the text format.");
      }
    } catch (e: any) {
      alert(e.message || "An error occurred during bulk import.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setModalStep(1);
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

  const closeBulkAdd = () => {
    setIsBulkAddOpen(false);
    setBulkStep(1);
    setBulkText('');
  };

  const openEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      englishName: s.englishName,
      burmeseName: s.burmeseName,
      parentPhone: s.parentPhone,
      category: s.category,
      dayType: s.dayType,
      joinDate: s.joinDate,
      isActive: s.isActive,
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.burmeseName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = s.dayType === dayFilter;
    const matchesLevel = s.category === levelFilter;
    return matchesSearch && matchesDay && matchesLevel;
  }).sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1));

  return (
    <div className="space-y-6 sm:space-y-10 animate-fadeIn text-black">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">Registry</h1>
          <p className="text-slate-500 font-medium">Class enrollment directory</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => { setBulkStep(1); setIsBulkAddOpen(true); }}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl hover:bg-slate-50 transition-all font-semibold shadow-sm"
          >
            <ListPlus size={18} />
            <span>Bulk import</span>
          </button>
          <button 
            onClick={() => { setModalStep(1); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white px-7 py-3 rounded-xl transition-all shadow-lg font-semibold"
          >
            <UserPlus size={18} />
            <span>Add student</span>
          </button>
        </div>
      </header>

      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-100">
          {(['Weekday', 'Weekend'] as const).map(type => (
            <button
              key={type}
              onClick={() => setDayFilter(type)}
              className={`flex-1 px-5 py-2 rounded-xl text-xs font-bold transition-all ${dayFilter === type ? 'bg-white text-black shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {type}
            </button>
          ))}
        </div>

        <select 
          className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as StudentLevel)}
        >
          {getAvailableLevels(dayFilter).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
        </select>

        <div className="md:ml-auto relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Search directory..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white font-medium text-black"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px] sm:min-w-0">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 sm:px-10 py-5 sm:py-6">Student details</th>
                <th className="px-6 sm:px-10 py-5 sm:py-6">Parent contact</th>
                <th className="px-6 sm:px-10 py-5 sm:py-6 text-center">Day type</th>
                <th className="px-6 sm:px-10 py-5 sm:py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 sm:px-10 py-16 sm:py-24 text-center text-slate-300 font-bold">No students found</td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className={`hover:bg-slate-50/50 transition-colors group ${!student.isActive ? 'opacity-40' : ''}`}>
                    <td className="px-6 sm:px-10 py-6">
                      <p className="font-bold text-black">{student.englishName}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1">{student.burmeseName}</p>
                    </td>
                    <td className="px-6 sm:px-10 py-6">
                      <a href={`tel:${student.parentPhone}`} className="text-slate-600 hover:text-black font-semibold text-sm">
                        {student.parentPhone}
                      </a>
                    </td>
                    <td className="px-6 sm:px-10 py-6 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400">
                        <Calendar size={14} />
                        {student.dayType}
                      </span>
                    </td>
                    <td className="px-6 sm:px-10 py-6 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(student)} className="p-2.5 text-slate-300 hover:text-black hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-slate-100 transition-all"><Edit3 size={18} /></button>
                        <button onClick={() => { setStudentToDelete(student.id); setIsDeleteConfirmOpen(true); }} className="p-2.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-scaleIn my-8">
            <div className="p-8 sm:p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Bulk import</h3>
                <p className="text-slate-400 text-xs mt-1">Smart class enrollment</p>
              </div>
              <button onClick={closeBulkAdd} className="text-slate-500 hover:text-white transition-colors"><X size={32} /></button>
            </div>
            
            <div className="p-8 sm:p-10 space-y-8">
              {bulkStep === 1 ? (
                <>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500">Target assignment</label>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Schedule</p>
                         <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold text-black" value={bulkConfig.dayType} onChange={(e) => setBulkConfig({...bulkConfig, dayType: e.target.value as any})}>
                           <option value="Weekday">Weekday</option>
                           <option value="Weekend">Weekend</option>
                         </select>
                       </div>
                       <div className="space-y-2">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class level</p>
                         <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm font-bold text-black" value={bulkConfig.category} onChange={(e) => setBulkConfig({...bulkConfig, category: e.target.value as any})}>
                           {getAvailableLevels(bulkConfig.dayType).map(l => <option key={l} value={l}>{l}</option>)}
                         </select>
                       </div>
                    </div>
                  </div>
                  <button onClick={() => setBulkStep(2)} className="w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-xl text-sm uppercase tracking-widest transition-all">Continue to import</button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-500">Paste student data</label>
                    <textarea 
                      className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-black outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all"
                      placeholder="