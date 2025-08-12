// "use client"
// import React, { useEffect, useState } from 'react';
// import {supabase} from "../../../utils/supabaseClient"
// import {ArrowLeft } from "lucide-react"

// const page = () => {
//   const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
//   const [preset, setPreset] = useState([])
//   const categories = ['Nature', 'Abstract', 'Easter', 'Animals', 'Holiday'];

//   // Form state
//   const [formData, setFormData] = useState({titleEn: '', titleDe: '', descEn: '', descDe: '', category: '', filters: [] as string[], size: { label: '', value: '' }, price: '', images: [] as File[] });
//   const sizes = [
//     { label: 'sm', value: 12 },
//     { label: 'xs', value: 1 },
//     { label: 'md', value: 18 },
//     { label: 'lg', value: 27 },
//     { label: 'xl', value: 32 },
//     { label: 'xxl', value: 38 },
//   ];
  
//   const filters = ['Floral', 'Geometric', 'Minimalist', 'Colorful', 'Vintage'];

//   useEffect(()=>{
//     const fetchPreset = async () =>{
//       const { data, error } = await supabase
//     .from('presets')
//     .select('*');

//     if(error){console.log("error", error); return}
//     console.log("data", data);

//     setPreset(data)

//   }
//   fetchPreset()
//   },[currentView])

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
//     console.log("formData", formData.images);

//     const { name, type } = e.target;
  
//     if (type === "file") {
//       const files = (e.target as HTMLInputElement).files;
//       if (!files) return;
      
//       const imageObjects = Array.from(files).map(file => ({
//         fileObject: file,
//         previewUrl: URL.createObjectURL(file)
//       }));
      
//       setFormData((prev) => ({
//         ...prev,
//         [name]: imageObjects, 
//       }));
//     } else {
//       const { value } = e.target;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };
  

//   const handleFilterToggle = (filter: string) => {
//     setFormData(prev => ({
//       ...prev,
//       filters: prev.filters.includes(filter)
//         ? prev.filters.filter(f => f !== filter)
//         : [...prev.filters, filter]
//     }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (formData.images.length === 0) {
//       alert("Please upload at least one image.");
//       return;
//     }
  
//     if(formData.images.length !== parseInt(formData.size.value)) {
//       alert("Please upload the correct number of images for the selected size.");
//       return;
//     }
  
//     try {
//       const uploadedImageUrls: string[] = [];
  
//       for (let image of formData.images) {
//         const file = image.fileObject; // Access the actual File object
//         const fileExt = file.name.split(".").pop();
//         const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
//         const filePath = `presets/${fileName}`;
  
//         let { error: uploadError } = await supabase.storage
//           .from("presets")
//           .upload(filePath, file);
  
//         if (uploadError) {
//           console.error("Image upload error:", uploadError);
//           // Clean up any created URLs
//           formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
//           return;
//         }
  
//         // Get public URL
//         const { data: publicUrlData } = supabase.storage
//           .from("presets")
//           .getPublicUrl(filePath);
  
//         uploadedImageUrls.push(publicUrlData.publicUrl);
//       }
  
//       // Clean up the object URLs after upload
//       formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
  
//       // Save preset in table with image URLs
//       const { data, error } = await supabase
//         .from("presets")
//         .insert({
//           preset_name: {
//             en_name: formData.titleEn,
//             de_name: formData.titleDe,
//           },
//           preset_desc: {
//             en_desc: formData.descEn,
//             de_desc: formData.descDe,
//           },
//           category: formData.category,
//           filters: formData.filters,
//           preset_size_json: formData.size,
//           preset_price: formData.price,
//           preset_images: uploadedImageUrls, 
//         })
//         .select("*")
//         .single();
  
//       if (error) {
//         console.error("Preset save error:", error);
//         return;
//       }
  
//       console.log("Preset created:", data);
//       alert("Preset created successfully!");
//       setCurrentView("list");
  
//     } catch (err) {
//       console.error("Unexpected error:", err);
//       // Clean up any created URLs in case of error
//       formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
//     }
//   };
  

//   if (currentView === 'create') {
//     return (
//       <div className="container mx-auto px-4 py-8 font-manrope">
//         <div onClick={()=> setCurrentView('list')}>
//           <ArrowLeft/>
//         </div>

//         <div className="mb-6">
//           <h1 className="text-2xl font-bold text-gray-800">Create New Preset</h1>
//           <p className="text-gray-600">Fill out the form below to create a new egg card preset.</p>
//         </div>

//         <form className="space-y-6" onSubmit={handleSubmit}>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label htmlFor="title-en" className="block text-sm font-medium text-gray-700 mb-1">Title (English)</label>
//                   <input required onChange={handleInputChange} type="text" id="title-en" name="titleEn" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Spring Flowers Collection" />
//                 </div>
//                 <div>
//                   <label htmlFor="title-de" className="block text-sm font-medium text-gray-700 mb-1">Title (German)</label>
//                   <input required  onChange={handleInputChange} type="text" id="title-de" name="titleDe" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Frühlingsblumen Kollektion" />
//                 </div>
//               </div>
          
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label htmlFor="desc-en" className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
//                   <textarea required onChange={handleInputChange} id="desc-en" name="descEn" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="A beautiful collection of spring flower designs for your egg memory game."></textarea>
//                 </div>
//                 <div>
//                   <label htmlFor="desc-de" className="block text-sm font-medium text-gray-700 mb-1">Description (German)</label>
//                   <textarea required onChange={handleInputChange} id="desc-de" name="descDe" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Eine wunderschöne Kollektion von Frühlingsblumen-Designs für Ihr Eier-Memory-Spiel."></textarea>
//                 </div>
//               </div>
          
//               <div>
//                 <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
//                 <select onChange={handleInputChange} id="category" name="category" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500">
//                   <option value="">Select a category</option>
//                   {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
//                 </select>
//                 <div className="mt-2">
//                   <button type="button" className="text-sm text-blue-600 hover:text-blue-800">+ Add new category</button>
//                 </div>
//               </div>
          
//           <div>
//               <label htmlFor="filters" className="block text-sm font-medium text-gray-700 mb-1">
//                 Filters/Tags
//               </label>

//               <div className="flex flex-wrap gap-2 mb-2">
//                 {filters.map((filter) => (
//                   <div key={filter} className="flex items-center">
//                     <input
//                       id={`filter-${filter}`}
//                       name="filters"
//                       type="checkbox"
//                       value={filter}
//                       checked={formData.filters.includes(filter)}
//                       onChange={() => handleFilterToggle(filter)}
//                       className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//                     />
//                     <label htmlFor={`filter-${filter}`} className="ml-2 text-sm text-gray-700">
//                       {filter}
//                     </label>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-1">
//                 <input
//                   type="text"
//                   placeholder="Add new filter/tag"
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') {
//                       e.preventDefault();
//                       if (e.currentTarget.value.trim() && !formData.filters.includes(e.currentTarget.value.trim())) {
//                         setFormData((prev) => ({
//                           ...prev,
//                           filters: [...prev.filters, e.currentTarget.value.trim()],
//                         }));
//                       }
//                       e.currentTarget.value = '';
//                     }
//                   }}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//                 />
//               </div>
//               </div>

          
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">Preset Size</label>
//                   <select
//                     name="size"
//                     onChange={(e) => {
//                       const selectedValue = e.target.value; // ye value hoga number as string, e.g. "32"
//                       const selectedSize = sizes.find(s => s.value.toString() === selectedValue);
//                       if(selectedSize) {
//                         setFormData(prev => ({
//                           ...prev,
//                           size: selectedSize
//                         }));
//                       }
//                     }}
//                   >
//                     <option value="">Select a size</option>
//                     {sizes.map(({ label, value }) => (
//                       <option key={label} value={value}>
//                         {label} ({value} cards)
//                       </option>
//                     ))}
//                   </select>


//                 </div>
//                 <div>
//                   <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
//                   <input required  onChange={handleInputChange} type="number" id="price" name="price" step="0.01" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="19.99" />
//                 </div>
//               </div>
          
//               <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
//                   <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md" 
//                     onClick={()=>{if(!formData.size.value){alert("Please select a size first"); return}}}
//                   >
//                     <div className="space-y-1 text-center">
//                       <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
//                         <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
//                       </svg>
//                       <div className="flex text-sm text-gray-600">
//                         <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
//                           <span>Upload files</span>
//                           <input 
//                             id="file-upload" 
//                             name="images" 
//                             type="file" 
//                             className="sr-only" 
//                             multiple 
//                             onChange={(e) => {
//                               if (e.target.files && e.target.files.length > 0) {
//                                 const filesArray = Array.from(e.target.files).map(file => ({
//                                   fileObject: file,
//                                   previewUrl: URL.createObjectURL(file)
//                                 }));
//                                 setFormData(prev => ({
//                                   ...prev,
//                                   images: [...prev.images, ...filesArray]
//                                 }));
//                               }
//                             }}
//                           />
//                         </label>
//                         <p className="pl-1">or drag and drop</p>
//                       </div>
//                       <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
//                     </div>
//                   </div>

//                   {formData.images.length > 0 && (
//                     <div className="mt-4">
//                       <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Images ({formData.images.length})</h3>
//                       <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
//                         {formData.images.map((image, index) => (
//                           <div key={index} className="relative group">
//                             <img 
//                               src={image.previewUrl} 
//                               alt={`Preview ${index}`} 
//                               className="h-24 w-full object-cover rounded-md"
//                             />
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 // Revoke the object URL to avoid memory leaks
//                                 URL.revokeObjectURL(image.previewUrl);
//                                 setFormData(prev => ({
//                                   ...prev,
//                                   images: prev.images.filter((_, i) => i !== index)
//                                 }));
//                               }}
//                               className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                             >
//                               ×
//                             </button>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
                
          
//               <div className="flex justify-end gap-3 pt-4">
//                 <button 
//                   type="button"
//                   onClick={() => setCurrentView('list')}
//                   className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-custom-yellow hover:bg-custom-yellow cursor-pointer"
//                 >
//                   Create Preset
//                 </button>
//               </div>
//             </form>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 bg-gray-50">
//       <div className="mb-8 flex justify-between">
//         <div className='w-3/4'>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Presets Management</h1>
//           <p className="text-gray-600">This page allows you to manage all presets (collections of egg cards). You can create new presets, edit existing ones, and organize them into categories.</p>
//         </div>
  
//         <div className="mb-8">
//           <button
//             onClick={() => setCurrentView('create')}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
//           >
//             Create New Preset
//           </button>
//         </div>
//       </div>
  
//       {preset.length > 0 ? (
//         <div className="grid grid-cols-1 gap-6">
//           {preset.map((item) => (
//             <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border">
//               <div className="p-6">
//                 {/* Preset Details - Top Section */}
//                 <div className="flex flex-col md:flex-row gap-6">
//                   <div className="w-full">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <div className="mb-2">
//                           <p className="text-sm text-gray-500 mb-1">English Title</p>
//                           <h2 className="text-lg font-semibold text-gray-800">
//                             {item.preset_name?.en_name || 'Untitled Preset'}
//                           </h2>
//                         </div>
//                         <div className="mb-4">
//                           <p className="text-sm text-gray-500 mb-1">German Title</p>
//                           <h2 className="text-lg font-semibold text-gray-800">
//                             {item.preset_name?.de_name || 'Unbenanntes Preset'}
//                           </h2>
//                         </div>
//                       </div>
//                       <div className="flex flex-col items-end gap-5">
//                       <div className="flex gap-3">
//                               <button onClick={() => handleEdit(item.id)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md font-medium">Edit</button>
//                               <button onClick={() => handleDelete(item.id)}className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium">Delete</button>
//                            </div>
//                         <div className="flex">
//                           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">{item.category || 'Uncategorized'}</span>
//                         </div>

//                         <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
//                           <p className="text-xs text-gray-500">Preset Size</p>
//                           <p className="text-xl font-bold text-gray-800">
//                             {item.preset_size_json?.label || 'N/A'}
//                           </p>
//                           <p className="text-xl font-bold text-gray-800">
//                             {item.preset_size_json?.value || 'N/A'}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
  
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                       <div>
//                         <p className="text-sm text-gray-500 mb-1">English Description</p>
//                         <p className="text-gray-700">
//                           {item.preset_desc?.en_desc || 'No description'}
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500 mb-1">German Description</p>
//                         <p className="text-gray-700">
//                           {item.preset_desc?.de_desc || 'Keine Beschreibung'}
//                         </p>
//                       </div>
//                     </div>
  
//                     <div className="mb-4">
//                       <p className="text-sm text-gray-500 mb-1">Filters/Tags</p>
//                       <div className="flex flex-wrap gap-2">
//                         {item.filters?.map((filter, index) => (
//                           <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
//                             {filter}
//                           </span>
//                         ))}
//                       </div>
//                     </div>
  
//                     <div className="flex items-center gap-4 mb-6">
//                       <div className="bg-gray-100 px-3 py-2 rounded-lg">
//                         <p className="text-sm text-gray-500">Price</p>
//                         <p className="text-lg font-bold">€{item.preset_price || '0.00'}</p>
//                       </div>
//                       <div>
//                         <p className="text-sm text-gray-500">Created</p>
//                         <p className="text-sm font-medium">
//                           {new Date(item.created_at).toLocaleDateString()}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
  
//                 {/* Images Row - Bottom Section */}
//                 <div className="mt-6 pt-6 border-t border-gray-200">
//                   <p className="text-sm text-gray-500 mb-3">Preset Images</p>
//                   <div className="flex gap-3 overflow-x-auto pb-2">
//                     {item.preset_images?.map((imageUrl, index) => (
//                       <div key={index} className="flex-shrink-0 h-[120px] w-[120px] overflow-hidden rounded-md border border-gray-200">
//                         <img 
//                           src={imageUrl} 
//                           alt={`Preset image ${index + 1}`}
//                           className="w-full h-full object-cover"
//                           loading="lazy"
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="bg-gray-50 rounded-lg p-8 text-center">
//           <svg
//             className="mx-auto h-12 w-12 text-gray-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             aria-hidden="true"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={1}
//               d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//             />
//           </svg>
//           <h3 className="mt-2 text-lg font-medium text-gray-900">No presets found!</h3>
//           <p className="mt-1 text-gray-500">Get started by creating a new preset.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default page;



"use client"
import React, { useEffect, useState } from 'react';
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
  Loader2
} from "lucide-react"

const page = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [preset, setPreset] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const categories = ['Nature', 'Abstract', 'Easter', 'Animals', 'Holiday'];

  // Form state
  const [formData, setFormData] = useState({
    titleEn: '', 
    titleDe: '', 
    descEn: '', 
    descDe: '', 
    category: '', 
    filters: [] as string[], 
    size: { label: '', value: '' }, 
    price: '', 
    images: [] as File[] 
  });

  const sizes = [
    { label: 'sm', value: 12 },
    { label: 'xs', value: 1 },
    { label: 'md', value: 18 },
    { label: 'lg', value: 27 },
    { label: 'xl', value: 32 },
    { label: 'xxl', value: 38 },
  ];
  
  const filters = ['Floral', 'Geometric', 'Minimalist', 'Colorful', 'Vintage'];

  useEffect(()=>{
    const fetchPreset = async () =>{
      const { data, error } = await supabase
        .from('presets')
        .select('*');

      if(error){console.log("error", error); return}
      console.log("data", data);

      setPreset(data)
    }
    fetchPreset()
  },[currentView])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
  
    if (type === "file") {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      
      const imageObjects = Array.from(files).map(file => ({
        fileObject: file,
        previewUrl: URL.createObjectURL(file)
      }));
      
      setFormData((prev) => ({
        ...prev,
        [name]: imageObjects, 
      }));
    } else {
      const { value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleFilterToggle = (filter: string) => {
    setFormData(prev => ({
      ...prev,
      filters: prev.filters.includes(filter)
        ? prev.filters.filter(f => f !== filter)
        : [...prev.filters, filter]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    if (formData.images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }
  
    if(formData.images.length !== parseInt(formData.size.value)) {
      alert("Please upload the correct number of images for the selected size.");
      return;
    }
  
    try {
      const uploadedImageUrls: string[] = [];
  
      for (let image of formData.images) {
        const file = image.fileObject;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `presets/${fileName}`;
  
        let { error: uploadError } = await supabase.storage
          .from("presets")
          .upload(filePath, file);
  
        if (uploadError) {
          console.error("Image upload error:", uploadError);
          formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
          return;
        }
  
        const { data: publicUrlData } = supabase.storage
          .from("presets")
          .getPublicUrl(filePath);
  
        uploadedImageUrls.push(publicUrlData.publicUrl);
      }
  
      formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
  
      const { data, error } = await supabase
        .from("presets")
        .insert({
          preset_name: {
            en_name: formData.titleEn,
            de_name: formData.titleDe,
          },
          preset_desc: {
            en_desc: formData.descEn,
            de_desc: formData.descDe,
          },
          category: formData.category,
          filters: formData.filters,
          preset_size_json: formData.size,
          preset_price: formData.price,
          preset_images: uploadedImageUrls, 
        })
        .select("*")
        .single();
  
      if (error) {
        console.error("Preset save error:", error);
        return;
      }
  
      console.log("Preset created:", data);
      alert("Preset created successfully!");
      setCurrentView("list");
  
    } catch (err) {
      console.error("Unexpected error:", err);
      formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    }finally{
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this preset?")) {
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Delete error:", error);
        return;
      }
      
      setPreset(preset.filter(item => item.id !== id));
    }
  };

  const handleEdit = (id: string) => {
    const presetToEdit = preset.find(item => item.id === id);
    if (presetToEdit) {
      setFormData({
        titleEn: presetToEdit.preset_name?.en_name || '',
        titleDe: presetToEdit.preset_name?.de_name || '',
        descEn: presetToEdit.preset_desc?.en_desc || '',
        descDe: presetToEdit.preset_desc?.de_desc || '',
        category: presetToEdit.category || '',
        filters: presetToEdit.filters || [],
        size: presetToEdit.preset_size_json || { label: '', value: '' },
        price: presetToEdit.preset_price || '',
        images: []
      });
      setCurrentView('create');
    }
  };

  if (currentView === 'create') {
    return (
      <div className="container mx-auto px-4 py-8 font-manrope">
        <div 
          onClick={()=> setCurrentView('list')} 
          className="mb-4 cursor-pointer flex items-center text-[#e6d281] hover:text-[#d4c070] transition-colors"
        >
          <ArrowLeft className="mr-2" />
          <span>Back to Presets</span>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <PlusCircle className="text-[#e6d281] mr-2" size={24} />
            <h1 className="text-2xl font-bold text-gray-800">Create New Preset</h1>
          </div>
          <p className="text-gray-600">Fill out the form below to create a new egg card preset.</p>
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
                <label htmlFor="desc-en" className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea 
                  required 
                  onChange={handleInputChange} 
                  id="desc-en" 
                  name="descEn" 
                  rows={3} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="A beautiful collection of spring flower designs for your egg memory game."
                ></textarea>
              </div>
              <div>
                <label htmlFor="desc-de" className="block text-sm font-medium text-gray-700 mb-1">Description (German)</label>
                <textarea 
                  required 
                  onChange={handleInputChange} 
                  id="desc-de" 
                  name="descDe" 
                  rows={3} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="Eine wunderschöne Kollektion von Frühlingsblumen-Designs für Ihr Eier-Memory-Spiel."
                ></textarea>
              </div>
            </div>
          </div>
      
          {/* Category & Filters Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Layers className="text-[#e6d281] mr-2" size={20} />
              Category & Filters
            </h2>
            
            <div className="mb-6">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <div className="relative">
                <select 
                  onChange={handleInputChange} 
                  id="category" 
                  name="category" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
              </div>
              <div className="mt-2">
                <button 
                  type="button" 
                  className="text-sm text-[#e6d281] hover:text-[#d4c070] flex items-center"
                >
                  <PlusCircle className="mr-1" size={14} />
                  Add new category
                </button>
              </div>
            </div>
      
            <div>
              <label htmlFor="filters" className="block text-sm font-medium text-gray-700 mb-1">
                Filters/Tags
              </label>

              <div className="flex flex-wrap gap-2 mb-2">
                {filters.map((filter) => (
                  <div 
                    key={filter} 
                    onClick={() => handleFilterToggle(filter)}
                    className={`flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${formData.filters.includes(filter) ? 'bg-[#e6d281] text-gray-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {formData.filters.includes(filter) ? (
                      <Check className="mr-1" size={12} />
                    ) : null}
                    {filter}
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Add new filter/tag (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.currentTarget.value.trim() && !formData.filters.includes(e.currentTarget.value.trim())) {
                          setFormData((prev) => ({
                            ...prev,
                            filters: [...prev.filters, e.currentTarget.value.trim()],
                          }));
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]"
                  />
                  <PlusCircle className="absolute right-3 top-2.5 text-gray-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Size & Price Section */}
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
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const selectedSize = sizes.find(s => s.value.toString() === selectedValue);
                      if(selectedSize) {
                        setFormData(prev => ({
                          ...prev,
                          size: selectedSize
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] appearance-none"
                  >
                    <option value="">Select a size</option>
                    {sizes.map(({ label, value }) => (
                      <option key={label} value={value}>
                        {label.toUpperCase()} ({value} cards)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-gray-400" size={16} />
                </div>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price (€)</label>
                <div className="relative">
                  <input 
                    required 
                    onChange={handleInputChange} 
                    type="number" 
                    id="price" 
                    name="price" 
                    step="0.01" 
                    min="0" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281] pl-8" 
                    placeholder="19.99" 
                  />
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
                </div>
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
              onClick={()=>{
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
                            previewUrl: URL.createObjectURL(file)
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
                    Selected size requires {formData.size.value} images
                  </p>
                )}
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ImageIcon className="mr-2" size={16} />
                  Selected Images ({formData.images.length}/{formData.size.value || '0'})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square overflow-hidden rounded-md border border-gray-200">
                        <img 
                          src={image.previewUrl} 
                          alt={`Preview ${index}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(image.previewUrl);
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }));
                        }}
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
              onClick={() => setCurrentView('list')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 cursor-pointer transition-colors flex items-center justify-center"
            >
              <PlusCircle className="mr-2" size={16} />
              Create Preset
            </button>
          </div>
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
            <p className="text-gray-600">Manage all presets (collections of egg cards). Create, edit, and organize presets.</p>
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
  
      {preset.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {preset.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start">
                      <div className="mb-4 md:mb-0">
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1 flex items-center">
                            <Tag className="mr-1" size={14} />
                            English Title
                          </p>
                          <h2 className="text-lg font-semibold text-gray-800">
                            {item.preset_name?.en_name || 'Untitled Preset'}
                          </h2>
                        </div>
                        <div className="mb-4">
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
                            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm font-medium flex items-center"
                          >
                            <Trash2 className="mr-1" size={14} />
                            Delete
                          </button>
                        </div>
                        <div className="flex flex-col md:items-end gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#e6d281] text-gray-800">
                            {item.category || 'Uncategorized'}
                          </span>
                          <div className="bg-gray-100 px-3 py-2 rounded-lg text-center">
                            <p className="text-xs text-gray-500 flex items-center justify-center">
                              <Layers className="mr-1" size={12} />
                              {item.preset_size_json?.label || 'N/A'} ({item.preset_size_json?.value || '0'} cards)
                            </p>
                          </div>
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
    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1 flex items-center">
                        <Tag className="mr-1" size={14} />
                        Filters/Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.filters?.map((filter, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e6d281] text-gray-800">
                            {filter}
                          </span>
                        ))}
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
                    </div>
                  </div>
                </div>
    
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3 flex items-center">
                    <ImageIcon className="mr-1" size={14} />
                    Preset Images ({item.preset_images?.length || 0})
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {item.preset_images?.map((imageUrl, index) => (
                      <div key={index} className="flex-shrink-0 h-[100px] w-[100px] overflow-hidden rounded-md border border-gray-200">
                        <img 
                          src={imageUrl} 
                          alt={`Preset image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
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
            <h3 className="text-lg font-medium text-gray-900">No presets found!</h3>
            <p className="mt-1 text-gray-500 mb-6">Get started by creating your first preset.</p>
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

export default page;