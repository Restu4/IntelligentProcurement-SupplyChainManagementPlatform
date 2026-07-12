"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, Plus, MessageSquare, Clock, Trash2, X } from "lucide-react";
import { ChatMessage } from "@/components/chat/chat-message";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { document: string; chunk: string; score: number }[];
  confidence?: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const suggestions = [
  "Who is the best supplier?",
  "What are the procurement approval limits?",
  "What is the SLA for delivery?",
  "What penalties apply for late delivery?",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hello! I'm **SmartProcure AI**, your intelligent procurement assistant.\n\nI can help you with:\n- Supplier evaluation and risk analysis\n- Procurement policies and SOP\n- Contract guidelines and SLA\n- Budget and forecast insights\n\nAsk me anything about your procurement data!",
};

function getMockAnswer(question: string): Message {
  const q = question.toLowerCase();

  if (q.includes("best supplier") || q.includes("best") || q.includes("rekomendasi")) {
    return {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "Berdasarkan analisis data procurement kami, **PT Surya Pratama** merupakan supplier terbaik saat ini:\n\n- **Kualitas Produk**: Skor 95/100\n- **Ketepatan Waktu**: Rata-rata pengiriman 2 hari lebih cepat dari SLA\n- **Harga Kompetitif**: 8-12% di bawah rata-rata pasar\n- **Rating Kepuasan**: 4.8/5 dari 156 transaksi\n\nRekomendasi lain:\n1. PT Maju Bersama — unggul kategori elektronik\n2. CV Teknik Sejahtera — terbaik untuk spare parts industri",
      sources: [{ document: "supplier-evaluation-2024.pdf", chunk: "Supplier performance ranking Q4 2024", score: 0.94 }], confidence: 93,
    };
  }

  if (q.includes("approval") || q.includes("otorisasi") || q.includes("limit")) {
    return {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "Batasan otorisasi approval procurement sesuai **SOP Procurement No. 003/2024**:\n\n| Nilai PO | Approver |\n|----------|----------|\n| < Rp 50 juta | Manager Procurement |\n| Rp 50 juta - Rp 500 juta | Direktur Operasional |\n| Rp 500 juta - Rp 2 miliar | Direktur Utama |\n| > Rp 2 miliar | Rapat Direksi |",
      sources: [{ document: "SOP-Procurement-2024.pdf", chunk: "Approval limits", score: 0.96 }], confidence: 95,
    };
  }

  if (q.includes("sla") || q.includes("delivery") || q.includes("pengiriman")) {
    return {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "Standar SLA pengiriman per kategori barang:\n\n- **Raw Material**: Maksimal 7 hari kerja\n- **MRO**: Maksimal 14 hari kerja\n- **Peralatan Kantor**: Maksimal 21 hari kerja\n- **Mesin Industri**: Maksimal 30 hari kerja\n\nMonitoring: Auto-notifikasi H-3, escalation otomatis jika terlambat > 2 hari.",
      sources: [{ document: "SLA-Procurement-Policy.pdf", chunk: "Delivery SLA standards", score: 0.97 }], confidence: 92,
    };
  }

  if (q.includes("penalty") || q.includes("late") || q.includes("terlambat") || q.includes("denda")) {
    return {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "Sanksi keterlambatan pengiriman:\n\n| Keterlambatan | Sanksi |\n|---------------|--------|\n| 1-3 hari | Denda 0.5% dari nilai PO |\n| 4-7 hari | Denda 1% + Teguran tertulis |\n| 8-14 hari | Denda 2% + Blacklist warning |\n| > 14 hari | Denda 5% + Blacklist permanen |",
      sources: [{ document: "Master-Contract-Template.pdf", chunk: "Penalty clauses", score: 0.95 }], confidence: 91,
    };
  }

  if (q.includes("budget") || q.includes("anggaran") || q.includes("alokasi")) {
    return {
      id: (Date.now() + 1).toString(), role: "assistant",
      content: "Alokasi budget procurement Q3 2024:\n\n**Total: Rp 45.2 Miliar**\n\n| Kategori | Alokasi |\n|----------|---------|\n| Raw Material | Rp 22.6 Miliar (50%) |\n| MRO & Spare Parts | Rp 9.04 Miliar (20%) |\n| Peralatan & Mesin | Rp 6.78 Miliar (15%) |\n| Jasa & Konsultan | Rp 4.52 Miliar (10%) |",
      sources: [{ document: "Budget-Allocation-Q3-2024.xlsx", chunk: "Budget distribution", score: 0.93 }], confidence: 88,
    };
  }

  return {
    id: (Date.now() + 1).toString(), role: "assistant",
    content: "Terima kasih! Sebagai SmartProcure AI, saya bisa membantu Anda dengan:\n\n- **SOP & Kebijakan Procurement**\n- **Database Supplier**\n- **Kontrak & SLA**\n- **Budget & Forecast**\n\nCoba tanyakan topik spesifik seperti \"Siapa supplier terbaik?\" atau \"Berapa limit approval?\"",
    sources: [{ document: "Knowledge-Base-Index.pdf", chunk: "Available topics", score: 0.85 }], confidence: 85,
  };
}

function getGreetingTitle(messages: Message[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "New Chat";
  const text = firstUserMsg.content;
  return text.length > 30 ? text.substring(0, 30) + "..." : text;
}

export default function AIAssistantPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question || input;
    if (!q.trim() || loading) return;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: q };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    if (!activeSessionId) {
      const sessionId = Date.now().toString();
      setActiveSessionId(sessionId);
      setSessions((prev) => [{ id: sessionId, title: getGreetingTitle(newMessages), messages: newMessages, createdAt: new Date() }, ...prev]);
    } else {
      setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? { ...s, messages: newMessages } : s)));
    }

    try {
      const res = await api.chat.send(q);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: res.answer, sources: res.sources, confidence: res.confidence };
      const updated = [...newMessages, assistantMessage];
      setMessages(updated);
      setSessions((prev) => prev.map((s) => (s.id === (activeSessionId || Date.now().toString())) ? { ...s, messages: updated } : s));
    } catch {
      const mockMessage = getMockAnswer(q);
      const updated = [...newMessages, mockMessage];
      setMessages(updated);
      setSessions((prev) => prev.map((s) => (s.id === (activeSessionId || Date.now().toString())) ? { ...s, messages: updated } : s));
    } finally { setLoading(false); }
  };

  const handleRegenerate = async (messageIndex: number) => {
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || userMessage.role !== "user") return;
    const truncated = messages.slice(0, messageIndex);
    setMessages(truncated);
    setLoading(true);
    try {
      const res = await api.chat.send(userMessage.content);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: res.answer, sources: res.sources, confidence: res.confidence };
      const updated = [...truncated, assistantMessage];
      setMessages(updated);
      setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? { ...s, messages: updated } : s)));
    } catch {
      const mockMessage = getMockAnswer(userMessage.content);
      const updated = [...truncated, mockMessage];
      setMessages(updated);
      setSessions((prev) => prev.map((s) => (s.id === activeSessionId ? { ...s, messages: updated } : s)));
    } finally { setLoading(false); }
  };

  const handleNewChat = () => { setMessages([WELCOME_MESSAGE]); setInput(""); setActiveSessionId(null); };

  const handleSelectSession = (session: ChatSession) => { setMessages(session.messages); setActiveSessionId(session.id); setInput(""); setShowHistory(false); };

  const handleDeleteSession = (sessionId: string) => { setSessions((prev) => prev.filter((s) => s.id !== sessionId)); if (activeSessionId === sessionId) handleNewChat(); };

  const formatTime = (date: Date) => date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-8rem)] gap-0">
      {/* Chat History Sidebar - overlay on mobile */}
      {showHistory && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setShowHistory(false)} />
      )}
      <div className={cn(
        "flex-shrink-0 border border-gray-200 dark:border-gray-700/50 rounded-2xl bg-white dark:bg-primary-900/50 transition-all duration-300 overflow-hidden flex flex-col",
        showHistory ? "w-72" : "w-0 border-0",
        // On mobile, make it overlay
        showHistory && "fixed left-4 top-20 z-50 w-64 h-[calc(100vh-6rem)] lg:relative lg:left-auto lg:top-auto lg:z-auto lg:h-auto"
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4" /> Chat History
          </h3>
          <button onClick={() => setShowHistory(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-2">No chat history yet.</p>
          ) : sessions.map((session) => (
            <div key={session.id} className={cn("group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-colors", activeSessionId === session.id ? "bg-secondary-500/10 border border-secondary-500/20" : "hover:bg-gray-100 dark:hover:bg-primary-800")} onClick={() => handleSelectSession(session)}>
              <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary-900 dark:text-white truncate">{session.title}</p>
                <p className="text-[10px] text-gray-400">{formatTime(session.createdAt)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <Trash2 className="w-3 h-3 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col ml-0 lg:ml-3 min-w-0">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button onClick={() => setShowHistory(!showHistory)} className={cn("p-2 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors shrink-0", showHistory ? "bg-gray-100 dark:bg-primary-800" : "hover:bg-gray-100 dark:hover:bg-primary-800")}>
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold text-primary-900 dark:text-white tracking-tight flex items-center gap-2">
                <Bot className="w-5 h-5 md:w-7 md:h-7 text-secondary-500 shrink-0" />
                <span className="truncate">AI Assistant</span>
              </h1>
            </div>
          </div>
          <button onClick={handleNewChat} className="btn-outline flex items-center gap-2 text-sm shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide border border-gray-200 dark:border-gray-700/50 rounded-2xl bg-white dark:bg-primary-900/50 p-3 md:p-4">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2 px-2 md:px-4 pt-2">
              {suggestions.map((s, idx) => (
                <button key={idx} onClick={() => handleSend(s)} className="px-3 md:px-4 py-2 text-xs md:text-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-primary-800 text-gray-600 dark:text-gray-300 transition-colors">
                  <Sparkles className="w-3 h-3 inline mr-1 text-secondary-500" />
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, idx) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} sources={msg.sources} confidence={msg.confidence}
              onRegenerate={msg.role === "assistant" && idx > 0 ? () => handleRegenerate(idx) : undefined} />
          ))}
          {loading && (
            <div className="flex gap-3 md:gap-4 py-6 chat-message-animation">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/20 shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-4 rounded-2xl bg-gray-100 dark:bg-primary-800/50 border border-gray-200 dark:border-gray-700/50">
                <span className="typing-dot w-2 h-2 bg-secondary-500 rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-secondary-500 rounded-full inline-block" />
                <span className="typing-dot w-2 h-2 bg-secondary-500 rounded-full inline-block" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 md:mt-4 flex gap-2 md:gap-3">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask SmartProcure AI..." className="input-field flex-1 min-w-0" disabled={loading} />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()}
            className="btn-secondary px-4 md:px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
