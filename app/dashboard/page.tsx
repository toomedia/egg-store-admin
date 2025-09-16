"use client";
import React, { useEffect, useState } from "react";
import {
  ShoppingCartIcon,
  CubeIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  UserIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import Image from "next/image";

// Main Dashboard Component
const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => {
          // Refresh orders data when any change happens
          fetchOrders();
        }
      )
      .subscribe();

    const presetsChannel = supabase
      .channel('dashboard-presets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'presets' }, 
        () => {
          // Refresh presets data when any change happens
          fetchPresets();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('dashboard-users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => {
          // Refresh users data when any change happens
          fetchUsers();
        }
      )
      .subscribe();

    // Cleanup subscriptions on component unmount
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(presetsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      setOrders(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  };

  const fetchPresets = async () => {
    try {
      const { data, error } = await supabase.from("presets").select("*");
      if (error) throw error;
      setPresets(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching presets:", error);
      return [];
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setUsers(data || []);
      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ordersData, presetsData, usersData] = await Promise.all([
        fetchOrders(),
        fetchPresets(),
        fetchUsers()
      ]);

      buildActivities(ordersData, presetsData, usersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(`Failed to load dashboard: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const buildActivities = (
    ordersData: any[],
    presetsData: any[],
    usersData: any[]
  ) => {
    // Sort newest first
    const sortedOrders = ordersData
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    const sortedPresets = presetsData
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    const sortedUsers = usersData
      .slice()
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const order = sortedOrders[0];
    const preset = sortedPresets[0];
    const user = sortedUsers[0];

    const acts = [];

    if (order) {
      acts.push({
        icon: <ShoppingCartIcon className="w-5 h-5" />,
        message:
          order.payment_status === "completed"
            ? `Order #${order.id} completed`
            : `New order by ${order.user_info?.email || "unknown user"}`,
        sub: order.product_name || "Egg Card",
        time: getRelativeTime(order.created_at),
        timeObj: order.created_at,
        tag: order.payment_status === "completed" ? "Completed" : "New Order",
      });
    }

    if (preset) {
      acts.push({
        icon: <CubeIcon className="w-5 h-5" />,
        message: "New preset created",
        sub: preset.preset_name?.en_name || "Untitled",
        time: getRelativeTime(preset.created_at),
        timeObj: preset.created_at,
        tag: "New Product",
      });
    }

    if (user) {
      acts.push({
        icon: <UserIcon className="w-5 h-5" />,
        message: "New customer signup",
        sub: user.email || "No email",
        time: getRelativeTime(user.created_at),
        timeObj: user.created_at,
        tag: "New Customer",
      });
    }

    // Sort activities newest first
    setActivities(
      acts.sort(
        (a, b) => new Date(b.timeObj).getTime() - new Date(a.timeObj).getTime()
      )
    );
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = (new Date().getTime() - date.getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} d ago`;
  };

  const countOrdersByStatus = () => {
    const counts = { 
      pending: 0, 
      processing: 0,
      completed: 0,
      cancelled: 0
    };
    
    orders.forEach((order) => {
      const status = order.payment_status?.toLowerCase() || "";
      
      if (status.includes("pending")) counts.pending++;
      else if (status.includes("processing")) counts.processing++;
      else if (status.includes("complete")) counts.completed++;
      else if (status.includes("cancel")) counts.cancelled++;
    });
    
    return counts;
  };

  const statusCounts = countOrdersByStatus();

  // Calculate sales count per preset
  const salesCountMap: { [key: string]: number } = {};
  orders.forEach((order) => {
    const id = order.preset_id;
    if (id) {
      salesCountMap[id] = (salesCountMap[id] || 0) + 1;
    }
  });

  // Create enhanced preset sales data with images and descriptions
  const presetSalesData = presets
    .map((preset) => {
      const salesCount = salesCountMap[preset.id] || 0;
      return {
        id: preset.id,
        title: preset.preset_name?.en_name || "Untitled Preset",
        description: preset.preset_description?.en_description || "No description available",
        category: preset.category || "Uncategorized",
        image: preset.preset_images?.[0] || "/placeholder-image.jpg",
        price: preset.preset_price || 0,
        salesCount: salesCount,
        revenue: salesCount * (preset.preset_price || 0),
      };
    })
    .sort((a, b) => b.salesCount - a.salesCount) // Sort by sales count descending
    .slice(0, 4); // Get top 4

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-[#e6d281] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-manrope">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-base text-gray-500">Overview of your egg card store</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/orders">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-100 text-base">
              <EyeIcon className="w-5 h-5 text-[#e6d281]" />
              View Orders
            </button>
          </Link>
          <Link href="/dashboard/presets">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-black rounded-lg shadow text-base">
              <PlusIcon className="w-5 h-5" />
              Add Preset
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            <div>
              <p className="font-semibold text-base">Error:</p>
              <p className="text-base">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingCartIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Active Presets"
          value={presets.length}
          icon={<CubeIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Total Users"
          value={users.length}
          icon={<UserIcon className="w-6 h-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${orders.reduce((total, order) => total + (order.total_amount || 44), 0)}`}
          icon={<ChartBarIcon className="w-6 h-6" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold text-xl mb-4">Orders by Status</h2>
          <StatusRow
            color="bg-yellow-500"
            label="Pending"
            count={statusCounts.pending}
          />
          <StatusRow
            color="bg-blue-500"
            label="Processing"
            count={statusCounts.processing}
          />
          <StatusRow
            color="bg-green-600"
            label="Completed"
            count={statusCounts.completed}
          />
          <StatusRow
            color="bg-red-500"
            label="Cancelled"
            count={statusCounts.cancelled}
          />
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-xl">Best Selling Presets</h2>
            <Link href="/dashboard/presets">
              <span className="text-base text-[#e6d281] hover:underline cursor-pointer">
                View all
              </span>
            </Link>
          </div>
          {presetSalesData.length === 0 ? (
            <p className="text-gray-400 text-base">No sales data available.</p>
          ) : (
            <div className="space-y-4">
              {presetSalesData.map((preset) => (
                <BestSellerRow
                  key={preset.id}
                  title={preset.title}
                  description={preset.description}
                  category={preset.category}
                  image={preset.image}
                  price={preset.price}
                  salesCount={preset.salesCount}
                  revenue={preset.revenue}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl shadow">
        <h2 className="flex items-center font-semibold text-xl mb-4">
          <ClockIcon className="w-6 h-6 mr-2 text-[#e6d281]" />
          Recent Activity
        </h2>
        <div className="space-y-4 text-base">
          {activities.length === 0 ? (
            <p className="text-gray-400 text-base">No recent activity found.</p>
          ) : (
            activities.map((act, i) => <ActivityRow key={i} {...act} />)
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// ✅ Reusable Components
const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
    <div>
      <p className="text-base text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[#e6d281]">
      {icon}
    </div>
  </div>
);

const StatusRow = ({ color, label, count }: any) => (
  <div className="flex justify-between items-center mb-2 text-base text-gray-700">
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
    <span className="font-semibold">{count} orders</span>
  </div>
);

const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const isExternal = src.startsWith('http');
  
  if (isExternal) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={`${className} w-15 h-15 object-cover`} 
        onError={(e) => {
          e.currentTarget.src = '/placeholder-image.jpg';
        }}
      />
    );
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
    />
  );
};

const BestSellerRow = ({ 
  title, 
  description, 
  category, 
  image, 
  price, 
  salesCount, 
  revenue 
}: any) => (
  <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
    <div className="relative w-14 h-14 flex-shrink-0">
      <SafeImage
        src={image}
        alt={title}
        className="object-cover rounded-md"
      />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-900 truncate text-base">{title}</h4>
        <span className="text-base font-semibold text-green-600 ml-2">${price}</span>
      </div>
   
      <div className="flex justify-between items-center mt-1">
        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {category}
        </span>
 
      </div>
    </div>
  </div>
);

const ActivityRow = ({ icon, message, sub, time, tag }: any) => (
  <div className="flex justify-between items-start">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#e6d281]">
        {icon}
      </div>
      <div>
        <p className="font-medium text-gray-800 text-base">{message}</p>
        <p className="text-gray-400 text-sm">{sub}</p>
      </div>
    </div>
    <div className="text-right text-sm text-gray-400">
      <p>{time}</p>
      <p className="font-semibold text-[#e6d281]">{tag}</p>
    </div>
  </div>
);