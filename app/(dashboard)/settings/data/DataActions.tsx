"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { signOut } from "next-auth/react";

interface Props {
  orgName: string;
}

export function DataActions({ orgName }: Props) {
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/gdpr/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "mise-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — rare, and the button state reset is enough feedback
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/gdpr/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    if (res.ok) {
      await signOut({ callbackUrl: "/?deleted=1" });
      return;
    }
    const data = await res.json().catch(() => ({}));
    setDeleteError(data.error ?? "Something went wrong. Please try again.");
    setDeleting(false);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Export */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Export your data</p>
            <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
              Download a full JSON export of your organization — all inventory, movements,
              purchase orders, users, recipes, and audit logs.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="shrink-0"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export JSON
          </Button>
        </div>

        {/* Delete */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-5">
          <div>
            <p className="text-sm font-semibold text-red-900">Delete account</p>
            <p className="text-xs text-red-700 mt-0.5 max-w-sm">
              Permanently delete your organization and all its data. This cancels your
              Stripe subscription immediately and cannot be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => { setDeleteOpen(true); setConfirmation(""); setDeleteError(""); }}
            className="shrink-0"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete account
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-red-900">Delete organization</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{orgName}</strong> and all its data —
              locations, inventory, movements, users, audit logs, and billing. Your Stripe
              subscription will be cancelled immediately.
              <br /><br />
              <strong>This cannot be undone.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="confirm-name" className="text-sm text-slate-700">
                Type <span className="font-semibold text-slate-900">{orgName}</span> to confirm
              </Label>
              <Input
                id="confirm-name"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder={orgName}
                autoComplete="off"
              />
            </div>
            {deleteError && (
              <p className="text-sm text-red-600">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || confirmation !== orgName}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
