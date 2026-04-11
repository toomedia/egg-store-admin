"use client";

export type OrderRecord = {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  payment?: number | string;
  total?: number | string;
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  fulfillment_status?: string;
  refund_status?: string;
  status?: string;
  user_info?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
  };
  preset_object?: any[] | any;
  [key: string]: any;
};

export type NormalizedOrderStatus =
  | "pending"
  | "failed"
  | "refund_requested"
  | "completed"
  | "processing"
  | "cancelled"
  | "unknown";

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getOrderStatus(order: OrderRecord): NormalizedOrderStatus {
  const statusCandidates = [
    order.status,
    order.order_status,
    order.fulfillment_status,
    order.payment_status,
    order.refund_status,
    order.refund_request_status,
  ].map(normalize);

  if (statusCandidates.some((value) => ["refund_requested", "refund_request", "refund_pending", "requested"].includes(value))) {
    return "refund_requested";
  }

  if (statusCandidates.some((value) => ["failed", "payment_failed", "declined", "unpaid", "charge_failed"].includes(value))) {
    return "failed";
  }

  if (statusCandidates.some((value) => ["pending", "pending_fulfillment", "awaiting_fulfillment", "unfulfilled"].includes(value))) {
    return "pending";
  }

  if (statusCandidates.some((value) => ["completed", "paid", "fulfilled", "succeeded", "success"].includes(value))) {
    return "completed";
  }

  if (statusCandidates.some((value) => ["processing", "in_progress"].includes(value))) {
    return "processing";
  }

  if (statusCandidates.some((value) => ["cancelled", "canceled"].includes(value))) {
    return "cancelled";
  }

  return "unknown";
}

export function getCustomerName(order: OrderRecord) {
  const fullName = order.user_info?.fullName?.trim();
  if (fullName) return fullName;

  const firstName = order.user_info?.firstName?.trim() || "";
  const lastName = order.user_info?.lastName?.trim() || "";
  const combined = `${firstName} ${lastName}`.trim();

  return combined || "Unknown customer";
}

export function getCustomerEmail(order: OrderRecord) {
  return order.user_info?.email?.trim() || "—";
}

export function getOrderAmount(order: OrderRecord) {
  if (typeof order.total_amount === "number") {
    return order.total_amount > 999 ? order.total_amount / 100 : order.total_amount;
  }

  const rawAmount = order.payment ?? order.total ?? 0;
  const amount = Number(rawAmount);

  return Number.isFinite(amount) ? amount : 0;
}

export function formatCurrency(order: OrderRecord) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(getOrderAmount(order));
}

export function formatOrderDate(value?: string, includeTime = false) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit" as const,
          minute: "2-digit" as const,
        }
      : {}),
  });
}

export function getPresetDesigns(order: OrderRecord) {
  if (Array.isArray(order.preset_object)) return order.preset_object;
  if (order.preset_object) return [order.preset_object];
  return [];
}

export function getPrimaryPresetName(order: OrderRecord) {
  const first = getPresetDesigns(order)[0];
  return first?.preset_name?.en_name || first?.name || "Untitled preset";
}

export function collectPreviewImages(designs: any[], max: number) {
  const out: string[] = [];

  for (const design of Array.isArray(designs) ? designs : []) {
    if (out.length >= max) break;

    if (Array.isArray(design?.images)) {
      for (const url of design.images) {
        if (out.length >= max) break;
        out.push(url);
      }
    } else if (design?.image) {
      out.push(design.image);
    }
  }

  while (out.length < max) out.push("/placeholder.png");
  return out.slice(0, max);
}

export function matchesDateRange(order: OrderRecord, range: string) {
  if (range === "all") return true;

  const createdAt = order.created_at ? new Date(order.created_at) : null;
  if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

  const now = new Date();
  const start = new Date(now);

  if (range === "7d") {
    start.setDate(now.getDate() - 7);
    return createdAt >= start;
  }

  if (range === "30d") {
    start.setDate(now.getDate() - 30);
    return createdAt >= start;
  }

  if (range === "90d") {
    start.setDate(now.getDate() - 90);
    return createdAt >= start;
  }

  if (range === "this_month") {
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
  }

  return true;
}

export function sortOrdersByRecent(orders: OrderRecord[]) {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

export function getStatusPresentation(status: NormalizedOrderStatus) {
  const map = {
    pending: {
      label: "Pending fulfillment",
      className: "bg-amber-100 text-amber-800",
    },
    failed: {
      label: "Failed payment",
      className: "bg-red-100 text-red-700",
    },
    refund_requested: {
      label: "Refund requested",
      className: "bg-violet-100 text-violet-700",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-700",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-100 text-blue-700",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-200 text-gray-700",
    },
    unknown: {
      label: "Unknown",
      className: "bg-gray-100 text-gray-600",
    },
  } satisfies Record<NormalizedOrderStatus, { label: string; className: string }>;

  return map[status];
}
