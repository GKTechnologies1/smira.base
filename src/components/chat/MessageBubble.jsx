import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ChevronRight, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Action';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;

  const parsedResults = (() => {
    if (!results) return null;
    try { return typeof results === 'string' ? JSON.parse(results) : results; } catch { return results; }
  })();

  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );

  const statusConfig = {
    pending: { icon: Clock, color: 'text-muted-foreground', spin: false },
    running: { icon: Loader2, color: 'text-primary', spin: true },
    in_progress: { icon: Loader2, color: 'text-primary', spin: true },
    completed: isError
      ? { icon: AlertCircle, color: 'text-destructive', spin: false }
      : { icon: CheckCircle2, color: 'text-primary', spin: false },
    success: { icon: CheckCircle2, color: 'text-primary', spin: false },
    failed: { icon: AlertCircle, color: 'text-destructive', spin: false },
    error: { icon: AlertCircle, color: 'text-destructive', spin: false },
  }[status] || { icon: Clock, color: 'text-muted-foreground', spin: false };

  const Icon = statusConfig.icon;
  const formattedName = name.split('.').pop().replace(/([A-Z])/g, ' $1').trim();

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition-all",
          "hover:bg-secondary/50",
          expanded ? "bg-secondary border-border" : "bg-card border-border"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-muted-foreground">{formattedName}</span>
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        )}
      </button>
      {expanded && !statusConfig.spin && (
        <div className="mt-1.5 ml-3 pl-3 border-l-2 border-border space-y-2">
          {toolCall.arguments_string && (
            <pre className="bg-secondary rounded-lg p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-auto">
              {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
            </pre>
          )}
          {parsedResults && (
            <pre className="bg-secondary rounded-lg p-2 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-auto">
              {typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div className={cn("max-w-[80%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.length > 0 && (
          <div className="space-y-1">
            {message.tool_calls.map((tc, idx) => (
              <FunctionDisplay key={idx} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}