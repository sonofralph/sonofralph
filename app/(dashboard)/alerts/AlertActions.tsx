"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AlertStatus } from "@prisma/client";

interface AlertActionsProps {
  alertId: string;
  currentStatus: AlertStatus;
}

export function AlertActions({ alertId, currentStatus }: AlertActionsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="flex items-center gap-2 shrink-0">
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
  );
}
