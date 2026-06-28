"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { LocationType } from "@/types";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

const locationTypes: { value: LocationType; label: string }[] = [
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BAR", label: "Bar" },
  { value: "CELLAR", label: "Cellar" },
  { value: "STORAGE", label: "Storage / Dry Store" },
  { value: "FREEZER", label: "Freezer / Cold Store" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "HOUSEKEEPING", label: "Housekeeping" },
  { value: "LAUNDRY", label: "Laundry" },
  { value: "PHARMACY", label: "Pharmacy / Dispensary" },
  { value: "WARD", label: "Ward / Station" },
  { value: "RESTAURANT", label: "Restaurant" },
  { value: "HOTEL", label: "Hotel" },
  { value: "EVENT_SPACE", label: "Event Space" },
  { value: "OTHER", label: "Other" },
];

export function AddLocationButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("HOTEL");
  const [upgradeInfo, setUpgradeInfo] = useState<{ current: number; limit: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (res.status === 402) {
        const body = await res.json();
        setOpen(false);
        setUpgradeInfo({ current: body.current, limit: body.limit });
        return;
      }
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to add location");
      }
      setOpen(false);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <UpgradeModal
      open={!!upgradeInfo}
      onClose={() => setUpgradeInfo(null)}
      resource="locations"
      current={upgradeInfo?.current ?? 0}
      limit={upgradeInfo?.limit ?? 1}
    />
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Location Name *</Label>
            <Input
              required
              placeholder="Main Kitchen"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Location Type *</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as LocationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locationTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
