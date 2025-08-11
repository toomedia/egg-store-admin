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
import React from "react";
import {
  ShoppingCartIcon,
  CubeIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  ChartBarIcon,
  UserIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-manrope">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-manrope">Dashboard</h1>
          <p className="text-gray-500 mt-1 font-manrope">
            Welcome back! Here's what's happening with your egg card business.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/orders">
            <button className="px-4 py-2 rounded-lg bg-white text-sm font-medium text-gray-700 shadow hover:bg-gray-100 flex items-center gap-2 font-manrope">
              <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#e6d281]">
                <EyeIcon className="w-4 h-4" />
              </span>
              View Pending Orders
            </button>
          </Link>
          <Link href="/dashboard/presets">
            <button className="px-4 py-2 rounded-lg bg-[#e6d281] text-black text-sm font-manrope shadow flex items-center gap-2 font-manrope">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-black">
                <PlusIcon className="w-4 h-4" />
              </span>
              Add New Preset
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Orders Today"
          value="24"
          subtitle="+12% vs last month"
          icon={<ShoppingCartIcon className="w-5 h-5" />}
        />
        <StatCard
          title="This Month's Orders"
          value="487"
          subtitle="+23% vs last month"
          icon={<ChartBarIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Active Presets"
          value="156"
          subtitle="+8% vs last month"
          icon={<CubeIcon className="w-5 h-5" />}
        />
        <StatCard
          title="Total Revenue"
          value="$12,847"
          subtitle="+31% vs last month"
          icon={<ChartBarIcon className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow p-6 font-manrope">
          <h2 className="font-semibold font-manrope text-lg mb-4">Orders by Status</h2>
          <div className="space-y-3">
            <StatusRow color="bg-yellow-500" label="Pending" count={12} />
            <StatusRow color="bg-blue-600" label="Delivering" count={34} />
            <StatusRow color="bg-green-600" label="Completed" count={441} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 font-manrope">
          <h2 className="font-semibold font-manrope text-lg mb-4">Best Selling Presets</h2>
          <div className="space-y-3 text-sm">
            <BestSeller label="Easter Bundle - 24 Pack" count="89 sales" amount="$2,136" />
            <BestSeller label="Nature Collection" count="67 sales" amount="$1,608" />
            <BestSeller label="Abstract Dreams" count="45 sales" amount="$1,080" />
            <BestSeller label="Spring Flowers" count="32 sales" amount="$768" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6 font-manrope">
        <h2 className="font-semibold text-lg mb-4 flex items-center">
          <ClockIcon className="w-5 h-5 mr-2 text-yellow-500" />
          Recent Activity
        </h2>
        <div className="space-y-4 text-sm">
          <ActivityRow
            icon={<ShoppingCartIcon className="w-4 h-4" />}
            message="New order placed by Sarah Johnson"
            sub="Easter Bundle - 24 Pack"
            time="2 minutes ago"
            tag="New Order"
          />
          <ActivityRow
            icon={<CubeIcon className="w-4 h-4" />}
            message="Nature Collection updated"
            sub="Added 5 new designs"
            time="1 hour ago"
            tag="Updated"
          />
          <ActivityRow
            icon={<UserIcon className="w-4 h-4" />}
            message="New customer registration"
            sub="Mike Chen joined the platform"
            time="3 hours ago"
            tag="New Customer"
          />
          <ActivityRow
            icon={<CheckCircleIcon className="w-4 h-4" />}
            message="Order #12847 completed"
            sub="Delivered to Emma Wilson"
            time="5 hours ago"
            tag="Completed"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

const StatCard = ({ title, value, subtitle, icon }: any) => (
  <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center font-manrope">
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-xs text-green-600 font-medium mt-1">{subtitle}</p>
    </div>
    <div className="w-8 h-8 bg-gray-100 text-[#e6d281] rounded-full flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const StatusRow = ({ color, label, count }: any) => (
  <div className="flex justify-between items-center text-sm text-gray-700 font-manrope">
    <div className="flex items-center space-x-3">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
    <span className="font-semibold text-gray-900">{count} orders</span>
  </div>
);

const BestSeller = ({ label, count, amount }: any) => (
  <div className="flex justify-between items-center font-manrope">
    <div>
      <p className="text-gray-800 font-medium">{label}</p>
      <p className="text-gray-400 text-xs">{count}</p>
    </div>
    <p className="text-green-600 font-semibold">{amount}</p>
  </div>
);

const ActivityRow = ({ icon, message, sub, time, tag }: any) => (
  <div className="flex justify-between items-start font-manrope">
    <div className="flex space-x-4">
      <div className="w-8 h-8 bg-gray-100 text-[#e6d281] rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-gray-900 font-medium">{message}</p>
        <p className="text-gray-400 text-xs">{sub}</p>
        <p className="text-gray-400 text-xs">{time}</p>
      </div>
    </div>
    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md font-manrope whitespace-nowrap">
      {tag}
    </span>
  </div>
);
