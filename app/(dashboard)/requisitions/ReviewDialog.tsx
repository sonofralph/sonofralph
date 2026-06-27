"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function ReviewDialog({
  requisition,
  onReviewed,
  onClose,
}: {
  requisition: any;
  onReviewed: (r: any) => void;
  onClose: () => void;
}) {
  const [reviewNote, setReviewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/requisitions/${requisition.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNote: reviewNote || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
    onReviewed(data);
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Requisition</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <p className="text-sm font-medium text-slate-900">{requisition.location.name}</p>
            <p className="text-xs text-slate-500">Requested by {requisition.requestedBy.name ?? requisition.requestedBy.email}</p>
            <ul className="text-sm text-slate-700 space-y-1 mt-2">
              {requisition.lines.map((line: any) => (
                <li key={line.id}>· {line.item.name} — {line.quantity} {line.item.unit}</li>
              ))}
            </ul>
            {requisition.notes && <p className="text-xs text-slate-500 mt-2">Note: {requisition.notes}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Review note (optional)</Label>
            <Input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Reason for approval or rejection..." />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={loading} onClick={() => submit("REJECTED")}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Reject
          </Button>
          <Button disabled={loading} onClick={() => submit("APPROVED")}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
