"use client";

import { useState } from "react";
import { Plus, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionUser } from "@/types";
import { NewRequisitionDialog } from "./NewRequisitionDialog";
import { ReviewDialog } from "./ReviewDialog";
import { CommentsThread } from "@/components/ui/CommentsThread";
import { formatDate } from "@/lib/utils";

interface RequisitionLine {
  id: string;
  quantity: number;
  notes: string | null;
  item: { id: string; name: string; unit: string };
}

interface Requisition {
  id: string;
  status: string;
  notes: string | null;
  reviewNote: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string | null; email: string; jobTitle: string | null };
  reviewedBy: { id: string; name: string | null; email: string } | null;
  location: { id: string; name: string };
  lines: RequisitionLine[];
}

const statusConfig: Record<string, { label: string; variant: any; icon: React.ElementType }> = {
  PENDING:  { label: "Pending",  variant: "warning",   icon: Clock },
  APPROVED: { label: "Approved", variant: "success",   icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "destructive", icon: XCircle },
};

export function RequisitionClient({
  initialRequisitions,
  locations,
  items,
  user,
}: {
  initialRequisitions: Requisition[];
  locations: { id: string; name: string }[];
  items: { id: string; name: string; unit: string }[];
  user: SessionUser;
}) {
  const [requisitions, setRequisitions] = useState(initialRequisitions);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reviewing, setReviewing] = useState<Requisition | null>(null);

  const canReview = ["OWNER", "ADMIN", "MANAGER"].includes(user.role);

  function onCreated(r: Requisition) {
    setRequisitions((prev) => [r, ...prev]);
    setShowNew(false);
  }

  function onReviewed(r: Requisition) {
    setRequisitions((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    setReviewing(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Requisitions</h1>
          <p className="text-sm text-slate-500">Request stock — managers review and approve</p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <div className="space-y-3">
        {requisitions.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            No requisitions yet. Create one to request stock from your manager.
          </div>
        )}
        {requisitions.map((req) => {
          const cfg = statusConfig[req.status] ?? statusConfig.PENDING;
          const Icon = cfg.icon;
          const isExpanded = expanded === req.id;

          return (
            <div key={req.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50"
                onClick={() => setExpanded(isExpanded ? null : req.id)}
              >
                <Icon className={`h-5 w-5 shrink-0 ${req.status === "APPROVED" ? "text-emerald-500" : req.status === "REJECTED" ? "text-red-500" : "text-amber-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-900">{req.location.name}</span>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {req.requestedBy.name ?? req.requestedBy.email}
                    {req.requestedBy.jobTitle && ` · ${req.requestedBy.jobTitle}`}
                    {" · "}{formatDate(new Date(req.createdAt))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canReview && req.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setReviewing(req); }}
                    >
                      Review
                    </Button>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                        <th className="pb-2 font-medium">Item</th>
                        <th className="pb-2 font-medium">Qty</th>
                        <th className="pb-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {req.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 text-slate-900">{line.item.name}</td>
                          <td className="py-2 text-slate-600">{line.quantity} {line.item.unit}</td>
                          <td className="py-2 text-slate-500">{line.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {req.notes && (
                    <p className="text-sm text-slate-600"><span className="font-medium">Request note:</span> {req.notes}</p>
                  )}
                  {req.reviewNote && (
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">{req.status === "APPROVED" ? "Approval" : "Rejection"} note:</span> {req.reviewNote}
                    </p>
                  )}
                  {req.reviewedBy && (
                    <p className="text-xs text-slate-400">Reviewed by {req.reviewedBy.name ?? req.reviewedBy.email}</p>
                  )}
                  <div className="pt-2 border-t border-slate-100">
                    <CommentsThread
                      entityType="REQUISITION"
                      entityId={req.id}
                      currentUserId={user.id}
                      currentUserName={user.name}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showNew && (
        <NewRequisitionDialog
          locations={locations}
          items={items}
          onCreated={onCreated}
          onClose={() => setShowNew(false)}
        />
      )}
      {reviewing && (
        <ReviewDialog
          requisition={reviewing}
          onReviewed={onReviewed}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
