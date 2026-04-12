"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../utils/supabaseClient";
import {
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  UserRound,
  PackageOpen,
} from "lucide-react";

type DateFilter = "today" | "week" | "all";

type OwnershipPreset = {
  id: string;
  created_at: string | null;
  updated_at?: string | null;
  owned_by: string | null;
  preset_status?: string | null;
  preset_images?: string[] | null;
  preset_name?: {
    en_name?: string | null;
    de_name?: string | null;
  } | null;
  owner?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

const DATE_FILTER_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All-Time" },
];

function getPresetName(preset: OwnershipPreset) {
  return preset.preset_name?.en_name || preset.preset_name?.de_name || "Untitled preset";
}

function getClaimedAt(preset: OwnershipPreset) {
  return preset.updated_at || preset.created_at || null;
}

function formatClaimedDate(value: string | null) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function isToday(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(date: Date, now: Date) {
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return date >= startOfWeek;
}

function matchesDateFilter(preset: OwnershipPreset, filter: DateFilter, now: Date) {
  if (filter === "all") return true;

  const claimedAt = getClaimedAt(preset);
  if (!claimedAt) return false;

  const claimDate = new Date(claimedAt);
  if (Number.isNaN(claimDate.getTime())) return false;

  if (filter === "today") return isToday(claimDate, now);
  return isThisWeek(claimDate, now);
}

function isAvailablePreset(preset: OwnershipPreset) {
  const status = preset.preset_status;
  const isApproved = status === "approved" || status == null;
  return isApproved && !preset.owned_by;
}

function Thumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [imageSrc, setImageSrc] = useState(src || "/placeholder.png");

  useEffect(() => {
    setImageSrc(src || "/placeholder.png");
  }, [src]);

  return (
    <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className="object-cover"
        sizes="56px"
        onError={() => setImageSrc("/placeholder.png")}
      />
    </div>
  );
}

export default function OwnershipPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    (searchParams.get("date") as DateFilter) || "all"
  );
  const [presets, setPresets] = useState<OwnershipPreset[]>([]);
  const [filteredOwnedPresets, setFilteredOwnedPresets] = useState<OwnershipPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextSearch = searchParams.get("q") || "";
    const nextDate = searchParams.get("date");
    setSearchQuery(nextSearch);
    setDateFilter(
      nextDate === "today" || nextDate === "week" || nextDate === "all" ? nextDate : "all"
    );
  }, [searchParams]);

  useEffect(() => {
    const now = new Date();
    const ownedPresets = presets.filter((preset) => Boolean(preset.owned_by));
    const query = searchQuery.trim().toLowerCase();

    const nextRows = ownedPresets.filter((preset) => {
      const presetName = getPresetName(preset).toLowerCase();
      const ownerEmail = preset.owner?.email?.toLowerCase() || "";
      const matchesSearch =
        query.length === 0 || presetName.includes(query) || ownerEmail.includes(query);

      return matchesSearch && matchesDateFilter(preset, dateFilter, now);
    });

    nextRows.sort((a, b) => {
      const aDate = getClaimedAt(a) ? new Date(getClaimedAt(a) as string).getTime() : 0;
      const bDate = getClaimedAt(b) ? new Date(getClaimedAt(b) as string).getTime() : 0;
      return bDate - aDate;
    });

    setFilteredOwnedPresets(nextRows);
  }, [dateFilter, presets, searchQuery]);

  const updateQueryParams = (next: { q?: string; date?: DateFilter }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSearch = next.q ?? searchQuery;
    const nextDate = next.date ?? dateFilter;

    if (nextSearch.trim()) {
      params.set("q", nextSearch.trim());
    } else {
      params.delete("q");
    }

    if (nextDate === "all") {
      params.delete("date");
    } else {
      params.set("date", nextDate);
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const fetchOwnership = async (showRefreshState = false) => {
    if (showRefreshState) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    const { data, error: fetchError } = await supabase
      .from("presets")
      .select(
        "id, created_at, updated_at, owned_by, preset_status, preset_images, preset_name, owner:users!owned_by(name,email)"
      )
      .or("preset_status.eq.approved,preset_status.is.null")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Failed to load ownership data. Please try again.");
    } else {
      setPresets((data as OwnershipPreset[]) || []);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOwnership();

    const channel = supabase
      .channel("public:ownership-presets")
      .on("postgres_changes", { event: "*", schema: "public", table: "presets" }, () => {
        fetchOwnership(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalOwned = presets.filter((preset) => Boolean(preset.owned_by)).length;
  const claimedLast7Days = presets.filter((preset) => {
    if (!preset.owned_by) return false;
    const claimedAt = getClaimedAt(preset);
    if (!claimedAt) return false;

    const claimTime = new Date(claimedAt).getTime();
    if (Number.isNaN(claimTime)) return false;

    return claimTime >= Date.now() - 7 * 24 * 60 * 60 * 1000;
  }).length;
  const stillAvailable = presets.filter(isAvailablePreset).length;

  return (
    <div className="pp">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-4xl md:text-5xl leading-none text-gray-900">Ownership</h1>
            <p className="text-sm text-gray-600 mt-3">
              See who owns each preset without digging through order records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchOwnership(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:text-amber-900 hover:border-[#e6d281]/40 transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={refreshing ? "animate-spin" : ""} size={16} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-3xl font-light">{totalOwned}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Total Owned</p>
          </div>
          <div className="card p-5">
            <p className="text-3xl font-light">{claimedLast7Days}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
              Claimed Last 7 Days
            </p>
          </div>
          <div className="card p-5">
            <p className="text-3xl font-light">{stillAvailable}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
              Still Available
            </p>
          </div>
        </div>

        <div className="card p-4 sm:p-5 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setSearchQuery(nextValue);
                  updateQueryParams({ q: nextValue });
                }}
                placeholder="Search preset name or owner email"
                className="ifield ifield-with-icon h-12 pr-4 text-sm leading-5"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {DATE_FILTER_OPTIONS.map((option) => {
                const active = dateFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDateFilter(option.value);
                      updateQueryParams({ date: option.value });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm border transition-colors ${
                      active
                        ? "bg-[#e6d281] text-gray-900 border-[#e6d281]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#e6d281]/50 hover:text-gray-900"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {(searchQuery || dateFilter !== "all") && (
            <p className="text-sm text-gray-600 mt-4">
              Showing <span className="font-medium text-gray-900">{filteredOwnedPresets.length}</span>{" "}
              ownership row{filteredOwnedPresets.length === 1 ? "" : "s"}
              {searchQuery ? (
                <>
                  {" "}
                  for <span className="text-amber-900">&quot;{searchQuery}&quot;</span>
                </>
              ) : null}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="card p-10 text-center text-gray-500">
            <Loader2 className="animate-spin mx-auto mb-3" size={24} />
            Loading ownership data...
          </div>
        ) : filteredOwnedPresets.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <PackageOpen className="mx-auto mb-4 text-gray-300" size={30} />
            <h2 className="text-lg font-medium text-gray-900">
              {searchQuery || dateFilter !== "all" ? "No ownership matches" : "No owned presets yet"}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {searchQuery || dateFilter !== "all"
                ? "Try a different search or a wider date range."
                : "Owned presets will appear here as soon as they are claimed."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-4">Preset</th>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Owner</th>
                      <th className="px-5 py-4">Owner Email</th>
                      <th className="px-5 py-4">Claimed Date</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOwnedPresets.map((preset) => (
                      <tr key={preset.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-5 py-4">
                          <Thumbnail
                            src={preset.preset_images?.[0]}
                            alt={getPresetName(preset)}
                          />
                        </td>
                        <td className="px-5 py-4 font-medium text-gray-900">
                          {getPresetName(preset)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 text-gray-900">
                            <UserRound size={14} className="text-gray-400" />
                            <span>{preset.owner?.name || "Unknown owner"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">{preset.owner?.email || "No email"}</td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{formatClaimedDate(getClaimedAt(preset))}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Owned
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-3">
              {filteredOwnedPresets.map((preset) => (
                <div key={preset.id} className="card p-4">
                  <div className="flex gap-4">
                    <Thumbnail src={preset.preset_images?.[0]} alt={getPresetName(preset)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900 leading-snug">
                          {getPresetName(preset)}
                        </h2>
                        <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Owned
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {preset.owner?.name || "Unknown owner"}
                      </p>
                      <p className="text-sm text-gray-500 break-all">
                        {preset.owner?.email || "No email"}
                      </p>
                      <p className="text-xs text-gray-500 mt-3">
                        Claimed {formatClaimedDate(getClaimedAt(preset))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
