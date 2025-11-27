'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Search,
  ChevronDown,
  Download,
  Calendar,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageSquare,
  Trash2,
  PlusCircle,
  Grid,
  Globe,
  Moon,
  Sun
} from "lucide-react";
import { supabase } from '../../../utils/supabaseClient';

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
  tags?: string[];
  likes: number;
  downloads: number;
  created_at: string;
  updated_at: string;
}

interface PresetCreationData {
  titleEn: string;
  titleDe: string;
  descEn: string;
  descDe: string;
  selectedEggs: Creation[];
}

interface DarkModeEgg {
  id: string;
  creation_id: string;
  image_url: string;
  title?: string;
  prompt?: string;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

// IndexedDB utility functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CreationsDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('creations')) {
        const store = db.createObjectStore('creations', { keyPath: 'id' });
        store.createIndex('source', 'source', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
};

const storeCreationsInDB = async (creations: Creation[]): Promise<void> => {
  try {
    console.log('💾 Storing creations in IndexedDB...', creations.length);
    const db = await openDB();
    const transaction = db.transaction(['creations'], 'readwrite');
    const store = transaction.objectStore('creations');
    
    await store.clear();
    
    for (const creation of creations) {
      store.add(creation);
    }
    
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('✅ Successfully stored creations in IndexedDB:', creations.length);
        resolve();
      };
      transaction.onerror = () => {
        console.error('❌ Error storing creations in IndexedDB:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('❌ Error storing creations in IndexedDB:', error);
    throw error;
  }
};

const getCreationsFromDB = async (): Promise<Creation[]> => {
  try {
    console.log('🏠 Checking IndexedDB for cached creations...');
    const db = await openDB();
    const transaction = db.transaction(['creations'], 'readonly');
    const store = transaction.objectStore('creations');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        console.log('📊 IndexedDB cache result:', result.length, 'creations found');
        resolve(result);
      };
      request.onerror = () => {
        console.error('❌ Error retrieving from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ Error accessing IndexedDB:', error);
    return [];
  }
};

const OwnCreations = () => {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<Creation | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'image_url' | 'generated_images'>('all');
  const [displayedCount, setDisplayedCount] = useState(100);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');
  
  // Preset creation state
  const [presetCreationMode, setPresetCreationMode] = useState(false);
  const [selectedForPreset, setSelectedForPreset] = useState<string[]>([]);
  const [presetFormData, setPresetFormData] = useState<PresetCreationData>({
    titleEn: '',
    titleDe: '',
    descEn: '',
    descDe: '',
    selectedEggs: []
  });
  const [makingLive, setMakingLive] = useState(false);

  // Dark Mode State
  const [darkModeEggs, setDarkModeEggs] = useState<DarkModeEgg[]>([]);
  const [togglingDarkMode, setTogglingDarkMode] = useState<string | null>(null);
  const [showDarkModeModal, setShowDarkModeModal] = useState(false);
  const [selectedForDarkMode, setSelectedForDarkMode] = useState<string[]>([]);

  const itemsPerBatch = 100;

  // Fetch dark mode eggs
  const fetchDarkModeEggs = async () => {
    try {
      const { data, error } = await supabase
        .from('dark_mode_eggs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dark mode eggs:', error);
        return;
      }

      setDarkModeEggs(data || []);
    } catch (error) {
      console.error('Error in fetchDarkModeEggs:', error);
    }
  };

  // Check if creation is in dark mode
  const isCreationInDarkMode = (creationId: string) => {
    return darkModeEggs.some(egg => egg.creation_id === creationId && egg.is_active);
  };

  // Toggle dark mode for creation - TAGS REMOVED
  const toggleDarkModeForCreation = async (creationId: string, creationData: Creation) => {
    setTogglingDarkMode(creationId);
    
    try {
      const existingEgg = darkModeEggs.find(egg => egg.creation_id === creationId);
      
      if (existingEgg) {
        // Toggle existing egg
        const { error } = await supabase
          .from('dark_mode_eggs')
          .update({ is_active: !existingEgg.is_active })
          .eq('id', existingEgg.id);

        if (error) {
          console.error('Error toggling dark mode:', error);
          showNotification('error', 'Failed to update dark mode');
          return;
        }

        // Update local state
        setDarkModeEggs(prev => 
          prev.map(egg => 
            egg.id === existingEgg.id 
              ? { ...egg, is_active: !existingEgg.is_active }
              : egg
          )
        );

        showNotification('success', `Creation ${!existingEgg.is_active ? 'added to' : 'removed from'} dark mode`);
      } else {
        // Add new egg to dark mode - TAGS REMOVED
        const darkModeEggData = {
          creation_id: creationId,
          image_url: creationData.image_url,
          title: creationData.title || '',
          prompt: creationData.prompt || '',
          is_active: true,
          created_by: creationData.creator_id,
        };

        const { error } = await supabase
          .from('dark_mode_eggs')
          .insert(darkModeEggData);

        if (error) {
          console.error('Error adding to dark mode:', error);
          showNotification('error', 'Failed to add to dark mode');
          return;
        }

        // Refresh dark mode eggs
        fetchDarkModeEggs();
        showNotification('success', 'Creation added to dark mode');
      }
    } catch (error) {
      console.error('Error in toggleDarkModeForCreation:', error);
      showNotification('error', 'An unexpected error occurred');
    } finally {
      setTogglingDarkMode(null);
    }
  };

  // Bulk add to dark mode - TAGS REMOVED
  const bulkAddToDarkMode = async () => {
    if (selectedForDarkMode.length === 0) {
      showNotification('error', 'Please select at least one creation for dark mode');
      return;
    }

    setTogglingDarkMode('bulk');
    
    try {
      const successfulAdds: string[] = [];
      
      for (const creationId of selectedForDarkMode) {
        const creation = creations.find(c => c.id === creationId);
        if (!creation) continue;
        
        const existingEgg = darkModeEggs.find(egg => egg.creation_id === creationId);
        
        if (!existingEgg) {
          const darkModeEggData = {
            creation_id: creationId,
            image_url: creation.image_url,
            title: creation.title || '',
            prompt: creation.prompt || '',
            is_active: true,
            created_by: creation.creator_id,
          };

          const { error } = await supabase
            .from('dark_mode_eggs')
            .insert(darkModeEggData);

          if (error) {
            console.error(`Error adding creation ${creationId} to dark mode:`, error);
            continue;
          }
          
          successfulAdds.push(creationId);
        } else if (!existingEgg.is_active) {
          const { error } = await supabase
            .from('dark_mode_eggs')
            .update({ is_active: true })
            .eq('id', existingEgg.id);

          if (error) {
            console.error(`Error activating creation ${creationId} in dark mode:`, error);
            continue;
          }
          
          successfulAdds.push(creationId);
        }
      }

      // Refresh dark mode eggs
      await fetchDarkModeEggs();
      
      if (successfulAdds.length > 0) {
        showNotification('success', `Successfully added ${successfulAdds.length} creation(s) to dark mode`);
        setSelectedForDarkMode([]);
        setShowDarkModeModal(false);
      } else {
        showNotification('info', 'No new creations were added to dark mode');
      }
    } catch (error) {
      console.error('Error in bulkAddToDarkMode:', error);
      showNotification('error', 'Failed to add creations to dark mode');
    } finally {
      setTogglingDarkMode(null);
    }
  };

  // Bulk remove from dark mode
  const bulkRemoveFromDarkMode = async () => {
    if (selectedForDarkMode.length === 0) {
      showNotification('error', 'Please select at least one creation to remove from dark mode');
      return;
    }

    setTogglingDarkMode('bulk-remove');
    
    try {
      const successfulRemovals: string[] = [];
      
      for (const creationId of selectedForDarkMode) {
        const existingEgg = darkModeEggs.find(egg => egg.creation_id === creationId && egg.is_active);
        
        if (existingEgg) {
          const { error } = await supabase
            .from('dark_mode_eggs')
            .update({ is_active: false })
            .eq('id', existingEgg.id);

          if (error) {
            console.error(`Error removing creation ${creationId} from dark mode:`, error);
            continue;
          }
          
          successfulRemovals.push(creationId);
        }
      }

      // Refresh dark mode eggs
      await fetchDarkModeEggs();
      
      if (successfulRemovals.length > 0) {
        showNotification('success', `Successfully removed ${successfulRemovals.length} creation(s) from dark mode`);
        setSelectedForDarkMode([]);
        setShowDarkModeModal(false);
      } else {
        showNotification('info', 'No creations were removed from dark mode');
      }
    } catch (error) {
      console.error('Error in bulkRemoveFromDarkMode:', error);
      showNotification('error', 'Failed to remove creations from dark mode');
    } finally {
      setTogglingDarkMode(null);
    }
  };

  // Toggle selection for dark mode
  const toggleDarkModeSelection = (creationId: string) => {
    setSelectedForDarkMode(prev => {
      if (prev.includes(creationId)) {
        return prev.filter(id => id !== creationId);
      } else {
        return [...prev, creationId];
      }
    });
  };

  // Auto select all visible for dark mode
  const autoSelectForDarkMode = () => {
    const visibleCreations = currentItems.map(creation => creation.id);
    setSelectedForDarkMode(visibleCreations);
    showNotification('success', `Selected ${visibleCreations.length} creations for dark mode`);
  };

  // Clear dark mode selection
  const clearDarkModeSelection = () => {
    setSelectedForDarkMode([]);
  };

  // Open dark mode modal
  const openDarkModeModal = () => {
    setShowDarkModeModal(true);
    setSelectedForDarkMode([]);
  };

  // Real-time subscription for users table changes
  const setupRealtimeSubscription = () => {
    console.log('🔔 Setting up real-time subscription for users table...');
    
    const subscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newUser = payload.new;
            if (newUser.generated_images) {
              console.log('🆕 New/Updated user with generated_images detected');
              syncWithSupabase();
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return subscription;
  };

  const fetchFromSupabase = async (offset = 0, batchSize = 50): Promise<{ creations: Creation[], hasMore: boolean }> => {
    try {
      console.log('🌐 Fetching from Supabase...');
      setSyncStatus('syncing');
      
      const { data, error, count } = await supabase
        .from('users')
        .select('id, email, created_at, generated_images', { count: 'exact' })
        .not('generated_images', 'is', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1);
      
      console.log('📊 Supabase response:', {
        dataCount: data?.length,
        error: error,
        totalCount: count
      });

      if (error) {
        console.error('❌ Supabase fetch failed:', error);
        setSyncStatus('error');
        return { creations: [], hasMore: false };
      }

      if (!data || !Array.isArray(data)) {
        console.log('⚠️ No data from Supabase');
        setSyncStatus('complete');
        return { creations: [], hasMore: false };
      }

      console.log('✅ Processing Supabase data...');
      const collectedCreations: Creation[] = [];
      const seenImageUrls = new Set<string>();

      console.log('👥 Users to process:', data.length);

      for (const user of data) {
        const userId = user.id;
        const userEmail = user.email || 'Unknown User';
                
        if (user.generated_images) {
          try {
            let generatedImagesData: any[] = [];
            
            if (typeof user.generated_images === 'string') {
              try {
                const parsed = JSON.parse(user.generated_images);
                
                if (Array.isArray(parsed)) {
                  generatedImagesData = parsed;
                } 
                else if (parsed.generated_images && Array.isArray(parsed.generated_images)) {
                  generatedImagesData = parsed.generated_images;
                }
                else if (parsed.url || parsed.image_url) {
                  generatedImagesData = [parsed];
                }
              } catch (e) {
                if (user.generated_images.startsWith('http') || user.generated_images.startsWith('data:')) {
                  generatedImagesData = [{ url: user.generated_images, prompt: 'Generated image' }];
                }
              }
            } else if (typeof user.generated_images === 'object') {
              if (Array.isArray(user.generated_images)) {
                generatedImagesData = user.generated_images;
              } else if (user.generated_images.generated_images && Array.isArray(user.generated_images.generated_images)) {
                generatedImagesData = user.generated_images.generated_images;
              } else {
                generatedImagesData = [user.generated_images];
              }
            }

            generatedImagesData.forEach((imgData: any, index: number) => {
              const imageUrl = imgData.url || imgData.image_url;
              const prompt = imgData.prompt || imgData.description || '';
              const tags = imgData.tags || [];
              const title = imgData.title || '';
              
              if (imageUrl && typeof imageUrl === 'string' && !seenImageUrls.has(imageUrl)) {
                seenImageUrls.add(imageUrl);
                const creationId = `${userId}-generated_images-${index}-${Date.now()}`;
                          
                collectedCreations.push({
                  id: creationId,
                  title: title,
                  image_url: imageUrl,
                  prompt: prompt,
                  source: 'generated_images',
                  creator_id: userId,
                  creator: {
                    id: userId,
                    name: userEmail,
                    avatar_url: null
                  },
                  tags: tags,
                  likes: imgData.likes || 0,
                  downloads: imgData.downloads || 0,
                  created_at: imgData.created_at || user.created_at,
                  updated_at: imgData.updated_at || user.created_at
                });
              }
            });
          } catch (error) {
            console.error(`❌ Error processing user ${userId}:`, error);
          }
        }
      }

      console.log(`🎉 Supabase fetch complete: ${collectedCreations.length} creations`);
      setSyncStatus('complete');
      
      return { 
        creations: collectedCreations, 
        hasMore: data.length === batchSize 
      };
    } catch (error) {
      console.error('💥 Error in fetchFromSupabase:', error);
      setSyncStatus('error');
      return { creations: [], hasMore: false };
    }
  };

  const syncWithSupabase = async () => {
    console.log('🔄 Syncing with Supabase...');
    try {
      const result = await fetchFromSupabase(0, 100);
      
      if (result.creations.length > 0) {
        console.log('🔄 Updating with fresh Supabase data...');
        
        setCreations(prevCreations => {
          const newCreations = [...result.creations];
          
          const tagsSet = new Set<string>(allTags);
          newCreations.forEach(creation => {
            if (creation.tags && Array.isArray(creation.tags)) {
              creation.tags.forEach((tag: string) => tagsSet.add(tag));
            }
          });
          setAllTags(Array.from(tagsSet));
          
          storeCreationsInDB(newCreations);
          
          return newCreations;
        });
        
        setLastSync(new Date());
        console.log('✅ Sync completed successfully');
        
        if (result.creations.length > creations.length) {
          showNotification('success', `Synced ${result.creations.length - creations.length} new creations`);
        }
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      showNotification('error', 'Sync failed');
    }
  };

  // refreshCreations function
  const refreshCreations = async () => {
    console.log('🔄 Manual refresh triggered');
    setLoading(true);
    setDisplayedCount(100);
    setHasMore(true);
    
    try {
      console.log('🧹 Clearing cache for fresh data...');
      try {
        const db = await openDB();
        const transaction = db.transaction(['creations'], 'readwrite');
        const store = transaction.objectStore('creations');
        await store.clear();
        console.log('✅ Cache cleared');
      } catch (error) {
        console.error('❌ Error clearing cache:', error);
      }

      await syncWithSupabase();
      setLoading(false);
      showNotification('success', 'Creations refreshed successfully');
    } catch (err) {
      console.error('❌ Refresh failed:', err);
      setLoading(false);
      showNotification('error', 'Failed to refresh creations');
    }
  };

  const fetchGeneratedImagesFromUsers = async (offset = 0, batchSize = 50): Promise<{ creations: Creation[], hasMore: boolean }> => {
    try {
      console.log(`🔄 fetchGeneratedImagesFromUsers - Offset: ${offset}, BatchSize: ${batchSize}`);
      
      console.log('🏠 STEP 1: Loading from IndexedDB (instant)...');
      const dbCreations = await getCreationsFromDB();
      
      if (dbCreations.length > 0 && offset === 0) {
        console.log('✅ USING INDEXEDDB CACHE:', dbCreations.length, 'creations');
        
        setTimeout(() => {
          console.log('🔄 BACKGROUND: Starting Supabase sync...');
          syncWithSupabase();
        }, 1000);
        
        return { 
          creations: dbCreations.slice(offset, offset + batchSize), 
          hasMore: dbCreations.length > offset + batchSize 
        };
      }

      console.log('🔄 STEP 2: No cache found, fetching from Supabase...');
      const supabaseResult = await fetchFromSupabase(offset, batchSize);
      
      if (supabaseResult.creations.length > 0 && offset === 0) {
        console.log('💾 Caching Supabase data in IndexedDB...');
        await storeCreationsInDB(supabaseResult.creations);
      }
      
      return supabaseResult;
    } catch (error) {
      console.error('💥 Error in fetchGeneratedImagesFromUsers:', error);
      return { creations: [], hasMore: false };
    }
  };

  const fetchMoreCreations = async () => {
    if (loadingMore || !hasMore) return;
    
    console.log('🔄 fetchMoreCreations called');
    setLoadingMore(true);
    try {
      const dbRecordsFetched = Math.floor(creations.length / 5);
      const batchSize = 50;
      
      const result = await fetchGeneratedImagesFromUsers(dbRecordsFetched, batchSize);
      const newCreations = result.creations;
      const moreAvailable = result.hasMore;
      
      if (newCreations.length > 0) {
        const seenIds = new Set(creations.map((c: Creation) => c.id));
        const uniqueNewCreations = newCreations.filter((c: Creation) => !seenIds.has(c.id));
        
        if (uniqueNewCreations.length > 0) {
          const tagsSet = new Set<string>(allTags);
          uniqueNewCreations.forEach((creation: Creation) => {
            if (creation.tags && Array.isArray(creation.tags)) {
              creation.tags.forEach((tag: string) => tagsSet.add(tag));
            }
          });
          setAllTags(Array.from(tagsSet));
          
          setCreations(prev => [...prev, ...uniqueNewCreations]);
          setHasMore(moreAvailable);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error in fetchMoreCreations:', err);
      showNotification('error', 'Failed to load more creations');
    } finally {
      setLoadingMore(false);
    }
  };

  // handleDeleteAsset function
  const handleDeleteAsset = async () => {
    if (!selectedImage) {
      console.error('❌ No image selected for deletion');
      showNotification('error', 'No image selected');
      return;
    }
    
    setDeleting(true);
    try {
      const userId = selectedImage.creator_id || selectedImage.id.split('-')[0];
      const targetImageUrl = selectedImage.image_url;
      
      if (!userId) {
        throw new Error('Unable to determine user ID');
      }
      
      if (!targetImageUrl) {
        throw new Error('Image URL is missing');
      }
      
      console.log('🗑️ Deleting asset for user:', userId, 'Image URL:', targetImageUrl);
      
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('generated_images')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching user data:', fetchError);
        throw fetchError;
      }

      if (!userData || !userData.generated_images) {
        throw new Error('User or generated images not found');
      }

      let generatedImagesData: any[] = [];
      
      if (typeof userData.generated_images === 'string') {
        try {
          const parsed = JSON.parse(userData.generated_images);
          
          if (Array.isArray(parsed)) {
            generatedImagesData = parsed;
          } 
          else if (parsed.generated_images && Array.isArray(parsed.generated_images)) {
            generatedImagesData = parsed.generated_images;
          }
          else if (parsed.url || parsed.image_url) {
            generatedImagesData = [parsed];
          }
        } catch (e) {
          if (userData.generated_images.startsWith('http') || userData.generated_images.startsWith('data:')) {
            generatedImagesData = [{ url: userData.generated_images, prompt: 'Generated image' }];
          } else {
            throw new Error('Failed to parse generated_images');
          }
        }
      } else if (typeof userData.generated_images === 'object') {
        if (Array.isArray(userData.generated_images)) {
          generatedImagesData = userData.generated_images;
        } else if (userData.generated_images.generated_images && Array.isArray(userData.generated_images.generated_images)) {
          generatedImagesData = userData.generated_images.generated_images;
        } else {
          generatedImagesData = [userData.generated_images];
        }
      }

      const updatedImages = generatedImagesData.filter((imgData: any) => {
        const imageUrl = imgData.url || imgData.image_url;
        return imageUrl !== targetImageUrl;
      });

      if (updatedImages.length === generatedImagesData.length) {
        console.warn('⚠️ Image not found in user data, but proceeding with local removal');
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ generated_images: updatedImages })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating user data:', updateError);
        throw updateError;
      }

      setCreations(prev => {
        const updated = prev.filter(creation => creation.id !== selectedImage.id);
        storeCreationsInDB(updated).catch(err => {
          console.error('❌ Error updating IndexedDB:', err);
        });
        return updated;
      });
      
      showNotification('success', 'Asset deleted successfully');
      setSelectedImage(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('❌ Error deleting asset:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete asset';
      showNotification('error', `Failed to delete asset: ${errorMessage}`);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 Initializing data...');
        setLoading(true);
        
        // Load dark mode eggs first
        await fetchDarkModeEggs();
        
        console.log('🏠 Loading from IndexedDB...');
        const dbCreations = await getCreationsFromDB();
        
        if (dbCreations.length > 0) {
          console.log('✅ IndexedDB loaded instantly:', dbCreations.length, 'creations');
          setCreations(dbCreations);
          setLoading(false);
          
          const tagsSet = new Set<string>();
          dbCreations.forEach(creation => {
            if (creation.tags && Array.isArray(creation.tags)) {
              creation.tags.forEach((tag: string) => tagsSet.add(tag));
            }
          });
          setAllTags(Array.from(tagsSet));
        }
        
        console.log('🔄 Syncing with Supabase for fresh data...');
        await syncWithSupabase();
        
        console.log('🔔 Setting up real-time subscriptions...');
        const subscription = setupRealtimeSubscription();
        
        setLastSync(new Date());
        
        return () => {
          console.log('🧹 Cleaning up real-time subscription');
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('💥 Initialization failed:', err);
        setLoading(false);
        showNotification('error', 'Failed to load creations');
      }
    };

    initializeData();
  }, []);

  // Preset creation functions
  const MAX_EGGS = 12;
  
  const togglePresetSelection = (creationId: string) => {
    setSelectedForPreset(prev => {
      if (prev.includes(creationId)) {
        return prev.filter(id => id !== creationId);
      } else {
        if (prev.length >= MAX_EGGS) {
          showNotification('error', `Maximum ${MAX_EGGS} eggs can be selected`);
          return prev;
        }
        return [...prev, creationId];
      }
    });
  };

  const autoSelectEggs = () => {
    const availableEggs = filteredCreations.filter(creation => !selectedForPreset.includes(creation.id));
    const eggsToSelect = availableEggs.slice(0, MAX_EGGS - selectedForPreset.length);
    
    if (eggsToSelect.length === 0) {
      showNotification('info', 'No more eggs available to select');
      return;
    }
    
    setSelectedForPreset(prev => {
      const newSelection = [...prev, ...eggsToSelect.map(egg => egg.id)];
      return newSelection.slice(0, MAX_EGGS);
    });
    
    showNotification('success', `Auto-selected ${eggsToSelect.length} egg(s)`);
  };

  const startPresetCreation = () => {
    setPresetCreationMode(true);
    setSelectedForPreset([]);
    setPresetFormData({
      titleEn: '',
      titleDe: '',
      descEn: '',
      descDe: '',
      selectedEggs: []
    });
  };

  const cancelPresetCreation = () => {
    setPresetCreationMode(false);
    setSelectedForPreset([]);
  };

  // Make Live functionality
  const handleMakeLive = async () => {
    if (selectedForPreset.length === 0) {
      showNotification('error', 'Please select at least one image for the preset');
      return;
    }

    if (selectedForPreset.length > MAX_EGGS) {
      showNotification('error', `Maximum ${MAX_EGGS} eggs can be selected`);
      return;
    }

    if (!presetFormData.titleEn || !presetFormData.titleDe) {
      showNotification('error', 'Please provide both English and German titles');
      return;
    }

    setMakingLive(true);
    const selectedEggs = creations.filter(creation => selectedForPreset.includes(creation.id));
    
    try {
      const imageUrls = selectedEggs.map(egg => egg.image_url);
      
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      const presetData = {
        preset_name: {
          en_name: presetFormData.titleEn,
          de_name: presetFormData.titleDe,
        },
        preset_desc: {
          en_desc: presetFormData.descEn || '',
          de_desc: presetFormData.descDe || '',
        },
        preset_size_json: { value: selectedEggs.length * 2, price: 0.99 },
        preset_price: '0.99',
        preset_images: imageUrls,
        preset_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: currentUserId,
        created_at: new Date().toISOString(),
        created_by: currentUserId
      };

      console.log('🚀 Publishing preset:', presetData);

      const { data, error } = await supabase
        .from('presets')
        .insert(presetData)
        .select('*');

      if (error) {
        console.error('❌ Error publishing preset:', error);
        throw error;
      }

      showNotification('success', 'Preset created and published successfully!');
      setPresetCreationMode(false);
      setSelectedForPreset([]);
      
      setTimeout(() => {
        window.location.href = '/dashboard/presets';
      }, 2000);

    } catch (error) {
      console.error('❌ Error creating preset:', error);
      showNotification('error', 'Failed to create and publish preset');
    } finally {
      setMakingLive(false);
    }
  };

  const filteredCreations = useMemo(() => {
    return creations
      .filter(creation => {
        const title = creation.title || '';
        const prompt = creation.prompt || '';
        const tags = Array.isArray(creation.tags) ? creation.tags : [];
        
        const matchesSearch = 
          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTag = 
          tagFilter === 'all' || 
          tags.includes(tagFilter);

        const matchesSource = 
          sourceFilter === 'all' || 
          creation.source === sourceFilter;

        return matchesSearch && matchesTag && matchesSource;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [creations, searchQuery, tagFilter, sourceFilter]);
  
  const currentItems = filteredCreations.slice(0, displayedCount);
  const hasMoreToShow = filteredCreations.length > displayedCount || hasMore;
  
  const handleLoadMore = async () => {
    if (filteredCreations.length > displayedCount) {
      setDisplayedCount(prev => Math.min(prev + itemsPerBatch, filteredCreations.length));
    } else if (hasMore && !loadingMore) {
      await fetchMoreCreations();
      setDisplayedCount(prev => prev + itemsPerBatch);
    }
  };
  
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = async (creationId: string) => {
    try {
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;
      
      setCreations(prev => prev.map(c => 
        c.id === creationId ? { ...c, downloads: (c.downloads || 0) + 1 } : c
      ));
      
      fetch(creation.image_url)
        .then(res => res.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `creation-${creation.title || creation.id}.png`;
          a.click();
        })
        .catch(err => console.error("Download failed:", err));
      
      showNotification('success', 'Download started');
    } catch (error) {
      showNotification('error', 'Failed to download creation');
    }
  };

  const handleDownloadAll = async () => {
    if (creations.length === 0) {
      showNotification('info', 'No creations to download');
      return;
    }
    
    try {
      showNotification('info', `Starting download of ${creations.length} images...`);
      
      setCreations(prev => prev.map(c => ({ ...c, downloads: (c.downloads || 0) + 1 })));
      
      for (let i = 0; i < creations.length; i++) {
        const creation = creations[i];
        
        try {
          const response = await fetch(creation.image_url);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `creation-${creation.title || creation.id}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Failed to download image ${i + 1}:`, error);
        }
      }
      
      showNotification('success', 'All downloads started');
    } catch (error) {
      showNotification('error', 'Failed to initiate downloads');
    }
  };

  const handleImageLoad = (creationId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [creationId]: false
    }));
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const hasValidPrompt = (creation: Creation) => {
    return creation.source === 'generated_images' && creation.prompt && creation.prompt.trim().length > 0;
  };

  const SafeImage = ({ src, alt, className }: { src: string, alt: string, className: string }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = () => {
      setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0VFRUVFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==');
      setIsLoading(false);
    };

    const handleLoad = () => {
      setIsLoading(false);
    };

    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        )}
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="mr-2" size={20} />
          ) : notification.type === 'error' ? (
            <XCircle className="mr-2" size={20} />
          ) : (
            <AlertCircle className="mr-2" size={20} />
          )}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            <XCircle size={20} />
          </button>
        </div>
      )}
      
      {/* Sync Status Indicator */}
      {syncStatus === 'syncing' && (
        <div className="fixed top-4 left-4 z-50 p-3 bg-blue-100 text-blue-800 rounded-lg shadow-lg flex items-center">
          <RefreshCw className="animate-spin mr-2" size={16} />
          <span className="text-sm">Syncing with server...</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            {selectedImage.image_url && (
              <div className="relative w-full h-48 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedImage.image_url}
                  alt={selectedImage.title || 'Creation'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAsset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
                {deleting ? 'Deleting...' : 'Delete Asset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dark Mode Selection Modal */}
      {showDarkModeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Moon className="mr-2 text-purple-500" size={24} />
                  Manage Dark Mode Eggs
                </h3>
                <button
                  onClick={() => setShowDarkModeModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Select creations to add or remove from dark mode. Currently selected: {selectedForDarkMode.length} creation(s)
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {currentItems.map((creation) => {
                  const isSelected = selectedForDarkMode.includes(creation.id);
                  const isInDarkMode = isCreationInDarkMode(creation.id);
                  
                  return (
                    <div 
                      key={creation.id}
                      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-200' 
                          : isInDarkMode
                            ? 'border-green-500'
                            : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleDarkModeSelection(creation.id)}
                    >
                      <Image
                        src={creation.image_url}
                        alt={creation.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <CheckCircle size={12} />
                        </div>
                      )}
                      
                      {/* Dark Mode Status Indicator */}
                      {isInDarkMode && !isSelected && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Moon size={10} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="flex gap-2">
                 
                  <button
                    onClick={clearDarkModeSelection}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={bulkRemoveFromDarkMode}
                    disabled={selectedForDarkMode.length === 0 || togglingDarkMode === 'bulk-remove'}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                  >
                    {togglingDarkMode === 'bulk-remove' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Sun size={16} />
                    )}
                    Remove from Dark Mode ({selectedForDarkMode.length})
                  </button>
                  
                  <button
                    onClick={bulkAddToDarkMode}
                    disabled={selectedForDarkMode.length === 0 || togglingDarkMode === 'bulk'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                  >
                    {togglingDarkMode === 'bulk' ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Moon size={16} />
                    )}
                    Add to Dark Mode ({selectedForDarkMode.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedImage && !showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            >
              <XCircle size={24} />
            </button>
            <div className="p-6">
              <div className="relative w-full aspect-square max-h-[70vh] mb-4 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt || 'Creation'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              {selectedImage.prompt && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Prompt</h3>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedImage.prompt}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span> {formatDate(selectedImage.created_at)}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(selectedImage.id);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Asset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
              <ImageIcon className="text-[#e6d281] mr-2" size={24} />
              My Creations
            </h1>
            <p className="text-gray-600">Browse and manage your creative works from user generated images</p>
            {lastSync && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <Calendar size={14} className="mr-1" />
                Last synced: {formatDate(lastSync.toString())}
                {syncStatus === 'syncing' && (
                  <RefreshCw className="animate-spin ml-2" size={12} />
                )}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            {presetCreationMode ? (
              <>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={cancelPresetCreation}
                >
                  <XCircle size={18} />
                  Cancel Preset
                </button>
                <button 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center disabled:opacity-50"
                  onClick={handleMakeLive}
                  disabled={selectedForPreset.length === 0 || makingLive}
                >
                  {makingLive ? (
                    <Loader2 className="mr-2 animate-spin" size={18} />
                  ) : (
                    <Globe className="mr-2" size={18} />
                  )}
                  {makingLive ? 'Publishing...' : 'Make Live'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={refreshCreations}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
                  Refresh
                </button>
                
                {/* Dark Mode Button */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  onClick={openDarkModeModal}
                >
                  <Moon size={18} />
                  Dark Mode
                </button>
                
                <button 
                  className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
                  onClick={startPresetCreation}
                >
                  <PlusCircle className="mr-2" size={18} />
                  Create Preset
                </button>
                <button 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center"
                  onClick={handleDownloadAll}
                >
                  <Download className="mr-2" size={18} />
                  Download All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Preset Creation Form */}
        {presetCreationMode && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <Grid className="mr-2" size={20} />
              Create New Preset from Selected Eggs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preset Title (English) *</label>
                <input
                  type="text"
                  value={presetFormData.titleEn}
                  onChange={(e) => setPresetFormData(prev => ({ ...prev, titleEn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                  placeholder="Spring Flowers Collection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preset Title (German) *</label>
                <input
                  type="text"
                  value={presetFormData.titleDe}
                  onChange={(e) => setPresetFormData(prev => ({ ...prev, titleDe: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                  placeholder="Frühlingsblumen Kollektion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (English) - Optional</label>
                <textarea
                  value={presetFormData.descEn}
                  onChange={(e) => setPresetFormData(prev => ({ ...prev, descEn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                  placeholder="A beautiful collection of spring flower designs"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (German) - Optional</label>
                <textarea
                  value={presetFormData.descDe}
                  onChange={(e) => setPresetFormData(prev => ({ ...prev, descDe: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                  placeholder="Eine wunderschöne Kollektion von Frühlingsblumen-Designs"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800">
                  <CheckCircle className="inline mr-1" size={16} />
                  Selected {selectedForPreset.length}/{MAX_EGGS} eggs for preset 
                </p>
                <button
                  onClick={autoSelectEggs}
                  disabled={selectedForPreset.length >= MAX_EGGS}
                  className="px-3 py-1.5 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Auto Select {selectedForPreset.length < MAX_EGGS ? `(${MAX_EGGS - selectedForPreset.length} remaining)` : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search creations, prompts..."
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayedCount(itemsPerBatch);
              }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <ImageIcon className="text-gray-300 mb-4" size={32} />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <p className="text-sm text-gray-500">Loading creations...</p>
          </div>
        </div>
      ) : filteredCreations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={40} />
          <h3 className="text-lg font-medium text-gray-900">No creations found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery || sourceFilter !== 'all' ? 'Try a different search term or filter' : 'Add some creations to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-20 gap-2 mb-6" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
            {currentItems.map((creation) => {
              const isInDarkMode = isCreationInDarkMode(creation.id);
              
              return (
                <div 
                  key={creation.id} 
                  className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer col-span-1 ${
                    presetCreationMode && selectedForPreset.includes(creation.id) 
                      ? 'ring-2 ring-[#e6d281] ring-offset-2' 
                      : ''
                  }`}
                  onClick={() => {
                    if (presetCreationMode) {
                      togglePresetSelection(creation.id);
                    } else {
                      setSelectedImage(creation);
                    }
                  }}
                >
                  <div className="relative aspect-square">
                    {imageLoadingStates[creation.id] !== false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <Loader2 className="animate-spin text-gray-400" size={24} />
                      </div>
                    )}
                    <Image 
                      src={creation.image_url} 
                      alt={creation.title}
                      fill
                      className={`object-cover ${imageLoadingStates[creation.id] !== false ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}`}
                      onLoadingComplete={() => handleImageLoad(creation.id)}
                      onError={() => {
                        handleImageLoad(creation.id);
                      }}
                      unoptimized
                    />
                    
                    {/* Selection Indicator */}
                    {presetCreationMode && selectedForPreset.includes(creation.id) && (
                      <div className="absolute top-1 right-1 bg-[#e6d281] text-gray-800 rounded-full w-5 h-5 flex items-center justify-center">
                        <CheckCircle size={12} />
                      </div>
                    )}
                    
                    {/* Action Buttons - Only show when not in preset creation mode */}
                    {!presetCreationMode && (
                      <>
                        <div className="absolute top-1 right-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button 
                            className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500 active:scale-95 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleDownload(creation.id);
                            }}
                            title="Download"
                          >
                            <Download size={12} />
                          </button>
                          
                          <button 
                            className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500 active:scale-95 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('🗑️ Delete button clicked for:', creation.id);
                              setSelectedImage(creation);
                              setShowDeleteConfirm(true);
                            }}
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                  
                        {hasValidPrompt(creation) && (
                          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(creation);
                              }}
                              title="View Prompt"
                            >
                              <MessageSquare size={12} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                    
                  <div className="p-2">
                    {creation.prompt ? (
                      <div className="text-xs text-gray-600 truncate" title={creation.prompt}>
                        {truncatePrompt(creation.prompt, 60)}
                      </div>
                    ) : null}
                    
                    {/* Dark Mode Badge */}
                    {isInDarkMode && (
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                          <Moon size={8} className="mr-0.5" />
                          Dark Mode
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {hasMoreToShow && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <ChevronDown size={18} />
                  </>
                )}
              </button>
            </div>
          )}
          {!hasMoreToShow && filteredCreations.length > 0 && (
            <div className="text-center mt-6 text-gray-500 text-sm">
              Showing all {filteredCreations.length} creations
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnCreations;