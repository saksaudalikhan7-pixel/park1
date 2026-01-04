"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import {
    fetchAPI,
    postAPI,
    putAPI,
    deleteAPI,
    API_ENDPOINTS
} from '@/lib/api';
import ImageUploadField from '@/app/(admin-portal)/admin/components/ImageUploadField';
import { Button } from '@/components/admin/Button';
import toast from 'react-hot-toast';

interface CarouselImage {
    id: number;
    title: string;
    image_url: string;
    order: number;
    active: boolean;
}

export default function PricingCarouselManager() {
    const [images, setImages] = useState<CarouselImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadImages();
    }, []);

    const loadImages = async () => {
        try {
            const data = await fetchAPI(API_ENDPOINTS.cms.pricing_carousel_images);
            setImages(data);
        } catch (error) {
            console.error('Failed to load carousel images:', error);
            toast.error('Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = async (file: File | null) => {
        if (!file) return;

        // Upload first
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/cms/upload', {
                method: 'POST',
                body: formData,
            });

            if (!uploadRes.ok) throw new Error('Upload failed');

            const uploadData = await uploadRes.json();
            const url = uploadData.url;

            const newImage = {
                image_url: url,
                title: '',
                order: images.length,
                active: true,
            };
            const created = await postAPI(API_ENDPOINTS.cms.pricing_carousel_images, newImage);
            setImages([...images, created as CarouselImage]);
            toast.success('Image added successfully');
        } catch (error) {
            console.error('Failed to add image:', error);
            toast.error('Failed to add image');
        }
    };

    const handleUpdate = async (id: number, data: Partial<CarouselImage>) => {
        try {
            // Optimistic update
            setImages(images.map(img => img.id === id ? { ...img, ...data } : img));

            await putAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${id}/`, data);
        } catch (error) {
            console.error('Failed to update image:', error);
            toast.error('Failed to update image');
            loadImages(); // Revert on failure
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            await deleteAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${id}/`);
            setImages(images.filter(img => img.id !== id));
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

        // Swap
        [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];

        // Update order field locally
        const updatedImages = newImages.map((img, i) => ({ ...img, order: i }));
        setImages(updatedImages);

        // Save new order
        try {
            // We only need to update the two affected items really, but updating all is safer for consistency
            await Promise.all([
                putAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${updatedImages[index].id}/`, { order: index }),
                putAPI(`${API_ENDPOINTS.cms.pricing_carousel_images}${updatedImages[targetIndex].id}/`, { order: targetIndex })
            ]);
        } catch (error) {
            console.error('Failed to reorder:', error);
            toast.error('Failed to save order');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-medium mb-4 text-slate-700">Add New Image</h3>
                <ImageUploadField
                    onChange={handleAddImage}
                    label="Upload Image"
                />
            </div>

            <div className="space-y-4">
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="p-4 flex items-center gap-4 bg-white border border-slate-200 rounded-lg shadow-sm"
                    >
                        {/* Order Controls */}
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={() => moveImage(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                onClick={() => moveImage(index, 'down')}
                                disabled={index === images.length - 1}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                <ArrowDown size={16} />
                            </button>
                        </div>

                        <div className="h-16 w-24 relative rounded overflow-hidden bg-slate-100 flex-shrink-0">
                            {image.image_url ? (
                                <img
                                    src={image.image_url}
                                    alt={image.title}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <ImageIcon className="h-6 w-6 text-slate-400" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-2">
                            <input
                                type="text"
                                placeholder="Image Title / Alt Text"
                                value={image.title || ''}
                                onChange={(e) => handleUpdate(image.id, { title: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">Active</span>
                                <input
                                    type="checkbox"
                                    checked={image.active}
                                    onChange={(e) => handleUpdate(image.id, { active: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                            </div>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(image.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {images.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        No images added yet.
                    </div>
                )}
            </div>
        </div>
    );
}
