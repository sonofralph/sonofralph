"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { CreatePOModal } from "./CreatePOModal";
import type { AlertStatus } from "@/types";

interface Supplier {
  id: string;
  name: string;
}

interface AlertActionsProps {
  alertId: string;
  currentStatus: AlertStatus;
  itemId: string;
  itemName: string;
  itemUnit: string;
  unitCost: number;
  suppliers: Supplier[];
}

export function AlertActions({
  alertId,
  currentStatus,
  itemId,
  itemName,
  itemUnit,
  unitCost,
  suppliers,
}: AlertActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [poOpen, setPoOpen] = useState(false);

  const updateStatus = async (status: AlertStatus) => {
    setIsLoading(true);
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          onClick={() => setPoOpen(true)}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
          Reorder
        </Button>

        {currentStatus === "OPEN" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateStatus("ACKNOWLEDGED")}
            disabled={isLoading}
          >
            Acknowledge
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 border-green-200 hover:bg-green-50"
          onClick={() => updateStatus("RESOLVED")}
          disabled={isLoading}
        >
          Resolve
        </Button>
      </div>

      <CreatePOModal
        open={poOpen}
        onClose={() => setPoOpen(false)}
        alertId={alertId}
        itemId={itemId}
        itemName={itemName}
        itemUnit={itemUnit}
        unitCost={unitCost}
        suppliers={suppliers}
      />
    </>
  );
}
