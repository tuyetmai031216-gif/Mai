
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelName = 'gemini-2.5-flash';

// Define schema for smart transaction parsing (Array of transactions)
const transactionListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "Số tiền giao dịch (VND)" },
      type: { 
        type: Type.STRING, 
        enum: ["income", "expense", "saving"], 
        description: "Loại giao dịch: 'income' (thu nhập), 'expense' (chi tiêu), 'saving' (tiết kiệm/đầu tư)" 
      },
      category: { type: Type.STRING, description: "Danh mục. Chi tiêu thiết yếu: 'Nhà', 'Ăn', 'Đi lại'. Chi tiêu thay đổi: 'Ăn uống', 'Mỹ phẩm', 'Khác'." },
      description: { type: Type.STRING, description: "Mô tả ngắn gọn về giao dịch" },
      date: { type: Type.STRING, description: "Ngày giao dịch định dạng YYYY-MM-DD. Nếu không rõ, dùng ngày hiện tại." }
    },
    required: ["amount", "type", "category", "description", "date"]
  }
};

export const parseTransactionInput = async (input: string, imageBase64?: string, imageMimeType?: string): Promise<Partial<Transaction>[] | null> => {
  if (!apiKey) {
    console.warn("API Key is missing");
    return null;
  }

  try {
    const parts: any[] = [];
    
    // Add image if present
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType
        }
      });
    }

    // Add text prompt
    parts.push({
      text: `Phân tích dữ liệu tài chính (từ văn bản hoặc ảnh chụp màn hình/hóa đơn/sao kê). 
      Hãy trích xuất TẤT CẢ các giao dịch tìm thấy trong nội dung.
      Mặc định đơn vị là VND. Hôm nay là ${new Date().toISOString().split('T')[0]}.
      Lưu ý: 
      - Nếu nội dung là 'tiết kiệm', 'để dành', 'mua vàng', 'đầu tư' hãy set type là 'saving'.
      - Nếu là ảnh chuyển khoản hoặc sao kê ngân hàng, hãy tìm từng dòng giao dịch bao gồm số tiền, nội dung và ngày tháng.
      - Ưu tiên sử dụng các danh mục: Nhà, Ăn, Đi lại, Ăn uống, Mỹ phẩm, Khác. Lưu ý: 'Ăn' là đi chợ nấu ăn, 'Ăn uống' là đi ăn ngoài.
      Input text bổ sung: "${input}"`
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionListSchema,
        systemInstruction: "Bạn là trợ lý tài chính. Hãy trích xuất danh sách giao dịch chính xác từ text hoặc hình ảnh. Nếu số tiền hiển thị dạng 50k, 50.000, 50,000 thì đều là 50000. Nếu không rõ danh mục, hãy đoán dựa trên ngữ cảnh.",
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini parse error:", error);
    return null;
  }
};

export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
  if (!apiKey) return "Vui lòng cấu hình API Key để sử dụng tính năng phân tích AI.";
  
  if (transactions.length === 0) return "Chưa có dữ liệu giao dịch để phân tích.";

  // Simplify data for token efficiency
  const summary = transactions.slice(-50).map(t => {
    let sign = '-';
    if (t.type === 'income') sign = '+';
    if (t.type === 'saving') sign = '-> (Save)';
    return `${t.date}: ${sign} ${t.amount} (${t.category}) - ${t.description}`;
  }).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using flash for speed/cost balance on larger context
      contents: `Đây là lịch sử giao dịch gần đây của tôi:\n${summary}\n\nHãy đóng vai chuyên gia tài chính cá nhân. Hãy phân tích dòng tiền (biến động thu chi và tiết kiệm), đưa ra nhận xét về tỷ lệ tiết kiệm (saving), so sánh chi tiêu thiết yếu (Nhà, Ăn, Đi lại) vs thay đổi (Ăn uống, Mỹ phẩm, Khác), cảnh báo nếu chi tiêu quá đà và đưa ra lời khuyên cụ thể để tối ưu hóa tài chính bằng Tiếng Việt. Sử dụng định dạng Markdown.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster advice
      }
    });

    return response.text || "Không thể tạo phân tích lúc này.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Đã xảy ra lỗi khi phân tích dữ liệu.";
  }
};
