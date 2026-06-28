"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentsThreadProps {
  entityType: "PURCHASE_ORDER" | "REQUISITION";
  entityId: string;
  initialComments?: Comment[];
  currentUserId: string;
  currentUserName?: string | null;
}

export function CommentsThread({
  entityType,
  entityId,
  initialComments,
  currentUserId,
  currentUserName,
}: CommentsThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments ?? []);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(!initialComments);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initialComments) {
      fetch(`/api/comments?entityType=${entityType}&entityId=${entityId}`)
        .then((r) => r.json())
        .then((data: Comment[]) => {
          setComments(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [entityType, entityId, initialComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const tempId = `opt-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      body: trimmed,
      createdAt: new Date().toISOString(),
      user: { id: currentUserId, name: currentUserName ?? null, email: "you" },
    };
    setComments((prev) => [...prev, optimistic]);
    setBody("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, body: trimmed }),
      });
      if (res.ok) {
        const saved: Comment = await res.json();
        setComments((prev) => prev.map((c) => (c.id === tempId ? saved : c)));
      }
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  if (loading) {
    return (
      <div className="py-3 text-xs text-slate-400 text-center">Loading comments…</div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Comments{comments.length > 0 ? ` (${comments.length})` : ""}
        </p>
      </div>

      {comments.length === 0 ? (
        <p className="text-xs text-slate-400">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const display = c.user.name ?? c.user.email;
            const initial = display.charAt(0).toUpperCase();
            const isOwn = c.user.id === currentUserId;

            return (
              <div key={c.id} className="flex gap-2.5">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isOwn ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`}>
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800">{display}</span>
                    <span className="text-xs text-slate-400">
                      {formatDate(new Date(c.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          maxLength={2000}
          disabled={submitting}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-colors"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!body.trim() || submitting}
          className="shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
