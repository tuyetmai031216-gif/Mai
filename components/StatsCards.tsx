import React, { useMemo } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, PiggyBank } from 'lucide-react';
import { SummaryStats, Transaction, TimeRange } from '../types';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface StatsCardsProps {
  stats: SummaryStats;
  transactions: Transaction[];
  timeRange: TimeRange;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
};

// Helper to fill missing dates for smooth charts
const fillMissingDates = (data: any[], timeRange: TimeRange) => {
  if (data.length === 0) return [];
  // For simplicity in this demo, we return sorted data. 
  // In a production app, we would loop through date ranges to fill 0 values.
  return data.sort((a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime());
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, transactions, timeRange }) => {

  // Process data for sparklines based on TimeRange
  const trendData = useMemo(() => {
    const grouped: Record<string, { income: number, expense: number, saving: number, balance: number, dateKey: string }> = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      let key = '';
      
      if (timeRange === 'day') {
        key = t.date; // YYYY-MM-DD
      } else if (timeRange === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; // YYYY-MM-01
      } else {
        key = `${d.getFullYear()}-01-01`; // YYYY-01-01
      }

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0, saving: 0, balance: 0, dateKey: key };
      }

      if (t.type === 'income') grouped[key].income += t.amount;
      else if (t.type === 'expense') grouped[key].expense += t.amount;
      else if (t.type === 'saving') grouped[key].saving += t.amount;
    });

    // Calculate balance for each point and convert to array
    let data = Object.values(grouped).map(item => ({
      ...item,
      balance: item.income - item.expense - item.saving
    }));

    return fillMissingDates(data, timeRange);
  }, [transactions, timeRange]);

  const renderSparkline = (dataKey: string, color: string, id: string) => (
    <div className="h-16 w-full -mb-5 -ml-5 absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-2xl">
      <ResponsiveContainer width="115%" height="100%">
        <AreaChart data={trendData}>
          <defs>
            <linearGradient id={`color${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip cursor={false} content={<></>} />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2} 
            fillOpacity={1} 
            fill={`url(#color${id})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Income Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <ArrowUpCircle size={20} />
            </div>
            <span className="text-sm text-slate-500 font-medium">Tổng thu nhập</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalIncome)}</p>
        </div>
        {renderSparkline('income', '#10b981', 'Income')}
      </div>

      {/* Expense Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <ArrowDownCircle size={20} />
            </div>
            <span className="text-sm text-slate-500 font-medium">Tổng chi tiêu</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalExpense)}</p>
        </div>
        {renderSparkline('expense', '#ef4444', 'Expense')}
      </div>

      {/* Saving Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <PiggyBank size={20} />
            </div>
            <span className="text-sm text-slate-500 font-medium">Đã tiết kiệm</span>
          </div>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.totalSaving)}</p>
        </div>
        {renderSparkline('saving', '#8b5cf6', 'Saving')}
      </div>

      {/* Balance Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Wallet size={20} />
            </div>
            <span className="text-sm text-slate-500 font-medium">Còn dư</span>
          </div>
          <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
            {formatCurrency(stats.balance)}
          </p>
        </div>
        {renderSparkline('balance', '#3b82f6', 'Balance')}
      </div>
    </div>
  );
};