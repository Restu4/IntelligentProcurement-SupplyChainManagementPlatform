"use client";

import { useState } from "react";
import { Bot, User, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Source {
  document: string;
  chunk: string;
  score: number;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: number;
  onRegenerate?: () => void;
}

export function ChatMessage({
  role,
  content,
  sources,
  confidence,
  onRegenerate,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <div className={cn("flex gap-4 py-6 chat-message-animation", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
          isUser
            ? "bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg shadow-accent-500/20"
            : "bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-lg shadow-secondary-500/20"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={cn("flex-1 max-w-3xl", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-5 py-4",
            isUser
              ? "bg-primary-900 dark:bg-primary-700 text-white"
              : "bg-gray-100 dark:bg-primary-800/50 border border-gray-200 dark:border-gray-700/50"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-primary-950 prose-code:text-secondary-400">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
              title="Copy answer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-primary-800 transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}

            {confidence !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full",
                  confidence >= 80
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : confidence >= 60
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                )}
              >
                {confidence}% confidence
              </span>
            )}

            {sources && sources.length > 0 && (
              <button
                onClick={() => setShowSources(!showSources)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showSources ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {sources.length} source{sources.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}

        {!isUser && showSources && sources && (
          <div className="mt-2 space-y-2 px-1">
            {sources.map((source, idx) => (
              <div
                key={idx}
                className="text-xs p-3 rounded-lg bg-gray-50 dark:bg-primary-800/30 border border-gray-200 dark:border-gray-700/50"
              >
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  📄 {source.document}
                </p>
                <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {source.chunk}
                </p>
                <p className="text-gray-400 mt-1">
                  Relevance: {(source.score * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
