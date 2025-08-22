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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If we're on the auth page, render children without dashboard layout
  if (pathname === "/auth") {
    return <>{children}</>;
  }

  // If no session and not on auth page, redirect to auth
  if (!session) {
    router.push("/auth");
    return null;
  }

  // Render dashboard layout for authenticated users
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
