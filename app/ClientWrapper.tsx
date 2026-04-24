"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import type { Session } from "@supabase/supabase-js";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    const verifyAdminSession = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (!active) return;
        setSession(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      const { data: userRow, error } = await supabase
        .from("users")
        .select("isAdmin")
        .eq("id", nextSession.user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !userRow?.isAdmin) {
        await supabase.auth.signOut();
        setSession(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setSession(nextSession);
      setIsAdmin(true);
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      verifyAdminSession(data.session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      verifyAdminSession(nextSession);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (pathname === "/auth") return;
    if (!session || !isAdmin) {
      router.replace("/auth");
    }
  }, [isLoading, session, isAdmin, pathname, router]);

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

  if (pathname === "/auth") {
    return <>{children}</>;
  }

  if (!session || !isAdmin) {
    return null;
  }

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
