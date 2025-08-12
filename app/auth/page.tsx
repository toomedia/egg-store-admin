"use client"

import React,{useState} from "react";
import { supabase } from "../../utils/supabaseClient.js";
import { useRouter } from "next/navigation";

export default function page() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isError, setIsError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        setIsError(null);
      const userData = localStorage.getItem('userData');
      if(userData){
        router.push('/');
        return;
    }else{
        try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
    
        if (error) {
            console.error(error);
            setIsError(error.message);
            return; // exit early if login failed
        }
    
        // Login successful, now check admin flag
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('isAdmin', true)
            .single();
    
        if (userError || !userData) {
            console.error(userError || 'User is not admin');
            setIsError(userError?.message || 'User is not admin');
            return;
        }
    
        // User is admin — you can redirect or show dashboard here
        console.log('Admin logged in:', userData);
        setIsError(null);
        router.push('/dashboard');
        localStorage.setItem('userData', JSON.stringify(userData));

        } catch (error) {
        console.error(error);
        setIsError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
        setIsLoading(false);
        }
    }
};
      

  return ( 
    <div className="min-h-screen font-monrape flex items-center justify-center bg-gradient-to-r from-[#f6e79e]/20 to-[#f7fcee]/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-[#f6e79e]/30">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        {isLoading && <p className="text-center text-gray-500">Logging in...</p>}
{isError && <p className="text-center text-red-500">{isError}</p>}


        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="admin@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring focus:border-blue-400"
          />
        </div>

        <button
        onClick={handleLogin}
          className="w-full bg-custom-yellow cursor-pointer hover:bg-custom-yellow/40 text-black py-2 rounded-lg font-medium transition"
        >
          Login
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Only authorized admins can log in here.
        </p>
      </div>
    </div>
  );
}
