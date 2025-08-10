"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Egg, LayoutDashboard, ShoppingCart, Settings, Box, LogOut, Users, Image, Shield, FileText, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/dashboard/orders", label: "Orders", icon: <ShoppingCart className="h-5 w-5" /> },
    { href: "/dashboard/customer", label: "Customer", icon: <Users className="h-5 w-5" /> },
    { href: "/dashboard/presets", label: "Presets", icon: <Box className="h-5 w-5" /> },
    { href: "/dashboard/mediaManage", label: "Media Manager", icon: <Image className="h-5 w-5" /> },
    { href: "/dashboard/adminManage", label: "Admin Manager", icon: <Shield className="h-5 w-5" /> },
    { href: "/dashboard/reports", label: "Reports", icon: <FileText className="h-5 w-5" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  // Check if current path starts with item's href to handle nested routes
  const isActive = (href) => {
    return pathname === href || 
           (href !== "/dashboard" && pathname.startsWith(href)) ||
           (pathname === "/dashboard" && href === "/dashboard");
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col border-r border-gray-200 dark:border-gray-700
        transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        transition-transform duration-200 ease-in-out
      `}>
        {/* Logo/Brand Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link 
            href="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl shadow-sm">
              <Egg className="h-6 w-6 text-amber-600 dark:text-amber-300" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              Eggception
              <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">Admin Dashboard</span>
            </h1>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => alert("Logout clicked")}
            className="flex items-center justify-center w-full gap-2 px-4 py-3 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}