
import { AppData, Student, Payment } from '../types';

const STORAGE_KEY = 'edupay_data_v1';

const INITIAL_DATA: AppData = {
  students: [],
  payments: [],
  sheetNo: 1
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_DATA;
  try {
    const parsed = JSON.parse(stored);
    return {
      ...INITIAL_DATA,
      ...parsed
    };
  } catch (e) {
    console.error("Failed to parse stored data", e);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
