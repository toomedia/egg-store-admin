"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "../../../utils/supabaseClient";
import {
  Users,
  UserPlus,
  UserCog,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar
} from "lucide-react";
import { getItem, setItem } from "@/utils/indexedDB";
interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
  avatar_url: string | null;
  isAdmin: boolean;
}

const AdminManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const itemsPerPage = 10;
  const roles = ['admin'];
  const statuses = ['active', 'inactive', 'pending'];

  // IndexedDB constants
  const DB_NAME = 'egg-store-db';
  const STORE_NAME = 'users';

  useEffect(() => {
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
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setLoading(false);
          return;
        }
        
        allUsers = data || [];
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
        const { data, error } = await supabase
          .from("users")
          .select("count")
          .single();
        
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {

        try {
          const storedUsers = await getItem(DB_NAME, STORE_NAME, "allUsers");
          const allUsers = Array.isArray(storedUsers) ? storedUsers : [];
          setUsers(allUsers);
        } catch (indexedDBError) {
        }
        
        setLoading(false);
        return;
      }
      
      const allUsers = data || [];
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
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRole = 
        roleFilter === 'all' || 
        user.role === roleFilter;
      
      const matchesStatus = 
        statusFilter === 'all' || 
        user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === '') return;
    
    try {
      // Set isAdmin to true when role is admin
      const isAdmin = newRole === 'admin';
      
      // First try using auth admin API (doesn't rely on schema cache)
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { role: newRole, isAdmin: isAdmin }
        }
      );

      if (!authError) {
        showNotification('success', 'User role updated successfully');
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole, isAdmin: isAdmin } : user
        ));
        return;
      }

      // Fallback: Try direct update bypassing schema cache
      // Using a different approach that doesn't cache the schema
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ role: newRole, isAdmin: isAdmin })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showNotification('success', 'User role updated successfully');
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole, isAdmin: newRole === 'admin' } : user
      ));
    } catch (error: any) {
      showNotification('error', `Failed to update role: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        showNotification('error', `Failed to update status: ${error.message}`);
        throw error;
      }
      showNotification('success', 'User status updated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) {
        showNotification('error', `Failed to activate user: ${error.message}`);
        throw error;
      }
      showNotification('success', 'User activated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ));
    } catch (error) {
    }
  };

  const handleDeactivateUser = async (userId: string) => {

    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) {
        showNotification('error', `Failed to deactivate user: ${error.message}`);
        throw error;
      }

      showNotification('success', 'User deactivated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'inactive' } : user
      ));
    } catch (error) {
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        showNotification('error', `Failed to delete user: ${error.message}`);
        throw error;
      }

      showNotification('success', 'User deleted successfully');
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (error) {
      showNotification('error', 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      return;
    }
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const userId of selectedUsers) {
        try {
          await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }
      
      if (errorCount > 0) {
        showNotification('warning', `Deleted ${successCount} users, failed to delete ${errorCount}`);
      } else {
        showNotification('success', `Successfully deleted ${successCount} users`);
      }
      
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    } catch (error) {
      showNotification('error', 'Error during bulk delete operation');
    }
  };

  const handleSendInvite = async (email: string, role: string) => {
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showNotification('error', 'Please enter a valid email address');
      return;
    }
    
    setIsSendingInvite(true);
    
    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email);
        
      if (checkError) {
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        showNotification('warning', 'User with this email already exists');
        return;
      }
    
      const { data: newUser, error: dbError } = await supabase
        .from('users')
        .insert({
          email,
          status: 'pending',
          role: role
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role }
      });

      if (inviteError) {
        
        showNotification('warning', 'User created but invitation failed to send');
        setUsers(prev => [newUser, ...prev]);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('admin');
        return;
      }

      showNotification('success', 'Invitation sent successfully!');
      setUsers(prev => [newUser, ...prev]);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('admin');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) {
      return;
    }
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: editUser.name,
          role: editUser.role,
          status: editUser.status
        })
        .eq('id', editUser.id);

      if (error) {
        showNotification('error', `Failed to update user: ${error.message}`);
        throw error;
      }
      showNotification('success', 'User updated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === editUser.id ? editUser : user
      ));
      setIsEditing(false);
      setEditUser(null);
    } catch (error) {
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="mr-2" size={20} />
          ) : notification.type === 'error' ? (
            <XCircle className="mr-2" size={20} />
          ) : (
            <AlertCircle className="mr-2" size={20} />
          )}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
              <Shield className="text-[#e6d281] mr-2" size={24} />
              User Manager
            </h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
         
          </div>
          <div className="flex gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={refreshUsers}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
              Refresh
            </button>
            <button 
              className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
              onClick={() => setShowInviteModal(true)}
              disabled={isSendingInvite}
            >
              {isSendingInvite ? (
                <Loader2 className="mr-2 animate-spin" size={18} />
              ) : (
                <UserPlus className="mr-2" size={18} />
              )}
              Invite User
            </button>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Invite User</h3>
              <button onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('admin');
              }}>
                <XCircle className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('admin');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-md flex items-center"
                  onClick={() => handleSendInvite(inviteEmail, inviteRole)}
                  disabled={isSendingInvite || !inviteEmail}
                >
                  {isSendingInvite ? (
                    <Loader2 className="mr-2 animate-spin" size={16} />
                  ) : (
                    <Mail className="mr-2" size={16} />
                  )}
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedUsers.length} selected</span>
              <button 
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md text-sm font-medium flex items-center hover:bg-red-200"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-1" size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {isEditing && editUser && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit User</h3>
              <button onClick={() => setIsEditing(false)}>
                <XCircle className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={editUser.name || ''}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={editUser.status}
                  onChange={(e) => setEditUser({...editUser, status: e.target.value})}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-md"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <Users className="text-gray-300 mb-4" size={32} />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <p className="text-sm text-gray-500">Fetching data...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="mx-auto text-gray-400 mb-4" size={40} />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Invite some users or try different filters'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
                        checked={selectedUsers.length === currentItems.length && currentItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(currentItems.map(user => user.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((user) => (
                    <tr 
                      key={user.id} 
                      className={selectedUsers.includes(user.id) ? 'bg-[#e6d281]/10' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img className="h-10 w-10 rounded-full" src={user.avatar_url} alt="" />
                            ) : (
                              <span className="text-gray-600">
                                {(user.email || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className={`text-sm ${user.role === 'admin' ? 'text-red-600' : 'text-gray-600'} bg-transparent border-none focus:ring-1 focus:ring-[#e6d281] rounded`}
                          value={user.role || ''}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          <option value="">Select Role</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.status === 'active' ? (
                              <CheckCircle className="mr-1" size={12} />
                            ) : user.status === 'inactive' ? (
                              <XCircle className="mr-1" size={12} />
                            ) : (
                              <Loader2 className="mr-1 animate-spin" size={12} />
                            )}
                            {(user.status || 'inactive').charAt(0).toUpperCase() + (user.status || 'inactive').slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            className="text-gray-600 hover:text-[#e6d281] p-1"
                            onClick={() => {
                              setEditUser(user);
                              setIsEditing(true);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              className="text-gray-600 hover:text-orange-500 p-1"
                              onClick={() => handleDeactivateUser(user.id)}
                              title="Deactivate user"
                            >
                              <Lock size={16} />
                            </button>
                          ) : (
                            <button
                              className="text-gray-600 hover:text-green-500 p-1"
                              onClick={() => handleActivateUser(user.id)}
                              title="Activate user"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                          <button
                            className="text-gray-600 hover:text-red-500 p-1"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                          {user.status === 'pending' && (
                            <button
                              className="text-gray-600 hover:text-green-500 p-1"
                              onClick={() => handleSendInvite(user.email, user.role)}
                              title="Resend invite"
                            >
                              <Mail size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
                      <span className="font-medium">{filteredUsers.length}</span> users
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-[#e6d281] border-[#e6d281] text-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminManager;
