// 'use client'
// import React, { useState, useEffect, useMemo } from 'react';
// import {
//   Image,
//   Plus,
//   Trash2,
//   Search,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   Heart,
//   Download,
//   Eye,
//   Calendar,
//   User,
//   Tag,
//   Loader2,
//   CheckCircle,
//   RefreshCw,
//   XCircle,
//   AlertCircle
// } from "lucide-react";

// interface Creation {
//   id: string;
//   title: string;
  
//   image_url: string;
//   creator_id: string;
//   creator: {
//     id: string;
//     name: string | null;
//     avatar_url: string | null;
//   };
//   tags: string[];
//   likes: number;
//   downloads: number;
//   views: number;
//   created_at: string;
//   updated_at: string;
// }

// const OwnCreations = () => {
//   const [creations, setCreations] = useState<Creation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedCreations, setSelectedCreations] = useState<string[]>([]);
//   const [tagFilter, setTagFilter] = useState('all');
//   const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
//   const [lastSync, setLastSync] = useState<Date | null>(null);
//   const [allTags, setAllTags] = useState<string[]>([]);
//   const [sampleSize, setSampleSize] = useState(100); // Only show a sample of the data
  
//   const itemsPerPage = 12;

//   // Function to fetch a limited number of generated_images from IndexedDB
//   const fetchGeneratedImagesFromIndexedDB = async (limit = 100) => {
//     try {
//       const request = indexedDB.open('egg-store-db');
      
//       return new Promise<Creation[]>((resolve) => {
//         request.onsuccess = function (event) {
//           const db = (event.target as IDBOpenDBRequest).result;
          
//           // Check if the database has the object store
//           if (!db.objectStoreNames.contains('users')) {
//             console.warn("No 'users' store found in IndexedDB");
//             resolve([]);
//             return;
//           }
          
//           const transaction = db.transaction(['users'], 'readonly');
//           const store = transaction.objectStore('users');
//           const getRequest = store.get('allUsers');

//           getRequest.onsuccess = function () {
//             const result = getRequest.result;
//             const allUsers = result?.value || result;

//             if (Array.isArray(allUsers)) {
//               const collectedCreations: Creation[] = [];
//               let count = 0;

//               // Process users until we reach the limit
//               for (const user of allUsers) {
//                 if (count >= limit) break;
                
//                 if (user.generated_images) {
//                   try {
//                     const parsedImages = JSON.parse(user.generated_images);
//                     if (Array.isArray(parsedImages)) {
//                       // Transform the data to match the Creation interface
//                       for (const img of parsedImages) {
//                         if (count >= limit) break;
                        
//                         collectedCreations.push({
//                           id: `${user.id}-${count}`,
//                           title: img.title || `Creation ${count + 1}`,
                       
//                           image_url: img.url,
//                           creator_id: user.id || 'unknown',
//                           creator: {
//                             id: user.id || 'unknown',
//                             name: user.name || user.email || 'Unknown Creator',
//                             avatar_url: user.avatar_url || null
//                           },
//                           tags: img.tags || [],
//                           likes: img.likes || 0,
//                           downloads: img.downloads || 0,
//                           views: img.views || 0,
//                           created_at: img.created_at || new Date().toISOString(),
//                           updated_at: img.updated_at || new Date().toISOString()
//                         });
                        
//                         count++;
//                       }
//                     }
//                   } catch (error) {
//                     console.error(`Error parsing images for user ${user.id}:`, error);
//                   }
//                 }
//               }

//               console.log("Collected sample of creations:", collectedCreations.length);
//               resolve(collectedCreations);
//             } else {
//               console.warn("No valid users array found in IndexedDB.");
//               resolve([]);
//             }
//           };

//           getRequest.onerror = function () {
//             console.error('Failed to get users from IndexedDB.');
//             resolve([]);
//           };
//         };

//         request.onerror = function () {
//           console.error('Failed to open IndexedDB.');
//           resolve([]);
//         };
//       });
//     } catch (error) {
//       console.error("Error fetching from IndexedDB:", error);
//       return [];
//     }
//   };

//   useEffect(() => {
//     const fetchAllCreations = async () => {
//       try {
//         console.log("Starting fetchAllCreations from IndexedDB");
//         setLoading(true);
        
//         // Only fetch a sample of the data (100 items)
//         const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
//         console.log("IndexedDB sample data found:", allCreations.length, "items");
        
//         // Extract all unique tags
//         const tagsSet = new Set<string>();
//         allCreations.forEach(creation => {
//           if (creation.tags && Array.isArray(creation.tags)) {
//             creation.tags.forEach((tag: string) => tagsSet.add(tag));
//           }
//         });
//         setAllTags(Array.from(tagsSet));
        
//         setCreations(allCreations);
//         setLastSync(new Date());
//         setLoading(false);
//         console.log("Fetch completed successfully");
//       } catch (err) {
//         console.error("Unexpected error in fetchAllCreations:", err);
//         setLoading(false);
//         showNotification('error', 'Failed to fetch creations');
//       }
//     };

//     fetchAllCreations();
//   }, []);

//   const refreshCreations = async () => {
//     console.log("Manual refresh triggered");
//     setLoading(true);
    
//     try {
//       const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
//       console.log("Refresh successful, items:", allCreations.length);
      
//       // Extract all unique tags
//       const tagsSet = new Set<string>();
//       allCreations.forEach(creation => {
//         if (creation.tags && Array.isArray(creation.tags)) {
//           creation.tags.forEach((tag: string) => tagsSet.add(tag));
//         }
//       });
//       setAllTags(Array.from(tagsSet));
      
//       setCreations(allCreations);
//       setLastSync(new Date());
//       setLoading(false);
//       console.log("Refresh completed");
//       showNotification('success', 'Creations refreshed successfully');
//     } catch (err) {
//       console.error("Unexpected error in refresh:", err);
//       setLoading(false);
//       showNotification('error', 'Failed to refresh creations');
//     }
//   };

//   const filteredCreations = useMemo(() => {
//     return creations.filter(creation => {
//       // Ensure all properties exist with fallback values
//       const title = creation.title || '';
      
//       const tags = Array.isArray(creation.tags) ? creation.tags : [];
      
//       const matchesSearch = 
//         title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        
//         tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
//       const matchesTag = 
//         tagFilter === 'all' || 
//         tags.includes(tagFilter);

//       return matchesSearch && matchesTag;
//     });
//   }, [creations, searchQuery, tagFilter]);
  
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredCreations.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredCreations.length / itemsPerPage);
  
//   const showNotification = (type: string, message: string) => {
//     setNotification({ type, message });
//     setTimeout(() => setNotification(null), 5000);
//   };

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//   };

//   const handleDeleteCreation = async (creationId: string) => {
//     if (!confirm('Are you sure you want to delete this creation?')) {
//       return;
//     }
    
//     try {
//       // In a real implementation, you would update IndexedDB here
//       setCreations(prev => prev.filter(creation => creation.id !== creationId));
//       setSelectedCreations(prev => prev.filter(id => id !== creationId));
//       showNotification('success', 'Creation deleted successfully');
//     } catch (error) {
//       showNotification('error', 'Failed to delete creation');
//     }
//   };

//   const handleBulkDelete = async () => {
//     if (!confirm(`Are you sure you want to delete ${selectedCreations.length} creations?`)) {
//       return;
//     }
    
//     try {
//       // In a real implementation, you would update IndexedDB here
//       setCreations(prev => prev.filter(creation => !selectedCreations.includes(creation.id)));
//       setSelectedCreations([]);
//       showNotification('success', `Successfully deleted ${selectedCreations.length} creations`);
//     } catch (error) {
//       showNotification('error', 'Error during bulk delete operation');
//     }
//   };

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   const handleLike = async (creationId: string) => {
//     try {
//       // In a real implementation, you would update IndexedDB here
//       setCreations(prev => prev.map(c => 
//         c.id === creationId ? { ...c, likes: c.likes + 1 } : c
//       ));
//       showNotification('success', 'Creation liked');
//     } catch (error) {
//       showNotification('error', 'Failed to like creation');
//     }
//   };

//   const handleDownload = async (creationId: string) => {
//     try {
//       const creation = creations.find(c => c.id === creationId);
//       if (!creation) return;
      
//       // Update download count
//       setCreations(prev => prev.map(c => 
//         c.id === creationId ? { ...c, downloads: c.downloads + 1 } : c
//       ));
      
//       // Actual download logic
//       fetch(creation.image_url)
//         .then(res => res.blob())
//         .then(blob => {
//           const a = document.createElement('a');
//           a.href = URL.createObjectURL(blob);
//           a.download = `creation-${creation.title || creation.id}.png`;
//           a.click();
//         })
//         .catch(err => console.error("Download failed:", err));
      
//       showNotification('success', 'Download started');
//     } catch (error) {
//       showNotification('error', 'Failed to download creation');
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {/* Notification Banner */}
//       {notification && (
//         <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
//           notification.type === 'success' ? 'bg-green-100 text-green-800' :
//           notification.type === 'error' ? 'bg-red-100 text-red-800' :
//           'bg-yellow-100 text-yellow-800'
//         }`}>
//           {notification.type === 'success' ? (
//             <CheckCircle className="mr-2" size={20} />
//           ) : notification.type === 'error' ? (
//             <XCircle className="mr-2" size={20} />
//           ) : (
//             <AlertCircle className="mr-2" size={20} />
//           )}
//           <span>{notification.message}</span>
//           <button 
//             onClick={() => setNotification(null)}
//             className="ml-4 text-gray-500 hover:text-gray-700"
//           >
//             <XCircle size={20} />
//           </button>
//         </div>
//       )}
      
//       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//           <div>
//             <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 flex items-center">
//               <Image className="text-[#e6d281] mr-2" size={24} />
//               Own Creations
//             </h1>
//             <p className="text-gray-600">Browse and manage your creative works</p>
//             {lastSync && (
//               <p className="text-sm text-gray-500 mt-1 flex items-center">
//                 <Calendar size={14} className="mr-1" />
//                 Last synced: {formatDate(lastSync.toString())}
//               </p>
//             )}
//           </div>
//           <div className="flex gap-3">
//             <button 
//               className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
//               onClick={refreshCreations}
//               disabled={loading}
//             >
//               <RefreshCw className={loading ? "animate-spin" : ""} size={18} />
//               Refresh
//             </button>
//             <button 
//               className="px-4 py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center"
//               onClick={() => {/* Add creation modal would go here */}}
//             >
//               <Plus className="mr-2" size={18} />
//               Add Creation
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="text-gray-400" size={16} />
//             </div>
//             <input
//               type="text"
//               placeholder="Search creations..."
//               className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1);
//               }}
//             />
//           </div>
          
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Tag className="text-gray-400" size={16} />
//             </div>
//             <select
//               className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
//               value={tagFilter}
//               onChange={(e) => {
//                 setTagFilter(e.target.value);
//                 setCurrentPage(1);
//               }}
//             >
//               <option value="all">All Tags</option>
//               {allTags.map((tag) => (
//                 <option key={tag} value={tag}>{tag}</option>
//               ))}
//             </select>
//             <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
//           </div>
          
//           {selectedCreations.length > 0 && (
//             <div className="flex items-center gap-2">
//               <span className="text-sm font-medium">{selectedCreations.length} selected</span>
//               <button 
//                 className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md text-sm font-medium flex items-center hover:bg-red-200"
//                 onClick={handleBulkDelete}
//               >
//                 <Trash2 className="mr-1" size={14} />
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {loading ? (
//         <div className="bg-white rounded-lg shadow-md p-8 text-center">
//           <div className="animate-pulse flex flex-col items-center">
//             <Image className="text-gray-300 mb-4" size={32} />
//             <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//             <p className="text-sm text-gray-500">Loading creations...</p>
//           </div>
//         </div>
//       ) : filteredCreations.length === 0 ? (
//         <div className="bg-white rounded-lg shadow-md p-8 text-center">
//           <Image className="mx-auto text-gray-400 mb-4" size={40} />
//           <h3 className="text-lg font-medium text-gray-900">No creations found</h3>
//           <p className="mt-1 text-gray-500">
//             {searchQuery ? 'Try a different search term' : 'Add some creations to get started'}
//           </p>
//         </div>
//       ) : (
//         <>
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
//             {currentItems.map((creation) => (
//               <div 
//                 key={creation.id} 
//                 className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
//                   selectedCreations.includes(creation.id) ? 'ring-2 ring-[#e6d281]' : ''
//                 }`}
//               >
//                 <div className="relative">
//                   <img 
//                     src={creation.image_url} 
//                     alt={creation.title}
//                     className="w-full h-48 object-cover"
//                     onError={(e) => {
//                       // Fallback for broken images
//                       (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0VFRUVFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
//                     }}
//                   />
//                   <input
//                     type="checkbox"
//                     className="absolute top-2 left-2 h-5 w-5 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
//                     checked={selectedCreations.includes(creation.id)}
//                     onChange={(e) => {
//                       if (e.target.checked) {
//                         setSelectedCreations([...selectedCreations, creation.id]);
//                       } else {
//                         setSelectedCreations(selectedCreations.filter(id => id !== creation.id));
//                       }
//                     }}
//                   />
//                   <div className="absolute top-2 right-2 flex gap-1">
//                     <button 
//                       className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500"
//                       onClick={() => handleLike(creation.id)}
//                     >
//                       <Heart size={16} fill={creation.likes > 0 ? "currentColor" : "none"} />
//                     </button>
//                     <button 
//                       className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
//                       onClick={() => handleDownload(creation.id)}
//                     >
//                       <Download size={16} />
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="p-4">
//                   <h3 className="font-semibold text-lg mb-1 truncate">{creation.title || 'Untitled'}</h3>
                  
//                   <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
//                     <div className="flex items-center">
//                       {creation.creator?.avatar_url ? (
//                         <img 
//                           src={creation.creator.avatar_url} 
//                           alt={creation.creator.name || 'User'} 
//                           className="w-5 h-5 rounded-full mr-2"
//                           onError={(e) => {
//                             // Fallback for broken avatars
//                             (e.target as HTMLImageElement).style.display = 'none';
//                           }}
//                         />
//                       ) : (
//                         <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-2">
//                           <User size={12} className="text-gray-500" />
//                         </div>
//                       )}
//                       <span>{creation.creator?.name || 'Unknown'}</span>
//                     </div>
//                     <span>{formatDate(creation.created_at)}</span>
//                   </div>
                  
//                   {creation.tags && creation.tags.length > 0 && (
//                     <div className="flex flex-wrap gap-1 mb-4">
//                       {creation.tags.slice(0, 3).map((tag, index) => (
//                         <span 
//                           key={index} 
//                           className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
//                         >
//                           {tag}
//                         </span>
//                       ))}
//                       {creation.tags.length > 3 && (
//                         <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
//                           +{creation.tags.length - 3}
//                         </span>
//                       )}
//                     </div>
//                   )}
                  
//                   <div className="flex justify-between items-center text-sm text-gray-500">
//                     <div className="flex items-center space-x-4">
//                       <span className="flex items-center">
//                         <Heart size={14} className="mr-1" />
//                         {creation.likes}
//                       </span>
//                       <span className="flex items-center">
//                         <Download size={14} className="mr-1" />
//                         {creation.downloads}
//                       </span>
//                       <span className="flex items-center">
//                         <Eye size={14} className="mr-1" />
//                         {creation.views}
//                       </span>
//                     </div>
                    
//                     <div className="flex items-center space-x-2">
//                       <button 
//                         className="text-gray-500 hover:text-red-500"
//                         onClick={() => handleDeleteCreation(creation.id)}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
          
//           {totalPages > 1 && (
//             <div className="bg-white rounded-lg shadow-md px-4 py-3 flex items-center justify-between">
//               <div className="flex-1 flex justify-between sm:hidden">
//                 <button
//                   onClick={() => handlePageChange(currentPage - 1)}
//                   disabled={currentPage === 1}
//                   className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Previous
//                 </button>
//                 <button
//                   onClick={() => handlePageChange(currentPage + 1)}
//                   disabled={currentPage === totalPages}
//                   className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </div>
//               <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                 <div>
//                   <p className="text-sm text-gray-700">
//                     Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
//                     <span className="font-medium">{Math.min(indexOfLastItem, filteredCreations.length)}</span> of{' '}
//                     <span className="font-medium">{filteredCreations.length}</span> creations
//                   </p>
//                 </div>
//                 <div>
//                   <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//                     <button
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1}
//                       className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//                     >
//                       <span className="sr-only">Previous</span>
//                       <ChevronLeft className="h-5 w-5" aria-hidden="true" />
//                     </button>
//                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                       let pageNum;
//                       if (totalPages <= 5) {
//                         pageNum = i + 1;
//                       } else if (currentPage <= 3) {
//                         pageNum = i + 1;
//                       } else if (currentPage >= totalPages - 2) {
//                         pageNum = totalPages - 4 + i;
//                       } else {
//                         pageNum = currentPage - 2 + i;
//                       }
                      
//                       return (
//                         <button
//                           key={pageNum}
//                           onClick={() => handlePageChange(pageNum)}
//                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-[#e6d281] border-[#e6d281] text-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
//                         >
//                           {pageNum}
//                         </button>
//                       );
//                     })}
//                     <button
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={currentPage === totalPages}
//                       className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
//                     >
//                       <span className="sr-only">Next</span>
//                       <ChevronRight className="h-5 w-5" aria-hidden="true" />
//                     </button>
//                   </nav>
//                 </div>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default OwnCreations;



'use client'
import React, { useState, useEffect, useMemo } from 'react';
import {
  Image,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Eye,
  Calendar,
  User,
  Tag,
  Loader2,
  CheckCircle,
  RefreshCw,
  XCircle,
  AlertCircle
} from "lucide-react";

interface Creation {
  id: string;
  title: string;
  image_url: string;
  creator_id: string;
  creator: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  tags: string[];
  likes: number;
  downloads: number;
  views: number;
  created_at: string;
  updated_at: string;
}

const OwnCreations = () => {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCreations, setSelectedCreations] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState('all');
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  
  const itemsPerPage = 12;

  // Function to fetch a limited number of generated_images from IndexedDB
  const fetchGeneratedImagesFromIndexedDB = async (limit = 100) => {
    try {
      const request = indexedDB.open('egg-store-db');
      
      return new Promise<Creation[]>((resolve) => {
        request.onsuccess = function (event) {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Check if the database has the object store
          if (!db.objectStoreNames.contains('users')) {
            console.warn("No 'users' store found in IndexedDB");
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

              // Process users until we reach the limit
              for (const user of allUsers) {
                if (count >= limit) break;
                
                if (user.generated_images) {
                  try {
                    const parsedImages = JSON.parse(user.generated_images);
                    if (Array.isArray(parsedImages)) {
                      // Transform the data to match the Creation interface
                      for (const img of parsedImages) {
                        if (count >= limit) break;
                        
                        // Generate a unique ID for each creation
                        const uniqueId = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        
                        collectedCreations.push({
                          id: uniqueId,
                          title: img.title || `Creation ${count + 1}`,
                          image_url: img.url,
                          creator_id: user.id || 'unknown',
                          creator: {
                            id: user.id || 'unknown',
                            name: user.name || user.email || 'Unknown Creator',
                            avatar_url: user.avatar_url || null
                          },
                          tags: img.tags || [],
                          likes: img.likes || 0,
                          downloads: img.downloads || 0,
                          views: img.views || 0,
                          created_at: img.created_at || new Date().toISOString(),
                          updated_at: img.updated_at || new Date().toISOString()
                        });
                        
                        count++;
                      }
                    }
                  } catch (error) {
                    console.error(`Error parsing images for user ${user.id}:`, error);
                  }
                }
              }

              console.log("Collected sample of creations:", collectedCreations.length);
              resolve(collectedCreations);
            } else {
              console.warn("No valid users array found in IndexedDB.");
              resolve([]);
            }
          };

          getRequest.onerror = function () {
            console.error('Failed to get users from IndexedDB.');
            resolve([]);
          };
        };

        request.onerror = function () {
          console.error('Failed to open IndexedDB.');
          resolve([]);
        };
      });
    } catch (error) {
      console.error("Error fetching from IndexedDB:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchAllCreations = async () => {
      try {
        console.log("Starting fetchAllCreations from IndexedDB");
        setLoading(true);
        
        // Only fetch a sample of the data (100 items)
        const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
        console.log("IndexedDB sample data found:", allCreations.length, "items");
        
        // Extract all unique tags
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
        console.log("Fetch completed successfully");
      } catch (err) {
        console.error("Unexpected error in fetchAllCreations:", err);
        setLoading(false);
        showNotification('error', 'Failed to fetch creations');
      }
    };

    fetchAllCreations();
  }, []);

  const refreshCreations = async () => {
    console.log("Manual refresh triggered");
    setLoading(true);
    
    try {
      const allCreations = await fetchGeneratedImagesFromIndexedDB(100);
      console.log("Refresh successful, items:", allCreations.length);
      
      // Extract all unique tags
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
      console.log("Refresh completed");
      showNotification('success', 'Creations refreshed successfully');
    } catch (err) {
      console.error("Unexpected error in refresh:", err);
      setLoading(false);
      showNotification('error', 'Failed to refresh creations');
    }
  };

  const filteredCreations = useMemo(() => {
    return creations.filter(creation => {
      // Ensure all properties exist with fallback values
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

  const handleDeleteCreation = async (creationId: string) => {
    if (!confirm('Are you sure you want to delete this creation?')) {
      return;
    }
    
    try {
      setCreations(prev => prev.filter(creation => creation.id !== creationId));
      setSelectedCreations(prev => prev.filter(id => id !== creationId));
      showNotification('success', 'Creation deleted successfully');
    } catch (error) {
      showNotification('error', 'Failed to delete creation');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCreations.length} creations?`)) {
      return;
    }
    
    try {
      setCreations(prev => prev.filter(creation => !selectedCreations.includes(creation.id)));
      setSelectedCreations([]);
      showNotification('success', `Successfully deleted ${selectedCreations.length} creations`);
    } catch (error) {
      showNotification('error', 'Error during bulk delete operation');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLike = async (creationId: string) => {
    try {
      setCreations(prev => prev.map(c => 
        c.id === creationId ? { ...c, likes: c.likes + 1 } : c
      ));
      showNotification('success', 'Creation liked');
    } catch (error) {
      showNotification('error', 'Failed to like creation');
    }
  };

  const handleDownload = async (creationId: string) => {
    try {
      const creation = creations.find(c => c.id === creationId);
      if (!creation) return;
      
      // Update download count
      setCreations(prev => prev.map(c => 
        c.id === creationId ? { ...c, downloads: c.downloads + 1 } : c
      ));
      
      // Actual download logic
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Notification Banner */}
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
              Own Creations
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
              onClick={() => {/* Add creation modal would go here */}}
            >
              <Plus className="mr-2" size={18} />
              Add Creation
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
          
          {selectedCreations.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedCreations.length} selected</span>
              <button 
                className="px-3 py-1.5 bg-red-100 text-red-600 rounded-md text-sm font-medium flex items-center hover:bg-red-200"
                onClick={handleBulkDelete}
              >
                <Trash2 className="mr-1" size={14} />
                Delete
              </button>
            </div>
          )}
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
                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${
                  selectedCreations.includes(creation.id) ? 'ring-2 ring-[#e6d281]' : ''
                }`}
              >
                <div className="relative">
                  <img 
                    src={creation.image_url} 
                    alt={creation.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback for broken images
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0VFRUVFRSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeT0iLjM1ZW0iIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                    loading="lazy"
                  />
                  <input
                    type="checkbox"
                    className="absolute top-2 left-2 h-5 w-5 text-[#e6d281] focus:ring-[#e6d281] border-gray-300 rounded"
                    checked={selectedCreations.includes(creation.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCreations([...selectedCreations, creation.id]);
                      } else {
                        setSelectedCreations(selectedCreations.filter(id => id !== creation.id));
                      }
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button 
                      className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-red-500"
                      onClick={() => handleLike(creation.id)}
                    >
                      <Heart size={16} fill={creation.likes > 0 ? "currentColor" : "none"} />
                    </button>
                    <button 
                      className="p-1.5 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-500"
                      onClick={() => handleDownload(creation.id)}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{creation.title || 'Untitled'}</h3>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      {creation.creator?.avatar_url ? (
                        <img 
                          src={creation.creator.avatar_url} 
                          alt={creation.creator.name || 'User'} 
                          className="w-5 h-5 rounded-full mr-2"
                          onError={(e) => {
                            // Fallback for broken avatars
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          <User size={12} className="text-gray-500" />
                        </div>
                      )}
                      <span>{creation.creator?.name || 'Unknown'}</span>
                    </div>
                    <span>{formatDate(creation.created_at)}</span>
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
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Heart size={14} className="mr-1" />
                        {creation.likes}
                      </span>
                      <span className="flex items-center">
                        <Download size={14} className="mr-1" />
                        {creation.downloads}
                      </span>
                      <span className="flex items-center">
                        <Eye size={14} className="mr-1" />
                        {creation.views}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-gray-500 hover:text-red-500"
                        onClick={() => handleDeleteCreation(creation.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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