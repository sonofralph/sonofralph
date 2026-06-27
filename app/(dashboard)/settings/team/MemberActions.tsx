"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import type { UserRole } from "@/types";

interface Props {
  memberId: string;
  currentRole: UserRole;
  actorRole: UserRole;
  isSelf: boolean;
  isOwner: boolean;
}

export function MemberActions({ memberId, currentRole, actorRole, isSelf, isOwner }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const canModify = !isSelf && !isOwner;

  const handleRoleChange = async (newRole: string) => {
    setSaving(true);
    setRole(newRole as UserRole);
    await fetch(`/api/users/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    setSaving(false);
    router.refresh();
  };

  const handleRemove = async () => {
    if (!confirm("Remove this member from the organization?")) return;
    setRemoving(true);
    await fetch(`/api/users/${memberId}`, { method: "DELETE" });
    setRemoving(false);
    router.refresh();
  };

  if (!canModify) return null;

  const roles = actorRole === "OWNER"
    ? ["STAFF", "MANAGER", "ADMIN", "OWNER"]
    : ["STAFF", "MANAGER", "ADMIN"];

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={handleRoleChange} disabled={saving}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-red-500"
        onClick={handleRemove}
        disabled={removing}
      >
        {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
