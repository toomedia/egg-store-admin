"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronDown, Filter, Package, RefreshCw, Search } from "lucide-react";
import { getItem, setItem } from "@/utils/indexedDB";
import { supabase } from "@/utils/supabaseClient";
import {
  formatCurrency,
  formatOrderDate,
  getCustomerEmail,
  getCustomerName,
  getOrderStatus,
  getPrimaryPresetName,
  getStatusPresentation,
  matchesDateRange,
  OrderRecord,
  sortOrdersByRecent,
} from "./orderHelpers";

const DB_NAME = "egg-store-db";
const STORE_NAME = "orders";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "needs_attention", label: "Needs attention" },
  { value: "pending", label: "Pending fulfillment" },
  { value: "failed", label: "Failed payment" },
  { value: "refund_requested", label: "Refund requested" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "cancelled", label: "Cancelled" },
  { value: "unknown", label: "Unknown" },
] as const;

const DATE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
] as const;

function isAttentionStatus(status: string) {
  return ["pending", "failed", "refund_requested"].includes(status);
}

function orderMatchesCustomer(order: OrderRecord, customerFilter: string) {
  if (!customerFilter) return true;

  const search = customerFilter.trim().toLowerCase();
  const haystack = [String(order.id ?? ""), getCustomerName(order), getCustomerEmail(order)]
    .join(" ")
    .toLowerCase();

  return haystack.includes(search);
}

function orderMatchesStatus(order: OrderRecord, statusFilter: string) {
  if (statusFilter === "all") return true;

  const normalizedStatus = getOrderStatus(order);
  if (statusFilter === "needs_attention") return isAttentionStatus(normalizedStatus);

  return normalizedStatus === statusFilter;
}

function EmptyState({ customerFilter }: { customerFilter: string }) {
  return (
    <div className="text-center text-gray-500 py-10">
      <Package className="mx-auto mb-3 text-gray-300" size={32} />
      <h3 className="text-lg font-medium text-gray-900">
        {customerFilter ? "No matching orders" : "No orders found"}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {customerFilter
          ? `Nothing matches "${customerFilter}". Try a different customer or status filter.`
          : "Orders will show here once customers start checking out."}
      </p>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusFilter = searchParams.get("status") || "all";
  const dateRange = searchParams.get("dateRange") || "all";
  const customerFilter = searchParams.get("customer") || "";

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");

        if (Array.isArray(storedOrders) && storedOrders.length > 0) {
          setOrders(sortOrdersByRecent(storedOrders));
          setLoading(false);
        }

        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (fetchError) {
          setError("Failed to load orders. Please refresh the page.");
          setLoading(false);
          return;
        }

        const nextOrders = sortOrdersByRecent((data || []) as OrderRecord[]);
        setOrders(nextOrders);
        setLoading(false);
        setError(null);

        try {
          await setItem(DB_NAME, STORE_NAME, "allOrders", nextOrders);
        } catch {
          // Cache failures should not block the page.
        }
      } catch {
        setError("An unexpected error occurred while loading orders.");
        setLoading(false);
      }
    };

    fetchOrders();

    const channel = supabase
      .channel("public:orders:list")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, async (payload) => {
        setOrders((current) => {
          let next = [...current];

          if (payload.eventType === "INSERT") {
            next = [payload.new as OrderRecord, ...next.filter((order) => order.id !== payload.new.id)];
          } else if (payload.eventType === "UPDATE") {
            next = next.map((order) =>
              order.id === payload.new.id ? ({ ...order, ...(payload.new as OrderRecord) } as OrderRecord) : order
            );
          } else if (payload.eventType === "DELETE") {
            next = next.filter((order) => order.id !== payload.old.id);
          }

          const sorted = sortOrdersByRecent(next);
          setItem(DB_NAME, STORE_NAME, "allOrders", sorted).catch(() => undefined);
          return sorted;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return sortOrdersByRecent(orders).filter((order) => {
      return (
        orderMatchesStatus(order, statusFilter) &&
        matchesDateRange(order, dateRange) &&
        orderMatchesCustomer(order, customerFilter)
      );
    });
  }, [orders, statusFilter, dateRange, customerFilter]);

  const attentionOrders = useMemo(() => {
    return filteredOrders.filter((order) => isAttentionStatus(getOrderStatus(order)));
  }, [filteredOrders]);

  const metrics = useMemo(() => {
    return {
      total: orders.length,
      filtered: filteredOrders.length,
      attention: orders.filter((order) => isAttentionStatus(getOrderStatus(order))).length,
    };
  }, [orders, filteredOrders]);

  const refreshOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to refresh orders. Please try again.");
        setLoading(false);
        return;
      }

      const nextOrders = sortOrdersByRecent((data || []) as OrderRecord[]);
      setOrders(nextOrders);
      setLoading(false);

      try {
        await setItem(DB_NAME, STORE_NAME, "allOrders", nextOrders);
      } catch {
        // Ignore cache write issues.
      }
    } catch {
      setError("An unexpected error occurred while refreshing orders.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-end gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-5xl leading-none text-gray-900">Orders</h1>
            <p className="text-sm text-gray-600 mt-2">
              Surface the orders that need action first, then filter the rest.
            </p>
          </div>
          <button
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-white rounded-lg hover:bg-[#d4c070] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500">Total orders</p>
          <p className="text-3xl font-light text-gray-900 mt-2">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500">Needs attention</p>
          <p className="text-3xl font-light text-gray-900 mt-2">{metrics.attention}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500">Filtered results</p>
          <p className="text-3xl font-light text-gray-900 mt-2">{metrics.filtered}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Filter by customer or order ID"
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={customerFilter}
              onChange={(event) => updateQuery("customer", event.target.value)}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={statusFilter}
              onChange={(event) => updateQuery("status", event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
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
              value={dateRange}
              onChange={(event) => updateQuery("dateRange", event.target.value)}
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Priority queue</p>
            <h2 className="text-2xl text-gray-900">Needs attention</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pending fulfillment, failed payments, and refund requests bubble up here.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
            <AlertTriangle size={14} />
            {attentionOrders.length} visible
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>Loading orders...</p>
          </div>
        ) : attentionOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-sm text-gray-500">
            No orders currently need immediate attention for the selected filters.
          </div>
        ) : (
          <div className="space-y-3">
            {attentionOrders.map((order) => {
              const status = getOrderStatus(order);
              const presentation = getStatusPresentation(status);

              return (
                <Link
                  key={`attention-${order.id}`}
                  href={`/dashboard/orders/${order.id}`}
                  className="block rounded-lg border border-amber-100 bg-amber-50/50 p-4 hover:border-[#e6d281] hover:bg-amber-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">Order #{order.id}</span>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${presentation.className}`}>
                          {presentation.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{getCustomerName(order)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getPrimaryPresetName(order)} · {formatOrderDate(order.created_at, true)}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(order)}</p>
                      <p className="text-xs text-gray-500">{getCustomerEmail(order)}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">All orders</p>
          <h2 className="text-2xl text-gray-900">Order ownership view</h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState customerFilter={customerFilter} />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-left text-sm text-gray-600">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Preset</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const status = getOrderStatus(order);
                    const presentation = getStatusPresentation(status);

                    return (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <Link href={`/dashboard/orders/${order.id}`} className="hover:text-[#b89d3b]">
                            #{order.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{getCustomerName(order)}</div>
                          <div className="text-xs text-gray-500">{getCustomerEmail(order)}</div>
                        </td>
                        <td className="px-4 py-3">{getPrimaryPresetName(order)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${presentation.className}`}>
                            {presentation.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatCurrency(order)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/orders/${order.id}`} className="hover:text-[#b89d3b]">
                            {formatOrderDate(order.created_at, true)}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-3 md:hidden">
              {filteredOrders.map((order) => {
                const status = getOrderStatus(order);
                const presentation = getStatusPresentation(status);

                return (
                  <Link
                    key={`mobile-${order.id}`}
                    href={`/dashboard/orders/${order.id}`}
                    className="rounded-lg border border-gray-200 p-4 hover:border-[#e6d281] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-700 mt-1">{getCustomerName(order)}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${presentation.className}`}>
                        {presentation.label}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      <p>{getPrimaryPresetName(order)}</p>
                      <p>{formatCurrency(order)}</p>
                      <p>{formatOrderDate(order.created_at, true)}</p>
                      <p className="text-xs text-gray-500">{getCustomerEmail(order)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
