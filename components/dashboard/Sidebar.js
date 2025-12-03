"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Building2,
  Menu,
  X,
  Settings,
  BarChart3,
  LogOut,
  ChartBarBig,
  UserRoundCog,
  CookingPot,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SidebarNav from "./SidebarNav";
import { useGetUser, useLogout } from "@/hooks/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { loading: logoutLoading, handleLogout } = useLogout();

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div className="flex items-center h-16 px-4 mt-12 border-b ">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold">Admin Panel</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          onClick={() => setIsMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <SidebarNav pathname={pathname} />

      {/* Logout Button */}
      <div className="p-4 mt-auto border-t">
        <Button
          variant="ghost"
          className="justify-start w-full gap-2"
          onClick={handleLogout}
          disabled={logoutLoading}
        >
          <LogOut className="w-5 h-5" />
          <span>{logoutLoading ? "Logging out..." : "Logout"}</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed z-50 top-4 left-4 md:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="w-6 h-6" />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r shadow-lg md:hidden",
          "transform transition-transform duration-300 ease-in-out flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </div>

      {/* Desktop Sidebar */}
      <div className="fixed top-0 left-0 flex-col hidden h-full bg-white border-r shadow-sm md:flex w-72">
        {sidebarContent}
      </div>
    </>
  );
}
