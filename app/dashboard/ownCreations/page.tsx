'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
  Image,
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
  Tag
} from "lucide-react";

interface Creation {
  id: string;
  title: string;
  generated_images: string;
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
  
  const itemsPerPage = 12;

  const fetchGeneratedImagesFromIndexedDB = async (limit = 100) => {
    try {
      const request = indexedDB.open('egg-store-db');
      
      return new Promise<Creation[]>((resolve) => {
        request.onsuccess = function (event) {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains('users')) {
            resolve([]);
            return;
          }
          
          const transaction = db.transaction(['users'], 'readonly');
          const store = transaction.objectStore('users');
          const getRequest = store.get('allUsers');

          getRequest.onsuccess = function () {
            const result = getRequest.result;
            const allUsers = result?.value || result;

            if (Array.isArray(allUsers)) {
              const collectedCreations: Creation[] = [];
              let count = 0;

              for (const user of allUsers) {
                if (count >= limit) break;
                
                if (user.generated_images) {
                  try {
                    let generatedImages = user.generated_images;
                    
                    if (typeof generatedImages === 'string') {
                      generatedImages = JSON.parse(generatedImages);
                    }
                    
                    if (Array.isArray(generatedImages)) {
                      for (const img of generatedImages) {
                        if (count >= limit) break;
                        
                        let imageUrl = '';
                        if (typeof img === 'object' && img.url) {
                          imageUrl = img.url;
                        } else if (typeof img === 'string') {
                          imageUrl = img;
                        }
                        
                        if (imageUrl) {
                          const title = img.prompt || `Creation ${count + 1}`;
                          const createdAt = img.timestamp || new Date().toISOString();
                          
                          collectedCreations.push({
                            id: `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            title: title,
                            generated_images: imageUrl,
                            creator_id: user.id || 'unknown',
                            creator: {
                              id: user.id || 'unknown',
                              name: user.name || user.email || 'Unknown Creator',
                              avatar_url: user.avatar_url || null
                            },
                            tags: [],
                            likes: 0,
                            downloads: 0,
                            created_at: createdAt,
                            updated_at: createdAt
                          });
                          
                          count++;
                        }
                      }
                    }
                  } catch (error) {
                    if (typeof user.generated_images === 'string') {
                      collectedCreations.push({
                        id: `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: `Creation ${count + 1}`,
                        generated_images: user.generated_images,
                        creator_id: user.id || 'unknown',
                        creator: {
                          id: user.id || 'unknown',
                          name: user.name || user.email || 'Unknown Creator',
                          avatar_url: user.avatar_url || null
                        },
                        tags: [],
                        likes: 0,
                        downloads: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      });
                      
                      count++;
                    }
                  }
                }
              }

              resolve(collectedCreations);
            } else {
              resolve([]);
            }
          };

          getRequest.onerror = function () {
            resolve([]);
          };
        };

        request.onerror = function () {
          resolve([]);
        };
      });
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    const fetchAllCreations = async () => {
      try {
        setLoading(true);
        
        const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
        
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
      const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
      
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
    return creations.filter(creation => {
      const title = creation.title || '';
      const tags = Array.isArray(creation.tags) ? creation.tags : [];
      
      const matchesSearch = 
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = 
        tagFilter === 'all' || 
        tags.includes(tagFilter);

      return matchesSearch && matchesTag;
    });
  }, [creations, searchQuery, tagFilter]);
  
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
        c.id === creationId ? { ...c, downloads: c.downloads + 1 } : c
      ));
      
      fetch(creation.generated_images)
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
      
      setCreations(prev => prev.map(c => ({ ...c, downloads: c.downloads + 1 })));
      
      for (let i = 0; i < creations.length; i++) {
        const creation = creations[i];
        
        try {
          const response = await fetch(creation.generated_images);
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
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
              <Image className="text-[#e6d281] mr-2" size={24} />
              My Creations
            </h1>
            <p className="text-gray-600">Browse and manage your creative works</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={16} />
            </div>
            <input
              type="text"
              placeholder="Search creations..."
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
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <Image className="text-gray-300 mb-4" size={32} />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <p className="text-sm text-gray-500">Loading creations...</p>
          </div>
        </div>
      ) : filteredCreations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Image className="mx-auto text-gray-400 mb-4" size={40} />
          <h3 className="text-lg font-medium text-gray-900">No creations found</h3>
          <p className="mt-1 text-gray-500">
            {searchQuery ? 'Try a different search term' : 'Add some creations to get started'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
            {currentItems.map((creation) => (
              <div 
                key={creation.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative">
                  <img 
                    src={creation.generated_images} 
                    alt={creation.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0VFRUVFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbxlIiBmb250LXNpemU9IjIwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                    }}
                    loading="lazy"
                  />
                  <div className="absolute top-2 right-2">
                    <button 
                      className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                      onClick={() => handleDownload(creation.id)}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                    </div>
                  </div>
                  
                  {creation.tags && creation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {creation.tags.slice(0, 3).map((tag, index) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {creation.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{creation.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
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