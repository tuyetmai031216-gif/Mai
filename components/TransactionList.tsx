
import React, { useState } from 'react';
import { Transaction } from '../types';
import { Trash2, ArrowUpRight, ArrowDownRight, PiggyBank, Pencil, Trash, AlertTriangle, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDeleteAll: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, onDeleteAll }) => {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sort by date descending
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getTypeIcon = (type: string) => {
    if (type === 'income') return <ArrowUpRight size={14} className="text-emerald-500" />;
    if (type === 'saving') return <PiggyBank size={14} className="text-purple-500" />;
    return <ArrowDownRight size={14} className="text-red-500" />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'income') return 'text-emerald-600';
    if (type === 'saving') return 'text-purple-600';
    return 'text-slate-700';
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const handleConfirmDeleteAll = () => {
    onDeleteAll();
    setShowDeleteAllConfirm(false);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            Giao dịch gần đây 
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">{transactions.length}</span>
          </h3>
          
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-sm active:scale-95 bg-white text-red-600 border-red-100 hover:bg-red-50"
            >
              <Trash size={14} />
              Xoá tất cả
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Ngày</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Danh mục</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase">Mô tả</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-right">Số tiền</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                    <td className="py-3 px-6 text-sm text-slate-600">{formatDate(t.date)}</td>
                    <td className="py-3 px-6 text-sm">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                        ${t.type === 'saving' ? 'bg-purple-100 text-purple-700' : 
                          t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-slate-800 font-medium">{t.description}</td>
                    <td className={`py-3 px-6 text-sm font-bold text-right flex items-center justify-end gap-1 ${getTypeColor(t.type)}`}>
                       {getTypeIcon(t.type)}
                       {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(t);
                          }}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-blue-50"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(t.id);
                          }}
                          className="text-slate-400 hover:text-red-600 transition-colors p-2 rounded-md hover:bg-red-50"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Verification Popup (Modal) for Single Item */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded-full">
                      <AlertTriangle size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">Xác nhận xoá?</h3>
                </div>
                <button 
                  onClick={() => setDeleteId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
             </div>
             
             <p className="text-slate-600 mb-6 ml-1">
               Bạn có chắc chắn muốn xoá giao dịch này không? Hành động này không thể hoàn tác.
             </p>
             
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteId(null)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Huỷ
                </button>
                <button 
                  onClick={handleConfirmDelete} 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-200"
                >
                  Xoá giao dịch
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Delete Verification Popup (Modal) for ALL Items */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded-full">
                      <AlertTriangle size={24} />
                   </div>
                   <h3 className="text-lg font-bold text-slate-800">Xoá tất cả dữ liệu?</h3>
                </div>
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
             </div>
             
             <p className="text-slate-600 mb-6 ml-1">
               Bạn có chắc chắn muốn xoá <b>tất cả {transactions.length} giao dịch</b> không? 
               <br/><br/>
               <span className="text-red-500 font-medium">Cảnh báo: Tất cả dữ liệu sẽ bị mất vĩnh viễn và không thể khôi phục.</span>
             </p>
             
             <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Huỷ
                </button>
                <button 
                  onClick={handleConfirmDeleteAll} 
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-200"
                >
                  Xoá tất cả
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
