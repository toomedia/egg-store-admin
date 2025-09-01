
"use client"
import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from "lucide-react";

// Define a proper type for the user
interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  created_at: string;
  avatar_url: string | null;
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
  
  const itemsPerPage = 10;
  const roles = ['admin']; // Only admin role available
  const statuses = ['active', 'inactive', 'pending'];

  // Show notification and auto-hide after 5 seconds
  const showNotification = (type: string, message: string) => {
    console.log(`Notification: ${type} - ${message}`);
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    console.log("AdminManager component mounted");
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    console.log("Fetching users from database...");
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        showNotification('error', `Failed to load users: ${error.message}`);
        throw error;
      }
      
      // Ensure all users have required fields with default values
      const usersWithDefaults = (data || []).map(user => ({
        id: user.id || '',
        email: user.email || '',
        name: user.name || null,
        role: user.role || 'viewer',
        status: user.status || 'inactive',
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: user.avatar_url || null
      }));
      
      console.log(`Successfully fetched ${usersWithDefaults.length} users`, usersWithDefaults);
      setUsers(usersWithDefaults);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
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
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    console.log(`Changing to page ${pageNumber}`);
    setCurrentPage(pageNumber);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (newRole === '') return; // Don't do anything if "Select Role" is chosen
    
    console.log(`Changing role for user ${userId} to ${newRole}`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        showNotification('error', `Failed to update role: ${error.message}`);
        throw error;
      }

      console.log(`Successfully updated role for user ${userId}`);
      showNotification('success', 'User role updated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    console.log(`Changing status for user ${userId} to ${newStatus}`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating status:', error);
        showNotification('error', `Failed to update status: ${error.message}`);
        throw error;
      }

      console.log(`Successfully updated status for user ${userId}`);
      showNotification('success', 'User status updated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
    }
  };

  const handleActivateUser = async (userId: string) => {
    console.log(`Activating user ${userId}`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', userId);

      if (error) {
        console.error('Error activating user:', error);
        showNotification('error', `Failed to activate user: ${error.message}`);
        throw error;
      }

      console.log(`Successfully activated user ${userId}`);
      showNotification('success', 'User activated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'active' } : user
      ));
    } catch (error) {
      console.error('Error in handleActivateUser:', error);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    console.log(`Deactivating user ${userId}`);
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (error) {
        console.error('Error deactivating user:', error);
        showNotification('error', `Failed to deactivate user: ${error.message}`);
        throw error;
      }

      console.log(`Successfully deactivated user ${userId}`);
      showNotification('success', 'User deactivated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'inactive' } : user
      ));
    } catch (error) {
      console.error('Error in handleDeactivateUser:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    console.log(`Attempting to delete user ${userId}`);
    if (!confirm('Are you sure you want to delete this user?')) {
      console.log("User deletion cancelled");
      return;
    }
    
    try {
      console.log("Deleting user from database first...");
      // First delete from database
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user from database:', error);
        showNotification('error', `Failed to delete user: ${error.message}`);
        throw error;
      }

      console.log("Now attempting to delete user from authentication service...");
      // Then try to delete from auth (but handle potential errors gracefully)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('Note: Could not delete user from auth (may not exist or insufficient permissions):', authError);
          // We'll still proceed since the database record was deleted
        } else {
          console.log("Successfully deleted user from auth service");
        }
      } catch (authError) {
        console.warn('Auth deletion failed, but continuing since database record was deleted:', authError);
      }

      console.log(`Successfully deleted user ${userId} from database`);
      showNotification('success', 'User deleted successfully');
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      showNotification('error', 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    console.log(`Attempting bulk delete of ${selectedUsers.length} users`);
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
      console.log("Bulk deletion cancelled");
      return;
    }
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const userId of selectedUsers) {
        try {
          console.log(`Deleting user ${userId}...`);
          // First delete from database
          await supabase
            .from('users')
            .delete()
            .eq('id', userId);
          
          // Then try to delete from auth (but don't fail if it doesn't work)
          try {
            await supabase.auth.admin.deleteUser(userId);
          } catch (authError) {
            console.warn(`Could not delete user ${userId} from auth:`, authError);
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error deleting user ${userId}:`, error);
          errorCount++;
        }
      }

      console.log(`Bulk delete completed: ${successCount} successful, ${errorCount} failed`);
      
      if (errorCount > 0) {
        showNotification('warning', `Deleted ${successCount} users, failed to delete ${errorCount}`);
      } else {
        showNotification('success', `Successfully deleted ${successCount} users`);
      }
      
      setUsers(prev => prev.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error in handleBulkDelete:', error);
      showNotification('error', 'Error during bulk delete operation');
    }
  };

  const handleSendInvite = async (email: string, role: string) => {
    console.log(`Sending invite to: ${email} with role: ${role}`);
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format');
      showNotification('error', 'Please enter a valid email address');
      return;
    }
    
    setIsSendingInvite(true);
    
    try {
      console.log("Step 1: Checking if user already exists...");
      // 1. Check if user exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email);
        
      if (checkError) {
        console.error('Error checking existing users:', checkError);
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        console.log('User already exists with this email');
        showNotification('warning', 'User with this email already exists');
        return;
      }
      
      console.log("Step 2: Creating user in database...");
      // 2. Create user in database
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
        console.error('Error creating user in database:', dbError);
        throw dbError;
      }

      console.log("Step 3: Sending invitation email...");
      // 3. Send invitation (NO SMTP NEEDED)
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: role }
      });

      if (inviteError) {
        console.error('Error sending invitation:', inviteError);
        
        // Even if invite fails, we'll keep the user record but show a warning
        showNotification('warning', 'User created but invitation failed to send');
        setUsers(prev => [newUser, ...prev]);
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('admin');
        return;
      }

      console.log("Step 4: Success! Invitation sent");
      // 4. Success
      showNotification('success', 'Invitation sent successfully!');
      setUsers(prev => [newUser, ...prev]);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('admin');
    } catch (error: any) {
      console.error('Error in handleSendInvite:', error);
      showNotification('error', error.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editUser) {
      console.log("No user selected for editing");
      return;
    }
    
    console.log(`Saving edits for user ${editUser.id}`, editUser);
    
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
        console.error('Error updating user:', error);
        showNotification('error', `Failed to update user: ${error.message}`);
        throw error;
      }

      console.log("User updated successfully");
      showNotification('success', 'User updated successfully');
      
      setUsers(prev => prev.map(user => 
        user.id === editUser.id ? editUser : user
      ));
      setIsEditing(false);
      setEditUser(null);
    } catch (error) {
      console.error('Error in handleSaveEdit:', error);
    }
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
              className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
              onClick={() => {
                console.log("Opening invite modal");
                setShowInviteModal(true);
              }}
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
                console.log("Closing invite modal");
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
                  onChange={(e) => {
                    console.log("Invite email changed:", e.target.value);
                    setInviteEmail(e.target.value);
                  }}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={inviteRole}
                  onChange={(e) => {
                    console.log("Invite role changed:", e.target.value);
                    setInviteRole(e.target.value);
                  }}
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    console.log("Cancelling invite");
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteRole('admin');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-md flex items-center"
                  onClick={() => {
                    console.log("Sending invite to:", inviteEmail);
                    handleSendInvite(inviteEmail, inviteRole);
                  }}
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
                console.log("Search query changed:", e.target.value);
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
                console.log("Role filter changed:", e.target.value);
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
                console.log("Status filter changed:", e.target.value);
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
                onClick={() => {
                  console.log("Bulk delete initiated for:", selectedUsers.length, "users");
                  handleBulkDelete();
                }}
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
              <button onClick={() => {
                console.log("Closing edit modal");
                setIsEditing(false);
              }}>
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
                  onChange={(e) => {
                    console.log("Edit user name changed:", e.target.value);
                    setEditUser({...editUser, name: e.target.value});
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={editUser.role}
                  onChange={(e) => {
                    console.log("Edit user role changed:", e.target.value);
                    setEditUser({...editUser, role: e.target.value});
                  }}
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={editUser.status}
                  onChange={(e) => {
                    console.log("Edit user status changed:", e.target.value);
                    setEditUser({...editUser, status: e.target.value});
                  }}
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    console.log("Cancelling edit");
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-md"
                  onClick={() => {
                    console.log("Saving edits");
                    handleSaveEdit();
                  }}
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
                            console.log("Selecting all users on current page");
                            setSelectedUsers(currentItems.map(user => user.id));
                          } else {
                            console.log("Deselecting all users");
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
                              console.log("Selecting user:", user.id);
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              console.log("Deselecting user:", user.id);
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
                          onChange={(e) => {
                            console.log(`Changing role for user ${user.id} to:`, e.target.value);
                            handleRoleChange(user.id, e.target.value);
                          }}
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
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            className="text-gray-600 hover:text-[#e6d281] p-1"
                            onClick={() => {
                              console.log("Editing user:", user.id);
                              setEditUser(user);
                              setIsEditing(true);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              className="text-gray-600 hover:text-orange-500 p-1"
                              onClick={() => {
                                console.log("Deactivating user:", user.id);
                                handleDeactivateUser(user.id);
                              }}
                              title="Deactivate user"
                            >
                              <Lock size={16} />
                            </button>
                          ) : (
                            <button
                              className="text-gray-600 hover:text-green-500 p-1"
                              onClick={() => {
                                console.log("Activating user:", user.id);
                                handleActivateUser(user.id);
                              }}
                              title="Activate user"
                            >
                              <Unlock size={16} />
                            </button>
                          )}
                          <button
                            className="text-gray-600 hover:text-red-500 p-1"
                            onClick={() => {
                              console.log("Deleting user:", user.id);
                              handleDeleteUser(user.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                          {user.status === 'pending' && (
                            <button
                              className="text-gray-600 hover:text-green-500 p-1"
                              onClick={() => {
                                console.log("Resending invite to:", user.email);
                                handleSendInvite(user.email, user.role);
                              }}
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
                    onClick={() => {
                      console.log("Previous page");
                      handlePageChange(currentPage - 1);
                    }}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      console.log("Next page");
                      handlePageChange(currentPage + 1);
                    }}
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