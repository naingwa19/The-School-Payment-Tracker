export enum PaymentMethod {
  KPAY = 'K-pay',
  CASH = 'Cash'
}

export type AttendanceDay = 'Weekday' | 'Weekend';

export type StudentLevel = 
  | 'Pre-Starters' 
  | 'Starters' | 'Starters 1' | 'Starters 2' 
  | 'Movers' | 'Movers 1' | 'Movers 2' 
  | 'Flyers' | 'Flyers1' | 'Flyers2' 
  | 'Pre-flyers' 
  | 'KET-1' | 'KET-2' 
  | 'PET' | 'FCE' 
  | 'Math-1' | 'Math-4' | 'Math-6';

export interface Student {
  id: string;
  englishName: string;
  burmeseName: string;
  parentPhone: string;
  joinDate: string;
  category: StudentLevel;
  dayType: AttendanceDay;
  isActive: boolean;
}

export interface Payment {
  id: string;
  studentId: string;
  month: string; // Format: YYYY-MM
  amount: number;
  date: string;
  method: PaymentMethod;
  dayType: AttendanceDay;
  sheetNo: number; 
  notes?: string;
}

export interface AppData {
  students: Student[];
  payments: Payment[];
  sheetNo: number;
}