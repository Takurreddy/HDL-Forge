"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { sendAIChat, sendAIFeedback } from "@/lib/api";
import type { AITask, AIChatRequest } from "@/lib/types";
import {
  Sparkles,
  X,
  Send,
  Code2,
  AlertCircle,
  Bug,
  Lightbulb,
  Activity,
  MessageSquare,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  task: AITask;
  timestamp: Date;
  feedback?: "helpful" | "not_helpful";
}

interface AIAssistantProps {
  problemSlug?: string;
  submissionId?: number;
  code?: string;
  compilerError?: string;
  waveformId?: string;
  lessonSlug?: string;
  submissionStatus?: string;
  testsPassed?: number;
  testsTotal?: number;
}

const TASK_ICONS: Record<AITask, typeof Code2> = {
  explain_code: Code2,
  explain_error: AlertCircle,
  debug_submission: Bug,
  hint: Lightbulb,
  explain_waveform: Activity,
  ask: MessageSquare,
};

const TASK_LABELS: Record<AITask, string> = {
  explain_code: "Explain Code",
  explain_error: "Explain Error",
  debug_submission: "Debug",
  hint: "Hint",
  explain_waveform: "Waveform",
  ask: "Ask",
};

const QUICK_ACTIONS: { task: AITask; label: string; requiresCode: boolean; requiresError: boolean }[] = [
  { task: "explain_code", label: "Explain", requiresCode: true, requiresError: false },
  { task: "explain_error", label: "Explain Error", requiresCode: true, requiresError: true },
  { task: "debug_submission", label: "Debug", requiresCode: true, requiresError: false },
  { task: "hint", label: "Hint", requiresCode: false, requiresError: false },
  { task: "explain_waveform", label: "Waveform", requiresCode: false, requiresError: false },
  { task: "ask", label: "Ask", requiresCode: false, requiresError: false },
];

export default function AIAssistant({
  problemSlug,
  code,
  compilerError,
  waveformId,
  lessonSlug,
  submissionStatus,
  testsPassed,
  testsTotal,
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<AITask | null>(null);
  const [hintLevel, setHintLevel] = useState(1);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = useCallback(
    async (task: AITask, question?: string) => {
      const userQuestion = question || inputValue.trim();
      if (!userQuestion && task !== "hint" && task !== "explain_waveform") return;
      if (isLoading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: userQuestion || TASK_LABELS[task],
        task,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setIsLoading(true);
      setActiveTask(task);

      try {
        const request: AIChatRequest = {
          task,
          problemSlug,
          code,
          compilerError,
          waveformId,
          lessonSlug,
          userQuestion: userQuestion || undefined,
          hintLevel: task === "hint" ? hintLevel : undefined,
        };
        const result = await sendAIChat(request);
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: result.response,
          task,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (task === "hint") setHintLevel((prev) => Math.min(prev + 1, 4));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "AI request failed";
        setMessages((prev) => [...prev, {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Error: ${errorMessage}`,
          task,
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoading(false);
        setActiveTask(null);
      }
    },
    [inputValue, isLoading, problemSlug, code, compilerError, waveformId, lessonSlug, hintLevel]
  );

  const handleFeedback = useCallback(
    async (messageId: string, rating: "helpful" | "not_helpful") => {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m)));
      try {
        await sendAIFeedback({
          rating,
          taskType: messages.find((m) => m.id === messageId)?.task || "",
        });
      } catch { /* Feedback is non-critical */ }
    },
    [messages]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend("ask");
      }
    },
    [handleSend]
  );

  const getAvailableActions = () => {
    return QUICK_ACTIONS.filter((action) => {
      if (action.requiresCode && !code) return false;
      if (action.requiresError && !compilerError) return false;
      return true;
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-on-accent shadow-lg transition-all hover:bg-accent-hover hover:shadow-[0_0_24px_rgba(34,197,94,0.4)] hover:scale-105"
        title="AI Tutor"
      >
        <Sparkles className="h-5 w-5" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex w-[400px] max-w-[calc(100vw-3rem)] flex-col rounded-2xl border border-border bg-panel shadow-2xl overflow-hidden" style={{ height: minimized ? "auto" : "560px", maxHeight: "calc(100vh - 6rem)" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent/10">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="text-xs font-semibold text-text-primary">AI Tutor</span>
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(!minimized)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors">
                {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text-primary transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Quick Actions */}
              <div className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
                {getAvailableActions().map((action) => {
                  const Icon = TASK_ICONS[action.task];
                  return (
                    <button
                      key={action.task}
                      onClick={() => {
                        if (action.task === "hint") handleSend("hint", "Give me a hint");
                        else if (action.task === "explain_waveform") handleSend("explain_waveform", "Explain this waveform");
                        else setActiveTask(action.task);
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-surface px-2.5 py-1.5 text-[10px] font-medium text-text-muted transition-all hover:bg-accent/10 hover:text-accent disabled:opacity-50"
                    >
                      <Icon className="h-3 w-3" />
                      {action.label}
                    </button>
                  );
                })}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center text-center">
                    <div className="space-y-2">
                      <Sparkles className="mx-auto h-6 w-6 text-text-dim" />
                      <p className="text-xs text-text-muted">Ask me anything about HDL</p>
                      <p className="text-[10px] text-text-dim">
                        I can explain code, debug errors, give hints, and help with concepts.
                      </p>
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-accent/15 text-accent"
                          : "bg-surface text-text-secondary"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                      {msg.role === "assistant" && !msg.feedback && !msg.content.startsWith("Error:") && (
                        <div className="mt-2 flex gap-1.5 border-t border-border pt-2">
                          <button onClick={() => handleFeedback(msg.id, "helpful")} className="rounded-lg p-1 text-text-dim hover:bg-accent/10 hover:text-accent transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => handleFeedback(msg.id, "not_helpful")} className="rounded-lg p-1 text-text-dim hover:bg-error/10 hover:text-error transition-colors">
                            <ThumbsDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      {msg.feedback && (
                        <div className="mt-2 border-t border-border pt-2 text-[10px] text-text-dim">
                          {msg.feedback === "helpful" ? "Marked helpful" : "Marked not helpful"}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl bg-surface px-3 py-2 text-xs text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin text-accent" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeTask === "ask" || !activeTask ? (
                <div className="border-t border-border px-3 py-3">
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question..."
                      rows={1}
                      className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder-text-dim outline-none transition-all focus:border-accent/40 focus:shadow-[0_0_12px_rgba(34,197,94,0.1)]"
                    />
                    <button
                      onClick={() => handleSend("ask")}
                      disabled={!inputValue.trim() || isLoading}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-on-accent transition-all hover:bg-accent-hover disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </>
  );
}
