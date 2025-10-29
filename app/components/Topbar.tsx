'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, X } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const Topbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize search query from URL params
  useEffect(() => {
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
  }, [searchParams]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      
      return (query: string) => {
        clearTimeout(timeoutId);
        
        if (query.trim()) {
          setIsSearching(true);
          timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('q', query.trim());
            router.push(`${pathname}?${params.toString()}`);
            setIsSearching(false);
          }, 500); // 500ms delay
        } else {
          // If query is empty, remove search param
          const params = new URLSearchParams(searchParams.toString());
          params.delete('q');
          router.push(`${pathname}?${params.toString()}`);
        }
      };
    })(),
    [router, pathname, searchParams]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    router.push(`${pathname}?${params.toString()}`);
  };

  const getSearchContext = () => {
    if (pathname.includes('/orders')) return 'orders';
    if (pathname.includes('/presets')) return 'presets';
    if (pathname.includes('/customers')) return 'customers';
    return 'dashboard';
  };

  const getPlaceholderText = () => {
    const context = getSearchContext();
    switch (context) {
      case 'orders':
        return 'Search by order ID, customer name, email...';
      case 'presets':
        return 'Search presets by name, description...';
      case 'customers':
        return 'Search customers by name, email...';
      default:
        return 'Search orders, presets, customers...';
    }
  };

  return (
    <header className="bg-white w-full px-6 py-4 flex items-center justify-between shadow-sm font-manrope">
      <div className="relative w-full max-w-sm">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder={getPlaceholderText()}
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-10 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:bg-white transition-all duration-200"
        />
        
        {/* Loading indicator */}
        {isSearching && (
          <div className="absolute inset-y-0 right-10 flex items-center">
            <div className="w-4 h-4 border-2 border-[#e6d281] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {/* Clear search button */}
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search results info */}
      {searchQuery && (
        <div className="hidden sm:flex items-center text-sm text-gray-600">
          <span className="bg-[#e6d281] bg-opacity-20 px-3 py-1 rounded-full">
            Searching {getSearchContext()} for "{searchQuery}"
          </span>
        </div>
      )}

    </header>
  );
};

export default Topbar;
