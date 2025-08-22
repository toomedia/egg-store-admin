'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  Egg,
  LayoutDashboard,
  ShoppingCart,
  Settings,
  Box,
  LogOut,
  Users,
  Image,
  Shield,
  FileText,
  Menu,
  X,
} from "lucide-react";
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

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href !== "/dashboard" && pathname.startsWith(href)) ||
      (pathname === "/dashboard" && href === "/dashboard")
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white text-gray-700 border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e6d281] font-manrope"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-gray-200 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out font-manrope flex flex-col`}
      >
        {/* Top (Logo + Navigation) */}
        <div className="flex flex-col flex-grow overflow-y-auto">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="bg-[#e6d281]/30 p-2 rounded-xl shadow-sm">
                <Egg className="h-6 w-6 text-[#e6d281]" />
              </div>
              <div>
        <div className="flex flex-col leading-tight">
  <h1 className="text-2xl font-bold tracking-tight text-gray-900">Eggception</h1>
  <span className="text-sm text-gray-500">Admin Dashboard</span>
</div>

              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-grow overflow-y-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#e6d281]/20 text-[#e6d281] font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                } font-manrope`}
              >
                <span className={`${isActive(item.href) ? "text-[#e6d281]" : "text-gray-500"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => alert("Logout clicked")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors font-manrope"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}


// 'use client';

// import React, { useState } from "react";
// import Link from "next/link";
// import {
//   Egg,
//   LayoutDashboard,
//   ShoppingCart,
//   Settings,
//   Box,
//   LogOut,
//   Users,
//   Image,
//   Shield,
//   FileText,
//   Menu,
//   X,
// } from "lucide-react";
// import { usePathname } from "next/navigation";

// export default function Sidebar() {
//   const pathname = usePathname();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   const navItems = [
//     { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
//     { href: "/dashboard/orders", label: "Orders", icon: <ShoppingCart className="h-5 w-5" /> },
//     { href: "/dashboard/customer", label: "Customer", icon: <Users className="h-5 w-5" /> },
//     { href: "/dashboard/presets", label: "Presets", icon: <Box className="h-5 w-5" /> },
//     { href: "/dashboard/mediaManage", label: "Media Manager", icon: <Image className="h-5 w-5" /> },
//     { href: "/dashboard/adminManage", label: "Admin Manager", icon: <Shield className="h-5 w-5" /> },
//     { href: "/dashboard/reports", label: "Reports", icon: <FileText className="h-5 w-5" /> },
//     { href: "/dashboard/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
//   ];

//   const isActive = (href: string) => {
//     return (
//       pathname === href ||
//       (href !== "/dashboard" && pathname.startsWith(href)) ||
//       (pathname === "/dashboard" && href === "/dashboard")
//     );
//   };

//   return (
//     <>
//       {/* Mobile Toggle Button */}
//       <button
//         onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
//         className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white text-gray-700 border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e6d281]"
//       >
//         {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//       </button>

//       {/* Overlay for mobile */}
//       {mobileMenuOpen && (
//         <div 
//           className="lg:hidden fixed inset-0 bg-black/50 z-40"
//           onClick={() => setMobileMenuOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside
//         className={`fixed top-0 left-0 z-50 w-64 h-screen bg-white border-r border-gray-200 transition-all duration-200 ease-in-out font-manrope flex flex-col ${
//           mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
//         }`}
//       >
//         {/* Logo Section */}
//         <div className="p-6 border-b border-gray-200">
//           <Link
//             href="/"
//             onClick={() => setMobileMenuOpen(false)}
//             className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
//           >
//             <div className="bg-[#e6d281]/30 p-2 rounded-xl shadow-sm">
//               <Egg className="h-6 w-6 text-[#e6d281]" />
//             </div>
//             <div>
//               <h1 className="text-lg text-gray-800 leading-tight">Eggception</h1>
//               <span className="text-xs text-gray-500">Admin Dashboard</span>
//             </div>
//           </Link>
//         </div>

//         {/* Scrollable Content Area */}
//         <div className="flex-1 overflow-y-auto">
//           <nav className="px-4 py-3 space-y-1">
//             {navItems.map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 onClick={() => setMobileMenuOpen(false)}
//                 className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
//                   isActive(item.href)
//                     ? "bg-[#e6d281]/20 text-[#e6d281] font-semibold"
//                     : "text-gray-700 hover:bg-gray-50"
//                 }`}
//               >
//                 <span className={`${isActive(item.href) ? "text-[#e6d281]" : "text-gray-500"}`}>
//                   {item.icon}
//                 </span>
//                 <span>{item.label}</span>
//               </Link>
//             ))}
//           </nav>
//         </div>

//         {/* Fixed Logout Button at Bottom */}
//         <div className="mt-auto p-4 border-t border-gray-200 bg-white">
//           <button
//             onClick={() => alert("Logout clicked")}
//             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Logout</span>
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// }
