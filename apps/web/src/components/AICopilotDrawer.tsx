"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  HelpCircle,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { useMCPState } from "@/hooks/useMCPState";
import { apiService } from "@/services/apiService";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  citedRule?: string;
  intentRouted?: boolean;
}

export function AICopilotDrawer() {
  const { mcpState } = useMCPState();
  const limit = mcpState.hasRunMCP ? mcpState.contractLimitKw : 500;
  const savings = mcpState.hasRunMCP ? mcpState.monthlySavingsInr : 130000;

  const SUGGESTED_QUESTIONS = [
    "Why was Centrifugal Chiller #2 soft-ramped at 06:00 AM?",
    `What if we shift the contract limit to ${limit === 400 ? 450 : 400} kW?`,
    `How was the ₹${savings.toLocaleString("en-IN")} monthly savings calculated?`,
    "Which DISCOM rule was cited for the peak demand penalty?",
  ];
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      sender: "copilot",
      text: "Hello! I am your OptiGrid AI Copilot powered by LangGraph & Groq LLM. Ask me anything about building energy anomalies, demand staggering decisions, or run what-if scenarios.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput("");
    setLoading(true);

    try {
      const res = await apiService.askCopilot(q);
      const copilotMsg: ChatMessage = {
        id: `copilot_${Date.now()}`,
        sender: "copilot",
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        intentRouted: res.intent_routed,
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "copilot",
          text: `I experienced an error communicating with the agent graph backend. Using local grounded reasoning: recommendation rec_dynamic_${limit} staggering pre-cools Zone 3 and delays Compressor #1 startup to keep peak load under ${limit} kW, saving ₹${savings.toLocaleString("en-IN")}/month.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-purple-500/40"
        style={{
          background: "linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(6, 182, 212, 0.95) 100%)",
          boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)",
        }}
        aria-label="Open AI Copilot"
      >
        <Sparkles className="h-5 w-5 text-white animate-pulse" />
        <span className="font-semibold text-sm text-white tracking-wide">AI Copilot</span>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#0A0A16] border-l border-purple-500/20 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-purple-500/20 bg-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/30">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">OptiGrid Copilot</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Groq LLM
                </span>
              </div>
              <p className="text-xs text-slate-400">Grounded Energy Reasoning & What-If Engine</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === "user"
                    ? "bg-cyan-600 text-white"
                    : "bg-purple-700/80 text-purple-200 border border-purple-400/30"
                }`}
              >
                {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[80%] p-3.5 rounded-2xl ${
                  msg.sender === "user"
                    ? "bg-cyan-600/90 text-white rounded-tr-none"
                    : "bg-slate-900/90 text-slate-200 border border-purple-500/20 rounded-tl-none shadow-md"
                }`}
              >
                <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.text}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {msg.intentRouted && (
                    <span className="text-emerald-400 font-mono font-medium">✓ Real Agent Graph Response</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-700/80 text-purple-200 flex items-center justify-center shrink-0 border border-purple-400/30">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/90 text-slate-300 border border-purple-500/20 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                <span className="text-xs text-slate-400">Querying LangGraph agent state & solver...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions Quick Chips */}
        <div className="p-3 border-t border-purple-500/10 bg-slate-950/40">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-slate-400">
            <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="text-left text-xs px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-200 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-purple-500/20 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask copilot why or what-if scenario..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-purple-500/30 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
