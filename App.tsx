
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, PlusCircle, PieChart } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { Transaction, AppView } from './types';

// Initial dummy data to make the app look populated (3 months of data)
const INITIAL_DATA: Transaction[] = [
  // May
  { id: '1', date: '2024-05-01', amount: 20000000, type: 'income', category: 'Lương', description: 'Lương tháng 5' },
  { id: '2', date: '2024-05-02', amount: 5000000, type: 'expense', category: 'Nhà', description: 'Tiền thuê nhà' },
  { id: '3', date: '2024-05-05', amount: 3000000, type: 'expense', category: 'Ăn', description: 'Đi chợ đầu tháng' },
  { id: '4', date: '2024-05-15', amount: 5000000, type: 'saving', category: 'Gửi tiết kiệm', description: 'Tiết kiệm ngân hàng' },
  { id: '4b', date: '2024-05-20', amount: 500000, type: 'expense', category: 'Đi lại', description: 'Xăng xe' },
  
  // June
  { id: '5', date: '2024-06-01', amount: 20000000, type: 'income', category: 'Lương', description: 'Lương tháng 6' },
  { id: '6', date: '2024-06-05', amount: 5000000, type: 'expense', category: 'Nhà', description: 'Tiền thuê nhà' },
  { id: '7', date: '2024-06-06', amount: 2000000, type: 'expense', category: 'Mỹ phẩm', description: 'Mua đồ skincare' },
  { id: '8', date: '2024-06-10', amount: 7000000, type: 'saving', category: 'Đầu tư vàng', description: 'Mua 1 chỉ vàng' },
  { id: '8b', date: '2024-06-25', amount: 1500000, type: 'expense', category: 'Ăn uống', description: 'Tiệc sinh nhật bạn' },

  // July
  { id: '9', date: '2024-07-01', amount: 22000000, type: 'income', category: 'Lương', description: 'Lương tháng 7 (tăng lương)' },
  { id: '10', date: '2024-07-05', amount: 5000000, type: 'expense', category: 'Nhà', description: 'Tiền thuê nhà' },
  { id: '11', date: '2024-07-15', amount: 1500000, type: 'expense', category: 'Khác', description: 'Du lịch cuối tuần' },
  { id: '12', date: '2024-07-20', amount: 8000000, type: 'saving', category: 'Gửi tiết kiệm', description: 'Gửi tích lũy online' },
  { id: '13', date: '2024-07-22', amount: 2000000, type: 'expense', category: 'Ăn', description: 'Siêu thị' },
];

function App() {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile responsiveness

  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [...prev, transaction]);
    setView(AppView.TRANSACTIONS); // Go to list after add
  };

  const addTransactions = (newTransactions: Transaction[]) => {
    setTransactions(prev => [...prev, ...newTransactions]);
    setView(AppView.TRANSACTIONS);
  };

  const updateTransaction = (updated: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTransaction(null);
    setView(AppView.TRANSACTIONS);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteAllTransactions = () => {
    setTransactions([]);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setView(AppView.ADD);
  };

  const handleCancelForm = () => {
    setEditingTransaction(null);
    setView(AppView.TRANSACTIONS);
  }

  // Handle switching views to clear edit state if user clicks menu manually
  const switchView = (newView: AppView) => {
    if (newView !== AppView.ADD) {
        setEditingTransaction(null);
    } else {
        // If clicking Add manually, clear edit state to ensure blank form
        setEditingTransaction(null);
    }
    setView(newView);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <PieChart className="text-blue-400" /> FinanceAI
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => switchView(AppView.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.DASHBOARD ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} /> Tổng Quan
          </button>
          <button
            onClick={() => switchView(AppView.TRANSACTIONS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.TRANSACTIONS ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Receipt size={20} /> Giao Dịch
          </button>
          <button
            onClick={() => switchView(AppView.ADD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AppView.ADD ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <PlusCircle size={20} /> Thêm Mới
          </button>
        </nav>
        <div className="p-4 text-xs text-slate-500 border-t border-slate-800">
          Powered by Gemini 2.5
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-50 p-4 flex justify-between items-center shadow-md">
         <h1 className="text-lg font-bold flex items-center gap-2">
            <PieChart className="text-blue-400" /> FinanceAI
          </h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            Menu
          </button>
      </div>

       {/* Mobile Menu Overlay */}
       {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/95 z-40 pt-20 px-6 space-y-4">
           <button
            onClick={() => switchView(AppView.DASHBOARD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg ${view === AppView.DASHBOARD ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            <LayoutDashboard size={20} /> Tổng Quan
          </button>
          <button
            onClick={() => switchView(AppView.TRANSACTIONS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg ${view === AppView.TRANSACTIONS ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            <Receipt size={20} /> Giao Dịch
          </button>
           <button
            onClick={() => switchView(AppView.ADD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg ${view === AppView.ADD ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
          >
            <PlusCircle size={20} /> Thêm Mới
          </button>
        </div>
       )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {view === AppView.DASHBOARD && "Tổng quan tài chính"}
              {view === AppView.TRANSACTIONS && "Lịch sử giao dịch"}
              {view === AppView.ADD && (editingTransaction ? "Cập nhật giao dịch" : "Thêm giao dịch mới")}
            </h2>
            <p className="text-slate-500 text-sm">Quản lý chi tiêu thông minh của bạn</p>
          </div>
          {view !== AppView.ADD && (
            <button 
              onClick={() => switchView(AppView.ADD)}
              className="md:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg"
            >
              <PlusCircle size={24} />
            </button>
          )}
        </header>

        <div className="max-w-6xl mx-auto">
          {view === AppView.DASHBOARD && (
            <Dashboard transactions={transactions} />
          )}

          {view === AppView.TRANSACTIONS && (
            <TransactionList 
              transactions={transactions} 
              onDelete={deleteTransaction} 
              onEdit={handleEdit}
              onDeleteAll={deleteAllTransactions}
            />
          )}

          {view === AppView.ADD && (
            <TransactionForm 
              onAddTransaction={addTransaction}
              onAddTransactions={addTransactions} 
              onUpdateTransaction={updateTransaction}
              onCancel={handleCancelForm}
              initialData={editingTransaction}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
