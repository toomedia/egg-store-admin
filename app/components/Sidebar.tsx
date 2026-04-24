'use client';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Box,
  LogOut,
  Clock,
  Sparkles,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../utils/supabaseClient";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
// { href: "/dashboard/orders", label: "Orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { href: "/dashboard/presets", label: "Presets", icon: <Box className="h-5 w-5" /> },
    { href: "/dashboard/preset-requests", label: "Preset Requests", icon: <Clock className="h-5 w-5" /> },
    { href: "/dashboard/ownCreations", label: "Own Creations", icon: <Sparkles className="h-5 w-5" /> },
    { href: "/dashboard/adminManage", label: "Admin Manager", icon: <Shield className="h-5 w-5" /> },
  ];

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href))
    );
  };


  
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace('/auth');
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-[#0e0743] text-white shadow-sm focus:outline-none"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-[#111] transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out font-sans flex flex-col`}
      >
        {/* Logo Section */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Eggception"
                fill
                className="object-contain"
                sizes="32px"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold text-lg tracking-tight">Eggception</span>
              <span className="text-white/40 text-[11px] font-medium uppercase tracking-wider">Admin</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-grow overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-[#e6d281]/15 text-[#e6d281]"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className={`flex-shrink-0 ${isActive(item.href) ? "text-[#e6d281]" : "text-white/40"}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>{isLoggingOut ? 'Signing out…' : 'Logout'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
