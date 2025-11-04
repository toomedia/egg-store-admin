"use client";
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
  Globe,
  Loader2,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Grid,
  CheckSquare,
  Square
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

interface Creation {
  id: string;
  title: string;
  image_url: string;
  prompt: string;
  source: string; 
  creator_id: string;
  creator: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  tags: string[];
  likes: number;
  downloads: number;
  created_at: string;
  updated_at: string;
}

// IndexedDB constants
const DB_NAME = 'PresetsDB';
const STORE_NAME = 'presets';
const ALL_PRESETS_KEY = 'allPresets';
const OWN_CREATIONS_KEY = 'ownCreations';

// IndexedDB utility functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (event.oldVersion < 2 && !db.objectStoreNames.contains('ownCreations')) {
        db.createObjectStore('ownCreations');
      }
    };
  });
};

const setItem = async (key: string, value: any, store: string = STORE_NAME): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(store, 'readwrite');
    const objectStore = transaction.objectStore(store);
    objectStore.put(value, key);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    throw error;
  }
};

const getItem = async (key: string, store: string = STORE_NAME): Promise<any> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(store, 'readonly');
    const objectStore = transaction.objectStore(store);
    const request = objectStore.get(key);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    throw error;
  }
};

// Debugging function to track image sources
const debugImageSources = (eggs: Creation[], source: string) => {
  console.group(`🔍 IMAGE SOURCE DEBUG - ${source}`);
  
  // Count by source type
  const sourceCounts = eggs.reduce((acc, egg) => {
    const sourceType = egg.source || 'unknown';
    acc[sourceType] = (acc[sourceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📊 Source Distribution:', sourceCounts);
  console.log('📈 Total Eggs:', eggs.length);
  
  // Find problematic URLs
  const problematicUrls = eggs.filter(egg => 
    egg.image_url && 
    typeof egg.image_url === 'string' &&
    (egg.image_url.startsWith('" ') || egg.image_url.includes('" kaja'))
  );
  
  if (problematicUrls.length > 0) {
    console.log('🚨 PROBLEMATIC URLs found:', problematicUrls.length);
    problematicUrls.slice(0, 3).forEach((egg, index) => {
      console.log(`Problem ${index + 1}:`, {
        id: egg.id,
        source: egg.source,
        image_url: egg.image_url,
        preview: egg.image_url.substring(0, 100) + '...'
      });
    });
  }
  
  // Sample valid URLs
  const validUrls = eggs.filter(egg => 
    egg.image_url && 
    typeof egg.image_url === 'string' &&
    (egg.image_url.startsWith('http') || egg.image_url.startsWith('data:'))
  );
  
  if (validUrls.length > 0) {
    console.log('✅ Valid URLs sample (first 3):');
    validUrls.slice(0, 3).forEach((egg, index) => {
      console.log(`Valid ${index + 1}:`, {
        id: egg.id,
        source: egg.source,
        image_url: egg.image_url.substring(0, 100) + '...'
      });
    });
  }
  
  console.groupEnd();
};

// Safe Image Component with optimized loading
const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.warn('🖼️ Image failed to load:', { original: src });
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

  // Modal state for egg selection
  const [showEggModal, setShowEggModal] = useState(false);
  const [availableEggs, setAvailableEggs] = useState<Creation[]>([]);
  const [selectedEggs, setSelectedEggs] = useState<string[]>([]);
  const [eggSearchQuery, setEggSearchQuery] = useState('');
  const [loadingEggs, setLoadingEggs] = useState(false);
  const [eggsSource, setEggsSource] = useState<'cache' | 'supabase'>('cache');

  const sizes = [
    { value: 24, price: 0.99 },
  ];

  // Filter presets based on search query
  useEffect(() => {
    let filtered = preset;
    
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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, username')
        .eq('id', userId)
        .single();
      
      if (data && !error) {
        setUserInfo(prev => ({
          ...prev,
          [userId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  // Fetch available eggs for modal FROM INDEXEDDB
  const fetchAvailableEggs = async () => {
    setLoadingEggs(true);
    try {
      // First try to get from IndexedDB
      const cachedEggs = await getItem(OWN_CREATIONS_KEY, 'ownCreations');
      
      if (cachedEggs && Array.isArray(cachedEggs) && cachedEggs.length > 0) {
        console.log('💾 Loaded from IndexedDB cache:', cachedEggs.length, 'eggs');
        debugImageSources(cachedEggs, 'INDEXEDDB_CACHE');
        
        setAvailableEggs(cachedEggs);
        setEggsSource('cache');
        setLoadingEggs(false);
        return;
      }

      // If no cached data, fetch from Supabase and cache it
      console.log('🌐 No cache found, fetching from Supabase...');
      const fetchGeneratedImagesFromSupabase = async (): Promise<Creation[]> => {
        try {
          console.log('📡 Making Supabase API call to user_own_creations...');
          const { data, error } = await supabase
            .from('user_own_creations')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error('❌ Supabase error:', error);
            return [];
          }

          if (!data || !Array.isArray(data)) {
            console.log('⚠️ No data returned from Supabase');
            return [];
          }

          console.log('📥 Raw Supabase data received:', data.length, 'records');
          
          const collectedCreations: Creation[] = [];
          const seenImageUrls = new Set<string>();

          console.log('🔧 Processing Supabase records...');
          
          for (const creation of data) {
            const isGuest = !creation.user_uid || creation.user_uid === null;
            const creationId = creation.id;

            console.log(`🔄 Processing creation ${creationId}`, {
              has_image_url: !!creation.image_url,
              has_generated_images: !!creation.generated_images,
              image_url_type: typeof creation.image_url
            });

            if (creation.image_url) {
              try {
                let imageUrls: string[] = [];
                
                if (typeof creation.image_url === 'string') {
                  console.log(`📝 Processing image_url as string:`, creation.image_url.substring(0, 100) + '...');
                  
                  try {
                    const parsed = JSON.parse(creation.image_url);
                    console.log(`✅ Successfully parsed image_url as JSON`);
                    
                    if (Array.isArray(parsed)) {
                      imageUrls = parsed.filter(url => typeof url === 'string' && url.length > 0);
                      console.log(`📸 Found ${imageUrls.length} image URLs in JSON array`);
                    }
                  } catch (e) {
                    console.log(`❌ Failed to parse as JSON, treating as direct URL`);
                    if (creation.image_url.startsWith('http') || creation.image_url.startsWith('data:')) {
                      imageUrls = [creation.image_url];
                      console.log(`📸 Added as direct URL`);
                    } else {
                      console.log(`⚠️ Not a valid URL:`, creation.image_url.substring(0, 100));
                    }
                  }
                } else if (Array.isArray(creation.image_url)) {
                  console.log(`📝 Processing image_url as array with ${creation.image_url.length} items`);
                  imageUrls = creation.image_url.filter((url: string) => typeof url === 'string' && url.length > 0);
                }

                imageUrls.forEach((imageUrl: string, index: number) => {
                  if (imageUrl && typeof imageUrl === 'string' && !seenImageUrls.has(imageUrl)) {
                    seenImageUrls.add(imageUrl);
                    
                    // Log problematic URLs
                    if (imageUrl.startsWith('" ') || imageUrl.includes('" kaja')) {
                      console.warn(`🚨 Found problematic URL in image_url:`, {
                        creationId,
                        index,
                        url: imageUrl.substring(0, 100)
                      });
                    }
                    
                    collectedCreations.push({
                      id: `${creationId}-image_url-${index}`,
                      title: '',
                      image_url: imageUrl,
                      prompt: '', 
                      source: 'image_url',
                      creator_id: creation.user_uid || 'guest',
                      creator: {
                        id: creation.user_uid || 'guest',
                        name: isGuest ? 'Guest User' : 'Registered User',
                        avatar_url: null
                      },
                      tags: creation.tags || [],
                      likes: creation.likes || 0,
                      downloads: creation.downloads || 0,
                      created_at: creation.created_at,
                      updated_at: creation.updated_at || creation.created_at
                    });
                  }
                });
              } catch (error) {
                console.error('Error processing image_url:', error, 'for creation:', creationId);
              }
            }

            if (creation.generated_images) {
              try {
                let generatedImagesData: any[] = [];
                
                if (typeof creation.generated_images === 'string') {
                  console.log(`📝 Processing generated_images as string`);
                  try {
                    const parsed = JSON.parse(creation.generated_images);
                    console.log(`✅ Successfully parsed generated_images as JSON`);
                    
                    if (parsed.generated_images && Array.isArray(parsed.generated_images)) {
                      generatedImagesData = parsed.generated_images;
                      console.log(`📸 Found ${generatedImagesData.length} images in generated_images array`);
                    } 
                    else if (Array.isArray(parsed)) {
                      generatedImagesData = parsed;
                      console.log(`📸 Found ${generatedImagesData.length} images in array`);
                    }
                    else if (parsed.url || parsed.image_url) {
                      generatedImagesData = [parsed];
                      console.log(`📸 Found single image object`);
                    }
                  } catch (e) {
                    console.log(`❌ Failed to parse generated_images as JSON`);
                    if (creation.generated_images.startsWith('http') || creation.generated_images.startsWith('data:')) {
                      generatedImagesData = [{ url: creation.generated_images, prompt: 'Generated image' }];
                      console.log(`📸 Added as direct URL`);
                    }
                  }
                } else if (typeof creation.generated_images === 'object') {
                  console.log(`📝 Processing generated_images as object`);
                  if (creation.generated_images.generated_images && Array.isArray(creation.generated_images.generated_images)) {
                    generatedImagesData = creation.generated_images.generated_images;
                    console.log(`📸 Found ${generatedImagesData.length} images in generated_images array`);
                  } else if (Array.isArray(creation.generated_images)) {
                    generatedImagesData = creation.generated_images;
                    console.log(`📸 Found ${generatedImagesData.length} images in array`);
                  } else {
                    generatedImagesData = [creation.generated_images];
                    console.log(`📸 Found single image object`);
                  }
                }

                generatedImagesData.forEach((imgData: any, index: number) => {
                  const imageUrl = imgData.url || imgData.image_url;
                  const prompt = imgData.prompt || '';
                  
                  if (imageUrl && typeof imageUrl === 'string' && !seenImageUrls.has(imageUrl)) {
                    seenImageUrls.add(imageUrl);
                    
                    // Log problematic URLs
                    if (imageUrl.startsWith('" ') || imageUrl.includes('" kaja')) {
                      console.warn(`🚨 Found problematic URL in generated_images:`, {
                        creationId,
                        index,
                        url: imageUrl.substring(0, 100)
                      });
                    }
                    
                    collectedCreations.push({
                      id: `${creationId}-generated_images-${index}`,
                      title: '',
                      image_url: imageUrl,
                      prompt: prompt,
                      source: 'generated_images',
                      creator_id: creation.user_uid || 'guest',
                      creator: {
                        id: creation.user_uid || 'guest',
                        name: isGuest ? 'Guest User' : 'Registered User',
                        avatar_url: null
                      },
                      tags: creation.tags || [],
                      likes: creation.likes || 0,
                      downloads: creation.downloads || 0,
                      created_at: creation.created_at,
                      updated_at: creation.updated_at || creation.created_at
                    });
                  }
                });
              } catch (error) {
                console.error('Error processing generated_images:', error, 'for creation:', creationId);
              }
            }
          }

          console.log('🎯 Final processed eggs:', collectedCreations.length);
          return collectedCreations;
        } catch (error) {
          console.error('Error in fetchGeneratedImagesFromSupabase:', error);
          return [];
        }
      };

      const eggs = await fetchGeneratedImagesFromSupabase();
      
      // Debug the raw eggs before any filtering
      debugImageSources(eggs, 'SUPABASE_RAW');
      
      // Filter out problematic eggs before caching
      const validEggs = eggs.filter(egg => 
        egg.image_url && 
        typeof egg.image_url === 'string' &&
        egg.image_url.trim().length > 0 &&
        !egg.image_url.startsWith('" ') &&
        (egg.image_url.startsWith('http') || egg.image_url.startsWith('data:'))
      );

      console.log('🎯 After filtering - Valid eggs:', validEggs.length);
      console.log('🗑️  Removed eggs:', eggs.length - validEggs.length);
      
      // Cache the eggs in IndexedDB
      if (validEggs.length > 0) {
        try {
          await setItem(OWN_CREATIONS_KEY, validEggs, 'ownCreations');
          console.log('💾 Cached VALID eggs in IndexedDB:', validEggs.length);
        } catch (error) {
          console.error('Error caching eggs in IndexedDB:', error);
        }
      }
      
      setAvailableEggs(validEggs);
      setEggsSource('supabase');
      
      // Final debug of what we're actually displaying
      debugImageSources(validEggs, 'FINAL_DISPLAY');
      
    } catch (error) {
      console.error('Error fetching available eggs:', error);
    } finally {
      setLoadingEggs(false);
    }
  };

  // Refresh eggs from Supabase (manual refresh)
  const refreshEggsFromSupabase = async () => {
    setLoadingEggs(true);
    try {
      console.log('🔄 Manual refresh from Supabase...');
      // Clear cached data first
      try {
        await setItem(OWN_CREATIONS_KEY, [], 'ownCreations');
        console.log('🗑️ Cleared IndexedDB cache');
      } catch (error) {
        console.error('Error clearing cache:', error);
      }
      
      // Fetch fresh data
      await fetchAvailableEggs();
    } catch (error) {
      console.error('Error refreshing eggs:', error);
    } finally {
      setLoadingEggs(false);
    }
  };

  // Open modal and fetch eggs
  const handleOpenEggModal = () => {
    console.log('🎯 Opening egg selection modal...');
    if (!formData.size.value) {
      alert("Please select a size first");
      return;
    }
    setShowEggModal(true);
    setSelectedEggs([]);
    fetchAvailableEggs();
  };

  // Add selected eggs to form
  const handleAddSelectedEggs = () => {
    console.log('➕ Adding selected eggs to form:', selectedEggs.length);
    
    const selectedEggImages = availableEggs
      .filter(egg => selectedEggs.includes(egg.id))
      .map(egg => ({
        fileObject: null,
        previewUrl: egg.image_url,
        isExisting: true,
        originalUrl: egg.image_url,
        markedForDeletion: false
      }));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...selectedEggImages]
    }));

    setShowEggModal(false);
    setSelectedEggs([]);
    setEggSearchQuery('');
  };

  // Filter eggs based on search
  const filteredEggs = availableEggs.filter(egg => 
    egg.prompt?.toLowerCase().includes(eggSearchQuery.toLowerCase()) ||
    egg.tags?.some(tag => tag.toLowerCase().includes(eggSearchQuery.toLowerCase()))
  );

  // Toggle egg selection
  const toggleEggSelection = (eggId: string) => {
    setSelectedEggs(prev => 
      prev.includes(eggId) 
        ? prev.filter(id => id !== eggId)
        : [...prev, eggId]
    );
  };

useEffect(() => {
  const fetchAllPresets = async () => {
    try {
      let allPresets: any[] = [];
      setDataSource('Supabase');
      
      const { data, error } = await supabase
        .from('presets')
        .select('*')
        .or('preset_status.eq.approved,preset_status.is.null')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching presets:", error);
        return;
      }
      
      allPresets = data || [];
      
      allPresets.forEach(preset => {
        if (preset.created_by) {
          fetchUserInfo(preset.created_by);
        }
      });

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

        const { data, error } = await supabase
          .from('presets')
          .select('*')
          .or('preset_status.eq.approved,preset_status.is.null')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error refetching presets:", error);
          return;
        }
        
        const updatedPresets = data || [];
        
        try {
          await setItem(ALL_PRESETS_KEY, updatedPresets);
        } catch (indexedDBError) {
          console.error("Error updating IndexedDB:", indexedDBError);
        }
        
        setPreset(updatedPresets as Preset[]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [currentView]);

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center w-fit"><CheckCircle className="mr-1" size={12} />Approved</span>;
    case 'pending_approval':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full flex items-center w-fit"><Clock className="mr-1" size={12} />Pending</span>;
    case 'rejected':
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center w-fit"><XCircle className="mr-1" size={12} />Rejected</span>;
    default:
      return null;
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Function to handle "Make Live" button click for both create and edit
  const handleMakeLive = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First validate the form
    const activeImages = formData.images.filter(img => !img.markedForDeletion);
    
    if (activeImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    const requiredUniqueImages = Math.ceil(parseInt(String(formData.size.value)) / 2);
    if (activeImages.length !== requiredUniqueImages) {
      alert(`For a matching pairs game, you need exactly ${requiredUniqueImages} unique images (which will be duplicated to create ${formData.size.value} cards). Currently you have ${activeImages.length} images.`);
      return;
    }

    setIsLoading(true);

    try {
      // Upload images and get URLs
      const uploadedImageUrls: string[] = [];

      for (let image of formData.images) {
        if (image.markedForDeletion) continue;
        
        if (image.isExisting && image.originalUrl) {
          uploadedImageUrls.push(image.originalUrl);
        } else if (image.fileObject) {
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

      const finalImageUrls = uploadedImageUrls;

      // Clean up object URLs
      formData.images.forEach(img => {
        if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
      });

      // Get current user info for created_by field
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      const adminUserId = searchParams.get('admin_user_id'); // Get admin user ID from URL if present

      // Create preset data with approved status for immediate publishing
      const presetData = {
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
        preset_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminUserId || currentUserId, 
        created_at: new Date().toISOString(),
        created_by: currentUserId // Add created_by field
      };

      if (editingId) {
        // Update existing preset
        const { data, error } = await supabase
          .from("presets")
          .update(presetData)
          .eq("id", editingId)
          .select("*");

        if (error) {
          console.error("Database error:", error);
          alert(`Failed to update preset: ${error.message}`);
          setIsLoading(false);
          return;
        }

        alert("Preset updated and published successfully!");
        
        // Update local state and IndexedDB
        const updatedPresets = preset.map(item => 
          item.id === editingId ? data[0] : item
        );
        setPreset(updatedPresets);
        
        try {
          await setItem(ALL_PRESETS_KEY, updatedPresets);
        } catch (indexedDBError) {
          console.error("Error updating IndexedDB:", indexedDBError);
        }
      } else {
        // Create new preset
        const { data, error } = await supabase
          .from("presets")
          .insert(presetData)
          .select("*");

        if (error) {
          console.error("Database error:", error);
          alert(`Failed to create preset: ${error.message}`);
          setIsLoading(false);
          return;
        }

        alert("Preset created and published successfully!");
        
        // Update local state and IndexedDB
        const updatedPresets = [...preset, data[0]];
        setPreset(updatedPresets);
        
        try {
          await setItem(ALL_PRESETS_KEY, updatedPresets);
        } catch (indexedDBError) {
          console.error("Error updating IndexedDB:", indexedDBError);
        }
      }
      
      // Reset form and go back to list view
      setCurrentView("list");
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

    } catch (err) {
      console.error("Unexpected error in handleMakeLive:", err);
      formData.images.forEach(img => {
        if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
      });
      alert("An unexpected error occurred. Please check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  // Modified handleSubmit - Now only validates and shows message, doesn't save to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const activeImages = formData.images.filter(img => !img.markedForDeletion);
    
    if (activeImages.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    const requiredUniqueImages = Math.ceil(parseInt(String(formData.size.value)) / 2);
    if (activeImages.length !== requiredUniqueImages) {
      alert(`For a matching pairs game, you need exactly ${requiredUniqueImages} unique images (which will be duplicated to create ${formData.size.value} cards). Currently you have ${activeImages.length} images.`);
      return;
    }

    // Show message that preset is ready but not saved
    alert("Preset is ready! Click 'Make Live' to publish it to the presets.");
    
    // Clean up object URLs if there are any file objects
    formData.images.forEach(img => {
      if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this preset?")) {
      return;
    }

    setDeletingId(id);
    
    try {
      const presetToDelete = preset.find(item => item.id === id);
      if (presetToDelete && (presetToDelete.preset_images ?? []).length > 0) {
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

  const handleImageRemove = (index: number) => {
    const imageToRemove = formData.images[index];
    
    const currentImageCount = formData.images.filter(img => !img.markedForDeletion).length;
    const requiredImageCount = Math.ceil(parseInt(String(formData.size.value)) / 2);
    
    if (imageToRemove.isExisting && currentImageCount <= requiredImageCount) {
      if (!confirm(`Removing this image would make your preset incomplete. You need ${requiredImageCount} unique images (which will be duplicated to create ${formData.size.value} cards). Are you sure you want to remove it?`)) {
        return;
      }
    }
    
    if (imageToRemove.isExisting) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.map((img, i) => 
          i === index ? { ...img, markedForDeletion: true } : img
        )
      }));
      console.log("Marked existing image for deletion:", imageToRemove.originalUrl);
    } else {
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
        {/* Egg Selection Modal */}
        {/* {showEggModal && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Grid className="text-[#e6d281] mr-2" size={24} />
                    Select from Existing Eggs
                  </h2>
                  <button 
                    onClick={() => {
                      setShowEggModal(false);
                      setSelectedEggs([]);
                      setEggSearchQuery('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  Select eggs from your existing creations. Selected eggs will be added to your preset.
                </p>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search eggs by prompt or tags..."
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                      value={eggSearchQuery}
                      onChange={(e) => setEggSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {selectedEggs.length} selected
                    </span>
                    <button
                      onClick={refreshEggsFromSupabase}
                      disabled={loadingEggs}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm flex items-center disabled:opacity-50"
                      title="Refresh from Supabase"
                    >
                      <Loader2 className={`mr-1 ${loadingEggs ? 'animate-spin' : ''}`} size={14} />
                      Refresh
                    </button>
                    <button
                      onClick={handleAddSelectedEggs}
                      disabled={selectedEggs.length === 0}
                      className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Selected Eggs
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <CheckCircle className="mr-1" size={12} />
                  Loaded from {eggsSource} • {availableEggs.length} eggs available
                </div>
              </div>

              <div className="flex-1 overflow-auto p-6">
                {loadingEggs ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="animate-spin text-[#e6d281]" size={32} />
                    <span className="ml-2 text-gray-600">Loading eggs...</span>
                  </div>
                ) : filteredEggs.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No eggs found</h3>
                    <p className="text-gray-500">
                      {eggSearchQuery ? 'Try a different search term' : 'No eggs available in your creations'}
                    </p>
                    <button
                      onClick={refreshEggsFromSupabase}
                      className="mt-4 px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 rounded-lg"
                    >
                      Refresh from Supabase
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredEggs.map((egg) => (
                      <div
                        key={egg.id}
                        className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          selectedEggs.includes(egg.id) 
                            ? 'border-[#e6d281] ring-2 ring-[#e6d281] ring-opacity-30' 
                            : 'border-gray-200 hover:border-[#e6d281]'
                        }`}
                        onClick={() => toggleEggSelection(egg.id)}
                      >
                        <div className="aspect-square relative">
                          <Image
                            src={egg.image_url}
                            alt={egg.prompt || 'Egg creation'}
                            fill
                            className="object-cover"
                            loading="lazy"
                          />
                          <div className={`absolute top-2 right-2 p-1 rounded-full ${
                            selectedEggs.includes(egg.id) 
                              ? 'bg-[#e6d281] text-gray-800' 
                              : 'bg-white bg-opacity-80 text-gray-600'
                          }`}>
                            {selectedEggs.includes(egg.id) ? (
                              <CheckSquare size={16} />
                            ) : (
                              <Square size={16} />
                            )}
                          </div>
                        </div>
                        {egg.prompt && (
                          <div className="p-2 bg-white bg-opacity-90">
                            <p className="text-xs text-gray-600 truncate" title={egg.prompt}>
                              {egg.prompt.length > 50 ? `${egg.prompt.substring(0, 50)}...` : egg.prompt}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
         */}
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
              : 'Fill out the form below to create a new egg card preset. Use "Make Live" to publish it.'
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
            
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* <button
                type="button"
                onClick={handleOpenEggModal}
                disabled={!formData.size.value}
                className="px-4 py-3 border-2 border-[#e6d281] text-[#e6d281] hover:bg-[#e6d281] hover:text-gray-800 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400 disabled:hover:bg-transparent flex items-center justify-center w-full sm:w-auto"
              >
                <Grid className="mr-2" size={18} />
                Select from Existing Eggs
              </button>
               */}
              <div 
                className="flex-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#e6d281] transition-colors cursor-pointer"
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
                </div>
              </div>
            </div>

            {formData.size.value && (
              <p className="text-xs text-[#e6d281] mb-4 text-center">
                Selected size requires {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images (will be duplicated to create {formData.size.value} cards)
              </p>
            )}

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
                    ⚠️ Warning: You need exactly {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images for this preset size (which will be duplicated to create ${formData.size.value} cards). 
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

            {/* Make Live Button - For both new and edit modes */}
            <button 
              type="button"
              onClick={handleMakeLive}
              disabled={isLoading || (!!formData.size.value && formData.images.filter(img => !img.markedForDeletion).length !== Math.ceil(parseInt(String(formData.size.value)) / 2))}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Globe className="mr-2" size={16} />
              )}
              {isLoading ? 'Publishing...' : (editingId ? 'Update & Make Live' : 'Make Live')}
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
            <p className="text-gray-600">Manage approved presets (collections of egg cards).</p>
            
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
  {getStatusBadge(item.preset_status || '')}
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(item.id)} 
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium flex items-center"
                          >
                            <Edit className="mr-1" size={14} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            disabled={deletingId === item.id}
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium flex items-center disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="mr-1 animate-spin" size={14} />
                            ) : (
                              <Trash2 className="mr-1" size={14} />
                            )}
                            {deletingId === item.id ? 'Deleting...' : 'Delete'}
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
                        <p className="text-xs text-gray-500 mb-1 flex items-center">
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

                    {item.admin_notes && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-yellow-700 mb-1 font-medium">Admin Notes</p>
                        <p className="text-sm text-yellow-800">{item.admin_notes}</p>
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
              {searchQuery ? 'No matching presets found!' : 'No presets found!'}
            </h3>
            <p className="mt-1 text-gray-500 mb-6">
              {searchQuery 
                ? `No presets found matching "${searchQuery}". Try a different search term.`
                : 'Get started by creating your first preset.'
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