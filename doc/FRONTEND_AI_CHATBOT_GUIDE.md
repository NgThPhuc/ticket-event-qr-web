# 🤖 AI Chatbot - Hướng Dẫn Tích Hợp Frontend

## Tổng Quan

Backend đã tích hợp AI Chatbot sử dụng Google Gemini để hỗ trợ người dùng tra cứu thông tin sự kiện, đặt vé, hoàn tiền.

---

## API Endpoints

### 1. Chat với AI

```http
POST /ai/chat
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Mô tả |
|-------|------|----------|-------|
| `message` | string | ✅ | Tin nhắn từ người dùng |
| `event_id` | string (UUID) | ❌ | ID sự kiện để lấy context |
| `order_id` | string (UUID) | ❌ | ID đơn hàng để lấy context |

#### Ví dụ Request

```json
{
  "message": "Sự kiện này diễn ra ở đâu?",
  "event_id": "9e4c98d7-edf5-438b-830e-c20e27db9b37"
}
```

#### Response (200 OK)

```json
{
  "response": "Sự kiện \"Concert ABC\" sẽ diễn ra tại Nhà hát Lớn, 123 Đường XYZ, Quận 1, TP.HCM vào ngày 15/01/2025 lúc 19:00.",
  "context": {
    "event": {
      "id": "9e4c98d7-edf5-438b-830e-c20e27db9b37",
      "title": "Concert ABC"
    }
  }
}
```

#### Lỗi có thể xảy ra

| Status | Mô tả |
|--------|-------|
| 400 | `message` trống hoặc không hợp lệ |
| 429 | Quá nhiều request (> 10 msg/phút) |

---

### 2. Kiểm tra trạng thái AI

```http
GET /ai/status
```

#### Response (200 OK)

```json
{
  "available": true,
  "model": "gemini-1.5-flash-latest"
}
```

> ⚠️ Nếu `available: false`, hiển thị thông báo "AI đang bảo trì" và disable input.

---

## Tích Hợp React

### 1. API Service

```typescript
// src/services/aiService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ChatRequest {
  message: string;
  event_id?: string;
  order_id?: string;
}

export interface ChatResponse {
  response: string;
  context?: {
    event?: { id: string; title: string };
    order?: { id: string; order_number: string };
  };
}

export const aiService = {
  // Gửi tin nhắn chat
  async chat(data: ChatRequest): Promise<ChatResponse> {
    const res = await axios.post(`${API_URL}/ai/chat`, data);
    return res.data;
  },

  // Kiểm tra AI có sẵn sàng không
  async checkStatus(): Promise<{ available: boolean; model: string }> {
    const res = await axios.get(`${API_URL}/ai/status`);
    return res.data;
  },
};
```

### 2. Chat Component

```tsx
// src/components/AIChatbot.tsx
import { useState, useRef, useEffect } from 'react';
import { aiService, ChatResponse } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  eventId?: string;  // Truyền vào nếu đang ở trang event detail
  orderId?: string;  // Truyền vào nếu đang ở trang order detail
}

export function AIChatbot({ eventId, orderId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom khi có message mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiService.chat({
        message: input,
        event_id: eventId,
        order_id: orderId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.response?.status === 429
          ? 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.'
          : 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-50">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <span className="font-semibold">🤖 Trợ lý AI</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-500 text-center">
                Xin chào! Tôi có thể giúp gì cho bạn?
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-blue-100 ml-auto'
                    : 'bg-gray-100'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-100 p-3 rounded-lg">
                <span className="animate-pulse">Đang trả lời...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

### 3. Sử dụng Component

```tsx
// Trong App.tsx hoặc Layout
import { AIChatbot } from './components/AIChatbot';

function App() {
  return (
    <>
      {/* ... other components */}
      <AIChatbot />
    </>
  );
}

// Trong EventDetail.tsx - có context event
function EventDetail({ eventId }: { eventId: string }) {
  return (
    <>
      {/* Event content */}
      <AIChatbot eventId={eventId} />
    </>
  );
}
```

---

## Các Câu Hỏi AI Có Thể Trả Lời

| Loại | Ví dụ |
|------|-------|
| **Thông tin sự kiện** | "Sự kiện này diễn ra lúc nào?", "Địa điểm ở đâu?" |
| **Hướng dẫn mua vé** | "Làm sao để mua vé?", "Thanh toán bằng gì?" |
| **Tra cứu đơn hàng** | "Đơn hàng của tôi trạng thái gì?" (cần order_id) |
| **Hoàn tiền** | "Chính sách hoàn tiền thế nào?" |
| **Check-in** | "Check-in như thế nào?", "QR code ở đâu?" |

---

## Rate Limiting

- **Giới hạn**: 10 tin nhắn / phút / IP
- **Khi bị limit**: API trả về `429 Too Many Requests`
- **Xử lý**: Hiển thị thông báo và disable input trong 60 giây

---

## Lưu Ý

1. **Không cần authentication** - Endpoint `/ai/chat` là public
2. **Context tự động** - Nếu không truyền `event_id`, AI sẽ lấy danh sách events sắp diễn ra
3. **Fallback** - Nếu AI service lỗi, response sẽ là thông báo lỗi (không throw exception)
