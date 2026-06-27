"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SessionUser } from "@/types";

interface AlertPreview {
  id: string;
  type: string;
  message: string | null;
  itemName: string;
  locationName: string;
  createdAt: Date;
}

interface Props {
  user: SessionUser;
  alertCount: number;
  alerts: AlertPreview[];
  children: React.ReactNode;
}

export function DashboardShell({ user, alertCount, alerts, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:translate-x-0 md:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar
          userRole={user.role}
          orgName={user.organizationName}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0">
        <Header
          user={user}
          alertCount={alertCount}
          alerts={alerts}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
