
import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container py-6 max-w-full px-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
