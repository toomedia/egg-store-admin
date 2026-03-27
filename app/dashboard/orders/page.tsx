"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getItem, setItem } from "@/utils/indexedDB";
import { supabase } from "../../../utils/supabaseClient";
import {
  Search,
  User,
  ArrowLeft,
  Loader,
  RefreshCw,
  X,
  Calendar,
  Package,
} from "lucide-react";

function collectPreviewImages(designs: any[], max: number): string[] {
  const out: string[] = [];
  if (!Array.isArray(designs)) return Array(max).fill("/placeholder.png");
  for (const design of designs) {
    if (out.length >= max) break;
    if (Array.isArray(design?.images) && design.images.length > 0) {
      for (const u of design.images) {
        if (out.length >= max) break;
        out.push(u);
      }
    } else if (design?.image) {
      out.push(design.image);
    }
  }
  while (out.length < max) out.push("/placeholder.png");
  return out.slice(0, max);
}

const OrdersPage = () => {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const DB_NAME = "egg-store-db";
  const STORE_NAME = "orders";

  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrders(orders);
    } else {
      const search = searchQuery.toLowerCase();
      setFilteredOrders(
        orders.filter((order) => {
          const id = String(order.id ?? order.order_id ?? "");
          return (
            id.toLowerCase().includes(search) ||
            (order.user_info?.firstName?.toLowerCase() || "").includes(search) ||
            (order.user_info?.email?.toLowerCase() || "").includes(search)
          );
        })
      );
    }
  }, [orders, searchQuery]);

  useEffect(() => {
    const fetchAllOrders = async () => {
      try {
        let allOrders: any[] = [];
        let shouldFetchFromSupabase = true;

        try {
          const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
          if (Array.isArray(storedOrders) && storedOrders.length > 0) {
            allOrders = storedOrders;
            shouldFetchFromSupabase = false;
          }
        } catch {
          /* use network */
        }

        if (shouldFetchFromSupabase) {
          const { data, error } = await supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) {
            setError("Failed to load orders. Please refresh the page.");
            setLoading(false);
            return;
          }
          allOrders = data || [];
          try {
            await setItem(DB_NAME, STORE_NAME, "allOrders", allOrders);
          } catch {
            /* optional cache */
          }
        }

        setOrders(allOrders);
        setLoading(false);
      } catch {
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    };

    fetchAllOrders();

    const channel = supabase
      .channel("public:orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          try {
            const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
            const existingOrders: any[] = Array.isArray(storedOrders) ? storedOrders : [];
            const updatedOrders = [payload.new, ...existingOrders];
            await setItem(DB_NAME, STORE_NAME, "allOrders", updatedOrders);
            setOrders(updatedOrders);
          } catch (err) {
            console.error("Error handling order change:", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const FallbackImage = ({ src, alt, fallbackSrc = "/placeholder.png", ...props }: any) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [imgLoading, setImgLoading] = useState(true);

    return (
      <div className="relative w-full h-full">
        <Image
          {...props}
          src={imgSrc || fallbackSrc}
          alt={alt}
          fill
          className="object-cover"
          onLoadingComplete={() => setImgLoading(false)}
          onError={() => {
            setImgSrc(fallbackSrc);
            setImgLoading(false);
          }}
        />
        {imgLoading && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <Loader className="animate-spin text-gray-400" size={14} />
          </div>
        )}
      </div>
    );
  };

  const refreshOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Failed to refresh orders. Please try again.");
        setLoading(false);
        return;
      }
      const allOrders = data || [];
      try {
        await setItem(DB_NAME, STORE_NAME, "allOrders", allOrders);
      } catch {
        /* ignore */
      }
      setOrders(allOrders);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getName = (design: any) => {
    return design?.preset_name?.en_name || design?.name || "Untitled";
  };

  const errBanner = error && (
    <div className="mb-6 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex justify-between items-center gap-3">
      <span>{error}</span>
      <button type="button" onClick={() => setError(null)} className="text-red-200 hover:text-white shrink-0">
        <X size={18} />
      </button>
    </div>
  );

  if (selectedOrder) {
    const { user_info, preset_object } = selectedOrder;
    const designs = Array.isArray(preset_object) ? preset_object : [preset_object];
    const previewImages = collectPreviewImages(designs, 12);

    return (
      <div className="pp">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#e6d281] transition-colors mb-8 text-sm"
          >
            <ArrowLeft size={15} /> Back
          </button>

          {errBanner}

          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Order</p>
          <h1 className="serif text-4xl text-gray-900 mb-1">#{selectedOrder.id}</h1>
          <p className="text-sm text-gray-600 mb-8 flex items-center gap-2">
            <Calendar size={14} />
            {formatDate(selectedOrder.created_at)}
          </p>

          <div className="card p-5 mb-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Customer</p>
                <p className="text-sm">{user_info?.fullName || "—"}</p>
                <p className="text-xs text-gray-600 mt-1">{user_info?.email || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Payment</p>
                <p className="text-sm text-[#e6d281]">${selectedOrder.payment || "0.00"}</p>
                <p className="text-xs text-gray-600 mt-1">{selectedOrder.payment_method || "—"}</p>
              </div>
            </div>

            {designs.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Items</p>
                <p className="text-sm font-medium">{getName(designs[0])}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Quantity {designs.reduce((sum, d) => sum + (d?.quantity || 1), 0)}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Preview</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previewImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png";
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-5xl leading-none text-gray-900">Orders</h1>
          </div>
          <button
            type="button"
            onClick={refreshOrders}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-amber-900 hover:border-[#e6d281]/40 transition-all text-sm disabled:opacity-40"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        <div className="flex gap-8 mb-8 pb-8 border-b border-gray-200 flex-wrap items-end">
          <div>
            <p className="text-3xl font-light">{orders.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-0.5">Total</p>
          </div>
          {searchQuery && (
            <div className="ml-auto">
              <p className="text-sm text-gray-600">
                {filteredOrders.length} match{filteredOrders.length !== 1 ? "es" : ""} for{" "}
                <span className="text-[#e6d281]">&quot;{searchQuery}&quot;</span>
              </p>
            </div>
          )}
        </div>

        {errBanner}

        <div className="relative max-w-md mb-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-500" size={18} />
          </div>
          <input
            type="text"
            placeholder="Search order ID, name, or email…"
            className="ifield pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-4 animate-pulse h-24 bg-[#141414]" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 border border-gray-200">
              <Package size={22} className="text-gray-400" />
            </div>
            <h3 className="text-base mb-1">{searchQuery ? "No results" : "No orders yet"}</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery ? `Nothing matches “${searchQuery}”.` : "Orders will show here when customers checkout."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order, idx) => {
              const designs = Array.isArray(order.preset_object) ? order.preset_object : [order.preset_object];
              const thumbs = collectPreviewImages(designs, 8);
              const customerName = order.user_info?.firstName
                ? `${order.user_info.firstName} ${order.user_info.lastName || ""}`.trim()
                : "Unknown";

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="card fu w-full text-left p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <div className="flex gap-1.5 shrink-0 overflow-x-auto">
                    {thumbs.map((src, i) => (
                      <div key={i} className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <FallbackImage src={src} alt="" />
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Order #{order.id}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <User size={10} />
                      {customerName}
                    </p>
                    {designs.length > 0 && (
                      <p className="text-xs text-gray-600 truncate mt-1">{getName(designs[0])}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-[#e6d281]">${order.payment || "0.00"}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
