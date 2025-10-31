'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  RefreshCw,
  XCircle,
  AlertCircle,
  CheckCircle,
  Tag,
  Loader2,
  MessageSquare,
  Layers,
  Trash2
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
  tags: string[];
  likes: number;
  downloads: number;
  created_at: string;
  updated_at: string;
}

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
  
  const itemsPerBatch = 100;

  const fetchGeneratedImagesFromSupabase = async (offset = 0, batchSize = 50): Promise<{ creations: Creation[], hasMore: boolean }> => {
    try {
      const { data, error } = await supabase
        .from('user_own_creations')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + batchSize - 1);
      
      if (error) {
        console.error('Error fetching user_own_creations:', error);
        return { creations: [], hasMore: false };
      }

      if (!data || !Array.isArray(data)) {
        return { creations: [], hasMore: false };
      }

      const collectedCreations: Creation[] = [];
      const seenImageUrls = new Set<string>();

      for (const creation of data) {
        const isGuest = !creation.user_uid || creation.user_uid === null;
        const creationId = creation.id;

        if (creation.image_url) {
          try {
            let imageUrls: string[] = [];
            
            if (typeof creation.image_url === 'string') {
              try {
                const parsed = JSON.parse(creation.image_url);
                if (Array.isArray(parsed)) {
                  imageUrls = parsed.filter(url => typeof url === 'string' && url.length > 0);
                }
              } catch (e) {
                if (creation.image_url.startsWith('http') || creation.image_url.startsWith('data:')) {
                  imageUrls = [creation.image_url];
                }
              }
            } else if (Array.isArray(creation.image_url)) {
              imageUrls = creation.image_url.filter((url: string) => typeof url === 'string' && url.length > 0);
            }

            imageUrls.forEach((imageUrl: string, index: number) => {
              if (imageUrl && typeof imageUrl === 'string' && !seenImageUrls.has(imageUrl)) {
                seenImageUrls.add(imageUrl);
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
              try {
                const parsed = JSON.parse(creation.generated_images);
                
                if (parsed.generated_images && Array.isArray(parsed.generated_images)) {
                  generatedImagesData = parsed.generated_images;
                } 
                else if (Array.isArray(parsed)) {
                  generatedImagesData = parsed;
                }
                else if (parsed.url || parsed.image_url) {
                  generatedImagesData = [parsed];
                }
              } catch (e) {
                if (creation.generated_images.startsWith('http') || creation.generated_images.startsWith('data:')) {
                  generatedImagesData = [{ url: creation.generated_images, prompt: 'Generated image' }];
                }
              }
            } else if (typeof creation.generated_images === 'object') {
              if (creation.generated_images.generated_images && Array.isArray(creation.generated_images.generated_images)) {
                generatedImagesData = creation.generated_images.generated_images;
              } else if (Array.isArray(creation.generated_images)) {
                generatedImagesData = creation.generated_images;
              } else {
                generatedImagesData = [creation.generated_images];
              }
            }

            generatedImagesData.forEach((imgData: any, index: number) => {
              const imageUrl = imgData.url || imgData.image_url;
              const prompt = imgData.prompt || '';
              
              if (imageUrl && typeof imageUrl === 'string' && !seenImageUrls.has(imageUrl)) {
                seenImageUrls.add(imageUrl);
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

      return { creations: collectedCreations, hasMore: data.length === batchSize };
    } catch (error) {
      console.error('Error in fetchGeneratedImagesFromSupabase:', error);
      return { creations: [], hasMore: false };
    }
  };

  const fetchMoreCreations = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const dbRecordsFetched = Math.floor(creations.length / 5);
      const batchSize = 50;
      
      const result = await fetchGeneratedImagesFromSupabase(dbRecordsFetched, batchSize);
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
      showNotification('error', 'Failed to load more creations');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchInitialCreations = async () => {
      try {
        setLoading(true);
        
        let allFetchedCreations: Creation[] = [];
        let offset = 0;
        const batchSize = 50;
        let hasMoreData = true;
        
        while (hasMoreData && allFetchedCreations.length < itemsPerBatch) {
          const result = await fetchGeneratedImagesFromSupabase(offset, batchSize);
          const creations = result.creations;
          const hasMore = result.hasMore;
          
          if (creations.length === 0) {
            hasMoreData = false;
            break;
          }
          
          allFetchedCreations = [...allFetchedCreations, ...creations];
          offset += batchSize;
          
          if (!hasMore || creations.length < batchSize) {
            hasMoreData = false;
          }
        }
        
        const tagsSet = new Set<string>();
        allFetchedCreations.forEach(creation => {
          if (creation.tags && Array.isArray(creation.tags)) {
            creation.tags.forEach((tag: string) => tagsSet.add(tag));
          }
        });
        setAllTags(Array.from(tagsSet));
        
        setCreations(allFetchedCreations);
        setHasMore(hasMoreData);
        setLastSync(new Date());
        setLoading(false);
      } catch (err) {
        setLoading(false);
        showNotification('error', 'Failed to fetch creations');
      }
    };

    fetchInitialCreations();
  }, []);

  const refreshCreations = async () => {
    setLoading(true);
    setDisplayedCount(100);
    setHasMore(true);
    
    try {
      let allFetchedCreations: Creation[] = [];
      let offset = 0;
      const batchSize = 50;
      let hasMoreData = true;
      
      while (hasMoreData && allFetchedCreations.length < itemsPerBatch) {
        const result = await fetchGeneratedImagesFromSupabase(offset, batchSize);
        const creations = result.creations;
        const hasMore = result.hasMore;
        
        if (creations.length === 0) {
          hasMoreData = false;
          break;
        }
        
        allFetchedCreations = [...allFetchedCreations, ...creations];
        offset += batchSize;
        
        if (!hasMore || creations.length < batchSize) {
          hasMoreData = false;
        }
      }
      
      const tagsSet = new Set<string>();
      allFetchedCreations.forEach(creation => {
        if (creation.tags && Array.isArray(creation.tags)) {
          creation.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
      
      setCreations(allFetchedCreations);
      setHasMore(hasMoreData);
      setLastSync(new Date());
      setLoading(false);
      showNotification('success', 'Creations refreshed successfully');
    } catch (err) {
      setLoading(false);
      showNotification('error', 'Failed to refresh creations');
    }
  };
const handleDeleteAsset = async () => {
  if (!selectedImage) return;
  
  setDeleting(true);
  try {
    // Extract the complete original creation ID from the composite ID
    const idParts = selectedImage.id.split('-');
    const originalId = idParts.slice(0, -2).join('-');
    
    console.log('Deleting asset with ID:', originalId, 'Selected image ID:', selectedImage.id);
    
    // Delete from Supabase database
    const { error } = await supabase
      .from('user_own_creations')
      .delete()
      .eq('id', originalId);

    if (error) {
      throw error;
    }

    console.log('Before deletion - Creations count:', creations.length);
    
    setCreations(prev => {
      const filtered = prev.filter(creation => {
        const creationOriginalId = creation.id.split('-').slice(0, -2).join('-');
        return creationOriginalId !== originalId;
      });
      console.log('After deletion - Creations count:', filtered.length);
      return filtered;
    });
    
    showNotification('success', 'Asset deleted successfully');
    setSelectedImage(null);
    setShowDeleteConfirm(false);
  } catch (error) {
    console.error('Error deleting asset:', error);
    showNotification('error', 'Failed to delete asset');
  } finally {
    setDeleting(false);
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
      
      {selectedImage && (
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
                  
                  {/* DELETE BUTTON - ALWAYS VISIBLE NOW */}
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
            <p className="text-gray-600">Browse and manage your creative works from both formats</p>
            {lastSync && (
              <p className="text-sm text-gray-500 mt-1 flex items-center">
                <Calendar size={14} className="mr-1" />
                Last synced: {formatDate(lastSync.toString())}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={refreshCreations}
              disabled={loading}
            >
              <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
              Refresh
            </button>
            <button 
              className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
              onClick={handleDownloadAll}
            >
              <Download className="mr-2" size={18} />
              Download All
            </button>
          </div>
        </div>
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
            {currentItems.map((creation) => (
              <div 
                key={creation.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer col-span-1"
                onClick={() => setSelectedImage(creation)}
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
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(creation.id);
                      }}
                      title="Download"
                    >
                      <Download size={12} />
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
                </div>
                
                <div className="p-2">
                  {creation.prompt ? (
                    <div className="text-xs text-gray-600 truncate" title={creation.prompt}>
                      {truncatePrompt(creation.prompt, 60)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
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