import { Button } from '@/components/ui/button';
import { Bot, Loader2, MessageCircle, Send, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as aiAPI from '../api/ai';

/**
 * AI Chatbot Floating Widget
 * @param {Object} props
 * @param {string} [props.eventId] - ID sự kiện để lấy context
 * @param {string} [props.orderId] - ID đơn hàng để lấy context
 */
const AIChatbot = ({ eventId, orderId }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAvailable, setIsAvailable] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Scroll to bottom khi có message mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input khi mở chatbot
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Kiểm tra AI status khi component mount
    useEffect(() => {
        const checkAI = async () => {
            try {
                const status = await aiAPI.checkStatus();
                setIsAvailable(status.available);
            } catch (error) {
                console.log('AI service check failed:', error);
                setIsAvailable(true); // Assume available, will show error when chat fails
            }
        };
        checkAI();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await aiAPI.chat({
                message: userMessage.content,
                event_id: eventId,
                order_id: orderId,
            });

            const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: error.status === 429
                    ? t('chatbot.rateLimit', 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi 1 phút.')
                    : t('chatbot.error', 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại sau.'),
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                    isOpen 
                        ? 'bg-gray-600 hover:bg-gray-700' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <MessageCircle className="w-6 h-6 text-white" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[380px] h-[520px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{t('chatbot.title', 'Trợ lý AI')}</h3>
                                <p className="text-xs text-white/80">
                                    {isAvailable 
                                        ? t('chatbot.online', 'Trực tuyến') 
                                        : t('chatbot.unavailable', 'Đang bảo trì')
                                    }
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                        {messages.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-muted-foreground text-sm">
                                    {t('chatbot.welcome', 'Xin chào! Tôi có thể giúp gì cho bạn?')}
                                </p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {[
                                        t('chatbot.suggestion1', 'Sự kiện diễn ra ở đâu?'),
                                        t('chatbot.suggestion2', 'Làm sao để mua vé?'),
                                        t('chatbot.suggestion3', 'Chính sách hoàn tiền?'),
                                    ].map((suggestion, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                setInput(suggestion);
                                                inputRef.current?.focus();
                                            }}
                                            className="text-xs px-3 py-1.5 rounded-full bg-background border border-border hover:border-primary hover:text-primary transition-colors"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <User className="w-4 h-4" />
                                    ) : (
                                        <Bot className="w-4 h-4" />
                                    )}
                                </div>
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                            : msg.isError 
                                                ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm'
                                                : 'bg-background border border-border rounded-tl-sm'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-background border border-border px-4 py-3 rounded-2xl rounded-tl-sm">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('chatbot.loading', 'Đang trả lời...')}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border bg-background">
                        {!isAvailable ? (
                            <div className="text-center text-sm text-muted-foreground py-2">
                                {t('chatbot.unavailable', 'AI đang bảo trì. Vui lòng thử lại sau.')}
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('chatbot.placeholder', 'Nhập tin nhắn...')}
                                    className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                    disabled={loading}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    size="icon"
                                    className="rounded-full w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;
