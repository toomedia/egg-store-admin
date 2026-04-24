"use client"

import React, { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient.js";
import { useRouter } from "next/navigation";
import { Lock, Mail, Shield, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function Page() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isError, setIsError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            const { data } = await supabase.auth.getSession();
            if (!active) return;
            if (data.session) {
                const { data: userRow } = await supabase
                    .from('users')
                    .select('isAdmin')
                    .eq('id', data.session.user.id)
                    .maybeSingle();
                if (userRow?.isAdmin) {
                    router.replace('/dashboard');
                    return;
                }
                await supabase.auth.signOut();
            }
            setIsCheckingSession(false);
        })();
        return () => { active = false; };
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setIsError(null);

        try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (signInError || !signInData?.session) {
                setIsError(signInError?.message || 'Invalid email or password');
                return;
            }

            const { data: userRow, error: userError } = await supabase
                .from('users')
                .select('isAdmin')
                .eq('id', signInData.session.user.id)
                .maybeSingle();

            if (userError || !userRow?.isAdmin) {
                await supabase.auth.signOut();
                setIsError('This account does not have admin access.');
                return;
            }

            router.replace('/dashboard');
        } catch (error) {
            setIsError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#e6d281]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#e6d281] via-[#d4c070] to-[#c4b060] items-center justify-center relative overflow-hidden">
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
                        <h1 className="font-serif text-5xl font-bold mb-6 tracking-tight">Egg Store</h1>
                        <h2 className="font-serif text-2xl font-light opacity-90 mb-4">Admin Portal</h2>
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
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#e6d281] to-[#d4c070] rounded-3xl mb-6 shadow-lg">
                            <Shield className="w-10 h-10 text-gray-800" />
                        </div>
                        <h1 className="font-serif text-3xl font-bold text-gray-800 mb-3">Welcome Back</h1>
                        <p className="text-gray-600 text-lg">Sign in to your admin account</p>
                    </div>

                    <div className="hidden lg:block mb-10 text-center">
                        <h1 className="font-serif text-4xl font-bold text-gray-800 mb-3 tracking-tight">Welcome back</h1>
                        <p className="text-gray-600 text-lg">Sign in to your admin account to continue</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-10">
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

                        <form onSubmit={handleLogin} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <input
                                        onChange={(e) => setEmail(e.target.value)}
                                        value={email}
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Enter your email address"
                                        className="w-full px-5 py-4 pl-14 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e6d281]/30 focus:border-[#e6d281] transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-gray-300"
                                        required
                                    />
                                    <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e6d281] transition-colors duration-300" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Password
                                </label>
                                <div className="relative group">
                                    <input
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        className="w-full px-5 py-4 pl-14 pr-14 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#e6d281]/30 focus:border-[#e6d281] transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:border-gray-300"
                                        required
                                    />
                                    <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#e6d281] transition-colors duration-300" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

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

                        <div className="mt-10 pt-8 border-t border-gray-100">
                            <div className="flex items-center justify-center text-sm text-gray-500">
                                <Lock className="w-4 h-4 mr-2" />
                                Secure admin access only
                            </div>
                        </div>
                    </div>

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
