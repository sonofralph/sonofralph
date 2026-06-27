"use client";

import { useState } from "react";
import { Upload, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportModal } from "./ImportModal";
import { ExportButton } from "@/components/ui/ExportButton";
import Link from "next/link";

export function InventoryActions() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Link href="/inventory/consolidated">
        <Button variant="outline" size="sm">
          <Layers className="mr-1.5 h-4 w-4" />
          Consolidated
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
        <Upload className="mr-1.5 h-4 w-4" />
        Import CSV
      </Button>
      <ExportButton endpoint="/api/export/inventory" />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
