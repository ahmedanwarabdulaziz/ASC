'use client';

import { useEffect, useState } from 'react';

interface Image {
  url: string;
  title: string;
  alt: string;
}

interface ImageLightboxProps {
  images: Image[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 w-12 h-12 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center text-white transition-all"
        aria-label="إغلاق"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center text-white transition-all"
            aria-label="السابق"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-gray-900/80 hover:bg-gray-800 rounded-full flex items-center justify-center text-white transition-all"
            aria-label="التالي"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Image Container */}
      <div
        className="max-w-7xl max-h-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
        
        {/* Image Title */}
        {currentImage.title && (
          <div className="mt-4 text-center">
            <p className="text-white text-xl font-semibold">{currentImage.title}</p>
            {images.length > 1 && (
              <p className="text-gray-400 text-sm mt-2">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

