'use client';

import { useEffect, useState } from 'react';
import { externalLinks, ExternalLink } from './external-links';
import ExternalLinkCard from './ExternalLinkCard';
import { fetchLinkMetadata, LinkMetadata } from './fetch-link-metadata';

interface EnhancedLink extends ExternalLink {
  fetchedMetadata?: LinkMetadata;
}

export default function ExternalLinksSection() {
  const [links, setLinks] = useState<EnhancedLink[]>(externalLinks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllMetadata() {
      setLoading(true);
      const enhancedLinks = await Promise.all(
        externalLinks.map(async (link) => {
          // Only fetch metadata for links that don't have good metadata already
          if (link.type === 'facebook' || !link.description || link.description === 'محتوى من فيسبوك') {
            try {
              const metadata = await fetchLinkMetadata(link.url);
              if (metadata) {
                return {
                  ...link,
                  title: metadata.title !== 'Untitled' ? metadata.title : link.title,
                  description: metadata.description || link.description,
                  image: metadata.image || link.image,
                  fetchedMetadata: metadata,
                };
              }
            } catch (error) {
              console.error(`Failed to fetch metadata for ${link.url}:`, error);
            }
          }
          return link;
        })
      );
      setLinks(enhancedLinks);
      setLoading(false);
    }

    fetchAllMetadata();
  }, []);

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              روابط الصحف و المواقع الالكترونية
            </span>
          </h2>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">جاري تحميل الروابط...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            روابط الصحف و المواقع الالكترونية
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((link, index) => (
            <ExternalLinkCard key={index} link={link} />
          ))}
        </div>
      </div>
    </section>
  );
}

