"use client"

import React,{useState} from "react";
import { supabase } from "../../utils/supabaseClient.js";
import { useRouter } from "next/navigation";
import { Lock, Mail,Shield, Loader2, CheckCircle, User } from "lucide-react";

export default function page() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [isError, setIsError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        setIsError(null);
      const userData = localStorage.getItem('userData');
      if(userData){
        router.push('/dashboard');
        return;
    }
    
    else{
        try {
        console.log("email", email, name);

        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('name', name)
        .eq('isAdmin', true)
        .maybeSingle();
        
        console.log("🚀 ~ handleLogin ~ userData:", userData, userError)
        if (userError || !userData) {
          console.log("🚀 ~ handleLogin ~ userError:", userError)

            console.error(userError);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#e6d281] via-[#d4c070] to-[#c4b060] items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full"></div>
        </div>
        
        <div className="text-center text-white px-12 relative z-10">
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-8 shadow-2xl">
              <Shield className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-bold mb-6 tracking-tight">Egg Store</h1>
            <h2 className="text-2xl font-light opacity-90 mb-4">Admin Portal</h2>
            <p className="text-lg opacity-80 max-w-md mx-auto leading-relaxed">
              Streamline your egg store operations with our comprehensive admin dashboard
            </p>
          </div>
          
          <div className="space-y-6 text-left max-w-md mx-auto">
            <div className="flex items-center group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium">Inventory Management</span>
                <p className="text-sm opacity-70">Track stock levels and manage products</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium">Order Processing</span>
                <p className="text-sm opacity-70">Handle customer orders efficiently</p>
              </div>
            </div>
            <div className="flex items-center group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 group-hover:bg-white/30 transition-all duration-300">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="font-medium">Analytics & Reports</span>
                <p className="text-sm opacity-70">Monitor sales and performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#e6d281] to-[#d4c070] rounded-3xl mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-gray-800" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-3">Welcome Back</h1>
            <p className="text-gray-600 text-lg">Sign in to your admin account</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-3 tracking-tight">Welcome back</h1>
            <p className="text-gray-600 text-lg">Sign in to your admin account to continue</p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-10">
            {/* Error Message */}
            {isError && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-800 text-sm font-medium">{isError}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-8">
              {/* Email Field */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-5 py-4 pl-14 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e6d281]/30 focus:border-[#e6d281] transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-gray-300"
                    required
                  />
                  <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e6d281] transition-colors duration-300" />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Name
                </label>
                <div className="relative group">
                  <input
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    type="text"
                    placeholder="Enter your Name"
                    className="w-full px-5 py-4 pl-14 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e6d281]/30 focus:border-[#e6d281] transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-gray-300"
                    required
                  />
                  <User className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e6d281] transition-colors duration-300" />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#e6d281] to-[#d4c070] hover:from-[#d4c070] hover:to-[#c4b060] text-gray-800 font-semibold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Lock className="w-4 h-4 mr-2" />
                Secure admin access only
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need assistance? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
