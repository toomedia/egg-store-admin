"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {supabase} from "../../../utils/supabaseClient"
import {
  ArrowLeft,
  PlusCircle,
  Image as ImageIcon,
  Calendar,
  Edit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface PresetName {
  en_name: string;
  de_name: string;
}

interface PresetDesc {
  en_desc: string;
  de_desc: string;
}

interface PresetSize {
  value: string | number;
  price: number;
}

interface PresetImage {
  fileObject: File | null;
  previewUrl: string;
  isExisting?: boolean;
  originalUrl?: string;
  markedForDeletion?: boolean;
}

interface Preset {
  id: string;
  preset_name: PresetName;
  preset_desc: PresetDesc;
  preset_size_json: PresetSize;
  preset_price: string;
  preset_images: string[];
  created_at: string;
  created_by: string;
  preset_status?: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  concept?: string;
  egg_prompts?: string[];
  owned_by?: string;
}

interface FormData {
  titleEn: string;
  titleDe: string;
  descEn: string;
  size: PresetSize;
  price: string;
  images: PresetImage[];
}

interface UserInfo {
  id: string;
  email: string;
  username?: string;
}

// Modal interfaces
// IndexedDB constants
const DB_NAME = 'PresetsDB';
const STORE_NAME = 'presets';
const ALL_PRESETS_KEY = 'allPresets';

// IndexedDB utility functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const setItem = async (key: string, value: any): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    throw error;
  }
};

const getItem = async (key: string): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

// Safe Image Component with optimized loading
const SafeImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (hasError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <ImageIcon className="text-gray-400" size={18} />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {loading && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onError={() => {
          setHasError(true);
          setLoading(false);
        }}
        onLoad={() => setLoading(false)}
        loading="lazy"
        sizes="80px"
      />
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    approved: { label: 'Live', icon: <CheckCircle size={12} className="shrink-0" />, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    pending_approval: { label: 'Pending', icon: <Clock size={12} className="shrink-0" />, cls: 'bg-amber-50 text-amber-900 border-amber-200' },
    rejected: { label: 'Rejected', icon: <XCircle size={12} className="shrink-0" />, cls: 'bg-red-50 text-red-800 border-red-200' },
  };
  const c = map[status];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${c.cls}`}>
      {c.icon}
      {c.label}
    </span>
  );
};

// Modal Components
const ApprovalModal = ({ 
  isOpen, 
  onClose, 
  onApprove, 
  presetName 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onApprove: (data: { germanTitle: string }) => void;
  presetName: string;
}) => {
  const [germanTitle, setGermanTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!germanTitle.trim()) {
      alert("German title is required.");
      return;
    }
    onApprove({ germanTitle });
    setGermanTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 blur-back z-50 flex items-center justify-center p-4">
      <div className="fu bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-md p-6">
        <h2 className="text-base font-medium text-gray-900 mb-1">Approve preset</h2>
        <p className="text-xs text-gray-600 mb-5">
          <span className="text-amber-800">{presetName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="germanTitle" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
              German title *
            </label>
            <input
              type="text"
              id="germanTitle"
              value={germanTitle}
              onChange={(e) => setGermanTitle(e.target.value)}
              className="ifield text-sm"
              placeholder="Enter German title"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setGermanTitle('');
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <CheckCircle size={16} />
              Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RejectionModal = ({ 
  isOpen, 
  onClose, 
  onReject, 
  presetName 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onReject: (data: { rejectionReason: string }) => void;
  presetName: string;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    onReject({ rejectionReason });
    setRejectionReason('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 blur-back z-50 flex items-center justify-center p-4">
      <div className="fu bg-white border border-gray-200 shadow-xl rounded-2xl w-full max-w-md p-6">
        <h2 className="text-base font-medium text-gray-900 mb-1">Reject preset</h2>
        <p className="text-xs text-gray-600 mb-5">
          <span className="text-amber-800">{presetName}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="rejectionReason" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
              Reason *
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="ifield text-sm min-h-[100px] resize-y"
              placeholder="Reason for rejection…"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRejectionReason('');
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <XCircle size={16} />
              Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImageLightboxModal = ({
  isOpen,
  images,
  initialIndex,
  onClose,
}: {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const safe = Math.max(0, Math.min(initialIndex, Math.max(0, images.length - 1)));
      setIdx(safe);
    }
  }, [isOpen, initialIndex, images]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && images.length > 1) {
        e.preventDefault();
        setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
      }
      if (e.key === 'ArrowRight' && images.length > 1) {
        e.preventDefault();
        setIdx((i) => (i < images.length - 1 ? i + 1 : 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, images.length, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const src = images[idx];
  const showNav = images.length > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[70] rounded-full p-2.5 text-white/90 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>
      {showNav && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i > 0 ? i - 1 : images.length - 1));
            }}
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-[70] rounded-full p-2 sm:p-3 text-white/90 hover:bg-white/10 transition-colors flex"
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i < images.length - 1 ? i + 1 : 0));
            }}
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-[70] rounded-full p-2 sm:p-3 text-white/90 hover:bg-white/10 transition-colors flex"
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div
        className="relative w-full max-w-5xl max-h-[min(85vh,900px)] aspect-[4/3] sm:aspect-auto sm:h-[min(85vh,900px)] sm:min-h-[200px]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 1280px) 100vw, 1024px"
          priority
        />
      </div>

      {showNav && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70 tabular-nums">
          {idx + 1} / {images.length}
        </p>
      )}
    </div>
  );
};

const Page = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [preset, setPreset] = useState<Preset[]>([]);
  const [filteredPreset, setFilteredPreset] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ [key: string]: UserInfo }>({});
  
  // Modal states
  const [approvalModal, setApprovalModal] = useState<{ isOpen: boolean; presetId: string; presetName: string }>({
    isOpen: false,
    presetId: '',
    presetName: ''
  });
  const [imageLightbox, setImageLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; presetId: string; presetName: string }>({
    isOpen: false,
    presetId: '',
    presetName: ''
  });

  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const handleRegenerate = async (presetId: string, presetName: string) => {
    const env = (globalThis as any).process?.env ?? {};
    const apiUrl = env.NEXT_PUBLIC_AUTO_GENERATE_API_URL;
    const adminKey = env.NEXT_PUBLIC_ADMIN_SECRET_KEY;
    if (!apiUrl || !adminKey) {
      alert('Regeneration API not configured. Check NEXT_PUBLIC_AUTO_GENERATE_API_URL and NEXT_PUBLIC_ADMIN_SECRET_KEY.');
      return;
    }
    if (!confirm(`Regenerate a new version of "${presetName}"? This will use OpenAI credits and create a new pending preset for review.`)) return;

    setRegeneratingId(presetId);
    try {
      const res = await fetch(`${apiUrl}/api/regenerate-preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ preset_id: presetId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Regeneration failed. Check if this preset has saved prompts.');
      } else {
        alert(`New version "${data.name}" created with ${data.imageCount} eggs. Check Pending Approvals.`);
        const { data: updatedData } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
        if (updatedData) setPreset(updatedData);
      }
    } catch (e: any) {
      alert(e.message || 'Regeneration failed.');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Form state
  const [formData, setFormData] = useState<FormData>({
    titleEn: '', 
    titleDe: '', 
    descEn: '', 
    size: { value: '', price: 0 }, 
    price: '', 
    images: [] 
  });

  const sizes = [
    { value: 24, price: 0.99 },
  ];

  // Filter presets based on search query and status - ONLY pending_approval
  useEffect(() => {
    let filtered = preset;
    
    // Apply status filter - ONLY pending_approval
    filtered = filtered.filter(item => item.preset_status === 'pending_approval');
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.preset_name?.en_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preset_name?.de_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preset_desc?.en_desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preset_desc?.de_desc?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPreset(filtered);
  }, [preset, searchQuery]);

  // Fetch user info for creators
  const fetchUserInfo = async (userId: string) => {
    if (!userId || userInfo[userId]) return;
    
    try {
      console.log("Fetching user info for:", userId);
      
      // Try multiple methods to get user email
      let userEmail = null;
      let username = 'User';
      
      // Method 1: Try to get from profiles table first
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, email')
          .eq('id', userId)
          .single();
        
        if (profileData && !profileError) {
          username = profileData.username || 'User';
          userEmail = profileData.email || null;
          console.log("Found email from profiles:", userEmail);
        }
      } catch (profileErr) {
        console.log("Profiles table access failed");
      }
      
      // Method 2: If email not found, try auth admin API
      if (!userEmail) {
        try {
          // Using Supabase Admin API (requires service role key)
          const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
          
          if (authData && !authError && authData.user) {
            userEmail = authData.user.email;
            console.log("Found email from auth API:", userEmail);
          }
        } catch (authErr) {
          console.log("Auth admin API failed:", authErr);
        }
      }
      
      // Method 3: If still no email, try direct users table
      if (!userEmail) {
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .single();
            
          if (usersData && !usersError) {
            userEmail = usersData.email;
            console.log("Found email from users table:", userEmail);
          }
        } catch (usersErr) {
          console.log("Users table access failed");
        }
      }
      
      // Update user info state
      const userInfoData = {
        id: userId,
        email: userEmail || 'Email not available',
        username: username
      };
      
      setUserInfo(prev => ({
        ...prev,
        [userId]: userInfoData
      }));
      
      console.log("Updated user info:", userInfoData);
      
    } catch (error) {
      console.error('Error in fetchUserInfo:', error);
      // Set fallback data on error
      setUserInfo(prev => ({
        ...prev,
        [userId]: { 
          id: userId, 
          email: 'Error loading email', 
          username: 'Unknown User' 
        }
      }));
    }
  };

  useEffect(() => {
    const fetchAllPresets = async () => {
      try {
        let allPresets: any[] = [];

        const { data, error } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error("Error fetching presets:", error);
          return;
        }
        
        allPresets = data || [];
        
        // Fetch user info for all creators
        allPresets.forEach(preset => {
          if (preset.created_by) {
            fetchUserInfo(preset.created_by);
          }
        });

        // Save to IndexedDB
        try {
          await setItem(ALL_PRESETS_KEY, allPresets);
        } catch (indexedDBError) {
          console.error("Error saving to IndexedDB:", indexedDBError);
        }

        setPreset(allPresets);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchAllPresets();

    const channel = supabase
      .channel('public:presets')  
      .on(
        'postgres_changes',
        { 
          event: '*',  
          schema: 'public', 
          table: 'presets' 
        },
        async () => {
          const { data, error } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
          
          if (error) {
            console.error("Error refetching presets:", error);
            return;
          }
          
          const updatedPresets = data || [];
          
          // Update IndexedDB
          try {
            await setItem(ALL_PRESETS_KEY, updatedPresets);
          } catch (indexedDBError) {
            console.error("Error updating IndexedDB:", indexedDBError);
          }
          
          setPreset(updatedPresets as Preset[]);
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentView]);

  // Handle preset approval with modal
  const handleApprovePreset = async (data: { germanTitle: string }) => {
    const { germanTitle } = data;
    const presetId = approvalModal.presetId;
    
    if (!germanTitle.trim()) {
      alert("German title is required.");
      return;
    }

    setIsLoading(true);
    
    try {
      const presetToUpdate = preset.find(p => p.id === presetId);
      if (!presetToUpdate) {
        alert("Preset not found.");
        setIsLoading(false);
        return;
      }

      const creatorInfo = userInfo[presetToUpdate.created_by];
      const creatorEmail = creatorInfo?.email;
      
      console.log("Creator info:", creatorInfo);
      console.log("Creator email:", creatorEmail);
      
      // Try to send email if creator email is available
      if (creatorEmail && creatorEmail !== 'Email not available' && creatorEmail !== 'Error loading email' && creatorEmail !== 'Loading email...') {
        try {
          console.log("Attempting to send email to:", creatorEmail);
          
          const presetImages = presetToUpdate.preset_images || [];
          
          const response = await fetch('https://egg-store-admin.vercel.app/api/responseemail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'approve',
              presetId: presetId,
              germanTitle: germanTitle,
              germanDescription: '', // No longer required
              adminNotes: '', // No longer required
              authorEmail: creatorEmail,
              presetImages: presetImages
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success) {
            console.log("✅ Email sent successfully to:", creatorEmail);
          } else {
            console.log("❌ Email API returned error:", result.message);
          }
        } catch (apiError) {
          console.log("❌ Email API failed:", apiError);
          // Continue with approval even if email fails
        }
      } else {
        console.log("❌ Cannot send email: Creator email not available or invalid");
      }

      // Update preset in Supabase
      const { data: updateData, error } = await supabase
        .from('presets')
        .update({
          preset_status: 'approved',
          is_public: true,
          preset_name: {
            en_name: presetToUpdate.preset_name?.en_name || germanTitle,
            de_name: germanTitle
          },
          preset_desc: presetToUpdate.preset_desc || { en_desc: '', de_desc: '' }, // Keep existing or empty
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', presetId)
        .select();

      if (error) {
        console.error("Direct Supabase update error:", error);
        alert(`Failed to approve preset: ${error.message}`);
      } else {
        alert("Preset approved successfully!");
        // Refresh the list
        const { data: updatedData } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
        if (updatedData) {
          setPreset(updatedData);
        }
      }

    } catch (error) {
      console.error("Error approving preset:", error);
      alert("Error approving preset. Please try again.");
    } finally {
      setIsLoading(false);
      setApprovalModal({ isOpen: false, presetId: '', presetName: '' });
    }
  };

  // Handle preset rejection with modal
  const handleRejectPreset = async (data: { rejectionReason: string }) => {
    const { rejectionReason } = data;
    const presetId = rejectionModal.presetId;
    
    if (!rejectionReason.trim()) {
      alert("Rejection reason is required.");
      return;
    }

    setIsLoading(true);
    
    try {
      const presetToUpdate = preset.find(p => p.id === presetId);
      if (!presetToUpdate) {
        alert("Preset not found.");
        setIsLoading(false);
        return;
      }

      const creatorInfo = userInfo[presetToUpdate.created_by];
      const creatorEmail = creatorInfo?.email;
      
      console.log("Creator info for rejection:", creatorInfo);

      // Try to send rejection email if creator email is available
      if (creatorEmail && creatorEmail !== 'Email not available' && creatorEmail !== 'Error loading email' && creatorEmail !== 'Loading email...') {
        try {
          console.log("Attempting to send rejection email to:", creatorEmail);
          
          const presetImages = presetToUpdate.preset_images || [];
          
          const response = await fetch('https://egg-store-admin.vercel.app/api/responseemail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'reject',
              presetId: presetId,
              rejectionReason: rejectionReason,
              authorEmail: creatorEmail,
              presetImages: presetImages
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.success) {
            console.log("✅ Rejection email sent successfully to:", creatorEmail);
          } else {
            throw new Error(result.message);
          }
        } catch (apiError) {
          console.log("❌ Email API failed:", apiError);
          // Continue with rejection even if email fails
        }
      }

      // Update preset in Supabase
      const { data, error } = await supabase
        .from('presets')
        .update({
          preset_status: 'rejected',
          is_public: false,
          rejection_reason: rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', presetId)
        .select();

      if (error) {
        console.error("Direct Supabase update error:", error);
        alert(`Failed to reject preset: ${error.message}`);
      } else {
        alert("Preset rejected successfully!");
        // Refresh the list
        const { data: updatedData } = await supabase.from('presets').select('*').order('created_at', { ascending: false });
        if (updatedData) {
          setPreset(updatedData);
        }
      }

    } catch (error) {
      console.error("Error rejecting preset:", error);
      alert("Error rejecting preset. Please try again.");
    } finally {
      setIsLoading(false);
      setRejectionModal({ isOpen: false, presetId: '', presetName: '' });
    }
  };

  // Open approval modal
  const openApprovalModal = (presetId: string, presetName: string) => {
    setApprovalModal({
      isOpen: true,
      presetId,
      presetName
    });
  };

  // Open rejection modal
  const openRejectionModal = (presetId: string, presetName: string) => {
    setRejectionModal({
      isOpen: true,
      presetId,
      presetName
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    
    // Calculate active images (not marked for deletion)
    const activeImages = formData.images.filter(img => !img.markedForDeletion);
    
    if (activeImages.length === 0) {
      alert("Please upload at least one image.");
      setIsLoading(false);
      return;
    }

    // For matching pairs game, we only need half the number of unique images
    const requiredUniqueImages = Math.ceil(parseInt(String(formData.size.value)) / 2);
    if (activeImages.length !== requiredUniqueImages) {
      alert(`For a matching pairs game, you need exactly ${requiredUniqueImages} unique images (which will be duplicated to create ${formData.size.value} cards). Currently you have ${activeImages.length} images.`);
      setIsLoading(false);
      return;
    }

    try {
      // First, delete any images marked for deletion
      const imagesToDelete = formData.images.filter(
        img => img.isExisting && img.markedForDeletion
      );
      
      console.log("Images marked for deletion:", imagesToDelete);
      
      if (imagesToDelete.length > 0) {
        const imagePaths = imagesToDelete.map(img => {
          if (!img.originalUrl) return null;
          const urlParts = img.originalUrl.split('/');
          return `presets/${urlParts[urlParts.length - 1]}`;
        }).filter(Boolean) as string[];
        
        console.log("Deleting image paths from storage:", imagePaths);
        
        if (imagePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('presets')
            .remove(imagePaths);
            
          if (storageError) {
            console.error("Error deleting images from storage:", storageError);
          } else {
            console.log("Successfully deleted images from storage");
          }
        }
      }
      
      // Upload new images and duplicate them for matching pairs
      const uploadedImageUrls: string[] = [];

      for (let image of formData.images) {
        // Skip images marked for deletion
        if (image.markedForDeletion) continue;
        
        if (image.isExisting && image.originalUrl) {
          // Keep existing image URL (if not marked for deletion)
          uploadedImageUrls.push(image.originalUrl);
        } else if (image.fileObject) {
          // Upload new image
          const file = image.fileObject;
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `presets/${fileName}`;

          let { error: uploadError } = await supabase.storage
            .from("presets")
            .upload(filePath, file);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            formData.images.forEach(img => {
              if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
            });
            setIsLoading(false);
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from("presets")
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrlData.publicUrl);
          console.log("Uploaded new image:", publicUrlData.publicUrl);
        }
      }

      // Store only unique images in Supabase (duplication handled in application logic)
      const finalImageUrls = uploadedImageUrls;

      formData.images.forEach(img => {
        if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
      });

      let data: any = null;
      let error: any = null;
      
      if (editingId) {
        // First verify the preset exists
        const { data: existingPreset, error: checkError } = await supabase
          .from("presets")
          .select("id")
          .eq("id", editingId)
          .single();
        
        if (checkError || !existingPreset) {
          error = { message: 'Preset not found. It may have been deleted.' };
        } else {
          // Update existing preset
          const updateData = {
            preset_name: {
              en_name: formData.titleEn,
              de_name: formData.titleDe,
            },
            preset_desc: {
              en_desc: formData.descEn,
              de_desc: '', // German description empty
            },
            preset_size_json: formData.size,
            preset_price: formData.price,
            preset_images: finalImageUrls,
          };

          const { data: updateDataResult, error: updateError } = await supabase
            .from("presets")
            .update(updateData)
            .eq('id', editingId)
            .select("*");
          
          if (updateError) {
            error = updateError;
          } else if (!updateDataResult || updateDataResult.length === 0) {
            error = { message: 'Preset not found or no changes made' };
          } else {
            data = updateDataResult[0];
          }
        }
      } else {
        // Create new preset
        const insertData = {
          preset_name: {
            en_name: formData.titleEn,
            de_name: formData.titleDe,
          },
          preset_desc: {
            en_desc: formData.descEn,
            de_desc: '', // German description empty
          },
          preset_size_json: formData.size,
          preset_price: formData.price,
          preset_images: finalImageUrls,
          created_at: new Date().toISOString()
        };

        const { data: insertDataResult, error: insertError } = await supabase
          .from("presets")
          .insert(insertData)
          .select("*");
        
        if (insertError) {
          error = insertError;
        } else if (!insertDataResult || insertDataResult.length === 0) {
          error = { message: 'Failed to create preset' };
        } else {
          data = insertDataResult[0];
        }
      }

      if (error) {
        console.error("Database error:", error);
        alert(`Failed to ${editingId ? 'update' : 'create'} preset: ${error.message}`);
        setIsLoading(false);
        return;
      }

      alert(editingId ? "Preset updated successfully!" : "Preset created successfully!");
      
      let updatedPresets;
      if (editingId) {
        updatedPresets = preset.map(item => 
          item.id === editingId ? { ...item, ...data } : item
        );
        setPreset(updatedPresets);
      } else {
        updatedPresets = [...preset, data];
        setPreset(updatedPresets);
      }
      
      try {
        await setItem(ALL_PRESETS_KEY, updatedPresets);
      } catch (indexedDBError) {
        console.error("Error updating IndexedDB:", indexedDBError);
      }
      
      setCurrentView("list");
      setEditingId(null);

    } catch (err) {
      console.error("Unexpected error in handleSubmit:", err);
      formData.images.forEach(img => {
        if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
      });
      alert("An unexpected error occurred. Please check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) {
      return;
    }

    setDeletingId(id);
    
    try {
      const presetToDelete = preset.find(item => item.id === id);
      if (presetToDelete && (presetToDelete.preset_images ?? []).length > 0) {
        // Since we now store only unique images, we can delete all stored images directly
        const imagePaths = (presetToDelete.preset_images ?? []).map(url => {
          const urlParts = url.split('/');
          return `presets/${urlParts[urlParts.length - 1]}`;
        });

        const { error: storageError } = await supabase.storage
          .from('presets')
          .remove(imagePaths);

        if (storageError) {
          console.error("Error deleting images from storage:", storageError);
        }
      }

      // Simple delete without extra columns
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete preset. Please try again.");
        return;
      }

      const updatedPresets = preset.filter(item => item.id !== id);
      setPreset(updatedPresets);
      try {
        await setItem(ALL_PRESETS_KEY, updatedPresets);
      } catch (indexedDBError) {
        console.error("Error updating IndexedDB:", indexedDBError);
      }
      
      alert("Preset deleted successfully!");

    } catch (err) {
      console.error("Error in handleDelete:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    const presetToEdit = preset.find(item => item.id === id);
    if (presetToEdit) {
      // Since we now store only unique images, we can use all stored images directly
      const existingImages = (presetToEdit.preset_images || []).map((imageUrl: string, index: number) => ({
        fileObject: null, 
        previewUrl: imageUrl,
        isExisting: true, 
        originalUrl: imageUrl,
        markedForDeletion: false
      }));
      
      setFormData({
        titleEn: presetToEdit.preset_name?.en_name || '',
        titleDe: presetToEdit.preset_name?.de_name || '',
        descEn: presetToEdit.preset_desc?.en_desc || '',
        size: presetToEdit.preset_size_json || { value: '', price: 0 },
        price: presetToEdit.preset_price || '',
        images: existingImages
      });
      setEditingId(id);
      setCurrentView('create');
    }
  };

  // Function to handle image removal
  const handleImageRemove = (index: number) => {
    const imageToRemove = formData.images[index];
    
    // Check if removing this image would make the count less than required
    const currentImageCount = formData.images.filter(img => !img.markedForDeletion).length;
    const requiredImageCount = Math.ceil(parseInt(String(formData.size.value)) / 2);
    
    // If it's an existing image and we're not already at the minimum
    if (imageToRemove.isExisting && currentImageCount <= requiredImageCount) {
      // Show confirmation dialog
      if (!confirm(`Removing this image would make your preset incomplete. You need ${requiredImageCount} unique images (which will be duplicated to create ${formData.size.value} cards). Are you sure you want to remove it?`)) {
        return; // User canceled the removal
      }
    }
    
    // If it's an existing image, mark it for deletion instead of removing immediately
    if (imageToRemove.isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index ? { ...img, markedForDeletion: true } : img
        )
      }));
      console.log("Marked existing image for deletion:", imageToRemove.originalUrl);
    } else {
      // If it's a new image (not yet uploaded), just remove it
      if (imageToRemove.fileObject) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
      console.log("Removed new image from form");
    }
  };

  if (currentView === 'create') {
    const active = formData.images.filter((i) => !i.markedForDeletion);
    const req = formData.size.value ? Math.ceil(parseInt(String(formData.size.value)) / 2) : 0;
    const resetCreate = () => {
      setCurrentView('list');
      setEditingId(null);
      setFormData({
        titleEn: '',
        titleDe: '',
        descEn: '',
        size: { value: '', price: 0 },
        price: '',
        images: [],
      });
    };

    return (
      <div className="pp">
        <div className="max-w-xl mx-auto px-6 py-12">
          <button type="button" onClick={resetCreate} className="flex items-center gap-2 text-gray-600 hover:text-[#e6d281] transition-colors mb-10 text-sm">
            <ArrowLeft size={15} /> Back
          </button>
          <h1 className="serif text-4xl text-gray-900 mb-1">{editingId ? 'Edit preset' : 'New preset'}</h1>
          <p className="text-sm text-gray-600 mb-10">English and German titles, size, images, then save.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title-en" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                Title (English) *
              </label>
              <input
                required
                id="title-en"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleInputChange}
                className="ifield"
                placeholder="Spring Flowers"
              />
            </div>
            <div>
              <label htmlFor="title-de" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                Title (German) *
              </label>
              <input
                required
                id="title-de"
                name="titleDe"
                value={formData.titleDe}
                onChange={handleInputChange}
                className="ifield"
                placeholder="Frühlingsblumen"
              />
            </div>
            <div>
              <label htmlFor="desc-en" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                Description (optional)
              </label>
              <textarea
                id="desc-en"
                name="descEn"
                rows={3}
                value={formData.descEn}
                onChange={handleInputChange}
                className="ifield min-h-[88px] resize-y"
                placeholder="Short description…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="size" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                  Size
                </label>
                <div className="relative">
                  <select
                    id="size"
                    name="size"
                    value={formData.size?.value || ''}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const selectedSize = sizes.find((s) => s.value.toString() === selectedValue);
                      if (selectedSize) {
                        setFormData((prev) => ({
                          ...prev,
                          size: selectedSize,
                          price: selectedSize.price.toFixed(2),
                        }));
                      }
                    }}
                    className="ifield appearance-none pr-10"
                  >
                    <option value="">Select</option>
                    {sizes.map(({ value, price }) => (
                      <option key={value} value={value}>
                        {value} cards — €{price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                </div>
              </div>
              <div>
                <label htmlFor="price" className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                  Price (€)
                </label>
                <input
                  readOnly
                  required
                  id="price"
                  name="price"
                  type="text"
                  value={formData.price}
                  className="ifield opacity-80 cursor-not-allowed"
                  placeholder="—"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-600 mb-2">
                Images
                {req > 0 && (
                  <span className={`ml-2 normal-case ${active.length === req ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {active.length}/{req}
                  </span>
                )}
              </label>
              <label
                htmlFor="file-upload"
                className={`flex flex-col items-center justify-center h-28 border-dashed border-2 rounded-xl cursor-pointer transition-all ${
                  !formData.size.value ? 'border-gray-200 opacity-30 cursor-not-allowed' : 'border-gray-200 hover:border-[#e6d281]/40'
                }`}
              >
                <ImageIcon size={20} className="text-gray-500 mb-1.5" />
                <span className="text-xs text-gray-600">Upload images</span>
                <input
                  id="file-upload"
                  name="images"
                  type="file"
                  className="sr-only"
                  multiple
                  disabled={!formData.size.value}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      const filesArray = Array.from(e.target.files).map((file) => ({
                        fileObject: file,
                        previewUrl: URL.createObjectURL(file),
                        isExisting: false,
                      }));
                      setFormData((prev) => ({ ...prev, images: [...prev.images, ...filesArray] }));
                    }
                  }}
                />
              </label>
              {formData.images.length > 0 && (
                <div className="mt-3 grid grid-cols-6 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className={`relative group aspect-square rounded-lg overflow-hidden ${image.markedForDeletion ? 'opacity-30' : ''}`}>
                      <img src={image.previewUrl} alt="" className="w-full h-full object-cover" />
                      {image.isExisting && !image.markedForDeletion && (
                        <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-blue-500/90 text-white">Saved</span>
                      )}
                      {image.markedForDeletion && (
                        <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-red-500/90 text-white">Remove</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {formData.size.value && active.length !== req && req > 0 && (
                <p className="text-xs text-amber-800 mt-2">
                  Need exactly {req} unique images for this deck size.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={resetCreate} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300 transition-all text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (!!formData.size.value && active.length !== Math.ceil(parseInt(String(formData.size.value)) / 2))
                }
                className="flex-1 py-3 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-semibold text-sm hover:bg-[#f0dc8a] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    {editingId ? 'Saving…' : 'Creating…'}
                  </>
                ) : (
                  <>
                    <PlusCircle size={14} />
                    {editingId ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const pendingCount = preset.filter((p) => p.preset_status === 'pending_approval').length;

  return (
    <div className="pp">
      <ApprovalModal
        isOpen={approvalModal.isOpen}
        onClose={() => setApprovalModal({ isOpen: false, presetId: '', presetName: '' })}
        onApprove={handleApprovePreset}
        presetName={approvalModal.presetName}
      />

      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, presetId: '', presetName: '' })}
        onReject={handleRejectPreset}
        presetName={rejectionModal.presetName}
      />

      <ImageLightboxModal
        isOpen={imageLightbox !== null}
        images={imageLightbox?.images ?? []}
        initialIndex={imageLightbox?.index ?? 0}
        onClose={() => setImageLightbox(null)}
      />

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 md:py-12">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">Dashboard</p>
            <h1 className="serif text-5xl leading-none text-gray-900">Preset requests</h1>
            <p className="text-base text-gray-600 mt-4 max-w-xl leading-relaxed">Pending submissions. Approve with a German title or reject with a reason.</p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentView('create')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm hover:bg-[#f0dc8a] transition-all"
          >
            <PlusCircle size={14} /> New preset
          </button>
        </div>

        <div className="flex gap-10 md:gap-14 mb-10 pb-10 border-b border-gray-200 flex-wrap items-end">
          <div>
            <p className="text-4xl font-light text-gray-900 tabular-nums">{pendingCount}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Pending</p>
          </div>
          <div>
            <p className="text-4xl font-light text-gray-900 tabular-nums">{filteredPreset.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Shown</p>
          </div>
          {searchQuery && (
            <div className="ml-auto">
              <p className="text-base text-gray-600">
                {filteredPreset.length} result{filteredPreset.length !== 1 ? 's' : ''} for{' '}
                <span className="text-[#e6d281]">&quot;{searchQuery}&quot;</span>
              </p>
            </div>
          )}
        </div>

        {filteredPreset.length > 0 ? (
          <div className="space-y-5 md:space-y-6">
            {filteredPreset.map((item, idx) => (
              <div
                key={item.id}
                className="card fu rounded-2xl p-6 md:p-7 flex flex-col gap-5 shadow-sm"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex flex-col xl:flex-row xl:items-start gap-6 xl:gap-8">
                  {/* Thumbnails — 6 per row, max 2 rows (12), larger hit targets */}
                  <div className="shrink-0 xl:w-[min(100%,22rem)]">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2.5">Preview</p>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                      {(item.preset_images || []).slice(0, 12).map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          className="aspect-square rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-100 cursor-zoom-in hover:ring-2 hover:ring-[#e6d281]/50 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e6d281] focus-visible:ring-offset-2 text-left"
                          onClick={() =>
                            setImageLightbox({
                              images: (item.preset_images || []).slice(0, 12),
                              index: i,
                            })
                          }
                          aria-label={`Open image ${i + 1} in preview`}
                        >
                          <SafeImage src={url} alt="" className="w-full h-full pointer-events-none" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                      <h2 className="text-lg md:text-xl font-semibold text-gray-900 leading-snug break-words">
                        {item.preset_name?.en_name || 'Untitled'}
                      </h2>
                      <StatusBadge status={item.preset_status || ''} />
                    </div>
                    <p className="text-sm text-gray-600">{item.preset_name?.de_name || '—'}</p>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {item.preset_desc?.en_desc || 'No description'}
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-3 mt-1 border-t border-gray-100 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400 shrink-0" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-2 min-w-0">
                        <Mail size={16} className="text-gray-400 shrink-0" />
                        <span className="truncate">
                          {item.created_by ? userInfo[item.created_by]?.email || '…' : '—'}
                        </span>
                      </span>
                      <span className="font-medium text-amber-900">€{item.preset_price || '0.00'}</span>
                      <span>{item.preset_size_json?.value || '—'} cards</span>
                    </div>
                  </div>

                  <div className="flex flex-row flex-wrap xl:flex-col gap-2 shrink-0 xl:min-w-[10.5rem]">
                    {item.preset_status === 'pending_approval' && (
                      <>
                        <button
                          type="button"
                          onClick={() => openApprovalModal(item.id, item.preset_name?.en_name || 'Untitled')}
                          disabled={isLoading}
                          className="flex-1 xl:flex-none justify-center px-4 py-2.5 rounded-xl border border-emerald-200 text-emerald-900 text-sm font-medium bg-emerald-50/50 hover:bg-emerald-50 disabled:opacity-40 inline-flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          {isLoading ? '…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openRejectionModal(item.id, item.preset_name?.en_name || 'Untitled')}
                          disabled={isLoading}
                          className="flex-1 xl:flex-none justify-center px-4 py-2.5 rounded-xl border border-red-200 text-red-900 text-sm font-medium bg-red-50/40 hover:bg-red-50 disabled:opacity-40 inline-flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          {isLoading ? '…' : 'Reject'}
                        </button>
                      </>
                    )}
                    {item.owned_by && (
                      <button
                        type="button"
                        onClick={() => handleRegenerate(item.id, item.preset_name?.en_name || 'Untitled')}
                        disabled={regeneratingId === item.id}
                        className="flex-1 xl:flex-none justify-center px-4 py-2.5 rounded-xl border border-purple-200 text-purple-900 text-sm font-medium bg-purple-50/50 hover:bg-purple-50 disabled:opacity-40 inline-flex items-center gap-2"
                      >
                        <Loader2 className={regeneratingId === item.id ? 'animate-spin' : ''} size={16} />
                        {regeneratingId === item.id ? 'Regenerating…' : 'Regenerate new version'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEdit(item.id)}
                      className="flex-1 xl:flex-none justify-center px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 inline-flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  </div>
                </div>

                {item.admin_notes && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 leading-relaxed">
                    <span className="text-[10px] uppercase tracking-wider text-amber-800 font-semibold">Note</span>
                    <span className="block mt-1">{item.admin_notes}</span>
                  </div>
                )}
                {item.rejection_reason && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 leading-relaxed">
                    <span className="text-[10px] uppercase tracking-wider text-red-700 font-semibold">Rejected</span>
                    <span className="block mt-1">{item.rejection_reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5 border border-gray-200">
              <ImageIcon size={22} className="text-gray-400" />
            </div>
            <h3 className="text-base mb-1">{searchQuery ? 'No results' : 'No pending requests'}</h3>
            <p className="text-xs text-gray-500 mb-7 max-w-sm">
              {searchQuery
                ? `Nothing matches “${searchQuery}”.`
                : 'Submissions will appear here when creators send presets for review.'}
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6d281] text-[#0a0a0a] font-medium text-sm hover:bg-[#f0dc8a] transition-all"
            >
              <PlusCircle size={14} /> New preset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;