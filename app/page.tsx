"use client"
import { supabase } from "../utils/supabaseClient";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if(data.session){
        router.push('/dashboard')
      }else{
        router.push('/auth')
      }
    });
  }, []);

  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
