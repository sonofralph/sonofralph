"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MovementForm } from "@/components/inventory/MovementForm";
import { Plus } from "lucide-react";

interface MovementDialogButtonProps {
  items: { id: string; name: string; sku: string; unit: string }[];
  locations: { id: string; name: string; type: string }[];
}

export function MovementDialogButton({
  items,
  locations,
}: MovementDialogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Movement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <MovementForm
          items={items}
          locations={locations}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
