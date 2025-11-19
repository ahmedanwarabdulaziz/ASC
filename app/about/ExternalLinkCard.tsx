'use client';

import { ExternalLink } from './external-links';

interface ExternalLinkCardProps {
  link: ExternalLink;
}

export default function ExternalLinkCard({ link }: ExternalLinkCardProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-900/50 border border-yellow-500/20 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-all duration-300 transform hover:scale-105 block"
    >
      {link.image && (
        <div className="aspect-video w-full overflow-hidden bg-gray-800">
          <img
            src={link.image}
            alt={link.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          {link.type === 'youtube' && (
            <span className="px-2 py-1 text-xs font-bold bg-red-500/20 text-red-400 rounded">
              يوتيوب
            </span>
          )}
          {link.type === 'article' && (
            <span className="px-2 py-1 text-xs font-bold bg-blue-500/20 text-blue-400 rounded">
              مقال
            </span>
          )}
          {link.type === 'facebook' && (
            <span className="px-2 py-1 text-xs font-bold bg-blue-600/20 text-blue-300 rounded">
              فيسبوك
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2">
          {link.title}
        </h3>
        {link.description && (
          <p className="text-gray-300 text-sm line-clamp-3 mb-3">
            {link.description}
          </p>
        )}
        <div className="flex items-center text-yellow-400 text-sm font-medium">
          <span>زيارة الرابط</span>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </a>
  );
}

