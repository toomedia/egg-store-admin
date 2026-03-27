"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    
    if (pathname === "/auth") {
      // If we're on the auth page, don't redirect
      setIsLoading(false);
      return;
    }

    if (!userData) {
      router.push("/auth");
      return;
    }

    setSession(JSON.parse(userData));
    setIsLoading(false);
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-[#e6d281]/30" />
            <div className="absolute inset-0 rounded-full border-4 border-t-[#e6d281] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If we're on the auth page, render children without dashboard layout
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // If no session and not on auth page, redirect to auth
  if (!session) {
    return null;
  }

  // Render dashboard layout for authenticated users
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen bg-gray-50 lg:ml-64">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
