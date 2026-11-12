"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { ThemeProvider } from "./theme-provider";
import { tokenStore } from "@/lib/api";
import { cn } from "@/lib/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Tokens live in localStorage, so this guard runs on the client. Without it a
  // signed-out visitor would render the dashboard shell and fire a burst of
  // unauthenticated API requests.
  useEffect(() => {
    if (tokenStore.get() || tokenStore.getRefresh()) {
      setSessionChecked(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!sessionChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-primary-950">
        <p className="text-sm text-gray-500 dark:text-gray-400">Checking your session…</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-primary-950">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0",
            // Desktop: margin for sidebar
            "lg:ml-64",
            collapsed && "lg:ml-20"
          )}
        >
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
