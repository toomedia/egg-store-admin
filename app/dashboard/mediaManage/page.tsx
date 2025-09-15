// "use client"
// import React, { useState, useEffect } from 'react';
// import { supabase } from "../../../utils/supabaseClient";
// import {
//   Image as ImageIcon,
//   Video,
//   Folder,
//   Upload,
//   Search,
//   Filter,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   Grid,
//   List,
//   Trash2,
//   Download,
//   Share2,
//   MoreVertical,
//   Plus,
//   X,
//   Star,
//   CheckCircle,
//   RotateCw,
//   File
// } from "lucide-react";

// const MediaManager = () => {
//   const [media, setMedia] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [viewMode, setViewMode] = useState('grid');
//   const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
//   const [currentFolder, setCurrentFolder] = useState('All Media');
//   const [uploadProgress, setUploadProgress] = useState<any>(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 12;

//   const folders = ['All Media', 'Images', 'Videos', 'Documents', 'Archived'];
//   const fileTypes = {
//     image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
//     video: ['mp4', 'mov', 'avi', 'mkv'],
//     document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
//   };

//   useEffect(() => {
//     const fetchMedia = async () => {
//       setLoading(true);
//       try {
//         const { data, error } = await supabase
//           .from('media')
//           .select('*')
//           .order('created_at', { ascending: false });

//         if (error) throw error;
//         setMedia(data);
//       } catch (error) {
//         console.error('Error fetching media:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMedia();
//   }, []);

//   const filteredMedia = media.filter(item => {
//     const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
//     const matchesFolder = 
//       currentFolder === 'All Media' || 
//       (currentFolder === 'Images' && fileTypes.image.includes(item.type)) ||
//       (currentFolder === 'Videos' && fileTypes.video.includes(item.type)) ||
//       (currentFolder === 'Documents' && fileTypes.document.includes(item.type)) ||
//       (currentFolder === 'Archived' && item.archived);

//     return matchesSearch && matchesFolder;
//   });

//   // Pagination logic
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredMedia.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);

//   const handlePageChange = (pageNumber: number) => {
//     setCurrentPage(pageNumber);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i];
//       const fileExt = file.name.split('.').pop();
//       const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
//       const filePath = `media/${fileName}`;

//       try {
//         setUploadProgress({ fileName, progress: 0 });

//         const { error } = await supabase.storage
//           .from('media')
//           .upload(filePath, file, {
//             cacheControl: '3600',
//             upsert: false
//           });

//         if (error) throw error;
//         const { data: publicUrlData } = supabase.storage
//           .from('media')
//           .getPublicUrl(filePath);
//         const { data, error: dbError } = await supabase
//           .from('media')
//           .insert({
//             name: file.name,
//             url: publicUrlData.publicUrl,
//             type: fileExt,
//             size: file.size,
//             folder: currentFolder === 'All Media' ? null : currentFolder
//           })
//           .select()
//           .single();

//         if (dbError) throw dbError;

//         setMedia(prev => [data, ...prev]);
//         setCurrentPage(1); 
//       } catch (error) {
//         console.error('Error uploading file:', error);
//       } finally {
//         setTimeout(() => setUploadProgress(null), 2000);
//       }
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this item?')) return;
    
//     try {
//       const itemToDelete = media.find(item => item.id === id);
//       if (!itemToDelete) return;
//       const filePath = itemToDelete.url.split('/').pop();
//       const { error: storageError } = await supabase.storage
//         .from('media')
//         .remove([filePath]);

//       if (storageError) throw storageError;

//       const { error: dbError } = await supabase
//         .from('media')
//         .delete()
//         .eq('id', id);

//       if (dbError) throw dbError;

//       setMedia(prev => prev.filter(item => item.id !== id));
//       setSelectedMedia(prev => prev.filter(itemId => itemId !== id));
//     } catch (error) {
//       console.error('Error deleting media:', error);
//     }
//   };

//   const handleBulkDelete = async () => {
//     if (!confirm(`Are you sure you want to delete ${selectedMedia.length} items?`)) return;
    
//     try {
//       for (const id of selectedMedia) {
//         const itemToDelete = media.find(item => item.id === id);
//         if (!itemToDelete) continue;

//         const filePath = itemToDelete.url.split('/').pop();
//         await supabase.storage
//           .from('media')
//           .remove([filePath]);
//         await supabase
//           .from('media')
//           .delete()
//           .eq('id', id);
//       }
//       setMedia(prev => prev.filter(item => !selectedMedia.includes(item.id)));
//       setSelectedMedia([]);
//     } catch (error) {
//       console.error('Error during bulk delete:', error);
//     }
//   };

//   const getFileIcon = (type: string) => {
//     if (fileTypes.image.includes(type)) {
//       return <ImageIcon className="text-[#e6d281]" size={24} />;
//     } else if (fileTypes.video.includes(type)) {
//       return <Video className="text-[#e6d281]" size={24} />;
//     } else if (fileTypes.document.includes(type)) {
//       return <File className="text-[#e6d281]" size={24} />;
//     }
//     return <File className="text-[#e6d281]" size={24} />;
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//   };

//   return (
//     <div className="container mx-auto px-4 py-8">

//       <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
//           <div>
//             <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 flex items-center">
//               <ImageIcon className="text-[#e6d281] mr-2" size={20} />
//               Media Manager
//             </h1>
//             <p className="text-sm md:text-base text-gray-600">Organize and manage all your media files</p>
//           </div>
//           <div className="flex gap-2 md:gap-3">
//             <label className="px-3 py-1.5 md:px-4 md:py-2 bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium rounded-lg flex items-center cursor-pointer transition-colors text-sm md:text-base">
//               <Upload className="mr-1 md:mr-2" size={16} />
//               <span className="hidden sm:inline">Upload</span>
//               <input 
//                 type="file" 
//                 className="hidden" 
//                 multiple 
//                 onChange={handleUpload}
//               />
//             </label>
//             <button 
//               className="p-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
//               onClick={() => setSelectedMedia([])}
//             >
//               <Plus size={20} />
//             </button>
//           </div>
//         </div>
//       </div>
//       <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-4 md:mb-6">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="text-gray-400" size={16} />
//             </div>
//             <input
//               type="text"
//               placeholder="Search media..."
//               className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] text-sm md:text-base"
//               value={searchQuery}
//               onChange={(e) => {
//                 setSearchQuery(e.target.value);
//                 setCurrentPage(1);
//               }}
//             />
//           </div>
          
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Filter className="text-gray-400" size={16} />
//             </div>
//             <select
//               className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none text-sm md:text-base"
//               value={currentFolder}
//               onChange={(e) => {
//                 setCurrentFolder(e.target.value);
//                 setCurrentPage(1);
//               }}
//             >
//               {folders.map((folder) => (
//                 <option key={folder} value={folder}>{folder}</option>
//               ))}
//             </select>
//             <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
//           </div>
          
//           <div className="flex justify-end gap-2">
//             <button 
//               onClick={() => setViewMode('grid')}
//               className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[#e6d281] text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
//               aria-label="Grid view"
//             >
//               <Grid size={18} />
//             </button>
//             <button 
//               onClick={() => setViewMode('list')}
//               className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#e6d281] text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
//               aria-label="List view"
//             >
//               <List size={18} />
//             </button>
//           </div>
//         </div>
//       </div>
//       {uploadProgress && (
//         <div className="bg-white rounded-lg shadow-md p-4 mb-4 md:mb-6 border border-[#e6d281]">
//           <div className="flex items-center">
//             <RotateCw className="animate-spin text-[#e6d281] mr-2 md:mr-3" size={18} />
//             <div className="flex-1">
//               <div className="text-sm font-medium text-gray-800 mb-1 truncate">
//                 Uploading {uploadProgress.fileName}
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2">
//                 <div 
//                   className="bg-[#e6d281] h-2 rounded-full" 
//                   style={{ width: `${uploadProgress.progress}%` }}
//                 ></div>
//               </div>
//             </div>
//             <span className="text-sm font-medium text-gray-800 ml-2 md:ml-3">
//               {uploadProgress.progress}%
//             </span>
//           </div>
//         </div>
//       )}
//       {selectedMedia.length > 0 && (
//         <div className="bg-[#e6d281] bg-opacity-20 rounded-lg shadow-md p-3 md:p-4 mb-4 md:mb-6 border border-[#e6d281]">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//             <div className="flex items-center">
//               <CheckCircle className="text-[#e6d281] mr-2" size={18} />
//               <span className="text-sm md:text-base font-medium text-gray-800">
//                 {selectedMedia.length} item{selectedMedia.length !== 1 ? 's' : ''} selected
//               </span>
//             </div>
//             <div className="flex gap-2">
//               <button 
//                 className="px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm font-medium flex items-center hover:bg-gray-50"
//                 onClick={() => {
//                   selectedMedia.forEach(id => {
//                     const item = media.find(m => m.id === id);
//                     if (item) {
//                       window.open(item.url, '_blank');
//                     }
//                   });
//                 }}
//               >
//                 <Download className="mr-1" size={14} />
//                 Download
//               </button>
//               <button 
//                 className="px-3 py-1.5 bg-white text-gray-800 rounded-md text-sm font-medium flex items-center hover:bg-gray-50"
//                 onClick={() => {
//                   const urls = selectedMedia.map(id => {
//                     const item = media.find(m => m.id === id);
//                     return item ? item.url : '';
//                   }).join('\n');
//                   navigator.clipboard.writeText(urls);
//                 }}
//               >
//                 <Share2 className="mr-1" size={14} />
//                 Share
//               </button>
//               <button 
//                 className="px-3 py-1.5 bg-white text-red-500 rounded-md text-sm font-medium flex items-center hover:bg-gray-50"
//                 onClick={handleBulkDelete}
//               >
//                 <Trash2 className="mr-1" size={14} />
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="bg-white rounded-lg shadow-md overflow-hidden">
//         {loading ? (
//           <div className="p-6 md:p-8 text-center">
//             <div className="animate-pulse flex flex-col items-center">
//               <ImageIcon className="text-gray-300 mb-4" size={32} />
//               <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
//             </div>
//           </div>
//         ) : filteredMedia.length === 0 ? (
//           <div className="p-6 md:p-8 text-center">
//             <ImageIcon className="mx-auto text-gray-400 mb-4" size={40} />
//             <h3 className="text-lg font-medium text-gray-900">No media files found</h3>
//             <p className="mt-1 text-gray-500 text-sm md:text-base">
//               {searchQuery ? 'Try a different search term' : 'Upload some files or try a different filter'}
//             </p>
//           </div>
//         ) : viewMode === 'grid' ? (
//           <>
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 p-4 md:p-6">
//               {currentItems.map((item) => (
//                 <div 
//                   key={item.id} 
//                   className={`relative border rounded-lg overflow-hidden group transition-all ${selectedMedia.includes(item.id) ? 'border-[#e6d281] ring-2 ring-[#e6d281]' : 'border-gray-200 hover:border-gray-300'}`}
//                   onClick={() => {
//                     if (selectedMedia.includes(item.id)) {
//                       setSelectedMedia(prev => prev.filter(id => id !== item.id));
//                     } else {
//                       setSelectedMedia(prev => [...prev, item.id]);
//                     }
//                   }}
//                 >
//                   {fileTypes.image.includes(item.type) ? (
//                     <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
//                       <img 
//                         src={item.url} 
//                         alt={item.name} 
//                         className="w-full h-full object-cover transition-transform group-hover:scale-105"
//                         loading="lazy"
//                       />
//                     </div>
//                   ) : (
//                     <div className="aspect-square bg-gray-100 flex flex-col items-center justify-center p-4">
//                       {getFileIcon(item.type)}
//                       <span className="mt-2 text-xs text-gray-500 text-center line-clamp-2">{item.name}</span>
//                     </div>
//                   )}
//                   <div className="p-2 bg-white">
//                     <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{item.name}</p>
//                     <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
//                   </div>
//                                   <div className={`absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 ${selectedMedia.includes(item.id) ? 'opacity-100 bg-opacity-20' : ''}`}>
//                     {selectedMedia.includes(item.id) && (
//                       <div className="absolute top-2 right-2 bg-[#e6d281] rounded-full p-1">
//                         <CheckCircle className="text-white" size={16} />
//                       </div>
//                     )}
//                     <div className="flex gap-2">
//                       <button 
//                         className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           window.open(item.url, '_blank');
//                         }}
//                       >
//                         <Download size={16} />
//                       </button>
//                       <button 
//                         className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           navigator.clipboard.writeText(item.url);
//                         }}
//                       >
//                         <Share2 size={16} />
//                       </button>
//                       <button 
//                         className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleDelete(item.id);
//                         }}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//             {totalPages > 1 && (
//               <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
//                 <div className="flex-1 flex justify-between sm:hidden">
//                   <button
//                     onClick={() => handlePageChange(currentPage - 1)}
//                     disabled={currentPage === 1}
//                     className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                   >
//                     Previous
//                   </button>
//                   <button
//                     onClick={() => handlePageChange(currentPage + 1)}
//                     disabled={currentPage === totalPages}
//                     className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
//                   >
//                     Next
//                   </button>
//                 </div>
//                 <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
//                   <div>
//                     <p className="text-sm text-gray-700">
//                       Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
//                       <span className="font-medium">{Math.min(indexOfLastItem, filteredMedia.length)}</span> of{' '}
//                       <span className="font-medium">{filteredMedia.length}</span> results
//                     </p>
//                   </div>
//                   <div>
//                     <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
//                       <button
//                         onClick={() => handlePageChange(currentPage - 1)}
//                         disabled={currentPage === 1}
//                         className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         <span className="sr-only">Previous</span>
//                         <ChevronLeft className="h-5 w-5" aria-hidden="true" />
//                       </button>
//                       {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
//                         <button
//                           key={page}
//                           onClick={() => handlePageChange(page)}
//                           className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === page ? 'z-10 bg-[#e6d281] border-[#e6d281] text-gray-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
//                         >
//                           {page}
//                         </button>
//                       ))}
//                       <button
//                         onClick={() => handlePageChange(currentPage + 1)}
//                         disabled={currentPage === totalPages}
//                         className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         <span className="sr-only">Next</span>
//                         <ChevronRight className="h-5 w-5" aria-hidden="true" />
//                       </button>
//                     </nav>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Name
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Size
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Uploaded
//                   </th>
//                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {currentItems.map((item) => (
//                   <tr 
//                     key={item.id} 
//                     className={selectedMedia.includes(item.id) ? 'bg-[#e6d281]/10' : 'hover:bg-gray-50'}
//                     onClick={() => {
//                       if (selectedMedia.includes(item.id)) {
//                         setSelectedMedia(prev => prev.filter(id => id !== item.id));
//                       } else {
//                         setSelectedMedia(prev => [...prev, item.id]);
//                       }
//                     }}
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
//                           {getFileIcon(item.type)}
//                         </div>
//                         <div className="ml-4">
//                           <div className="text-sm font-medium text-gray-900 truncate max-w-xs">{item.name}</div>
//                         </div>
//                         {selectedMedia.includes(item.id) && (
//                           <div className="ml-2 bg-[#e6d281] rounded-full p-1">
//                             <CheckCircle className="text-white" size={16} />
//                           </div>
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {item.type.toUpperCase()}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {formatFileSize(item.size)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                       {new Date(item.created_at).toLocaleDateString()}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                       <div className="flex justify-end space-x-2">
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             window.open(item.url, '_blank');
//                           }}
//                           className="text-gray-600 hover:text-[#e6d281]"
//                         >
//                           <Download size={16} />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             navigator.clipboard.writeText(item.url);
//                           }}
//                           className="text-gray-600 hover:text-[#e6d281]"
//                         >
//                           <Share2 size={16} />
//                         </button>
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handleDelete(item.id);
//                           }}
//                           className="text-gray-600 hover:text-red-500"
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>

//             {totalPages > 1 && (
//               <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">

//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MediaManager;