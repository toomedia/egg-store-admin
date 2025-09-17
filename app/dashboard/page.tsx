"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import Image from "next/image";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShoppingCart,
  Box,
  BarChart3,
  Clock,
  Plus,
  Eye,
  User,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  CreditCard,
  DollarSign,
  Users,
  RefreshCw,
  Download,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Main Dashboard Component
const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    conversionRate: 0,
    avgOrderValue: 0,
    returningCustomers: 0,
  });
  type SectionKey = 'charts' | 'performance' | 'ordersStatus' | 'bestSellers' | 'recentOrders' | 'activity';
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    charts: true,
    performance: true,
    ordersStatus: true,
    bestSellers: true,
    recentOrders: true,
    activity: true,
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' }, 
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const presetsChannel = supabase
      .channel('dashboard-presets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'presets' }, 
        () => {
          fetchPresets();
        }
      )
      .subscribe();

    const usersChannel = supabase
      .channel('dashboard-users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        () => {
          fetchUsers();
        }
      )
      .subscribe();

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
      processChartData(ordersData, usersData);
      calculateMetrics(ordersData, usersData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(`Failed to load dashboard: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (ordersData: any[], usersData: any[]) => {
    const monthlyOrders = processMonthlyOrdersData(ordersData);
    setMonthlyOrdersData(monthlyOrders);
    
    const userGrowth = processUserGrowthData(usersData);
    setUserGrowthData(userGrowth);
  };

 const processMonthlyOrdersData = (ordersData: any[]) => {
  const last6Months: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    last6Months.push({ name: monthName, orders: 0, revenue: 0 });
  }
  
  ordersData.forEach(order => {
    if (order.created_at && order.payment_status === 'completed') {
      const orderDate = new Date(order.created_at);
      const monthName = orderDate.toLocaleString('default', { month: 'short' });
      
      const monthData = last6Months.find(m => m.name === monthName);
      if (monthData) {
        monthData.orders += 1;
        monthData.revenue += order.total_amount || 44;
      }
    }
  });
  
  return last6Months;
};

const processUserGrowthData = (usersData: any[]) => {
  const last6Months: any[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    last6Months.push({ name: monthName, users: 0, cumulative: 0 });
  }
  
  usersData.forEach(user => {
    if (user.created_at) {
      const userDate = new Date(user.created_at);
      const monthName = userDate.toLocaleString('default', { month: 'short' });
      
      const monthData = last6Months.find(m => m.name === monthName);
      if (monthData) {
        monthData.users += 1;
      }
    }
  });
  
  let cumulativeTotal = 0;
  for (let month of last6Months) {
    cumulativeTotal += month.users;
    month.cumulative = cumulativeTotal;
  }
  
  return last6Months;
};
  const calculateMetrics = (ordersData: any[], usersData: any[]) => {
    const completedOrders = ordersData.filter(order => order.payment_status === 'completed').length;
    const conversionRate = usersData.length > 0 ? (completedOrders / usersData.length) * 100 : 0;
    
    const totalRevenue = ordersData
      .filter(order => order.payment_status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount || 44), 0);
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    const userOrderCount: {[key: string]: number} = {};
    ordersData.forEach(order => {
      const userId = order.user_id;
      if (userId) {
        userOrderCount[userId] = (userOrderCount[userId] || 0) + 1;
      }
    });
    
    const returningCustomers = Object.values(userOrderCount).filter(count => count > 1).length;
    
    setMetrics({
      conversionRate: Math.round(conversionRate),
      avgOrderValue: Math.round(avgOrderValue),
      returningCustomers
    });
  };

  const buildActivities = (
    ordersData: any[],
    presetsData: any[],
    usersData: any[]
  ) => {
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
        icon: <ShoppingCart className="w-5 h-5" />,
        message:
          order.payment_status === "completed"
            ? `Order #${order.id} completed`
            : `New order by ${order.user_info?.email || "unknown user"}`,
        sub: order.product_name || "Egg Card",
        time: getRelativeTime(order.created_at),
        timeObj: order.created_at,
        tag: order.payment_status === "Completed" ? "Completed" : "New Order",
      });
    }

    if (preset) {
      acts.push({
        icon: <Box className="w-5 h-5" />,
        message: "New preset created",
        sub: preset.preset_name?.en_name || "Untitled",
        time: getRelativeTime(preset.created_at),
        timeObj: preset.created_at,
        tag: "New Product",
      });
    }

    if (user) {
      acts.push({
        icon: <User className="w-5 h-5" />,
        message: "New customer signup",
        sub: user.email || "No email",
        time: getRelativeTime(user.created_at),
        timeObj: user.created_at,
        tag: "New Customer",
      });
    }

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

  // Prepare data for order status pie chart
  const orderStatusData = [
    { name: 'Completed', value: statusCounts.completed, color: '#e6d281' },
    { name: 'Processing', value: statusCounts.processing, color: '#f59e0b' },
    { name: 'Pending', value: statusCounts.pending, color: '#fbbf24' },
    { name: 'Cancelled', value: statusCounts.cancelled, color: '#ef4444' },
  ];

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
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 4);

  // Get latest orders for the orders table with preset information
  const latestOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(order => {
      const preset = presets.find(p => p.id === order.preset_id);
      return {
        ...order,
        preset: preset || null
      };
    });
  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <RefreshCw className="animate-spin h-10 w-10 text-[#e6d281] mx-auto mb-4" />
          <p className="text-gray-500 text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 font-manrope">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-base text-gray-500">Overview of your egg card store</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-100 text-base transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link href="/dashboard/orders">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-100 text-base transition-colors">
              <Eye className="w-4 h-4 text-[#e6d281]" />
              View Orders
            </button>
          </Link>
          <Link href="/dashboard/presets">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-black rounded-lg shadow hover:bg-[#d4c073] text-base transition-colors">
              <Plus className="w-4 h-4" />
              Add Preset
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-base">Error:</p>
            <p className="text-base">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-[#e6d281]"
        />
        <StatCard
          title="Active Presets"
          value={presets.length}
          icon={<Box className="w-6 h-6" />}
          color="bg-[#e6d281]"
        />
        <StatCard
          title="Total Users"
          value={users.length}
          icon={<Users className="w-6 h-6" />}
          color="bg-[#e6d281]"
        />
        <StatCard
          title="Total Revenue"
          value={`$${orders
            .filter(order => order.payment_status === 'completed')
            .reduce((total, order) => total + (order.total_amount || 44), 0)
            .toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-[#e6d281]"
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
        <div 
          className="flex justify-between items-center p-5 cursor-pointer"
          onClick={() => toggleSection('performance')}
        >
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#e6d281]" />
            Performance Metrics
          </h2>
          {expandedSections.performance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
        {expandedSections.performance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 pt-0">
            <MetricCard
              title="Conversion Rate"
              value={`${metrics.conversionRate}%`}
              description="Orders per customer"
              trend={metrics.conversionRate > 0 ? "up" : "down"}
              trendValue={metrics.conversionRate > 0 ? "12%" : "0%"}
              icon={<TrendingUp className="w-4 h-4" />}
            />
            <MetricCard
              title="Avg. Order Value"
              value={`$${metrics.avgOrderValue}`}
              description="Average revenue per order"
              trend={metrics.avgOrderValue > 0 ? "up" : "down"}
              trendValue={metrics.avgOrderValue > 0 ? "8%" : "0%"}
              icon={<DollarSign className="w-4 h-4" />}
            />
            <MetricCard
              title="Returning Customers"
              value={metrics.returningCustomers}
              description="Customers with multiple orders"
              trend={metrics.returningCustomers > 0 ? "up" : "down"}
              trendValue={metrics.returningCustomers > 0 ? "5%" : "0%"}
              icon={<Users className="w-4 h-4" />}
            />
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
 
        {expandedSections.charts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 pt-0">
            {/* Orders Line Chart */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#e6d281]" />
                Monthly Orders Trend
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyOrdersData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'orders') return [value, 'Orders'];
                        return [`$${value}`, 'Revenue'];
                      }}
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="orders" 
                      name="Orders" 
                      stroke="#e6d281" 
                      strokeWidth={3}
                      activeDot={{ r: 6, fill: '#e6d281' }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      activeDot={{ r: 6, fill: '#10b981' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

{/* Total Users Growth */}
<div className="bg-gray-50 p-5 rounded-lg">
  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
    <Users className="w-4 h-4 text-[#e6d281]" />
    Total Users Growth
  </h3>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={userGrowthData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip 
          formatter={(value) => [`${value}`, 'Total Users']}
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: 'none', 
            borderRadius: '0.5rem',
            color: 'white'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="cumulative" 
          name="Total Users" 
          stroke="#e6d281" 
          strokeWidth={3}
          activeDot={{ r: 6, fill: '#e6d281' }} 
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div 
            className="flex justify-between items-center p-5 cursor-pointer"
            onClick={() => toggleSection('ordersStatus')}
          >
            <h2 className="font-semibold text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#e6d281]" />
              Orders by Status
            </h2>
            {expandedSections.ordersStatus ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          {expandedSections.ordersStatus && (
            <div className="p-5 pt-0">
              <div className="flex items-center justify-center mb-4">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} orders`, '']}
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: 'none', 
                          borderRadius: '0.5rem',
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-2">
                {orderStatusData.map((status, index) => (
                  <StatusRow
                    key={index}
                    color={status.color}
                    label={status.name}
                    count={status.value}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Best Selling Presets */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div 
            className="flex justify-between items-center p-5 cursor-pointer"
            onClick={() => toggleSection('bestSellers')}
          >
            <h2 className="font-semibold text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-[#e6d281]" />
              Best Selling Presets
            </h2>
            {expandedSections.bestSellers ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
          {expandedSections.bestSellers && (
            <div className="p-5 pt-0">
              {presetSalesData.length === 0 ? (
                <p className="text-gray-400 text-base text-center py-8">No sales data available.</p>
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
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link href="/dashboard/presets">
                  <button className="w-full flex items-center justify-center gap-2 text-[#e6d281] hover:text-[#d4c073] transition-colors">
                    View all presets
                    <Eye className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Latest Orders Section */}
      <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
        <div 
          className="flex justify-between items-center p-5 cursor-pointer"
          onClick={() => toggleSection('recentOrders')}
        >
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#e6d281]" />
            Latest Orders
          </h2>
          {expandedSections.recentOrders ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
        {expandedSections.recentOrders && (
          <div className="p-5 pt-0">
            {latestOrders.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No orders found.</p>
            ) : (
              <div className="space-y-4">
                {latestOrders.map((order) => (
                  <div key={order.id} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
                    {/* <div className="relative w-16 h-16 flex-shrink-0 mr-4 bg-white rounded-md overflow-hidden shadow-sm">
                      <SafeImage
                        src={order.preset?.preset_images?.[0] || "/placeholder-image.jpg"}
                        alt={order.preset?.preset_name?.en_name || order.preset?.name || 'Untitled Design'}
                        className="object-cover"
                      />
                    </div> */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-base truncate">
                          {order.preset?.preset_name?.en_name || "Egg Card"}
                        </h3>
                        <span className="text-base font-bold text-green-600 ml-2">
                          ${order.total_amount || 44}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <User className="w-4 h-4 mr-1" />
                          <span className="truncate">{order.user_info?.email || "Unknown"}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium
                          ${order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                            order.payment_status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}>
                          {order.payment_status || 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link href="/dashboard/orders">
                <button className="w-full flex items-center justify-center gap-2 text-[#e6d281] hover:text-[#d4c073] transition-colors">
                  View all orders
                  <Eye className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div 
          className="flex justify-between items-center p-5 cursor-pointer"
          onClick={() => toggleSection('activity')}
        >
          <h2 className="font-semibold text-xl flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#e6d281]" />
            Recent Activity
          </h2>
          {expandedSections.activity ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
        {expandedSections.activity && (
          <div className="p-5 pt-0 space-y-4 text-base">
            {activities.length === 0 ? (
              <p className="text-gray-400 text-base text-center py-8">No recent activity found.</p>
            ) : (
              activities.map((act, i) => <ActivityRow key={i} {...act} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// ✅ Reusable Components
const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl shadow flex justify-between items-center transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-base text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center text-white`}>
      {icon}
    </div>
  </div>
);

const MetricCard = ({ title, value, description, trend, trendValue, icon }: any) => (
  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
    <p className="text-base text-gray-500">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
    <div className="flex items-center mt-2">
      <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
        {icon}
        <span className="text-sm ml-1">{trendValue}</span>
      </div>
      <span className="text-sm text-gray-400 ml-2">from last month</span>
    </div>
    <p className="text-sm text-gray-400 mt-2">{description}</p>
  </div>
);

const StatusRow = ({ color, label, count }: any) => (
  <div className="flex justify-between items-center py-2 text-base text-gray-700">
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full`} style={{ backgroundColor: color }}></span>
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
        className={`${className} w-full h-full object-cover`} 
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




