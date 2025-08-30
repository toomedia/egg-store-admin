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

// Define TypeScript interfaces
interface PresetName {
  en_name: string;
  de_name: string;
}

interface PresetDesc {
  en_desc: string;
  de_desc: string;
}

interface PresetSize {
  label: string;
  value: string | number;
}

interface PresetImage {
  fileObject: File;
  previewUrl: string;
}

interface Preset {
  id: string;
  preset_name: PresetName;
  preset_desc: PresetDesc;
  category: string;
  filters: string[];
  preset_size_json: PresetSize;
  preset_price: string;
  preset_images: string[];
  created_at: string;
}

interface FormData {
  titleEn: string;
  titleDe: string;
  descEn: string;
  descDe: string;
  category: string;
  filters: string[];
  size: PresetSize;
  price: string;
  images: PresetImage[];
}

const Page = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [preset, setPreset] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const categories = ['Nature', 'Abstract', 'Easter', 'Animals', 'Holiday'];

  // Form state
  const [formData, setFormData] = useState<FormData>({
    titleEn: '', 
    titleDe: '', 
    descEn: '', 
    descDe: '', 
    category: '', 
    filters: [], 
    size: { label: '', value: '' }, 
    price: '', 
    images: [] 
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

  useEffect(() => {
    const fetchAllPresets = async () => {
      try {
        // 1️⃣ Check if data exists in localStorage
        const localData = localStorage.getItem('allPresets');
        let allPresets: any[] = [];
  
        if (localData) {
          allPresets = JSON.parse(localData);
          console.log("🚀 Loaded presets from localStorage:", allPresets);
        } else {
          const { data, error } = await supabase.from('presets').select('*');
          if (error) {
            console.error("🚀 Error fetching presets:", error);
            return;
          }
          allPresets = data || [];
          localStorage.setItem('allPresets', JSON.stringify(allPresets));
          console.log("🚀 Fetched presets from Supabase:", allPresets);
        }

        setPreset(allPresets);
        const imageLoadingStates: { [key: string]: boolean } = {};
        allPresets.forEach(preset => {
          preset.preset_images?.forEach((img: string) => {
            imageLoadingStates[img] = true;
          });
        });
      } catch (err) {
        console.error("🚀 Unexpected error:", err);
      }
    };
  
    fetchAllPresets();
  
    const channel = supabase
      .channel('public:presets')  
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'presets' },
        payload => {
          console.log('🚀 New preset inserted:', payload.new);
  
          const updatedPresets = [
            ...(JSON.parse(localStorage.getItem('allPresets') || '[]')),
            payload.new
          ];
          localStorage.setItem('allPresets', JSON.stringify(updatedPresets));
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(channel);
    };
  
  }, [currentView]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type, value } = e.target;
  
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
      setIsLoading(false);
      return;
    }
  
    if (formData.images.length !== parseInt(String(formData.size.value))) {
      alert("Please upload the correct number of images for the selected size.");
      setIsLoading(false);
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
          setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
  
      console.log("Preset created:", data);
      alert("Preset created successfully!");
      setCurrentView("list");
  
    } catch (err) {
      console.error("Unexpected error:", err);
      formData.images.forEach(img => URL.revokeObjectURL(img.previewUrl));
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
      // First delete associated images from storage if they exist
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
          console.error("Image deletion error:", storageError);
          // Continue with preset deletion even if image deletion fails
        }
      }

      // Delete the preset record from the database
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete preset. Please try again.");
        return;
      }

      // Update local state by filtering out the deleted preset
      setPreset(prevPreset => prevPreset.filter(item => item.id !== id));
      alert("Preset deleted successfully!");

    } catch (err) {
      console.error("Unexpected error during deletion:", err);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setDeletingId(null);
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
          onClick={() => setCurrentView('list')} 
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
                <label htmlFor="desc-en" className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea 
                  required 
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
                <label htmlFor="desc-de" className="block text-sm font-medium text-gray-700 mb-1">Description (German)</label>
                <textarea 
                  required 
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
                  value={formData.category}
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
                        const value = e.currentTarget.value.trim();
                        if (value && !formData.filters.includes(value)) {
                          setFormData((prev) => ({
                            ...prev,
                            filters: [...prev.filters, value],
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
                    value={formData.size.value}
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
                    value={formData.price}
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
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <PlusCircle className="mr-2" size={16} />
              )}
              {isLoading ? 'Creating...' : 'Create Preset'}
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
                        {item.filters?.map((filter: string, index: number) => (
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
                    {item.preset_images?.map((imageUrl: string, index: number) => (
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

export default Page;