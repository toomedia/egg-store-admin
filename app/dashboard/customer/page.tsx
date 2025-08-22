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
} from "lucide-react";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <User className="text-[#e6d281] mr-2" size={24} />
          Customer Management
        </h1>
        <p className="text-gray-500 mt-1">
          Manage all your customers in one place
        </p>
      </div>

      {/* Filters */}
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

          {/* Status Filter */}
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

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500">No users found.</div>
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
                  <td className="px-4 py-3">{user.name || "—"}</td>
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
