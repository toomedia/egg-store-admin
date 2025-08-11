'use client';
import React from 'react';
import { Bell, Search } from 'lucide-react';
const Topbar: React.FC = () => {
  return (
    <header className="bg-white w-full px-6 py-4 flex items-center justify-between shadow-sm font-manrope">
      <div className="relative w-full max-w-sm">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Search orders, presets, customers..."
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>
      <div className="flex items-center space-x-6 ml-4">
        <div className="relative">
          <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            2
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center text-sm font-bold shadow-md cursor-pointer">
          A
        </div>
      </div>
    </header>
  );
};

export default Topbar;
