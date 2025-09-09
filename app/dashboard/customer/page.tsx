"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import {
  User,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ShieldCheck,
  ShieldOff,
  RefreshCw,
} from "lucide-react";
import { getItem, setItem } from "@/utils/indexedDB";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const DB_NAME = "egg-store-db";
    const STORE_NAME = "users";
  
    const fetchAllUsers = async () => {
      try {
        let allUsers: any[] = [];
        let dataSource = "IndexedDB";
        try {
          const storedUsers = await getItem(DB_NAME, STORE_NAME, "allUsers");
          const storedTimestamp = await getItem(DB_NAME, STORE_NAME, "lastSyncTime");
          
          allUsers = Array.isArray(storedUsers) ? storedUsers : [];
          
          if (storedTimestamp) {
            setLastSync(new Date(storedTimestamp));
          }
          
          if (allUsers.length > 0) {
            console.log("Data fetched from: IndexedDB");
            setUsers(allUsers);
            setLoading(false);
            
            checkForSupabaseUpdates();
            return;
          }
        } catch (indexedDBError) {
        }
        
        const { data, error } = await supabase.from("users").select("*").order('created_at', { ascending: false });
        
        if (error) {
          setLoading(false);
          return;
        }
        
        allUsers = data || [];
        console.log("Data fetched from: Supabase (Initial Load)");

        try {
          await setItem(DB_NAME, STORE_NAME, "allUsers", allUsers);
          const now = Date.now();
          await setItem(DB_NAME, STORE_NAME, "lastSyncTime", now);
          setLastSync(new Date(now));
        } catch (indexedDBError) {
       
        }
  
        setUsers(allUsers);
        setLoading(false);
  
      } catch (err) {
        setLoading(false);
      }
    };
    const checkForSupabaseUpdates = async () => {
      try {
        const { data, error } = await supabase.from("users").select("count").single();
        
        if (error) {
          return;
        }
        
        const currentCount = users.length;
        const latestCount = data?.count || 0;
        
        if (latestCount > currentCount) {
          refreshUsers();
        }
      } catch (err) {
      }
    };
  
    fetchAllUsers();
    const channel = supabase
      .channel("public:users")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "users" 
        },
        async (payload) => {
          try {
            const DB_NAME = "egg-store-db";
            const STORE_NAME = "users";
            
            const storedUsers = await getItem(DB_NAME, STORE_NAME, "allUsers");
            let existingUsers: any[] = Array.isArray(storedUsers) ? storedUsers : [];
            
            if (payload.eventType === "INSERT") {
              existingUsers = [payload.new, ...existingUsers];
            } else if (payload.eventType === "UPDATE") {
              existingUsers = existingUsers.map(user => 
                user.id === payload.new.id ? { ...user, ...payload.new } : user
              );
            } else if (payload.eventType === "DELETE") {
              existingUsers = existingUsers.filter(user => user.id !== payload.old.id);
            }
            
            await setItem(DB_NAME, STORE_NAME, "allUsers", existingUsers);
            await setItem(DB_NAME, STORE_NAME, "lastSyncTime", Date.now());
            
            // Update UI
            setUsers(existingUsers);
            setLastSync(new Date());
          } catch (error) {
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  }, [users.length]);

  const refreshUsers = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.from("users").select("*").order('created_at', { ascending: false });
      
      if (error) {
        try {
          const storedUsers = await getItem("egg-store-db", "users", "allUsers");
          const allUsers = Array.isArray(storedUsers) ? storedUsers : [];
          setUsers(allUsers);
        } catch (indexedDBError) {
      
        }
        
        setLoading(false);
        return;
      }
      
      const allUsers = data || [];
      
      try {
        await setItem("egg-store-db", "users", "allUsers", allUsers);
        const now = Date.now();
        await setItem("egg-store-db", "users", "lastSyncTime", now);
        setLastSync(new Date(now));
      } catch (indexedDBError) {
     
      }
      
      setUsers(allUsers);
      setLoading(false);
      
    } catch (err) {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const email = user.email || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.status === "active") ||
      (statusFilter === "inactive" && user.status === "inactive");

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <User className="text-[#e6d281] mr-2" size={24} />
              Customer Management
            </h1>
            <p className="text-gray-500 mt-1">
              Manage all your customers in one place
            </p>
        
          </div>
          <button
            onClick={refreshUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-white rounded-lg hover:bg-[#d4c070] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by name or email"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <User className="mx-auto mb-2 text-gray-300" size={32} />
            <p>No users found.</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search query</p>
            )}
          </div>
        ) : (
          <table className="min-w-full text-left text-sm text-gray-600">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Is Admin</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <td className="px-4 py-3 font-medium">{user.name || "—"}</td>
                  <td className="px-4 py-3">{user.email || "—"}</td>
                  <td className="px-4 py-3">
                    {user.isAdmin === true || user.isAdmin === "true" ? (
                      <span className="inline-flex items-center text-green-600 font-medium">
                        <ShieldCheck className="mr-1" size={14} /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-400">
                        <ShieldOff className="mr-1" size={14} /> No
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Calendar className="mr-2 text-gray-400" size={14} />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;