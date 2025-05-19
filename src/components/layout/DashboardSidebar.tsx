
import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Gauge,
  Coins,
  FileText,
  Users,
  Settings,
  BarChart,
  Calendar
} from "lucide-react";

export const DashboardSidebar: React.FC = () => {
  const sidebar = useSidebar();
  const [sidebarWidth, setSidebarWidth] = useState(sidebar?.open ? "w-64" : "w-14");
  const location = useLocation();
  
  React.useEffect(() => {
    setSidebarWidth(sidebar?.open ? "w-64" : "w-14");
  }, [sidebar?.open]);
  
  // Menu items with their routes and icons
  const menuItems = [
    { title: "Dashboard", route: "/", icon: Gauge },
    { title: "Revenue", route: "/revenue", icon: Coins },
    { title: "Expenses", route: "/expenses", icon: FileText },
    { title: "Staff", route: "/staff", icon: Users },
    { title: "Reports", route: "/reports", icon: BarChart },
    { title: "Settings", route: "/settings", icon: Settings },
  ];
  
  // Helper function to check if a route is active
  const isActive = (route: string) => location.pathname === route;
  
  // Helper to determine NavLink className based on active state
  const getNavClass = ({ isActive }: { isActive: boolean }) => 
    isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium flex items-center gap-3 p-2 rounded-md w-full"
      : "hover:bg-sidebar-accent/50 flex items-center gap-3 p-2 rounded-md w-full";

  return (
    <Sidebar 
      className={`${sidebarWidth} shadow-md border-r transition-all duration-200`} 
    >
      {/* Logo section */}
      <div className={`p-4 flex items-center justify-between ${!sidebar?.open ? "justify-center" : ""}`}>
        {sidebar?.open && (
          <div className="text-xl font-bold text-primary">
            HealthyMind
          </div>
        )}
        <SidebarTrigger className="ml-2" />
      </div>
      
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.route} className={getNavClass}>
                      <item.icon className="h-5 w-5" />
                      {sidebar?.open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Period selector */}
        {sidebar?.open && (
          <div className="px-4 mt-8">
            <div className="text-sm font-medium mb-2 text-sidebar-foreground/70">
              Current Period
            </div>
            <div className="flex items-center gap-2 text-sm bg-sidebar-accent/50 p-2 rounded-md">
              <Calendar className="h-4 w-4" />
              <span>April 2025</span>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
