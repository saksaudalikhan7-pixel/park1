```javascript
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Trash2, Upload, Save, X, ArrowLeft, ArrowRight } from 'lucide-react';
import {
    getPricingCarouselImages,
    updatePricingCarouselOrder,
    deletePricingCarouselImage,
    createPricingCarouselImage
} from "@/app/actions/cms";
import { Button } from '@/components/admin/Button';
import toast from 'react-hot-toast';

interface CarouselImage {
    id: number;
    title: string;
    image: string;
    order: number;
    active: boolean;
    image_url: string; // Handle both key variations if needed, API returns snake_case usually
}

export default function PricingCarouselManager() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const data = await getPricingCarouselImages();
            // Map API response to consistent shape if needed, or just cast
            const formatted = data.map((img: any) => ({
                ...img,
                image: img.image_url || img.image // Ensure we have a displayable URL source
            }));
            setImages(formatted.sort((a: any, b: any) => a.order - b.order));
        } catch (error) {
            console.error('Failed to load carousel images:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setSelectedFiles(prev => [...prev, ...Array.from(files)]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveUpload = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        const uploadPromises = selectedFiles.map(async (file, index) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', file.name.split('.')[0]);
            formData.append('active', 'true');
            formData.append('order', (images.length + index + 1).toString());
            
            return createPricingCarouselImage(formData);
        });

        try {
            await Promise.all(uploadPromises);
            toast.success(`Saved ${ selectedFiles.length } new images`);
            setSelectedFiles([]);
            await loadImages();
        } catch (error) {
            console.error('Failed to upload images:', error);
            toast.error('Failed to save some images');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this image?')) return;
        try {
            await deletePricingCarouselImage(id);
            setImages(prev => prev.filter(img => img.id !== id));
            toast.success('Image removed');
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete image');
        }
    };

    const moveImage = async (index: number, direction: 'left' | 'right') => {
        if (
            (direction === 'left' && index === 0) ||
            (direction === 'right' && index === images.length - 1)
        ) {
            return;
        }

        const newImages = [...images];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

        const updatedImages = newImages.map((img, i) => ({ ...img, order: i }));
        setImages(updatedImages);

        try {
            const updates = updatedImages.map(img => ({ id: img.id, order: img.order }));
            await updatePricingCarouselOrder(updates);
        } catch (error) {
            console.error('Failed to save order:', error);
            toast.error('Failed to save order');
            loadImages();
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Pricing Carousel Images</h2>
                    <p className="text-sm text-slate-500">Manage images displayed on the pricing page</p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFilesSelected}
                        className="hidden"
                    />
                    
                    <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        Add Images
                    </Button>

                    {selectedFiles.length > 0 && (
                        <Button 
                            onClick={handleSaveUpload}
                            disabled={uploading}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save ({selectedFiles.length})
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* Previews of Pending Uploads */}
                    {selectedFiles.map((file, idx) => (
                        <div key={`preview - ${ idx } `} className="group relative aspect-video bg-blue-50 rounded-lg overflow-hidden border-2 border-blue-200">
                             <img 
                                src={URL.createObjectURL(file)} 
                                className="w-full h-full object-cover opacity-70" 
                                alt="preview"
                                onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                             />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                                    Pending Save
                                </span>
                             </div>
                             <button 
                                onClick={() => removeSelectedFile(idx)}
                                className="absolute top-2 right-2 p-1.5 bg-white text-slate-500 rounded-full hover:bg-red-50 hover:text-red-600 shadow-sm transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* Existing Images */}
                    {images.map((item, index) => (
                        <div key={item.id} className="group relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => moveImage(index, 'left')}
                                        disabled={index === 0}
                                        className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:bg-white hover:text-blue-600 disabled:opacity-50 transition-colors"
                                        title="Move Left"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => moveImage(index, 'right')}
                                        disabled={index === images.length - 1}
                                        className="p-1.5 bg-white/90 text-slate-700 rounded-full hover:bg-white hover:text-blue-600 disabled:opacity-50 transition-colors"
                                        title="Move Right"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8 w-8 rounded-full p-0"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            
                            {/* Order Badge */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                #{index + 1}
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && selectedFiles.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <Upload className="w-8 h-8 mx-auto mb-3 text-slate-300" />
                            <p>No images in carousel. Add pending images to start.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
```
