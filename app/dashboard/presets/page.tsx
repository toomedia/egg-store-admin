"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { supabase } from "../../../utils/supabaseClient"
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
  CheckCircle,
  XCircle,
  Clock,
  Moon
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

interface DarkModeEgg {
  id: string;
  creation_id: string;
  image_url: string;
  title?: string;
  prompt?: string;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  created_by: string;
  priority: number;
}

const Page = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  const [currentView, setCurrentView] = useState<'list' | 'create'>('list');
  const [preset, setPreset] = useState<Preset[]>([]);
  const [filteredPreset, setFilteredPreset] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [darkModeEggs, setDarkModeEggs] = useState<DarkModeEgg[]>([]);

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

  // Check if preset is in dark mode
  const isPresetInDarkMode = (presetId: string) => {
    return darkModeEggs.some(egg => egg.creation_id === presetId && egg.is_active);
  };

// Toggle dark mode for preset
const toggleDarkModeForPreset = async (presetId: string, presetImages: string[]) => {
  try {
    const existingEgg = darkModeEggs.find(egg => egg.creation_id === presetId);
    
    if (existingEgg) {
      // Toggle existing egg
      const { error } = await supabase
        .from('dark_mode_eggs')
        .update({ is_active: !existingEgg.is_active })
        .eq('id', existingEgg.id);

      if (error) {
        console.error('Error toggling dark mode:', error);
        alert('Failed to update dark mode');
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

      alert(`Preset ${!existingEgg.is_active ? 'added to' : 'removed from'} dark mode`);
    } else {
      // Add new egg to dark mode
      const firstImage = presetImages[0];
      const presetItem = preset.find(p => p.id === presetId);
      
      const darkModeEggData = {
        creation_id: presetId,
        image_url: firstImage,
        title: presetItem?.preset_name?.en_name || '',
        prompt: presetItem?.preset_desc?.en_desc || '',
        tags: [],
        is_active: true,
        created_by: presetItem?.created_by || null, // Use the preset's creator or null
        priority: 0
      };

      const { error } = await supabase
        .from('dark_mode_eggs')
        .insert(darkModeEggData);

      if (error) {
        console.error('Error adding to dark mode:', error);
        alert('Failed to add to dark mode');
        return;
      }

      // Refresh dark mode eggs
      fetchDarkModeEggs();
      alert('Preset added to dark mode');
    }
  } catch (error) {
    console.error('Error in toggleDarkModeForPreset:', error);
    alert('An unexpected error occurred');
  }
};

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

  // Filter presets based on search query
  useEffect(() => {
    let filtered = preset;
    
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

  useEffect(() => {
    const fetchAllPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('presets')
          .select('*')
          .or('preset_status.eq.approved,preset_status.is.null')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching presets:", error);
          return;
        }
        
        setPreset(data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchAllPresets();
    fetchDarkModeEggs();

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
          const { data, error } = await supabase
            .from('presets')
            .select('*')
            .or('preset_status.eq.approved,preset_status.is.null')
            .order('created_at', { ascending: false });
          
          if (error) {
            console.error("Error refetching presets:", error);
            return;
          }
          
          setPreset(data || []);
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

 const handleMakeLive = async (e: React.FormEvent) => {
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

  setIsLoading(true);

  try {
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
      }
    }

    const finalImageUrls = uploadedImageUrls;

    // Clean up object URLs
    formData.images.forEach(img => {
      if (img.fileObject) URL.revokeObjectURL(img.previewUrl);
    });

    const adminUserId = searchParams.get('admin_user_id');

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
      approved_by: adminUserId || null, // Use null instead of 'admin'
      created_at: new Date().toISOString(),
      created_by: adminUserId || null // Use null instead of 'admin'
    };

    if (editingId) {
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

      alert("Preset updated successfully!");
      const updatedPresets = preset.map(item => 
        item.id === editingId ? data[0] : item
      );
      setPreset(updatedPresets);
    } else {
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

      alert("Preset created successfully!");
      setPreset(prev => [...prev, data[0]]);
    }
    
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
    alert("An unexpected error occurred.");
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

      setPreset(prev => prev.filter(item => item.id !== id));
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
      if (!confirm(`Removing this image would make your preset incomplete. You need ${requiredImageCount} unique images. Are you sure you want to remove it?`)) {
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
    } else {
      if (imageToRemove.fileObject) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
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
        </div>

        <form className="space-y-6" onSubmit={handleMakeLive}>
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
      
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Edit className="text-[#e6d281] mr-2" size={20} />
              Descriptions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="desc-en" className="block text-sm font-medium text-gray-700 mb-1">Description (English)</label>
                <textarea 
                  onChange={handleInputChange} 
                  id="desc-en" 
                  name="descEn" 
                  rows={3} 
                  value={formData.descEn}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="A beautiful collection of spring flower designs"
                ></textarea>
              </div>
              <div>
                <label htmlFor="desc-de" className="block text-sm font-medium text-gray-700 mb-1">Description (German)</label>
                <textarea 
                  onChange={handleInputChange} 
                  id="desc-de" 
                  name="descDe" 
                  rows={3} 
                  value={formData.descDe}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#e6d281] focus:border-[#e6d281]" 
                  placeholder="Eine wunderschöne Kollektion von Frühlingsblumen-Designs"
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
                  Price (€)
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
              </div>
            </div>
          </div>
      
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <ImageIcon className="text-[#e6d281] mr-2" size={20} />
              Upload Images
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#e6d281] transition-colors cursor-pointer">
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
                Selected size requires {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images
              </p>
            )}

            {formData.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ImageIcon className="mr-2" size={16} />
                  Selected Images ({formData.images.filter(img => !img.markedForDeletion).length}/{Math.ceil(parseInt(String(formData.size.value || '0')) / 2)})
                </h3>
                
                {formData.size.value && formData.images.filter(img => !img.markedForDeletion).length !== Math.ceil(parseInt(String(formData.size.value)) / 2) && (
                  <p className="text-sm text-red-500 mt-2 mb-3">
                    ⚠️ You need exactly {Math.ceil(parseInt(String(formData.size.value)) / 2)} unique images
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
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium bg-green-600 hover:bg-green-700 text-white cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="mr-2 animate-spin" size={16} />
              ) : (
                <Globe className="mr-2" size={16} />
              )}
              {isLoading ? 'Publishing...' : (editingId ? 'Update Preset' : 'Create Preset')}
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
            <p className="text-gray-600">Manage approved presets and dark mode eligibility.</p>
            
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
    
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setCurrentView('create')}
              className="bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 shadow-sm flex items-center"
            >
              <PlusCircle className="mr-2" size={16} />
              Create New Preset
            </button>
          </div>
        </div>
      </div>
  
      {filteredPreset.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredPreset.map((item) => {
            const isInDarkMode = isPresetInDarkMode(item.id);
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="mb-4 md:mb-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(item.preset_status || '')}
                            {isInDarkMode && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full flex items-center w-fit">
                                <Moon className="mr-1" size={12} />
                                Dark Mode
                              </span>
                            )}
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
                              onClick={() => toggleDarkModeForPreset(item.id, item.preset_images || [])}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center ${
                                isInDarkMode
                                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={isInDarkMode ? 'Remove from dark mode' : 'Add to dark mode'}
                            >
                              <Moon className="mr-1" size={14} />
                              {isInDarkMode ? 'Dark Mode' : 'Add to Dark'}
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
                          <img 
                            src={imageUrl} 
                            alt={`Preset image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
            <button
              onClick={() => setCurrentView('create')}
              className="bg-[#e6d281] hover:bg-[#d4c070] text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center mx-auto"
            >
              <PlusCircle className="mr-2" size={16} />
              Create Preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;