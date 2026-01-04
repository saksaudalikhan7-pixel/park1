"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Upload, Loader2, Save } from 'lucide-react';
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
}

export default function PricingCarouselManager() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const data = await getPricingCarouselImages();
            setImages(data.sort((a: any, b: any) => a.order - b.order));
        } catch (error) {
            console.error('Failed to load carousel images:', error);
            toast.error('Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const uploadPromises = Array.from(files).map(async (file, index) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', file.name.split('.')[0] || 'Carousel Image');
            formData.append('active', 'true');
            // Append order: current length + index
            formData.append('order', (images.length + index).toString());

            return createPricingCarouselImage(formData);
        });

        try {
            await Promise.all(uploadPromises);
            toast.success(`Successfully added ${files.length} images`);
            await loadImages();
        } catch (error) {
            console.error('Failed to upload images:', error);
            toast.error('Failed to upload some images');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            await deletePricingCarouselImage(id);
            setImages(prev => prev.filter(img => img.id !== id));
            toast.success('Image deleted');
        } catch (error) {
            console.error('Failed to delete image:', error);
            toast.error('Failed to delete image');
        }
    };

    const moveImage = async (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === images.length - 1)
        ) {
            return;
        }

        const newImages = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        // Swap directly in the array
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

        // Update local state immediately for responsiveness
        // Re-assign orders based on new index
        const updatedImages = newImages.map((img, i) => ({ ...img, order: i }));
        setImages(updatedImages);

        // Sync with backend
        try {
            const updates = updatedImages.map(img => ({ id: img.id, order: img.order }));
            await updatePricingCarouselOrder(updates);
        } catch (error) {
            console.error('Failed to save order:', error);
            toast.error('Failed to save new order');
            loadImages(); // Revert on error
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-center">
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFilesSelected}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 bg-white rounded-full shadow-sm">
                        {uploading ? (
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        ) : (
                            <Upload className="w-8 h-8 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-slate-900">
                            {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Support for multiple images (JPG, PNG, WEBP)
                        </p>
                    </div>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="mt-2"
                    >
                        {uploading ? 'Uploading...' : 'Select Images'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex flex-col gap-1 text-slate-400">
                            <button
                                onClick={() => moveImage(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                title="Move Up"
                            >
                                <ArrowUp size={18} />
                            </button>
                            <button
                                onClick={() => moveImage(index, 'down')}
                                disabled={index === images.length - 1}
                                className="p-1 hover:text-blue-600 disabled:opacity-30 transition-colors"
                                title="Move Down"
                            >
                                <ArrowDown size={18} />
                            </button>
                        </div>

                        <div className="h-20 w-32 relative rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                            {image.image ? (
                                <img
                                    src={image.image}
                                    alt={image.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 truncate" title={image.title}>
                                {image.title || 'Untitled'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                {image.active ? (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        Active
                                    </span>
                                ) : (
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                        Inactive
                                    </span>
                                )}
                                <span className="text-xs text-slate-400">
                                    Order: {image.order}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(image.id)}
                                title="Delete Image"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {images.length === 0 && !loading && (
                    <div className="text-center py-12 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                        <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-slate-900 font-medium">No images yet</h3>
                        <p className="text-slate-500 text-sm">Upload images to create your carousel</p>
                    </div>
                )}
            </div>
        </div>
    );
}
