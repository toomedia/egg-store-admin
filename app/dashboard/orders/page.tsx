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
  FiMail,
  FiEdit,
  FiSave,
  FiLoader,
  FiRefreshCw
} from "react-icons/fi";

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const DB_NAME = "egg-store-db";
  const STORE_NAME = "orders";

  const paymentStatuses = [
    { id: 'all', name: 'All Orders' },
    { id: 'pending', name: 'Pending' },
    { id: 'processing', name: 'Processing' },
    { id: 'completed', name: 'Completed' },
    { id: 'cancelled', name: 'Cancelled' },
  ];

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        let allOrders: any[] = [];
        let shouldFetchFromSupabase = true;
        
        // First try to get orders from IndexedDB
        try {
          const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
          if (Array.isArray(storedOrders) && storedOrders.length > 0) {
            allOrders = storedOrders;
            shouldFetchFromSupabase = false;
            console.log("🚀 Loaded orders from IndexedDB:", allOrders.length);
          }
        } catch (indexedDBError) {
          console.warn("IndexedDB not available or empty, fetching from Supabase:", indexedDBError);
        }

        if (shouldFetchFromSupabase) {
          const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
          if (error) {
            console.error("🚀 Error fetching orders:", error);
            setError("Failed to load orders. Please refresh the page.");
            setLoading(false);
            return;
          }
          allOrders = data || [];
          
          // Store in IndexedDB for future use
          try {
            await setItem(DB_NAME, STORE_NAME, "allOrders", allOrders);
            console.log("Saved orders to IndexedDB:", allOrders.length);
          } catch (indexedDBError) {
            console.warn("Could not save to IndexedDB:", indexedDBError);
          }
          
          console.log("Fetched orders from Supabase:", allOrders.length);
        }

        setOrders(allOrders);
        setLoading(false);
      } catch (err) {
        console.error(" Unexpected error:", err);
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    fetchAllOrders();

    // Realtime subscription for orders
    const channel = supabase
      .channel("public:orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          console.log("🚀 New order inserted:", payload.new);
          try {
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            const existingOrders: any[] = Array.isArray(storedOrders) ? storedOrders : [];
            const updatedOrders = [payload.new, ...existingOrders]; // Add new order to the beginning
            await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
            setOrders(updatedOrders);
          } catch (err) {
            console.error("Error handling insert:", err);
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" },
        async (payload) => {
          console.log("Order updated:", payload.new);
          try {
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            const existingOrders: any[] = Array.isArray(storedOrders) ? storedOrders : [];
            const updatedOrders = existingOrders.map(order => 
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            );
            await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
            setOrders(updatedOrders);
            
            // Update selected order if it's the one being updated
            if (selectedOrder && selectedOrder.id === payload.new.id) {
              setSelectedOrder({ ...selectedOrder, ...payload.new });
            }
          } catch (err) {
            console.error("Error handling update:", err);
          }
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "orders" },
        async (payload) => {
          console.log("Order deleted:", payload.old);
          try {
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            const existingOrders: any[] = Array.isArray(storedOrders) ? storedOrders : [];
            const updatedOrders = existingOrders.filter(order => order.id !== payload.old.id);
            await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
            setOrders(updatedOrders);
            
            // Clear selected order if it's the one being deleted
            if (selectedOrder && selectedOrder.id === payload.old.id) {
              setSelectedOrder(null);
            }
          } catch (err) {
            console.error("Error handling delete:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrder]);

  const updateOrderPaymentStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          payment_status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId)
        .select();
        
      if (error) {
        console.error("Error updating order payment status:", error);
        
        // Handle specific error cases
        if (error.code === 'PGRST204') {
          setError("Database schema issue. Please check if the 'payment_status' column exists in your orders table.");
        } else {
          setError("Failed to update order payment status. Please try again.");
        }
      } else {
        console.log("Order payment status updated successfully:", data);
        
        // Update local state immediately for better UX
        const updatedOrders = orders.map(order => 
          order.id === orderId ? { ...order, payment_status: newStatus } : order
        );
        setOrders(updatedOrders);
        
        // Update IndexedDB
        try {
          await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
        } catch (indexedDBError) {
          console.warn("Could not update IndexedDB:", indexedDBError);
        }
        
        // Update selected order if it's the one being updated
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, payment_status: newStatus });
        }
      }
    } catch (err) {
      console.error("Unexpected error updating payment status:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const refreshOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("orders").select("*").order('created_at', { ascending: false });
      if (error) {
        console.error("Error refreshing orders:", error);
        setError("Failed to refresh orders. Please try again.");
        setLoading(false);
        return;
      }
      
      const allOrders = data || [];
      try {
        await setItem(DB_NAME, STORE_NAME, "allOrders", allOrders);
      } catch (indexedDBError) {
        console.warn("Could not save to IndexedDB:", indexedDBError);
      }
      
      setOrders(allOrders);
      setLoading(false);
    } catch (err) {
      console.error("Unexpected error refreshing orders:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const search = searchQuery.toLowerCase();
    const matchesSearch =
      (order.order_id?.toLowerCase() || '').includes(search) ||
      (order.user_info?.firstName?.toLowerCase() || '').includes(search) ||
      (order.user_info?.email?.toLowerCase() || '').includes(search);

    const matchesStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const getPaymentStatusBadge = (payment_status: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium";
    
    switch (payment_status) {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImage = (design: any) => {
    if (design?.preset_images?.length > 0) {
      // Select a random image from the preset_images array
      const randomIndex = Math.floor(Math.random() * design.preset_images.length);
      return design.preset_images[randomIndex];
    }
    if (design?.image) return design.image;
    return "/placeholder.png";
  };

  const getName = (design: any) => {
    return design?.preset_name?.en_name || design?.name || 'Untitled Design';
  };

  const getCategory = (design: any) => {
    return design?.preset_category?.en_category || design?.category || 'Uncategorized';
  };

  // Function to get unique random images for each design
  const getRandomImagesForDesigns = (designs: any[], count: number) => {
    const selectedImages = [];
    const availableImages = [];
    
    // Collect all available images from all designs
    for (const design of designs) {
      if (design?.preset_images?.length > 0) {
        availableImages.push(...design.preset_images);
      } else if (design?.image) {
        availableImages.push(design.image);
      }
    }
    
    // If no images available, return placeholder
    if (availableImages.length === 0) {
      return Array(count).fill("/placeholder.png");
    }
    
    // Select random unique images
    const usedIndices = new Set();
    while (selectedImages.length < count && selectedImages.length < availableImages.length) {
      const randomIndex = Math.floor(Math.random() * availableImages.length);
      if (!usedIndices.has(randomIndex)) {
        selectedImages.push(availableImages[randomIndex]);
        usedIndices.add(randomIndex);
      }
    }
    
    // If we need more images than available, fill with placeholders
    while (selectedImages.length < count) {
      selectedImages.push("/placeholder.png");
    }
    
    return selectedImages;
  };

  // Function to generate egg images for the grid
  const generateEggGrid = (designs: any[]) => {
    const totalEggs = 36; // 6x6 grid
    const eggImages = [];
    
    // Collect all available egg images from all designs
    const allEggImages = [];
    for (const design of designs) {
      if (design?.preset_images?.length > 0) {
        allEggImages.push(...design.preset_images);
      } else if (design?.image) {
        allEggImages.push(design.image);
      }
    }
    
    // Fill the grid with eggs
    for (let i = 0; i < totalEggs; i++) {
      if (allEggImages.length > 0) {
        // Use a random image from available eggs
        const randomIndex = Math.floor(Math.random() * allEggImages.length);
        eggImages.push(allEggImages[randomIndex]);
      } else {
        // Use placeholder if no images available
        eggImages.push("/placeholder.png");
      }
    }
    
    return eggImages;
  };

  // ----------- ORDER DETAIL VIEW ------------
  if (selectedOrder) {
    const { user_info, preset_object } = selectedOrder;
    const designs = Array.isArray(preset_object) ? preset_object : [preset_object];
    // Generate egg grid for the detail view
    const eggGridImages = generateEggGrid(designs);

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => setSelectedOrder(null)}
          className="mb-6 flex items-center text-[#e6d281] hover:text-[#d4c070] transition-colors"
        >
          <FiArrowLeft className="mr-2" size={18} />
          Back to Orders
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-800">
              <FiXCircle size={20} />
            </button>
          </div>
        )}

        {/* Main Order Container */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Order Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                 <h3 className="text-sm font-medium text-gray-800 truncate cursor-pointer" >
                  Order #{selectedOrder.id}
                </h3>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <FiCalendar className="mr-1.5" size={14} />
                  {formatDate(selectedOrder.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 md:mt-0">
                <div className="relative">
                  <select
                    value={selectedOrder.payment_status || 'pending'}
                    onChange={(e) => updateOrderPaymentStatus(selectedOrder.id, e.target.value)}
                    disabled={updatingStatus === selectedOrder.id}
                    className="appearance-none bg-white border border-gray-300 rounded-md py-2 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#e6d281] focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {updatingStatus === selectedOrder.id ? (
                    <FiLoader className="absolute right-2 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={16} />
                  ) : (
                    <FiEdit className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  )}
                </div>
                {getPaymentStatusBadge(selectedOrder.payment_status || 'pending')}
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
                  <p className="text-gray-800">{user_info?.address || 'No address provided'}</p>
                  <p className="text-gray-600">
                    {user_info?.city}, {user_info?.state} {user_info?.postalCode}
                  </p>
                  <p className="text-gray-600">{user_info?.country}</p>
                </div>

                {/* Payment Column */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">PAYMENT</h3>
                  <p className="text-gray-800 font-medium">${selectedOrder.payment || '0.00'}</p>
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
              
              {/* Egg Grid - 6x6 layout */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Egg Designs Preview</h4>
                <div className="grid grid-cols-6 gap-2">
                  {eggGridImages.map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-50 rounded border flex items-center justify-center overflow-hidden">
                      <img
                        src={image}
                        alt={`Egg design ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => e.currentTarget.src = "/placeholder.png"}
                      />
                    </div>
                  ))}
                </div>
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
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-[#f8f5e8]">
            <FiPackage className="text-[#e6d281]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <p className="text-gray-600">View and manage customer orders</p>
          </div>
        </div>
        <button
          onClick={refreshOrders}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-white rounded-lg hover:bg-[#d4c070] disabled:opacity-50 transition-colors"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-800">
            <FiXCircle size={20} />
          </button>
        </div>
      )}

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
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
            >
              {paymentStatuses.map((status) => (
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
            
            // Get six random images from all available images in the order
            const randomImages = getRandomImagesForDesigns(designs, 6);
            
            const customerName = order.user_info?.firstName 
              ? `${order.user_info.firstName} ${order.user_info.lastName || ''}` 
              : 'Unknown Customer';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group"
              >
                {/* Images Section - 6 image grid */}
                <div 
                  className="p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {randomImages.map((image, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-white">
                        <img
                          src={image}
                          alt={`Design ${idx + 1}`}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                        {idx === 5 && designs.length > 6 && (
                          <div className="absolute inset-0  bg-opacity-40 flex items-center justify-center text-white text-xs font-medium">
                           
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Info Section */}
                <div className="p-5">
                  <div className="mb-4">
                   <h3 className="text-sm font-medium text-gray-800 truncate cursor-pointer" onClick={() => setSelectedOrder(order)}>
  Order #{order.id}
</h3>

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
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-700 flex items-center">
                        <FiDollarSign className="mr-1" size={14} />
                        ${order.payment || '0.00'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={order.payment_status || 'pending'}
                          onChange={(e) => updateOrderPaymentStatus(order.id, e.target.value)}
                          disabled={updatingStatus === order.id}
                          className="appearance-none bg-white border border-gray-300 rounded-md py-1 px-2 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-[#e6d281] focus:border-transparent"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {updatingStatus === order.id ? (
                          <FiLoader className="absolute right-1 top-1/2 transform -translate-y-1/2 animate-spin text-gray-400" size={12} />
                        ) : (
                          <FiEdit className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400" size={12} />
                        )}
                      </div>
                      {getPaymentStatusBadge(order.payment_status || 'pending')}
                      <FiChevronRight 
                        className="ml-1 text-gray-400 group-hover:text-[#e6d281] transition-colors cursor-pointer" 
                        size={18}
                        onClick={() => setSelectedOrder(order)}
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