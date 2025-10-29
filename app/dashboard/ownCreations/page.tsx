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
  Layers
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
  const [currentPage, setCurrentPage] = useState(1);
  const [tagFilter, setTagFilter] = useState('all');
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [showPrompt, setShowPrompt] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'image_url' | 'generated_images'>('all');
  
  const itemsPerPage = 20;

  const fetchGeneratedImagesFromSupabase = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('user_own_creations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      console.log("🚀 ~ fetchGeneratedImagesFromSupabase ~ data:", data);

      if (error) {
        console.error('Error fetching user_own_creations:', error);
        return [];
      }

      if (!data || !Array.isArray(data)) {
        return [];
      }

      const collectedCreations: Creation[] = [];

      for (const creation of data) {
        const isGuest = !creation.user_uid || creation.user_uid === null;
        const creationId = creation.id;
        
        console.log(`Processing creation ${creationId}:`, {
          has_image_url: !!creation.image_url,
          has_generated_images: !!creation.generated_images,
          image_url_type: typeof creation.image_url,
          generated_images_type: typeof creation.generated_images
        });

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
                console.error('Error parsing image_url as JSON:', e);

                if (creation.image_url.startsWith('http') || creation.image_url.startsWith('data:')) {
                  imageUrls = [creation.image_url];
                }
              }
            } else if (Array.isArray(creation.image_url)) {
              imageUrls = creation.image_url.filter((url: string) => typeof url === 'string' && url.length > 0);
            }

            console.log(`Found ${imageUrls.length} images in image_url for creation ${creationId}`);

            imageUrls.forEach((imageUrl: string, index: number) => {
              if (imageUrl && typeof imageUrl === 'string') {
                collectedCreations.push({
                  id: `${creationId}-image_url-${index}`,
                  title: `Image ${creationId.slice(0, 8)}-${index + 1}`,
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
                console.error('Error parsing generated_images as JSON:', e);
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

            console.log(`Found ${generatedImagesData.length} images in generated_images for creation ${creationId}`);
            generatedImagesData.forEach((imgData: any, index: number) => {
              const imageUrl = imgData.url || imgData.image_url;
              const prompt = imgData.prompt || `Generated image ${index + 1}`;
              
              if (imageUrl && typeof imageUrl === 'string') {
                collectedCreations.push({
                  id: `${creationId}-generated_images-${index}`,
                  title: `Design ${creationId.slice(0, 8)}-${index + 1}`,
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

      console.log(`Total creations collected: ${collectedCreations.length}`);
      return collectedCreations;
    } catch (error) {
      console.error('Error in fetchGeneratedImagesFromSupabase:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllCreations = async () => {
      try {
        setLoading(true);
        
        const allCreations = await fetchGeneratedImagesFromSupabase(100);
        
        const tagsSet = new Set<string>();
        allCreations.forEach(creation => {
          if (creation.tags && Array.isArray(creation.tags)) {
            creation.tags.forEach((tag: string) => tagsSet.add(tag));
          }
        });
        setAllTags(Array.from(tagsSet));
        
        setCreations(allCreations);
        setLastSync(new Date());
        setLoading(false);
        
        // Log statistics
        const imageUrlCount = allCreations.filter(c => c.source === 'image_url').length;
        const generatedImagesCount = allCreations.filter(c => c.source === 'generated_images').length;
        console.log(`Source statistics: image_url=${imageUrlCount}, generated_images=${generatedImagesCount}`);
      } catch (err) {
        setLoading(false);
        showNotification('error', 'Failed to fetch creations');
      }
    };

    fetchAllCreations();
  }, []);

  const refreshCreations = async () => {
    setLoading(true);
    
    try {
      const allCreations = await fetchGeneratedImagesFromSupabase(100);
      
      const tagsSet = new Set<string>();
      allCreations.forEach(creation => {
        if (creation.tags && Array.isArray(creation.tags)) {
          creation.tags.forEach((tag: string) => tagsSet.add(tag));
        }
      });
      setAllTags(Array.from(tagsSet));
      
      setCreations(allCreations);
      setLastSync(new Date());
      setLoading(false);
      showNotification('success', 'Creations refreshed successfully');
    } catch (err) {
      setLoading(false);
      showNotification('error', 'Failed to refresh creations');
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
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCreations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCreations.length / itemsPerPage);
  
  const showNotification = (type: string, message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
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

  const handleImageStartLoading = (creationId: string) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [creationId]: true
    }));
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const hasValidPrompt = (creation: Creation) => {
    return creation.source === 'generated_images' && creation.prompt && creation.prompt.trim().length > 0;
  };

  // Safe Image Component with Next.js Image
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
      {showPrompt && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Prompt</h3>
              <button 
                onClick={() => setShowPrompt(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{showPrompt}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={() => setShowPrompt(null)}
                className="px-4 py-2 bg-[#e6d281] text-gray-800 rounded-lg hover:bg-[#d4c070] transition-colors"
              >
                Close
              </button>
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
                setCurrentPage(1);
              }}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Layers className="text-gray-400" size={16} />
            </div>
            <select
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value as 'all' | 'image_url' | 'generated_images');
                setCurrentPage(1);
              }}
            >
              <option value="all">All Sources</option>
              <option value="image_url">Image URL Format</option>
              <option value="generated_images">Generated Images Format</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 mb-6">
            {currentItems.map((creation) => (
              <div 
                key={creation.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative aspect-square">
                  <SafeImage
                    src={creation.image_url}
                    alt={creation.title}
                    className="object-cover"
                  />
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                      onClick={() => handleDownload(creation.id)}
                      title="Download"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                  
                  {/* Show prompt button only for generated_images format */}
                  {hasValidPrompt(creation) && (
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                        onClick={() => setShowPrompt(creation.prompt)}
                        title="View Prompt"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="p-2">
                  <div className="text-xs text-gray-500 truncate" title={creation.title}>
                    {creation.title}
                  </div>
                  
                  {/* Show prompt only for generated_images format */}
                  {hasValidPrompt(creation) && (
                    <div 
                      className="text-xs text-gray-600 mt-1 cursor-pointer hover:text-blue-600 truncate"
                      title="Click to view full prompt"
                      onClick={() => setShowPrompt(creation.prompt)}
                    >
                      {truncatePrompt(creation.prompt)}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(creation.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredCreations.length)}</span> of{' '}
                    <span className="font-medium">{filteredCreations.length}</span> creations
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-[#e6d281] border-[#e6d281] text-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OwnCreations;
