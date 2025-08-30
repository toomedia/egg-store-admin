"use client";
import React, { useEffect, useState } from "react";
import { getItem, setItem } from "@/utils/indexedDB";
import { supabase } from "../../../utils/supabaseClient";
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiUser,
  FiHome,
  FiMapPin,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiCreditCard,
  FiChevronRight,
  FiArrowLeft,
  FiMail
} from "react-icons/fi";

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const DB_NAME = "egg-store-db";
  const STORE_NAME = "orders";


  const statuses = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending' },
    { id: 'processing', name: 'Processing' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  const generateOrderId = () => {
    return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  useEffect(() => {
          const fetchAllOrders = async () => {
        try {
          let allOrders: any[] = [];
          
          try {
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            allOrders = Array.isArray(storedOrders) ? storedOrders : [];
          } catch (indexedDBError) {
            console.warn("IndexedDB not available, fetching from Supabase directly:", indexedDBError);
          }

          if (allOrders.length > 0) {
            console.log("🚀 Loaded orders from IndexedDB:", allOrders);
          } else {
            const { data, error } = await supabase.from("orders").select("*");
            if (error) {
              console.error("🚀 Error fetching orders:", error);
              setLoading(false);
              return;
            }
            allOrders = data || [];
            
            try {
              await setItem(DB_NAME, STORE_NAME, "allOrders", allOrders);
            } catch (indexedDBError) {
              console.warn("Could not save to IndexedDB:", indexedDBError);
            }
            
            console.log("🚀 Fetched orders from Supabase:", allOrders);
          }

          setOrders(allOrders);
          setLoading(false);
        } catch (err) {
          console.error("🚀 Unexpected error:", err);
          setLoading(false);
        }
      };

    fetchAllOrders();

          const channel = supabase
        .channel("public:orders")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
          async (payload) => {
            console.log("🚀 New order inserted:", payload.new);
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            const existingOrders: any[] = Array.isArray(storedOrders) ? storedOrders : [];
            const updatedOrders = [...existingOrders, payload.new];
            await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
            setOrders(updatedOrders);
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (order.order_id?.toLowerCase() || '').includes(search) ||
      (order.user_info?.firstName?.toLowerCase() || '').includes(search) ||
      (order.user_info?.email?.toLowerCase() || '').includes(search);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}><FiCheckCircle className="mr-1.5" />Completed</span>;
      case 'processing':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}><FiTruck className="mr-1.5" />Processing</span>;
      case 'cancelled':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}><FiXCircle className="mr-1.5" />Cancelled</span>;
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}><FiPackage className="mr-1.5" />Pending</span>;
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getImage = (design: any) => {
    if (design?.preset_images?.[0]) return design.preset_images[0];
    if (design?.image) return design.image;
    return "/placeholder.png";
  };

  const getName = (design: any) => {
    return design?.preset_name?.en_name || design?.name || 'Untitled Design';
  };

  const getCategory = (design: any) => {
    return design?.preset_category?.en_category || design?.category || 'Uncategorized';
  };

  // ----------- ORDER DETAIL VIEW ------------
  if (selectedOrder) {
    const { user_info, preset_object } = selectedOrder;
    const designs = Array.isArray(preset_object) ? preset_object : [preset_object];

   return (
  <div className="container mx-auto px-4 py-8 max-w-6xl">
    <button
      onClick={() => setSelectedOrder(null)}
      className="mb-6 flex items-center text-[#e6d281] hover:text-[#d4c070] transition-colors"
    >
      <FiArrowLeft className="mr-2" size={18} />
      Back to Orders
    </button>

    {/* Main Order Container */}
    <div className="bg-white rounded-lg shadow-sm">
      {/* Order Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Order #{selectedOrder.order_id}
            </h1>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <FiCalendar className="mr-1.5" size={14} />
              {formatDate(selectedOrder.created_at)}
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            {getStatusBadge(selectedOrder.status)}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Customer & Order Info Section */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Column */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">CUSTOMER</h3>
              <p className="text-gray-800">{user_info?.firstName} {user_info?.lastName}</p>
              <p className="text-gray-600 mt-1">{user_info?.email}</p>
              <p className="text-gray-600 mt-1">{user_info?.phone || 'No phone provided'}</p>
            </div>

            {/* Shipping Column */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">SHIPPING</h3>
              <p className="text-gray-800">{user_info?.address}</p>
              <p className="text-gray-600">
                {user_info?.city}, {user_info?.state} {user_info?.postalCode}
              </p>
              <p className="text-gray-600">{user_info?.country}</p>
            </div>

            {/* Payment Column */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">PAYMENT</h3>
              <p className="text-gray-800 font-medium">${selectedOrder.payment}</p>
              <p className="text-gray-600 mt-1">
                {selectedOrder.payment_method || 'Credit Card'}
              </p>
            </div>
          </div>
        </section>

        {/* Order Items Section */}
        <section>
          <h2 className="text-lg font-medium text-gray-800 mb-4">
            {designs.length} {designs.length === 1 ? 'Item' : 'Items'} Purchased
          </h2>

          {/* Product Name and Category (shown once) */}
          {designs.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-800">
                {getName(designs[0])}
              </h3>
              <p className="text-sm text-gray-600">
                {getCategory(designs[0])}
              </p>
            </div>
          )}

          {/* All Product Images in a Single Row */}
          <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
            {designs.map((design, idx) => (
              <div key={idx} className="flex-shrink-0 relative group">
                <div className="w-32 h-32 bg-gray-50 rounded border flex items-center justify-center">
                  <img
                    src={getImage(design)}
                    alt={getName(design)}
                    className="max-w-full max-h-full object-contain p-2"
                    onError={(e) => e.currentTarget.src = "/placeholder.png"}
                  />
                </div>
                <div className="absolute inset-0  bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded"></div>
              </div>
            ))}
          </div>

          {/* Quantity Summary */}
          <div className="text-sm text-gray-800">
            Total Quantity: {designs.reduce((sum, d) => sum + (d?.quantity || 1), 0)}
          </div>
        </section>
      </div>
    </div>
  </div>
);
  }

  // ---------- ORDER LIST VIEW -----------
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-lg bg-[#f8f5e8]">
            <FiPackage className="text-[#e6d281]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by order ID, name, or email..."
              className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" size={18} />
            </div>
            <select
              className="pl-10 w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:border-transparent appearance-none"
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
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <FiPackage className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-1">No orders found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => {
            const designs = Array.isArray(order.preset_object) 
              ? order.preset_object 
              : [order.preset_object];
            const firstTwoDesigns = designs.slice(0, 2);
            const customerName = order.user_info?.firstName 
              ? `${order.user_info.firstName} ${order.user_info.lastName || ''}` 
              : 'Unknown Customer';

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-[#e6d281] group"
              >
                {/* Images Section */}
                <div className="flex p-4 gap-2 bg-gray-50 border-b border-gray-200">
                  {firstTwoDesigns.map((design:any, idx:any) => (
                    <div key={idx} className="relative w-1/2 aspect-square rounded-lg overflow-hidden bg-white">
                      <img
                        src={getImage(design)}
                        alt={getName(design)}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.png";
                        }}
                      />
                      {designs.length > 2 && idx === 1 && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-sm font-medium">
                          +{designs.length - 2} more
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Order Info Section */}
                <div className="p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800">Order #{order.order_id}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <FiUser className="mr-1.5" size={14} />
                      {customerName}
                    </p>
                  </div>

                  {/* Design Names and Categories */}
                 <div className="mb-4 space-y-2">
  {designs.length > 0 && (
    <div>
      <p className="text-sm font-medium text-gray-800 truncate">
        {getName(designs[0])}
      </p>
      <p className="text-xs text-gray-500">
        {getCategory(designs[0])}
      </p>
    </div>
  )}
  {/* {designs.length > 1 && (
    <p className="text-xs text-gray-500">
      +{designs.length - 1} more items
    </p>
  )} */}
</div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-700 flex items-center">
                        <FiDollarSign className="mr-1" size={14} />
                        ${order.payment}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getStatusBadge(order.status)}
                      <FiChevronRight 
                        className="ml-3 text-gray-400 group-hover:text-[#e6d281] transition-colors" 
                        size={18}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;