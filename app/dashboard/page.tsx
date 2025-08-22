// import React from 'react'
// import { ShoppingCart, Package, CheckCircle, Clock, PlusCircle, AlertCircle, TrendingUp, Activity, User } from 'lucide-react'
// import Link from "next/link"

// const page = () => {
//   // Sample data - replace with your actual data
//   const stats = {
//     totalOrders: {
//       today: 42,
//       month: 1280,
//     },
//     ordersByStatus: {
//       pending: 18,
//       delivering: 24,
//       completed: 980,
//     },
//     userCount: {
//       name: "users",
//       count: 5
//     },
//     revenue: {
//       today: 1260,
//       month: 38400,
//       change: '+12%',
//     },
//     recentActivity: [
//       { type: 'order', message: 'New order #1245 placed', time: '10 min ago' },
//       { type: 'stock', message: 'Easter Special preset stock updated', time: '25 min ago' },
//       { type: 'order', message: 'Order #1243 marked as completed', time: '1 hour ago' },
//       { type: 'preset', message: 'New preset "Spring Collection" added', time: '2 hours ago' },
//     ],
//     bestSellingPresets: [
//       { name: 'Easter Special', sales: 320, revenue: 9600 },
//       { name: 'Animal Patterns', sales: 280, revenue: 8400 },
//       { name: 'Classic Colors', sales: 210, revenue: 6300 },
//     ],
//   }

//   return (
//     <div className="p-6 font-monrape flex items-center justify-center h-full">
//       <div className="container mx-auto">
//         <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
        
//         {/* Quick Stats Section */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {/* Total Orders */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500">Total Orders</p>
//                 <h3 className="text-2xl font-bold mt-1">{stats.totalOrders.today}</h3>
//                 <p className="text-sm text-gray-500">
//                   {stats.totalOrders.month} this month
//                 </p>
//               </div>
//               <div className="bg-amber-100 p-3 rounded-full">
//                 <ShoppingCart className="h-6 w-6 text-amber-600" />
//               </div>
//             </div>
//           </div>

//           {/* Orders by Status */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="font-semibold mb-4">Orders by Status</h3>
//             <div className="space-y-3">
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <Clock className="h-4 w-4 text-yellow-500 mr-2" />
//                   <span>Pending</span>
//                 </div>
//                 <span className="font-medium">{stats.ordersByStatus.pending}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <Package className="h-4 w-4 text-blue-500 mr-2" />
//                   <span>Delivering</span>
//                 </div>
//                 <span className="font-medium">{stats.ordersByStatus.delivering}</span>
//               </div>
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center">
//                   <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
//                   <span>Completed</span>
//                 </div>
//                 <span className="font-medium">{stats.ordersByStatus.completed}</span>
//               </div>
//             </div>
//           </div>

//           {/* Users Card */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500">Total Users</p>
//                 <h3 className="text-2xl font-bold mt-1">{stats.userCount.name}</h3>
//                 <p className="text-sm text-gray-500">
//                   {stats.userCount.count} this month
//                 </p>
//               </div>
//               <div className="bg-amber-100 p-3 rounded-full">
//                 <User className="h-6 w-6 text-amber-600" />
//               </div>
//             </div>
//           </div>

//           {/* Revenue Overview */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500">Revenue</p>
//                 <h3 className="text-2xl font-bold mt-1">${stats.revenue.today}</h3>
//                 <p className="text-sm text-gray-500">
//                   ${stats.revenue.month} this month <span className="text-green-500">{stats.revenue.change}</span>
//                 </p>
//               </div>
//               <div className="bg-green-100 p-3 rounded-full">
//                 <TrendingUp className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Quick Actions Section */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           <Link href="/dashboard/presets" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
//             <button className='flex items-center justify-between w-full'>
//               <div className="flex items-center">
//                 <PlusCircle className="h-5 w-5 text-amber-600 mr-3" />
//                 <span className="font-medium">Add New Preset</span>
//               </div>
//               <span className="text-gray-500">+</span>
//             </button>
//           </Link>

//           <Link href="/dashboard/orders" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
//             <button className='flex items-center justify-between w-full'>
//               <div className="flex items-center">
//                 <AlertCircle className="h-5 w-5 text-yellow-500 mr-3" />
//                 <span className="font-medium">View Pending Orders</span>
//               </div>
//               <span className="text-gray-500">→</span>
//             </button>
//           </Link>
//         </div>

//         {/* Recent Activity Feed */}
//         <div className="bg-white rounded-lg shadow p-6">
//           <h3 className="font-semibold mb-4 flex items-center">
//             <Activity className="h-5 w-5 text-amber-600 mr-2" />
//             Recent Activity
//           </h3>
//           <div className="space-y-4">
//             {stats.recentActivity.map((activity, index) => (
//               <div key={index} className="flex items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">
//                 <div className={`p-2 rounded-full mr-3 ${
//                   activity.type === 'order' ? 'bg-blue-100' :
//                   activity.type === 'stock' ? 'bg-purple-100' :
//                   'bg-green-100'
//                 }`}>
//                   {activity.type === 'order' ? (
//                     <ShoppingCart className="h-4 w-4 text-blue-600" />
//                   ) : activity.type === 'stock' ? (
//                     <Package className="h-4 w-4 text-purple-600" />
//                   ) : (
//                     <PlusCircle className="h-4 w-4 text-green-600" />
//                   )}
//                 </div>
//                 <div className="flex-1">
//                   <p className="font-medium">{activity.message}</p>
//                   <p className="text-sm text-gray-500">{activity.time}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default page

// "use client";
// import React from "react";
// import {
//   ShoppingCart,
//   Package,
//   CheckCircle,
//   Clock,
//   Plus,
//   TrendingUp,
//   Activity,
//   User,
//   Eye,
// } from "lucide-react";
// import Link from "next/link";

// const Dashboard = () => {
//   return (
//     <div className="min-h-screen bg-gray-50 p-6 font-manrope">
//       {/* Top Bar */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
//           <p className="text-gray-500 mt-1">
//             Welcome back! Here's what's happening with your egg card business.
//           </p>
//         </div>
//         <div className="flex gap-3">
//           <Link href="/dashboard/orders">
//             <button className="px-4 py-2 rounded-lg bg-white text-sm font-medium text-gray-700 shadow hover:bg-gray-100 flex items-center gap-2">
//               <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[#e6d281]">
//                 <Eye className="w-4 h-4" />
//               </span>
//               View Pending Orders
//             </button>
//           </Link>
//           <Link href="/dashboard/presets">
//             <button className="px-4 py-2 rounded-lg bg-[#e6d281] text-black text-sm font-medium shadow flex items-center gap-2">
//               <span className="w-8 h-8 rounded-lg flex items-center justify-center text-black">
//                 <Plus className="w-4 h-4" />
//               </span>
//               Add New Preset
//             </button>
//           </Link>
//         </div>
//       </div>

//       {/* Stats Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
//         <StatCard
//           title="Total Orders Today"
//           value="24"
//           subtitle="+12% vs last month"
//           icon={<ShoppingCart className="w-5 h-5" />}
//         />
//         <StatCard
//           title="This Month's Orders"
//           value="487"
//           subtitle="+23% vs last month"
//           icon={<TrendingUp className="w-5 h-5" />}
//         />
//         <StatCard
//           title="Active Presets"
//           value="156"
//           subtitle="+8% vs last month"
//           icon={<Package className="w-5 h-5" />}
//         />
//         <StatCard
//           title="Total Revenue"
//           value="$12,847"
//           subtitle="+31% vs last month"
//           icon={<TrendingUp className="w-5 h-5" />}
//         />
//       </div>

//       {/* Status & Best Sellers */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//         <div className="bg-white rounded-xl shadow p-6">
//           <h2 className="font-semibold text-lg mb-4">Orders by Status</h2>
//           <div className="space-y-3">
//             <StatusRow icon={<Clock className="w-4 h-4" />} label="Pending" count={12} />
//             <StatusRow icon={<Package className="w-4 h-4" />} label="Delivering" count={34} />
//             <StatusRow icon={<CheckCircle className="w-4 h-4" />} label="Completed" count={441} />
//           </div>
//         </div>

//         <div className="bg-white rounded-xl shadow p-6">
//           <h2 className="font-semibold text-lg mb-4">Best Selling Presets</h2>
//           <div className="space-y-3 text-sm">
//             <BestSeller label="Easter Bundle - 24 Pack" count="89 sales" amount="$2,136" />
//             <BestSeller label="Nature Collection" count="67 sales" amount="$1,608" />
//             <BestSeller label="Abstract Dreams" count="45 sales" amount="$1,080" />
//             <BestSeller label="Spring Flowers" count="32 sales" amount="$768" />
//           </div>
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white rounded-xl shadow p-6">
//         <h2 className="font-semibold text-lg mb-4 flex items-center">
//           <Activity className="w-5 h-5 mr-2 text-yellow-500" />
//           Recent Activity
//         </h2>
//         <div className="space-y-4 text-sm">
//           <ActivityRow
//             icon={<ShoppingCart className="w-4 h-4" />}
//             message="New order placed by Sarah Johnson"
//             sub="Easter Bundle - 24 Pack"
//             time="2 minutes ago"
//             tag="New Order"
//           />
//           <ActivityRow
//             icon={<Package className="w-4 h-4" />}
//             message="Nature Collection updated"
//             sub="Added 5 new designs"
//             time="1 hour ago"
//             tag="Updated"
//           />
//           <ActivityRow
//             icon={<User className="w-4 h-4" />}
//             message="New customer registration"
//             sub="Mike Chen joined the platform"
//             time="3 hours ago"
//             tag="New Customer"
//           />
//           <ActivityRow
//             icon={<CheckCircle className="w-4 h-4" />}
//             message="Order #12847 completed"
//             sub="Delivered to Emma Wilson"
//             time="5 hours ago"
//             tag="Completed"
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// // ✅ Components

// const StatCard = ({ title, value, subtitle, icon }: any) => (
//   <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center">
//     <div>
//       <p className="text-sm text-gray-500">{title}</p>
//       <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
//       <p className="text-xs text-green-600 font-medium mt-1">{subtitle}</p>
//     </div>
//     <div className="bg-gray-100 text-[#e6d281] p-2 rounded-lg">{icon}</div>
//   </div>
// );

// const StatusRow = ({ icon, label, count }: any) => (
//   <div className="flex justify-between items-center text-sm text-gray-700">
//     <div className="flex items-center gap-3">
//       <div className="bg-gray-100 text-[#e6d281] p-2 rounded-lg">{icon}</div>
//       <span>{label}</span>
//     </div>
//     <span className="font-semibold text-gray-900">{count} orders</span>
//   </div>
// );

// const BestSeller = ({ label, count, amount }: any) => (
//   <div className="flex justify-between items-center">
//     <div>
//       <p className="text-gray-800 font-medium">{label}</p>
//       <p className="text-gray-400 text-xs">{count}</p>
//     </div>
//     <p className="text-green-600 font-semibold">{amount}</p>
//   </div>
// );

// const ActivityRow = ({ icon, message, sub, time, tag }: any) => (
//   <div className="flex justify-between items-start">
//     <div className="flex gap-4">
//       <div className="bg-gray-100 text-[#e6d281] p-2 rounded-lg">{icon}</div>
//       <div>
//         <p className="text-gray-900 font-medium">{message}</p>
//         <p className="text-gray-400 text-xs">{sub}</p>
//         <p className="text-gray-400 text-xs">{time}</p>
//       </div>
//     </div>
//     <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-medium whitespace-nowrap">
//       {tag}
//     </span>
//   </div>
// );


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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        { data: ordersData, error: ordersError },
        { data: presetsData, error: presetsError },
        { data: usersData, error: usersError },
      ] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("presets").select("*"),
        supabase.from("users").select("*"),
      ]);

      if (ordersError || presetsError || usersError) {
        console.error(
          "Supabase fetch error:",
          ordersError || presetsError || usersError
        );
        throw new Error("One or more tables failed to load.");
      }

      setOrders(ordersData || []);
      setPresets(presetsData || []);
      setUsers(usersData || []);

      buildActivities(ordersData || [], presetsData || [], usersData || []);
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
        icon: <ShoppingCartIcon className="w-4 h-4" />,
        message:
          order.status === "completed"
            ? `Order #${order.id} completed`
            : `New order by ${order.user_info?.email || "unknown user"}`,
        sub: order.product_name || "Egg Card",
        time: getRelativeTime(order.created_at),
        timeObj: order.created_at,
        tag: order.status === "completed" ? "Completed" : "New Order",
      });
    }

    if (preset) {
      acts.push({
        icon: <CubeIcon className="w-4 h-4" />,
        message: "New preset created",
        sub: preset.preset_name?.en_name || "Untitled",
        time: getRelativeTime(preset.created_at),
        timeObj: preset.created_at,
        tag: "New Product",
      });
    }

    if (user) {
      acts.push({
        icon: <UserIcon className="w-4 h-4" />,
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
    const counts = { pending: 0, delivering: 0, completed: 0, other: 0 };
    orders.forEach((order) => {
      const status = order.status?.toLowerCase() || "";
      if (status.includes("pending")) counts.pending++;
      else if (status.includes("deliver")) counts.delivering++;
      else if (status.includes("complete")) counts.completed++;
      else counts.other++;
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
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-manrope">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your egg card store</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/orders">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-100">
              <EyeIcon className="w-4 h-4 text-[#e6d281]" />
              View Orders
            </button>
          </Link>
          <Link href="/dashboard/presets">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-black rounded-lg shadow">
              <PlusIcon className="w-4 h-4" />
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
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingCartIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Active Presets"
          value={presets.length}
          icon={<CubeIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Total Users"
          value={users.length}
          icon={<UserIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${orders.reduce((total, order) => total + (order.total_amount || 44), 0)}`}
          icon={<ChartBarIcon className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-4">Orders by Status</h2>
          <StatusRow
            color="bg-yellow-500"
            label="Pending"
            count={statusCounts.pending}
          />
          <StatusRow
            color="bg-blue-500"
            label="Delivering"
            count={statusCounts.delivering}
          />
          <StatusRow
            color="bg-green-600"
            label="Completed"
            count={statusCounts.completed}
          />
          {statusCounts.other > 0 && (
            <StatusRow
              color="bg-gray-500"
              label="Other"
              count={statusCounts.other}
            />
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Best Selling Presets</h2>
            <Link href="/dashboard/presets">
              <span className="text-sm text-[#e6d281] hover:underline cursor-pointer">
                View all
              </span>
            </Link>
          </div>
          {presetSalesData.length === 0 ? (
            <p className="text-gray-400">No sales data available.</p>
          ) : (
            <div className="space-y-4">
              {presetSalesData.map((preset) => (
                <BestSellerRow
                  key={preset.id}
                  title={preset.title}
                 
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
        <h2 className="flex items-center font-semibold text-lg mb-4">
          <ClockIcon className="w-5 h-5 mr-2 text-[#e6d281]" />
          Recent Activity
        </h2>
        <div className="space-y-4 text-sm">
          {activities.length === 0 ? (
            <p className="text-gray-400">No recent activity found.</p>
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
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#e6d281]">
      {icon}
    </div>
  </div>
);

const StatusRow = ({ color, label, count }: any) => (
  <div className="flex justify-between items-center mb-2 text-sm text-gray-700">
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
    <span className="font-semibold">{count} orders</span>
  </div>
);

// Safe image component that handles external URLs
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const isExternal = src.startsWith('http');
  
  // For external images, we'll use a regular img tag until Next.js is configured
  if (isExternal) {
    return (
      <img 
        src={src} 
        alt={alt} 
        className={className}
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = '/placeholder-image.jpg';
        }}
      />
    );
  }
  
  // For local images, use Next.js Image component
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
        <h4 className="font-medium text-gray-900 truncate">{title}</h4>
        <span className="text-sm font-semibold text-green-600 ml-2">${price}</span>
      </div>
      <p className="text-xs text-gray-500 truncate">{description}</p>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
          {category}
        </span>
       
      </div>
    </div>
  </div>
);

const ActivityRow = ({ icon, message, sub, time, tag }: any) => (
  <div className="flex justify-between items-start">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[#e6d281]">
        {icon}
      </div>
      <div>
        <p className="font-medium text-gray-800">{message}</p>
        <p className="text-gray-400 text-xs">{sub}</p>
      </div>
    </div>
    <div className="text-right text-xs text-gray-400">
      <p>{time}</p>
      <p className="font-semibold text-[#e6d281]">{tag}</p>
    </div>
  </div>
);