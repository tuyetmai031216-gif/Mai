
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Transaction, SummaryStats, getExpenseGroup, TimeRange } from '../types';
import { StatsCards } from './StatsCards';
import { analyzeFinances } from '../services/geminiService';
import { BrainCircuit, Loader2, ShieldCheck, ShoppingBag, Filter, Calendar } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
}

const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];
const ESSENTIAL_COLOR = '#f43f5e'; // Rose
const VARIABLE_COLOR = '#3b82f6'; // Blue

type PeriodFilter = 'all' | 'this_year' | 'this_month' | 'last_month' | 'custom';

export const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [filter, setFilter] = useState<PeriodFilter>('all');
  
  // Custom range state
  const [customFromDate, setCustomFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  const [customToDate, setCustomToDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // Default to today
  });

  // Filter transactions based on selected Period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      
      if (filter === 'custom') {
        return t.date >= customFromDate && t.date <= customToDate;
      }

      if (filter === 'this_month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filter === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      }
      if (filter === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, filter, customFromDate, customToDate]);

  // Handle filter change with auto-granularity
  const handleFilterChange = (newFilter: PeriodFilter) => {
    setFilter(newFilter);
    // Auto adjust time range for better UX
    if (newFilter === 'this_month' || newFilter === 'last_month' || newFilter === 'custom') {
      setTimeRange('day');
    } else {
      setTimeRange('month');
    }
  };

  // 1. Calculate General Stats using FILTERED data
  const stats: SummaryStats = useMemo(() => {
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalSaving = filteredTransactions.filter(t => t.type === 'saving').reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense - totalSaving;
    const savingsRate = totalIncome > 0 ? (totalSaving / totalIncome) * 100 : 0;
    
    return { totalIncome, totalExpense, totalSaving, balance, savingsRate };
  }, [filteredTransactions]);

  // 2. Calculate Expense Breakdown Data using FILTERED data
  const expenseData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    let essentialTotal = 0;
    let variableTotal = 0;
    const essentialCats: Record<string, number> = {};
    const variableCats: Record<string, number> = {};

    expenses.forEach(t => {
      const group = getExpenseGroup(t.category);
      if (group === 'Thiết yếu') {
        essentialTotal += t.amount;
        essentialCats[t.category] = (essentialCats[t.category] || 0) + t.amount;
      } else {
        variableTotal += t.amount;
        variableCats[t.category] = (variableCats[t.category] || 0) + t.amount;
      }
    });

    const essentialChartData = Object.entries(essentialCats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const variableChartData = Object.entries(variableCats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = essentialTotal + variableTotal;

    return {
      overview: [
        { name: 'Thiết yếu', value: essentialTotal, fill: ESSENTIAL_COLOR },
        { name: 'Thay đổi', value: variableTotal, fill: VARIABLE_COLOR }
      ],
      essentialBreakdown: essentialChartData,
      variableBreakdown: variableChartData,
      totals: { essential: essentialTotal, variable: variableTotal, total }
    };
  }, [filteredTransactions]);

  // 3. Monthly/Daily/Yearly Data for Main Bar Chart (Fluctuations)
  const chartData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number; saving: number }> = {};
    
    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      let key = '';
      let label = '';

      if (timeRange === 'day') {
         // Only limit to 30 days if we are looking at ALL history. 
         // If we are looking at a specific month or custom range, show all relevant days.
         if (filter === 'all' || filter === 'this_year') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (d < thirtyDaysAgo) return;
         }
         
         key = t.date;
         label = `${d.getDate()}/${d.getMonth() + 1}`;
      } else if (timeRange === 'year') {
         key = d.getFullYear().toString();
         label = key;
      } else {
         key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
         label = `${d.getMonth() + 1}/${d.getFullYear()}`;
      }

      if (!data[key]) {
        data[key] = { name: label, income: 0, expense: 0, saving: 0 };
      }
      if (t.type === 'income') data[key].income += t.amount;
      else if (t.type === 'expense') data[key].expense += t.amount;
      else if (t.type === 'saving') data[key].saving += t.amount;
    });

    return Object.values(data).sort((a, b) => {
         if (a.name.includes('/')) {
             const [p1, p2] = a.name.split('/').map(Number);
             const [p3, p4] = b.name.split('/').map(Number);
             if (p2 !== p4) return p2 - p4;
             return p1 - p3;
         }
         return parseInt(a.name) - parseInt(b.name);
    });
  }, [filteredTransactions, timeRange, filter]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const result = await analyzeFinances(filteredTransactions); // Analyze current view
    setAdvice(result);
    setAnalyzing(false);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatCurrencyShort = (val: number) => {
    if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
    if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Filters & View Controls */}
      <div className="flex flex-col gap-4">
         <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
             {/* Period Filter */}
             <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-1 whitespace-nowrap mr-2">
                  <Filter size={16} /> Thời gian:
                </span>
                
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'this_year', label: 'Năm nay' },
                  { id: 'this_month', label: 'Tháng này' },
                  { id: 'last_month', label: 'Tháng trước' },
                  { id: 'custom', label: 'Tùy chọn' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleFilterChange(opt.id as PeriodFilter)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                      filter === opt.id 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>

             {/* Granularity Toggle */}
             <div className="bg-slate-200 p-1 rounded-lg inline-flex self-start md:self-auto">
                <button 
                  onClick={() => setTimeRange('day')}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${timeRange === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Ngày
                </button>
                <button 
                  onClick={() => setTimeRange('month')}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${timeRange === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tháng
                </button>
                <button 
                  onClick={() => setTimeRange('year')}
                  className={`px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${timeRange === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Năm
                </button>
             </div>
         </div>

         {/* Custom Date Inputs - Only visible when custom filter selected */}
         {filter === 'custom' && (
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm w-fit animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Từ ngày</span>
                    <input 
                      type="date" 
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    />
                </div>
                <div className="w-4 h-[1px] bg-slate-300"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Đến ngày</span>
                    <input 
                      type="date" 
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    />
                </div>
            </div>
         )}
      </div>

      {/* 1. Key Metrics Cards */}
      <StatsCards stats={stats} transactions={filteredTransactions} timeRange={timeRange} />

      {/* 2. Fluctuation Chart */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
            Biến động dòng tiền
          </h3>
        </div>
        
        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrencyShort} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle"/>
                <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} barSize={timeRange === 'day' ? 8 : 24}/>
                <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={timeRange === 'day' ? 8 : 24}/>
                <Bar dataKey="saving" name="Tiết kiệm" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={timeRange === 'day' ? 8 : 24}/>
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
              Chưa có dữ liệu biến động
            </div>
          )}
        </div>
      </div>

      {/* 3. Combined Expense Analysis */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
          Phân tích chi tiêu
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Overview Bar Chart (Fixed vs Variable) - Spans 4 cols */}
          <div className="lg:col-span-4 flex flex-col">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 text-center">Tổng quan</h4>
            <div className="flex-1 min-h-[250px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
               {expenseData.totals.total > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={expenseData.overview} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={14} fontWeight={500} tickLine={false} axisLine={false} dy={10} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                        {expenseData.overview.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400">Chưa có dữ liệu</div>
               )}
            </div>
          </div>

          {/* Right: Detailed Breakdown - Spans 8 cols */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Essential/Fixed Breakdown */}
            <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-rose-100 pb-2">
                 <ShieldCheck size={18} className="text-rose-500"/>
                 <span className="font-bold text-rose-800">Chi phí Thiết yếu</span>
                 <span className="ml-auto text-sm font-semibold text-rose-600">{formatCurrency(expenseData.totals.essential)}</span>
              </div>
              <div className="flex-1 flex items-center">
                 <div className="w-1/2 h-[150px]">
                    {expenseData.essentialBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData.essentialBreakdown}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expenseData.essentialBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-xs text-rose-400">Trống</div>
                    )}
                 </div>
                 <div className="w-1/2 pl-2">
                    <ul className="text-xs space-y-1">
                      {expenseData.essentialBreakdown.slice(0, 5).map((entry, index) => (
                        <li key={index} className="flex justify-between items-center text-rose-900">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                            <span className="truncate">{entry.name}</span>
                          </div>
                          <span className="font-medium">{((entry.value / expenseData.totals.essential) * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>
            </div>

            {/* Variable Breakdown */}
            <div className="bg-blue-50/50 rounded-2xl p-5 border border-blue-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4 border-b border-blue-100 pb-2">
                 <ShoppingBag size={18} className="text-blue-500"/>
                 <span className="font-bold text-blue-800">Chi phí Thay đổi</span>
                 <span className="ml-auto text-sm font-semibold text-blue-600">{formatCurrency(expenseData.totals.variable)}</span>
              </div>
              <div className="flex-1 flex items-center">
                 <div className="w-1/2 h-[150px]">
                    {expenseData.variableBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseData.variableBreakdown}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {expenseData.variableBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-blue-400">Trống</div>
                    )}
                 </div>
                 <div className="w-1/2 pl-2">
                    <ul className="text-xs space-y-1">
                      {expenseData.variableBreakdown.slice(0, 5).map((entry, index) => (
                        <li key={index} className="flex justify-between items-center text-blue-900">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                            <span className="truncate">{entry.name}</span>
                          </div>
                          <span className="font-medium">{((entry.value / expenseData.totals.variable) * 100).toFixed(0)}%</span>
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 4. AI Analysis */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl shadow-sm border border-indigo-100">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
            <BrainCircuit className="text-indigo-600" />
            AI Phân Tích & Tư Vấn
          </h3>
          <button 
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-indigo-200 shadow-lg flex items-center gap-2 disabled:opacity-70"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : 'Phân tích ngay'}
          </button>
        </div>
        
        {advice ? (
          <div className="prose prose-sm prose-indigo max-w-none bg-white/60 p-5 rounded-2xl border border-indigo-100/50">
             <div className="whitespace-pre-wrap leading-relaxed text-slate-700">{advice}</div>
          </div>
        ) : (
          <p className="text-slate-500 text-sm bg-white/60 p-5 rounded-2xl border border-indigo-100/50">
            Nhấn nút "Phân tích ngay" để AI xem xét dữ liệu chi tiêu và đưa ra lời khuyên tài chính cá nhân hóa cho bạn.
          </p>
        )}
      </div>

    </div>
  );
};
