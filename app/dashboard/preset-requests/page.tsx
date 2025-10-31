"use client"
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {supabase} from "../../../utils/supabaseClient"
import {  
  ArrowLeft, 
  PlusCircle, 
  Image as ImageIcon,
  Tag,
  Layers,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  X,
  Check,
  Loader2,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"

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
}

interface FormData {
  titleEn: string;
  titleDe: string;
  descEn: string;
  descDe: string;
  size: PresetSize;
  price: string;
  images: PresetImage[];
}

interface UserInfo {
  id: string;
  email: string;
  username?: string;
}

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
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <ImageIcon className="text-gray-400" size={24} />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="animate-spin text-gray-400" size={20} />
        </div>
      )}
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={`object-cover ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        sizes="(max-width: 768px) 100px, (max-width: 1200px) 150px, 200px"
      />
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
  const [dataSource, setDataSource] = useState<string>('');
  const [userInfo, setUserInfo] = useState<{ [key: string]: UserInfo }>({});
  
  // ONLY show pending_approval presets by default
  const [statusFilter, setStatusFilter] = useState<'pending_approval'>('pending_approval');

  // Form state
  const [formData, setFormData] = useState<FormData>({
    titleEn: '', 
    titleDe: '', 
    descEn: '', 
    descDe: '', 
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

  // Fetch user info for creators - IMPROVED VERSION
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
        setDataSource('Supabase');
        
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
        async (payload) => {
          setDataSource('Supabase Realtime');

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

// Handle preset approval with localhost API
const handleApprovePreset = async (presetId: string) => {
  if (!confirm("Are you sure you want to approve this preset? It will become publicly visible.")) {
    return;
  }

  setIsLoading(true);
  
  try {
    const germanTitle = prompt("Please enter German title for this preset:");
    const germanDescription = prompt("Please enter German description for this preset:");
    
    if (!germanTitle || !germanDescription) {
      alert("German title and description are required for approval.");
      setIsLoading(false);
      return;
    }

    const adminNotes = prompt("Optional admin notes for the author:") || '';

    // Get creator information for email
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
    
    // Try localhost API first for email
    if (creatorEmail && creatorEmail !== 'Email not available' && creatorEmail !== 'Error loading email' && creatorEmail !== 'Loading email...') {
      try {
        console.log("Attempting to send email to:", creatorEmail);
        
        // ✅ YEH LINE ADD KARO - Get preset images for email
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
            germanDescription: germanDescription,
            adminNotes: adminNotes,
            authorEmail: creatorEmail,
            presetImages: presetImages // ✅ YEH ADD KARO
          })
        });

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          console.log("✅ Email sent successfully to:", creatorEmail);
          console.log(`📸 ${presetImages.length} images included in email`);
        } else {
          console.log("❌ Email API returned error:", result.message);
        }
      } catch (apiError) {
        console.log("❌ Localhost API failed, email not sent:", apiError);
        // Continue with approval even if email fails
      }
    } else {
      console.log("❌ Cannot send email: Creator email not available or invalid");
      console.log("Available creator info:", creatorInfo);
    }

    // Update preset in Supabase (always do this regardless of email success)
    const { data, error } = await supabase
      .from('presets')
      .update({
        preset_status: 'approved',
        is_public: true,
        preset_name: {
          en_name: presetToUpdate.preset_name?.en_name || germanTitle,
          de_name: germanTitle
        },
        preset_desc: {
          en_desc: presetToUpdate.preset_desc?.en_desc || '',
          de_desc: germanDescription
        },
        admin_notes: adminNotes,
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
  }
};
  // Handle preset rejection with localhost API
  const handleRejectPreset = async (presetId: string) => {
    const rejectionReason = prompt("Please provide reason for rejection:");
    
    if (!rejectionReason) {
      alert("Rejection reason is required.");
      return;
    }

    setIsLoading(true);
    
    try {
      // Get creator information for email
      const presetToUpdate = preset.find(p => p.id === presetId);
      if (!presetToUpdate) {
        alert("Preset not found.");
        setIsLoading(false);
        return;
      }

      const creatorInfo = userInfo[presetToUpdate.created_by];
      const creatorEmail = creatorInfo?.email;
      
      console.log("Creator info for rejection:", creatorInfo);
      console.log("Creator email for rejection:", creatorEmail);

      // Try localhost API first for email
   if (creatorEmail && creatorEmail !== 'Email not available' && creatorEmail !== 'Error loading email' && creatorEmail !== 'Loading email...') {
  try {
    console.log("Attempting to send rejection email to:", creatorEmail);
    
    // Get preset images for rejection email bhi if needed
    const presetImages = presetToUpdate.preset_images || [];
    
    const response = await fetch('http://localhost:8000/api/responseemail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'reject',
        presetId: presetId,
        rejectionReason: rejectionReason,
        authorEmail: creatorEmail,
        presetImages: presetImages // Images bhi include karo
      })
    });

    // Check if response is ok
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
    console.log("❌ Localhost API failed, email not sent:", apiError);
    // Continue with rejection even if email fails
  }
}
      // Update preset in Supabase (always do this regardless of email success)
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
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center w-fit"><Clock className="mr-1" size={12} />Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center w-fit"><CheckCircle className="mr-1" size={12} />Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center w-fit"><XCircle className="mr-1" size={12} />Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Draft</span>;
    }
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
          // Update existing preset - ONLY EXISTING COLUMNS USE करें
          const updateData = {
            preset_name: {
              en_name: formData.titleEn,
              de_name: formData.titleDe,
            },
            preset_desc: {
              en_desc: formData.descEn,
              de_desc: formData.descDe,
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
        // Create new preset - ONLY EXISTING COLUMNS USE करें
        const insertData = {
          preset_name: {
            en_name: formData.titleEn,
            de_name: formData.titleDe,
          },
          preset_desc: {
            en_desc: formData.descEn,
            de_desc: formData.descDe,
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
        descDe: presetToEdit.preset_desc?.de_desc || '',
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
    return (
      <div className="container mx-auto px-4 py-8 font-manrope">
        <div 
          onClick={() => {
            setCurrentView('list');
            setEditingId(null);
            setFormData({
              titleEn: '', 
              titleDe: '', 
              descEn: '', 
              descDe: '', 
              size: { value: '', price: 0 }, 
              price: '', 
              images: [] 
            });
          }} 
          className="mb-4 cursor-pointer flex items-center text-[#e6d281] hover:text-[#d4c070] transition-colors"
        >
          <ArrowLeft className="mr-2" />
          <span>Back to Presets</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            {editingId ? (
              <Edit className="text-[#e6d281] mr-2" size={24} />
            ) : (
              <PlusCircle className="text-[#e6d281] mr-2" size={24} />
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {editingId ? 'Edit Preset' : 'Create New Preset'}
            </h1>
          </div>
          <p className="text-gray-600">
            {editingId 
              ? 'Update the preset information below.' 
              : 'Fill out the form below to create a new egg card preset.'
            }
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Titles Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Tag className="text-[#e6d281] mr-2" size={20} />
              Preset Titles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title-en" className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
                <input 
                  required 
                  onChange={handleInputChange} 
                  type="text" 
                  id="title-en" 
                  name="titleEn" 
                  value={formData.titleEn}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="Spring Flowers Collection" 
                />
              </div>
              <div>
                <label htmlFor="title-de" className="block text-sm font-medium text-gray-700 mb-1">Title (German)</label>
                <input 
                  required 
                  onChange={handleInputChange} 
                  type="text" 
                  id="title-de" 
                  name="titleDe" 
                  value={formData.titleDe}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="Frühlingsblumen Kollektion" 
                />
              </div>
            </div>
          </div>
      
          {/* Descriptions Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Edit className="text-[#e6d281] mr-2" size={20} />
              Descriptions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="desc-en" className="block text-sm font-medium text-gray-700 mb-1">Description (English) - Optional</label>
                <textarea 
                  onChange={handleInputChange} 
                  id="desc-en" 
                  name="descEn" 
                  rows={3} 
                  value={formData.descEn}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="A beautiful collection of spring flower designs for your egg memory game."
                ></textarea>
              </div>
              <div>
                <label htmlFor="desc-de" className="block text-sm font-medium text-gray-700 mb-1">Description (German) - Optional</label>
                <textarea 
                  onChange={handleInputChange} 
                  id="desc-de" 
                  name="descDe" 
                  rows={3} 
                  value={formData.descDe}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="Eine wunderschöne Kollektion von Frühlingsblumen-Designs für Ihr Eier-Memory-Spiel."
                ></textarea>
              </div>
            </div>
          </div>
    

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <DollarSign className="text-[#e6d281] mr-2" size={20} />
              Size & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Preset Size</label>
                <div className="relative">
                <select
                name="size"
                value={formData.size?.value || ""}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const selectedSize = sizes.find(
                    (s) => s.value.toString() === selectedValue
                  );
                  if (selectedSize) {
                    setFormData((prev) => ({
                      ...prev,
                      size: selectedSize,
                      price: selectedSize.price.toFixed(2),
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              >
                <option value="">Select a size</option>
                {sizes.map(({ value, price }) => (
                  <option key={value} value={value}>
                    {value} cards - €{price.toFixed(2)}
                  </option>
                ))}
              </select>

                  <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
                </div>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (€) - Auto-calculated
                </label>
                <div className="relative">
                  <input 
                    required 
                    readOnly
                    type="number" 
                    id="price" 
                    name="price" 
                    value={formData.price}
                    step="0.01" 
                    min="0" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] pl-8" 
                    placeholder="Select size to see price" 
                  />
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Price is automatically calculated based on the selected size
                </p>
              </div>
            </div>
          </div>
      
          {/* Images Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ImageIcon className="text-[#e6d281] mr-2" size={20} />
              Upload Images
            </h2>
            
            <div 
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#e6d281] transition-colors cursor-pointer"
              onClick={() => {
                if(!formData.size.value){
                  alert("Please select a size first"); 
                  return;
                }
              }}
            >
              <div className="space-y-1 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#e6d281] hover:text-[#d4c070] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#e6d281]">
                    <span>Upload files</span>
                    <input 
                      id="file-upload" 
                      name="images" 
                      type="file" 
                      className="sr-only" 
                      multiple 
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const filesArray = Array.from(e.target.files).map(file => ({
                            fileObject: file,
                            previewUrl: URL.createObjectURL(file),
                            isExisting: false
                          }));
                          setFormData(prev => ({
                            ...prev,
                            images: [...prev.images, ...filesArray]
                          }));
                        }
                      }}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                {formData.size.value && (
                  <p className="text-xs text-[#e6d281] mt-2">
                    Selected size requires {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images (will be duplicated to create {formData.size.value} cards)
                  </p>
                )}
                {editingId && (
                  <p className="text-xs text-blue-600 mt-2">
                    💡 You can add new images or remove existing ones
                  </p>
                )}
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ImageIcon className="mr-2" size={16} />
                  Selected Images ({formData.images.filter(img => !img.markedForDeletion).length}/{Math.ceil(parseInt(String(formData.size.value || '0')) / 2)} unique)
                  {editingId && (
                    <span className="ml-2 text-xs text-blue-600">
                      (Existing: {formData.images.filter(img => img.isExisting && !img.markedForDeletion).length}, 
                      New: {formData.images.filter(img => !img.isExisting).length},
                      To be deleted: {formData.images.filter(img => img.markedForDeletion).length})
                    </span>
                  )}
                </h3>
                
                {formData.size.value && formData.images.filter(img => !img.markedForDeletion).length !== Math.ceil(parseInt(String(formData.size.value)) / 2) && (
                  <p className="text-sm text-red-500 mt-2 mb-3">
                    ⚠️ Warning: You need exactly {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images for this preset size (which will be duplicated to create {formData.size.value} cards). 
                    Currently you have {formData.images.filter(img => !img.markedForDeletion).length} active images.
                  </p>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className={`aspect-square overflow-hidden rounded-md border ${image.markedForDeletion ? 'border-red-500 opacity-50' : 'border-gray-200'}`}>
                        <img 
                          src={image.previewUrl} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                        {image.isExisting && !image.markedForDeletion && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Existing
                          </div>
                        )}
                        {image.markedForDeletion && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            To Delete
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
      
          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button 
              type="button"
              onClick={() => {
                setCurrentView('list');
                setEditingId(null);
                setFormData({
                  titleEn: '', 
                  titleDe: '', 
                  descEn: '', 
                  descDe: '', 
                  size: { value: '', price: 0 }, 
                  price: '', 
                  images: [] 
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading || (!!formData.size.value && formData.images.filter(img => !img.markedForDeletion).length !== Math.ceil(parseInt(String(formData.size.value)) / 2))}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <PlusCircle className="mr-2" size={16} />
              )}
              {isLoading ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Preset' : 'Create Preset')}
            </button>
          </div>
          
          {/* Show message when button is disabled due to image count */}
          {formData.size.value && formData.images.filter(img => !img.markedForDeletion).length !== Math.ceil(parseInt(String(formData.size.value)) / 2) && !isLoading && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">⚠️ Cannot submit:</span> You need exactly {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images for this preset size. 
                Currently you have {formData.images.filter(img => !img.markedForDeletion).length} active images.
              </p>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className='mb-4 md:mb-0'>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Presets Management</h1>
            <p className="text-gray-600">Manage all presets (collections of egg cards). Review, approve, and organize presets.</p>
            
            {/* Search Status */}
            {searchQuery && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Showing results for: <span className="font-semibold text-[#e6d281]">"{searchQuery}"</span>
                  <span className="ml-2 text-xs bg-[#e6d281] bg-opacity-20 px-2 py-1 rounded-full">
                    {filteredPreset.length} preset(s) found
                  </span>
                </p>
              </div>
            )}
          </div>
    
          <button
            onClick={() => setCurrentView('create')}
            className="bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 shadow-sm flex items-center"
          >
            <PlusCircle className="mr-2" size={16} />
            Create New Preset
          </button>
        </div>

        {/* Status Filter - ONLY pending approval shown */}
        <div className="mt-4">
          <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <Clock className="mr-2" size={16} />
            <span className="font-medium">Showing: Pending Approval Presets Only</span>
          </div>
        </div>
      </div>
  
      {filteredPreset.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredPreset.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(item.preset_status || 'draft')}
                        </div>
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center">
                            <Tag className="mr-1" size={14} />
                            English Title
                          </p>
                          <h2 className="text-lg font-semibold text-gray-800">
                            {item.preset_name?.en_name || 'Untitled Preset'}
                          </h2>
                        </div>
                        <div className="mb-4 md:mb-0">
                          <p className="text-xs text-gray-500 mb-1 flex items-center">
                            <Tag className="mr-1" size={14} />
                            German Title
                          </p>
                          <h2 className="text-lg font-semibold text-gray-800">
                            {item.preset_name?.de_name || 'Unbenanntes Preset'}
                          </h2>
                        </div>
                      </div>
      
                      <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto">
                        {/* Action Buttons - Only show for pending_approval */}
                        {item.preset_status === 'pending_approval' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApprovePreset(item.id)} 
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md text-sm font-medium flex items-center"
                            >
                              <CheckCircle className="mr-1" size={14} />
                              {isLoading ? 'Approving...' : 'Approve'}
                            </button>
                            <button 
                              onClick={() => handleRejectPreset(item.id)} 
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium flex items-center"
                            >
                              <XCircle className="mr-1" size={14} />
                              {isLoading ? 'Rejecting...' : 'Reject'}
                            </button>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(item.id)} 
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium flex items-center"
                          >
                            <Edit className="mr-1" size={14} />
                            Edit
                          </button>
                    
                        </div>

                        <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                          <p className="text-xs text-gray-500 flex items-center justify-center">
                            <Layers className="mr-1" size={12} />
                            {item.preset_size_json?.value || 'N/A'} cards
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Creator Information */}
                    {item.created_by && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-2 font-medium">Creator Information</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <Mail className="text-blue-500 mr-1" size={14} />
                            <span className="text-sm text-gray-700">
                              {userInfo[item.created_by]?.email || 'Loading email...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center">
                          <Edit className="mr-1" size={14} />
                          English Description
                        </p>
                        <p className="text-gray-700 text-sm">
                          {item.preset_desc?.en_desc || 'No description'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center">
                          <Edit className="mr-1" size={14} />
                          German Description
                        </p>
                        <p className="text-gray-700 text-sm">
                          {item.preset_desc?.de_desc || 'Keine Beschreibung'}
                        </p>
                      </div>
                    </div>
    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="bg-gray-100 px-3 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 flex items-center">
                          <DollarSign className="mr-1" size={12} />
                          Price
                        </p>
                        <p className="text-lg font-bold">€{item.preset_price || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Calendar className="mr-1" size={12} />
                          Created
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {item.approved_at && (
                        <div>
                          <p className="text-xs text-gray-500 flex items-center">
                            <CheckCircle className="mr-1" size={12} />
                            Approved
                          </p>
                          <p className="text-sm font-medium">
                            {new Date(item.approved_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    {item.admin_notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-yellow-700 mb-1 font-medium">Admin Notes</p>
                        <p className="text-sm text-yellow-800">{item.admin_notes}</p>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {item.rejection_reason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-red-700 mb-1 font-medium">Rejection Reason</p>
                        <p className="text-sm text-red-800">{item.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
    
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 flex items-center">
                    <ImageIcon className="mr-1" size={14} />
                    Preset Images ({item.preset_images?.length || 0})
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {item.preset_images?.map((imageUrl: string, index: number) => (
                      <div key={index} className="flex-shrink-0 h-[100px] w-[100px] overflow-hidden rounded-md border border-gray-200">
                        <SafeImage
                          src={imageUrl}
                          alt={`Preset image ${index + 1}`}
                          className="w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <ImageIcon size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery ? 'No matching presets found!' : 'No pending approval presets found!'}
            </h3>
            <p className="mt-1 text-gray-500 mb-6">
              {searchQuery 
                ? `No pending approval presets found matching "${searchQuery}". Try a different search term.`
                : 'There are currently no presets waiting for approval.'
              }
            </p>
            {isLoading ? (
              <button
                onClick={() => setCurrentView('create')}
                className="bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center mx-auto"
              >
                <Loader2 className="mr-2" size={16} />
                Creating Preset...
              </button>
            ):(
              <button
                onClick={() => setCurrentView('create')}
                className="bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center mx-auto"
              >
                <PlusCircle className="mr-2" size={16} />
                Create Preset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;