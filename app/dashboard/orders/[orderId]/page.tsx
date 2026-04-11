"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, CreditCard, Loader, Package, RefreshCw, User } from "lucide-react";
import { getItem, setItem } from "@/utils/indexedDB";
import { supabase } from "@/utils/supabaseClient";
import {
  collectPreviewImages,
  formatCurrency,
  formatOrderDate,
  getCustomerEmail,
  getCustomerName,
  getOrderStatus,
  getPresetDesigns,
  getPrimaryPresetName,
  getStatusPresentation,
  OrderRecord,
} from "../orderHelpers";

const DB_NAME = "egg-store-db";
const STORE_NAME = "orders";

function FallbackImage({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative h-full w-full">
      <Image
        src={imgSrc || "/placeholder.png"}
        alt={alt}
        fill
        className="object-cover"
        onError={() => {
          setImgSrc("/placeholder.png");
          setLoading(false);
        }}
        onLoadingComplete={() => setLoading(false)}
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <Loader className="animate-spin text-gray-400" size={16} />
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const storedOrders = await getItem(DB_NAME, STORE_NAME, "allOrders");
        const cachedOrder = Array.isArray(storedOrders)
          ? (storedOrders.find((item) => String(item.id) === String(orderId)) as OrderRecord | undefined)
          : undefined;

        if (cachedOrder) {
          setOrder(cachedOrder);
          setLoading(false);
        }

        const { data, error: fetchError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (fetchError) {
          setError("Unable to load this order.");
          setLoading(false);
          return;
        }

        const nextOrder = data as OrderRecord;
        setOrder(nextOrder);
        setLoading(false);

        if (Array.isArray(storedOrders)) {
          const nextOrders = [nextOrder, ...storedOrders.filter((item) => String(item.id) !== String(orderId))];
          setItem(DB_NAME, STORE_NAME, "allOrders", nextOrders).catch(() => undefined);
        }
      } catch {
        setError("An unexpected error occurred while loading the order.");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const refreshOrder = async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (fetchError) {
        setError("Unable to refresh this order.");
        setLoading(false);
        return;
      }

      setOrder(data as OrderRecord);
      setLoading(false);
    } catch {
      setError("An unexpected error occurred while refreshing the order.");
      setLoading(false);
    }
  };

  const designs = order ? getPresetDesigns(order) : [];
  const previewImages = collectPreviewImages(designs, 8);
  const status = order ? getOrderStatus(order) : "unknown";
  const presentation = getStatusPresentation(status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center gap-4 mb-6 flex-wrap">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#b89d3b]">
          <ArrowLeft size={16} />
          Back to orders
        </Link>
        <button
          onClick={refreshOrder}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] text-white rounded-lg hover:bg-[#d4c070] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
      )}

      {loading && !order ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
          <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
          <p>Loading order...</p>
        </div>
      ) : !order ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
          <Package className="mx-auto mb-2 text-gray-300" size={28} />
          <p>Order not found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Order detail</p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="serif text-4xl leading-none text-gray-900">#{order.id}</h1>
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                  <Calendar size={14} />
                  {formatOrderDate(order.created_at, true)}
                </p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${presentation.className}`}>
                {presentation.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <User className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Customer</p>
                      <p className="text-sm text-gray-700 mt-1">{getCustomerName(order)}</p>
                      <p className="text-xs text-gray-500 mt-1">{getCustomerEmail(order)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="text-gray-400 mt-1" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Payment</p>
                      <p className="text-sm text-gray-700 mt-1">{formatCurrency(order)}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.payment_method || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Items</h2>
                <div className="rounded-lg border border-gray-200 p-4 mb-4">
                  <p className="font-medium text-gray-900">{getPrimaryPresetName(order)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {designs.length} {designs.length === 1 ? "item" : "items"} purchased
                  </p>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2">
                  {previewImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-36 sm:w-36"
                    >
                      <FallbackImage src={image} alt={`Order preview ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order metadata</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Order ID</dt>
                    <dd className="text-gray-900 font-medium">#{order.id}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Created</dt>
                    <dd className="text-gray-900">{formatOrderDate(order.created_at, true)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Updated</dt>
                    <dd className="text-gray-900">{formatOrderDate(order.updated_at, true)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Payment status</dt>
                    <dd className="text-gray-900">{order.payment_status || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Order status</dt>
                    <dd className="text-gray-900">{order.order_status || order.status || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Fulfillment</dt>
                    <dd className="text-gray-900">{order.fulfillment_status || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-500">Refund</dt>
                    <dd className="text-gray-900">{order.refund_status || "—"}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
