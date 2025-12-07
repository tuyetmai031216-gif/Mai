
export type TransactionType = 'income' | 'expense' | 'saving';

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
}

export interface SummaryStats {
  totalIncome: number;
  totalExpense: number;
  totalSaving: number;
  balance: number;
  savingsRate: number;
}

export type TimeRange = 'day' | 'month' | 'year';

export enum AppView {
  DASHBOARD = 'dashboard',
  TRANSACTIONS = 'transactions',
  ADD = 'add',
  ANALYSIS = 'analysis'
}

export const CATEGORIES = {
  income: ['Lương', 'Thưởng', 'Đầu tư', 'Bán hàng', 'Khác'],
  // Updated expense categories based on user request
  // Thiết yếu: Nhà, Ăn, Đi lại
  // Thay đổi: Ăn uống, Mỹ phẩm, Khác
  expense: ['Nhà', 'Ăn', 'Đi lại', 'Ăn uống', 'Mỹ phẩm', 'Khác'],
  saving: ['Gửi tiết kiệm', 'Đầu tư vàng', 'Chứng khoán', 'Quỹ dự phòng', 'Heo đất', 'Khác']
};

// Define which categories fall under Essential Expenses (Thiết yếu)
export const ESSENTIAL_EXPENSE_CATEGORIES = ['Nhà', 'Ăn', 'Đi lại'];

export const getExpenseGroup = (category: string): 'Thiết yếu' | 'Thay đổi' => {
  return ESSENTIAL_EXPENSE_CATEGORIES.includes(category) ? 'Thiết yếu' : 'Thay đổi';
};
