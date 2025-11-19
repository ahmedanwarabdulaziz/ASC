export interface LinkMetadata {
  title: string;
  description: string;
  image: string | null;
  url: string;
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
  try {
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      console.error(`Failed to fetch metadata for ${url}:`, response.statusText);
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}

