
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Sparkles, Loader2, X, Image as ImageIcon, Camera, Save } from 'lucide-react';
import { Transaction, TransactionType, CATEGORIES } from '../types';
import { parseTransactionInput } from '../services/geminiService';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface TransactionFormProps {
  onAddTransaction: (transaction: Transaction) => void;
  onAddTransactions?: (transactions: Transaction[]) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  onCancel: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  onAddTransaction, 
  onAddTransactions,
  onUpdateTransaction,
  onCancel, 
  initialData 
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  
  // AI Form State
  const [aiInput, setAiInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [description, setDescription] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setActiveTab('manual');
      setDate(initialData.date);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setDescription(initialData.description);
    }
  }, [initialData]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const transactionData: Transaction = {
      id: initialData ? initialData.id : generateId(),
      date,
      amount: parseFloat(amount),
      type,
      category,
      description
    };

    if (initialData && onUpdateTransaction) {
      onUpdateTransaction(transactionData);
    } else {
      onAddTransaction(transactionData);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract raw base64 (remove data:image/xxx;base64, prefix)
        const base64Data = base64String.split(',')[1];
        setSelectedImage(base64Data);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() && !selectedImage) return;

    setLoading(true);
    try {
      const results = await parseTransactionInput(aiInput, selectedImage || undefined, imageMimeType || undefined);
      
      if (results && results.length > 0) {
        // Process each result
        const newTransactions: Transaction[] = results.map(result => ({
          id: generateId(),
          date: result.date || new Date().toISOString().split('T')[0],
          amount: result.amount || 0,
          type: (result.type as TransactionType) || 'expense',
          category: result.category || 'Khác',
          description: result.description || (aiInput ? aiInput : 'Giao dịch từ hình ảnh')
        }));

        if (newTransactions.length > 0) {
           if (newTransactions.length > 1 && onAddTransactions) {
             onAddTransactions(newTransactions);
           } else {
             onAddTransaction(newTransactions[0]);
           }
        }
      } else {
        alert("AI không thể hiểu nội dung này hoặc không tìm thấy giao dịch nào. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối AI.");
    } finally {
      setLoading(false);
      setAiInput('');
      setSelectedImage(null);
      setImageMimeType(null);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (initialData && initialData.type === newType) {
        setCategory(initialData.category);
    } else {
        setCategory(CATEGORIES[newType][0]);
    }
  };

  const isEditing = !!initialData;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto">
      <div className="flex border-b border-slate-100">
        <button
          className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('manual')}
        >
          {isEditing ? 'Cập Nhật Giao Dịch' : 'Nhập Thủ Công'}
        </button>
        {!isEditing && (
          <button
            className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white text-purple-600 border-b-2 border-purple-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={16} />
            Nhập Thông Minh (AI)
          </button>
        )}
      </div>

      <div className="p-6">
        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                <div className="flex rounded-md shadow-sm h-10">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('expense')}
                    className={`flex-1 text-xs sm:text-sm font-medium rounded-l-md border transition-colors ${type === 'expense' ? 'bg-red-50 text-red-700 border-red-200 z-10' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    Chi tiêu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('income')}
                    className={`flex-1 text-xs sm:text-sm font-medium border-t border-b border-l-0 border-r-0 transition-colors ${type === 'income' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 z-10' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    Thu nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('saving')}
                    className={`flex-1 text-xs sm:text-sm font-medium rounded-r-md border transition-colors ${type === 'saving' ? 'bg-purple-50 text-purple-700 border-purple-200 z-10' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                  >
                    Tiết kiệm
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền (VND)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
              <input
                type="text"
                required
                placeholder={type === 'saving' ? "Gửi tiết kiệm tháng này" : "Ví dụ: Ăn trưa"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-colors flex items-center ${
                  isEditing ? 'bg-blue-600' :
                  type === 'income' ? 'bg-emerald-600' : type === 'expense' ? 'bg-red-600' : 'bg-purple-600'
                }`}
              >
                {isEditing ? <Save size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
                {isEditing ? 'Cập nhật' : 'Thêm giao dịch'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAiSubmit} className="space-y-4">
             <div className="bg-purple-50 p-4 rounded-lg text-sm text-purple-800 mb-4">
              <p className="font-semibold flex items-center gap-2">
                <Sparkles size={14} /> Mẹo AI
              </p>
              <p>Chụp ảnh hóa đơn hoặc nhập tự nhiên: "Ăn phở 45k", "Lương 20 triệu"...</p>
              <p className="text-xs text-purple-600 mt-1">* Hỗ trợ tách nhiều giao dịch từ một ảnh sao kê/hóa đơn.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nhập nội dung</label>
                  <textarea
                    rows={4}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ví dụ: Đã chuyển 500k tiền điện..."
                    className="w-full h-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh (Hóa đơn/Screenhot)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />
                  
                  {!selectedImage ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-purple-300 hover:text-purple-500 transition-all cursor-pointer"
                    >
                      <Camera size={24} className="mb-2" />
                      <span className="text-xs">Chạm để tải ảnh lên</span>
                    </div>
                  ) : (
                    <div className="relative w-full h-32 rounded-lg border border-slate-200 overflow-hidden group">
                       <img 
                          src={`data:${imageMimeType};base64,${selectedImage}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(null);
                              setImageMimeType(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm"
                          >
                             <X size={20} />
                          </button>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
               <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || (!aiInput && !selectedImage)}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Sparkles size={16} className="mr-1" />}
                {loading ? 'Đang phân tích...' : 'Phân tích & Thêm'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
