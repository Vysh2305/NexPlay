import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Plus, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  admin: [
    "How do I set up a new auction?",
    "Best practices for scheduling matches?",
    "How should I manage discipline issues?",
    "Tips for balancing league parity?",
  ],
  franchise_owner: [
    "How does the silent bid auction work?",
    "Which player stats matter most?",
    "How do I maximize my auction budget?",
    "How to build a winning roster?",
  ],
  player: [
    "How is my AI score calculated?",
    "How can I improve my score?",
    "How do fouls affect my ranking?",
    "How do I join an auction?",
  ],
};

export function ChatWidget({ userRole }: { userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(false);
  const [showConvList, setShowConvList] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const role = userRole as keyof typeof QUICK_PROMPTS | undefined;
  const quickPrompts = role && QUICK_PROMPTS[role] ? QUICK_PROMPTS[role] : QUICK_PROMPTS.player;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConvs(true);
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
    setIsLoadingConvs(false);
  }, []);

  const loadMessages = useCallback(async (convId: number) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  }, []);

  const createConversation = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "League Assistant" }),
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setCurrentConvId(conv.id);
        setMessages([]);
        setShowConvList(false);
        return conv.id;
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (isOpen && conversations.length === 0) {
      loadConversations();
    }
  }, [isOpen, conversations.length, loadConversations]);

  useEffect(() => {
    if (isOpen && conversations.length > 0 && !currentConvId) {
      const latest = conversations[0];
      setCurrentConvId(latest.id);
      loadMessages(latest.id);
    }
  }, [isOpen, conversations, currentConvId, loadMessages]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const sendMessage = useCallback(async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isStreaming) return;

    setInput("");

    let convId = currentConvId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);

    const assistantMsg: Message = { role: "assistant", content: "", streaming: true };
    setMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.streaming) {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return updated;
              });
            }
            if (parsed.done || parsed.error) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.streaming) {
                  updated[updated.length - 1] = { ...last, streaming: false };
                }
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, content: "Sorry, I couldn't get a response. Please try again.", streaming: false };
          }
          return updated;
        });
      }
    }

    setIsStreaming(false);
    if (!isOpen) setHasUnread(true);
  }, [input, isStreaming, currentConvId, createConversation, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchConversation = (conv: Conversation) => {
    setCurrentConvId(conv.id);
    loadMessages(conv.id);
    setShowConvList(false);
  };

  const startNewChat = async () => {
    setCurrentConvId(null);
    setMessages([]);
    setShowConvList(false);
    await createConversation();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col"
            style={{ height: "560px" }}
          >
            <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: "linear-gradient(135deg, rgba(10,20,35,0.98) 0%, rgba(5,15,25,0.99) 100%)", backdropFilter: "blur(20px)" }}>
              
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8"
                style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(139,92,246,0.1) 100%)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #10b981, #8b5cf6)" }}>
                  <Bot size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm leading-none">NEXPLAY Assistant</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs text-emerald-400">AI-powered · Always on</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowConvList(p => !p)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    title="Conversation history"
                  >
                    <ChevronDown size={15} className={cn("transition-transform", showConvList && "rotate-180")} />
                  </button>
                  <button
                    onClick={startNewChat}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                    title="New chat"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Conversation list dropdown */}
              <AnimatePresence>
                {showConvList && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-white/8 overflow-hidden"
                    style={{ background: "rgba(0,0,0,0.3)" }}
                  >
                    <div className="p-2 max-h-40 overflow-y-auto">
                      {isLoadingConvs ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 size={14} className="animate-spin text-white/40" />
                        </div>
                      ) : conversations.length === 0 ? (
                        <p className="text-xs text-white/40 text-center py-3">No conversations yet</p>
                      ) : (
                        conversations.map(conv => (
                          <button
                            key={conv.id}
                            onClick={() => switchConversation(conv)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors truncate",
                              currentConvId === conv.id
                                ? "bg-primary/20 text-primary"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {conv.title} · {new Date(conv.createdAt).toLocaleDateString()}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.length === 0 && !isStreaming && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 pb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <Bot size={26} className="text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-sm">How can I help you?</p>
                      <p className="text-white/40 text-xs mt-1">Ask me anything about the platform</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      {quickPrompts.map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(prompt)}
                          className="text-left px-3 py-2 rounded-xl text-xs text-white/70 hover:text-white transition-all border border-white/8 hover:border-primary/40 hover:bg-primary/5"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "linear-gradient(135deg, #10b981, #8b5cf6)" }}>
                        <Bot size={13} className="text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "text-white rounded-tr-sm"
                        : "text-white/90 rounded-tl-sm border border-white/8",
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary to-emerald-600"
                        : "bg-white/5"
                    )}>
                      {msg.content || (msg.streaming && (
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ))}
                      {msg.streaming && msg.content && (
                        <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-white/10 border border-white/10">
                        <User size={13} className="text-white/70" />
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/8">
                <div className="flex gap-2 items-end rounded-xl border border-white/10 bg-white/5 px-3 py-2 focus-within:border-primary/50 transition-colors">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about the league..."
                    rows={1}
                    disabled={isStreaming}
                    className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none outline-none leading-relaxed disabled:opacity-50"
                    style={{ maxHeight: "80px", overflowY: "auto" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isStreaming}
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: input.trim() && !isStreaming ? "linear-gradient(135deg, #10b981, #8b5cf6)" : "rgba(255,255,255,0.1)" }}
                  >
                    {isStreaming ? (
                      <Loader2 size={13} className="animate-spin text-white" />
                    ) : (
                      <Send size={13} className="text-white" />
                    )}
                  </button>
                </div>
                <p className="text-center text-white/20 text-[10px] mt-2">Powered by NEXPLAY AI · Enter to send</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{ background: "linear-gradient(135deg, #10b981, #8b5cf6)" }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background" />
        )}
      </motion.button>
    </>
  );
}
