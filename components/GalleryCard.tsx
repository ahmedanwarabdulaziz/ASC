'use client';

import { useState } from 'react';
import { BlogPost, BlogPostImage } from '@/types';
import ImageLightbox from './ImageLightbox';

interface GalleryCardProps {
  post: BlogPost;
  secondaryImages: BlogPostImage[];
}

function formatArabicDate(dateString: string | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  }).format(date);
}

export default function GalleryCard({ post, secondaryImages }: GalleryCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Prepare all images: primary first, then secondary
  const allImages = [
    {
      url: post.featured_image_url || post.thumbnail_image_url || '',
      title: (post as any).primary_image_title || post.title,
      alt: post.title,
    },
    ...secondaryImages.map(img => ({
      url: img.image_url,
      title: img.alt_text || post.title,
      alt: img.alt_text || post.title,
    }))
  ].filter(img => img.url); // Filter out empty URLs

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
  };

  const primaryImage = post.featured_image_url || post.thumbnail_image_url;

  return (
    <>
      <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300">
        {/* Primary Image */}
        {primaryImage && (
          <div 
            className="aspect-video w-full overflow-hidden cursor-pointer relative group"
            onClick={() => openLightbox(0)}
          >
            <img
              src={primaryImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.is_featured && (
              <span className="px-2 py-1 text-xs font-bold bg-yellow-500/20 text-yellow-400 rounded">
                مميز
              </span>
            )}
            {post.category && (
              <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
                {post.category.name}
              </span>
            )}
            <span className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded">
              {formatArabicDate(post.published_at || post.created_at)}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
            {post.title}
          </h3>
          
          {(post as any).primary_image_title && (
            <p className="text-yellow-400 text-sm mb-3">
              {(post as any).primary_image_title}
            </p>
          )}

          {/* Secondary Images Thumbnails */}
          {secondaryImages.length > 0 && (
            <div className="mt-4 pt-4 border-t border-yellow-500/20">
              <p className="text-gray-400 text-xs mb-2">صور إضافية:</p>
              <div className="flex gap-2 flex-wrap">
                {secondaryImages.slice(0, 4).map((img, index) => (
                  <div
                    key={img.id}
                    className="w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-yellow-500/50 transition-all group"
                    onClick={() => openLightbox(index + 1)}
                  >
                    <img
                      src={img.image_url}
                      alt={img.alt_text || `${post.title} - صورة ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
                {secondaryImages.length > 4 && (
                  <div
                    className="w-16 h-16 rounded-lg bg-gray-800 border-2 border-yellow-500/30 flex items-center justify-center cursor-pointer hover:border-yellow-500/50 transition-all"
                    onClick={() => openLightbox(1)}
                  >
                    <span className="text-yellow-400 text-xs font-bold">
                      +{secondaryImages.length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <ImageLightbox
          images={allImages}
          initialIndex={lightboxImageIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

