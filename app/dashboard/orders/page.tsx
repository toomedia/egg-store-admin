"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../../utils/supabaseClient";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Mail,
  ArrowLeft,
} from "lucide-react";

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const statuses = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending', icon: <Package className="text-yellow-500" size={16} /> },
    { id: 'processing', name: 'Processing', icon: <Truck className="text-blue-500" size={16} /> },
    { id: 'completed', name: 'Completed', icon: <CheckCircle className="text-green-500" size={16} /> },
    { id: 'cancelled', name: 'Cancelled', icon: <XCircle className="text-red-500" size={16} /> },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching orders:', error);

      const parsedOrders = (data || []).map(order => ({
        ...order,
        // Fix: Parse preset_object if it's a string
        preset_object:
          typeof order.preset_object === "string"
            ? JSON.parse(order.preset_object)
            : order.preset_object,
        user_info:
          typeof order.user_info === "string"
            ? JSON.parse(order.user_info)
            : order.user_info,
      }));

      setOrders(parsedOrders);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (order.order_number?.toLowerCase() || '').includes(search) ||
      (order.customer_name?.toLowerCase() || '').includes(search) ||
      (order.customer_email?.toLowerCase() || '').includes(search);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 inline-flex items-center"><CheckCircle size={12} className="mr-1" />Completed</span>;
      case 'processing':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center"><Truck size={12} className="mr-1" />Processing</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 inline-flex items-center"><XCircle size={12} className="mr-1" />Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 inline-flex items-center"><Package size={12} className="mr-1" />Pending</span>;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // ----------- ORDER DETAIL VIEW ------------
  if (selectedOrder) {
    const { user_info, preset_object } = selectedOrder;

    return (
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-4 flex items-center text-[#e6d281] hover:text-[#d4c070]"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </button>

        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
            <div>
              <h2 className="font-semibold text-gray-700 mb-1">Payment Info</h2>
              <p className="text-sm text-gray-800">€{selectedOrder.payment}</p>
              <p className="text-sm text-gray-600">{selectedOrder.payment_method || 'Paid'}</p>
            </div>

            {/* Status */}
            <div>
              <h2 className="font-semibold text-gray-700 mb-1">Status</h2>
              {getStatusBadge(selectedOrder.status)}
            </div>

            {/* Created At */}
            <div>
              <h2 className="font-semibold text-gray-700 mb-1">Created At</h2>
              <p className="text-sm text-gray-800">{formatDate(selectedOrder.created_at)}</p>
            </div>

            {/* User Info */}
            {user_info && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Billing Details</h2>
                <p className="text-sm text-gray-800">{user_info.firstName} {user_info.lastName}</p>
                <p className="text-sm text-gray-800">{user_info.address}</p>
                <p className="text-sm text-gray-800">{user_info.city}</p>
                <p className="text-sm text-gray-800">{user_info.country}</p>
                <p className="text-sm text-gray-600">{user_info.email}</p>
                {user_info.phone && <p className="text-sm text-gray-600">Phone: {user_info.phone}</p>}
              </div>
            )}

            {/* Preset Object */}
            {preset_object && (
              <div>
                <h2 className="font-semibold text-gray-700 mb-1">Preset Object</h2>
                {preset_object.title && <p className="text-sm text-gray-800 font-medium">{preset_object.title}</p>}
                {preset_object.description && <p className="text-sm text-gray-600">{preset_object.description}</p>}
                {preset_object.color && <p className="text-sm text-gray-600">Color: {preset_object.color}</p>}
                {preset_object.size && <p className="text-sm text-gray-600">Size: {preset_object.size}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- ORDER LIST VIEW -----------
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
              <Package className="text-[#e6d281] mr-2" size={24} />
              Order Management
            </h1>
            <p className="text-gray-600">View and manage all customer orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-gray-400" size={16} />
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center animate-pulse">
            <Package className="text-gray-300 mb-4 mx-auto" size={32} />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-sm text-gray-800 mb-1">Order ID: {order.id}</h2>
                  <p className="text-sm text-gray-600">{order.order_number}</p>
                  <p className="text-sm text-gray-600">€{order.payment} • {order.payment_method || 'Paid'}</p>
                  <p className="text-sm text-gray-800">{formatDate(order.created_at)}</p>
                  <div className="mt-2">{getStatusBadge(order.status)}</div>
                </div>
                <button className="text-[#e6d281] hover:text-[#d4c070]">
                  <Mail size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
