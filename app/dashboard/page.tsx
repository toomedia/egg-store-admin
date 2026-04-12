"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../utils/supabaseClient";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  ShoppingCart,
  Box,
  BarChart3,
  Plus,
  Eye,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Link2,
  Gem,
  Package,
  Clock,
  CheckCircle,
  Sparkles,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    conversionRate: 0,
    avgOrderValue: 0,
    returningCustomers: 0,
  });
  const [referralStats, setReferralStats] = useState({
    codesGenerated: 0,
    referralsCompleted: 0,
    creditsGranted: 0,
    creditsConsumed: 0,
    conversionRate: 0,
  });
  const [recentReferrals, setRecentReferrals] = useState<any[]>([]);
  const [presetInventory, setPresetInventory] = useState({
    available: 0,
    soldOut: 0,
    pendingApproval: 0,
    totalPublic: 0,
  });
  const [mintingStats, setMintingStats] = useState({
    totalMinted: 0,
    mintedThisWeek: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
  });

  type SectionKey = 'charts' | 'inventory' | 'referrals';
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    charts: true,
    inventory: true,
    referrals: false,
  });

  useEffect(() => {
    fetchDashboardData();

    const ordersChannel = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe();
    const presetsChannel = supabase
      .channel('dashboard-presets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presets' }, () => fetchPresets())
      .subscribe();
    const usersChannel = supabase
      .channel('dashboard-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchUsers())
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
    } catch (error) { console.error("Error fetching orders:", error); return []; }
  };

  const fetchPresets = async () => {
    try {
      const { data, error } = await supabase.from("presets").select("*");
      if (error) throw error;
      setPresets(data || []);
      return data || [];
    } catch (error) { console.error("Error fetching presets:", error); return []; }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      setUsers(data || []);
      return data || [];
    } catch (error) { console.error("Error fetching users:", error); return []; }
  };

  const fetchReferralStats = async () => {
    try {
      const [
        { count: codesGenerated },
        { data: referralsData },
        { data: creditsData },
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }).not("referral_code", "is", null),
        supabase.from("referrals").select("id, inviter_id, invitee_id, invite_code, status, created_at, reward_granted"),
        supabase.from("preset_claim_credits").select("id, source_type, status"),
      ]);

      const completed = (referralsData || []).filter((r: any) => r.status === "completed").length;
      const referralCredits = (creditsData || []).filter((c: any) => c.source_type?.startsWith("referral"));
      const consumed = referralCredits.filter((c: any) => c.status === "consumed").length;

      setReferralStats({
        codesGenerated: codesGenerated || 0,
        referralsCompleted: completed,
        creditsGranted: referralCredits.length,
        creditsConsumed: consumed,
        conversionRate: (codesGenerated || 0) > 0 ? Math.round((completed / (codesGenerated || 1)) * 100) : 0,
      });

      const recent = (referralsData || [])
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      if (recent.length > 0) {
        const userIds = Array.from(new Set(recent.flatMap((r: any) => [r.inviter_id, r.invitee_id])));
        const { data: usersInfo } = await supabase.from("users").select("id, email, name").in("id", userIds);
        const userMap: Record<string, any> = {};
        (usersInfo || []).forEach((u: any) => { userMap[u.id] = u; });

        setRecentReferrals(recent.map((r: any) => ({
          ...r,
          inviter: userMap[r.inviter_id] || { email: "Unknown" },
          invitee: userMap[r.invitee_id] || { email: "Unknown" },
        })));
      }
    } catch (error) { console.error("Error fetching referral stats:", error); }
  };

  const fetchPresetInventory = async () => {
    try {
      const [
        { count: available },
        { count: soldOut },
        { count: pendingApproval },
        { count: totalPublic },
      ] = await Promise.all([
        supabase.from("presets").select("id", { count: "exact", head: true })
          .eq("is_public", true).eq("preset_status", "approved").is("owned_by", null),
        supabase.from("presets").select("id", { count: "exact", head: true })
          .eq("is_public", true).eq("preset_status", "approved").not("owned_by", "is", null),
        supabase.from("presets").select("id", { count: "exact", head: true })
          .eq("preset_status", "pending_approval"),
        supabase.from("presets").select("id", { count: "exact", head: true })
          .eq("is_public", true).eq("preset_status", "approved"),
      ]);
      setPresetInventory({ available: available || 0, soldOut: soldOut || 0, pendingApproval: pendingApproval || 0, totalPublic: totalPublic || 0 });
    } catch (error) { console.error("Error fetching preset inventory:", error); }
  };

  const fetchMintingStats = async () => {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [
        { count: totalMinted },
        { count: mintedThisWeek },
        { data: rarityData },
      ] = await Promise.all([
        supabase.from("minted_eggs").select("id", { count: "exact", head: true }),
        supabase.from("minted_eggs").select("id", { count: "exact", head: true }).gte("minted_at", oneWeekAgo),
        supabase.from("minted_eggs").select("rarity_tier"),
      ]);
      const tiers = (rarityData || []).reduce((acc: any, row: any) => {
        const tier = (row.rarity_tier || "").toLowerCase();
        if (tier === "silver") acc.silver++;
        else if (tier === "gold") acc.gold++;
        else if (tier === "platinum") acc.platinum++;
        return acc;
      }, { silver: 0, gold: 0, platinum: 0 });
      setMintingStats({ totalMinted: totalMinted || 0, mintedThisWeek: mintedThisWeek || 0, ...tiers });
    } catch (error) { console.error("Error fetching minting stats:", error); }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, presetsData, usersData] = await Promise.all([
        fetchOrders(), fetchPresets(), fetchUsers(),
      ]);
      fetchReferralStats();
      fetchPresetInventory();
      fetchMintingStats();
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
    setMonthlyOrdersData(processMonthlyOrdersData(ordersData));
    setUserGrowthData(processUserGrowthData(usersData));
  };

  const processMonthlyOrdersData = (ordersData: any[]) => {
    const last6Months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({ name: date.toLocaleString('default', { month: 'short' }), orders: 0, revenue: 0 });
    }
    ordersData.forEach(order => {
      if (order.created_at && order.payment_status === 'completed') {
        const monthName = new Date(order.created_at).toLocaleString('default', { month: 'short' });
        const monthData = last6Months.find(m => m.name === monthName);
        if (monthData) { monthData.orders += 1; monthData.revenue += order.total_amount || 0; }
      }
    });
    return last6Months;
  };

  const processUserGrowthData = (usersData: any[]) => {
    const last6Months: any[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({ name: date.toLocaleString('default', { month: 'short' }), users: 0, cumulative: 0 });
    }
    usersData.forEach(user => {
      if (user.created_at) {
        const monthName = new Date(user.created_at).toLocaleString('default', { month: 'short' });
        const monthData = last6Months.find(m => m.name === monthName);
        if (monthData) monthData.users += 1;
      }
    });
    let cumulative = 0;
    for (const month of last6Months) { cumulative += month.users; month.cumulative = cumulative; }
    return last6Months;
  };

  const calculateMetrics = (ordersData: any[], usersData: any[]) => {
    const completedOrders = ordersData.filter(order => order.payment_status === 'completed').length;
    const conversionRate = usersData.length > 0 ? (completedOrders / usersData.length) * 100 : 0;
    const totalRevenue = ordersData
      .filter(order => order.payment_status === 'completed')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const userOrderCount: Record<string, number> = {};
    ordersData.forEach(order => { if (order.user_id) userOrderCount[order.user_id] = (userOrderCount[order.user_id] || 0) + 1; });
    const returningCustomers = Object.values(userOrderCount).filter(count => count > 1).length;
    setMetrics({ conversionRate: Math.round(conversionRate), avgOrderValue: Math.round(avgOrderValue), returningCustomers });
  };

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const totalRevenue = orders
    .filter(order => order.payment_status === 'completed')
    .reduce((total, order) => total + (order.total_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-[#c9b655] mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Dashboard</p>
            <h1 className="text-4xl font-light text-gray-900 tracking-tight">Overview</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3.5 py-2 text-gray-500 rounded-lg border border-gray-200 hover:bg-white hover:border-gray-300 text-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Link href="/dashboard/orders">
              <button className="flex items-center gap-2 px-3.5 py-2 text-gray-600 rounded-lg border border-gray-200 hover:bg-white hover:border-gray-300 text-sm transition-all">
                <Eye className="w-3.5 h-3.5" />
                Orders
              </button>
            </Link>
            <Link href="/dashboard/presets">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm transition-all">
                <Plus className="w-3.5 h-3.5" />
                Add Preset
              </button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard label="Total Orders" value={orders.length} icon={<ShoppingCart className="w-4 h-4" />} accent="text-blue-600 bg-blue-50" />
          <KPICard label="Total Users" value={users.length} icon={<Users className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" />
          <KPICard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" />
          <KPICard label="Conversion" value={`${metrics.conversionRate}%`} icon={<TrendingUp className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" sub={`${metrics.returningCustomers} returning`} />
        </div>

        {/* Inventory + Minting Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Preset Inventory */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Package className="w-4 h-4 text-[#c9b655]" />
                Preset Inventory
              </h2>
              {presetInventory.pendingApproval > 0 && (
                <Link href="/dashboard/preset-requests" className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full hover:bg-amber-100 transition-colors">
                  <AlertCircle className="w-3 h-3" />
                  {presetInventory.pendingApproval} pending
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/60 rounded-lg p-3 border border-emerald-100/60">
                <p className="text-2xl font-light text-gray-900">{presetInventory.available}</p>
                <p className="text-xs text-gray-500 mt-0.5">Available to sell</p>
              </div>
              <div className="bg-red-50/60 rounded-lg p-3 border border-red-100/60">
                <p className="text-2xl font-light text-gray-900">{presetInventory.soldOut}</p>
                <p className="text-xs text-gray-500 mt-0.5">Sold out</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-2xl font-light text-gray-900">{presetInventory.totalPublic}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total approved</p>
              </div>
              <div className="bg-amber-50/60 rounded-lg p-3 border border-amber-100/60">
                <p className="text-2xl font-light text-gray-900">{presetInventory.pendingApproval}</p>
                <p className="text-xs text-gray-500 mt-0.5">Awaiting review</p>
              </div>
            </div>
          </div>

          {/* NFT Minting */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Gem className="w-4 h-4 text-[#c9b655]" />
              NFT Minting
            </h2>
            <div className="flex items-end gap-6 mb-4">
              <div>
                <p className="text-4xl font-light text-gray-900">{mintingStats.totalMinted}</p>
                <p className="text-xs text-gray-400 mt-0.5">Total minted</p>
              </div>
              <div className="pb-1">
                <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  {mintingStats.mintedThisWeek} this week
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <RarityPill label="Silver" count={mintingStats.silver} color="bg-gray-100 text-gray-600 border-gray-200" />
              <RarityPill label="Gold" count={mintingStats.gold} color="bg-amber-50 text-amber-700 border-amber-200" />
              <RarityPill label="Platinum" count={mintingStats.platinum} color="bg-violet-50 text-violet-700 border-violet-200" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
          <button
            className="flex justify-between items-center w-full p-5 text-left"
            onClick={() => toggleSection('charts')}
          >
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#c9b655]" />
              Analytics
            </h2>
            {expandedSections.charts ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.charts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-gray-100">
              <div className="p-5 lg:border-r border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">Orders & Revenue</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyOrdersData}>
                      <defs>
                        <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#c9b655" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#c9b655" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                        formatter={(value: any, name: string) => name === 'orders' ? [value, 'Orders'] : [`$${value}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="orders" stroke="#c9b655" strokeWidth={2} fill="url(#ordersFill)" />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">User Growth</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                        formatter={(value: any) => [`${value}`, 'Total Users']}
                      />
                      <Area type="monotone" dataKey="cumulative" stroke="#8b5cf6" strokeWidth={2} fill="url(#usersFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Referrals */}
        <div className="bg-white rounded-xl border border-gray-100 mb-6 overflow-hidden">
          <button
            className="flex justify-between items-center w-full p-5 text-left"
            onClick={() => toggleSection('referrals')}
          >
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#c9b655]" />
              Referrals
            </h2>
            <div className="flex items-center gap-3">
              {!expandedSections.referrals && referralStats.referralsCompleted > 0 && (
                <span className="text-xs text-gray-400">{referralStats.referralsCompleted} completed &middot; {referralStats.conversionRate}% rate</span>
              )}
              {expandedSections.referrals ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </button>
          {expandedSections.referrals && (
            <div className="border-t border-gray-100 p-5 space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Codes Created" value={referralStats.codesGenerated} />
                <MiniStat label="Completed" value={referralStats.referralsCompleted} />
                <MiniStat label="Conversion" value={`${referralStats.conversionRate}%`} />
                <MiniStat label="Credits" value={referralStats.creditsGranted} sub={`${referralStats.creditsConsumed} used`} />
              </div>

              {recentReferrals.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="py-2 pr-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Inviter</th>
                        <th className="py-2 pr-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Invitee</th>
                        <th className="py-2 pr-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Code</th>
                        <th className="py-2 pr-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Status</th>
                        <th className="py-2 text-xs text-gray-400 font-medium uppercase tracking-wide">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReferrals.map((r: any) => (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="py-2.5 pr-3 text-gray-700">{r.inviter?.email || "—"}</td>
                          <td className="py-2.5 pr-3 text-gray-700">{r.invitee?.email || "—"}</td>
                          <td className="py-2.5 pr-3">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{r.invite_code}</code>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {r.status === "completed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

/* ─── Reusable Components ─── */

const KPICard = ({ label, value, icon, accent, sub }: { label: string; value: string | number; icon: React.ReactNode; accent: string; sub?: string }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex justify-between items-start hover:border-gray-200 transition-colors">
    <div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400">{label}</p>
      <p className="text-3xl font-light text-gray-900 mt-1 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
      {icon}
    </div>
  </div>
);

const MiniStat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-gray-50/80 rounded-lg p-3">
    <p className="text-[10px] uppercase tracking-[0.15em] text-gray-400">{label}</p>
    <p className="text-xl font-light text-gray-900 mt-0.5">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const RarityPill = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm flex-1 ${color}`}>
    <span className="font-medium">{count}</span>
    <span className="text-xs opacity-70">{label}</span>
  </div>
);
