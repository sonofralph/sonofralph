"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  supplierId: string;
  defaultValues: {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
  };
  canEdit: boolean;
  canDelete: boolean;
}

export function EditSupplierForm({ supplierId, defaultValues, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(defaultValues.name);
  const [contact, setContact] = useState(defaultValues.contact);
  const [email, setEmail] = useState(defaultValues.email);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [address, setAddress] = useState(defaultValues.address);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/suppliers/${supplierId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, email, phone, address }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : "Failed to save");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? Purchase orders linked to this supplier will also be removed.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/suppliers/${supplierId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/suppliers");
    } else {
      const d = await res.json();
      setError(typeof d.error === "string" ? d.error : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Supplier name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required disabled={!canEdit} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Contact person</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Full name" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="supplier@example.com" disabled={!canEdit} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Country" disabled={!canEdit} />
            </div>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex items-center justify-between">
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Supplier
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
