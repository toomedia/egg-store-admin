"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data }) => {
  //     if (data.session) {
  //       setSession(data.session);
  //     } else {
  //       router.push("/auth");
  //     }
  //     setIsLoading(false);
  //   });

  //   // Optional: listen to auth changes
  //   const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
  //     setSession(session);
  //     if (!session) {
  //       router.push("/auth");
  //     }
  //   });

  //   return () => {
  //     listener.subscription.unsubscribe();
  //   };
  // }, [router]);

  // if (isLoading) {
  //   return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  // }

  // if (!session) {
  //   return <>{children}</>;
  // }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
