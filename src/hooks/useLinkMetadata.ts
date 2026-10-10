import { useState, useCallback } from 'react';
import { EDGE_FUNCTION_URL } from '../lib/supabase';
import { normalizeUrl, extractDomain, getGoogleFaviconUrl } from '../lib/urlHelper';

interface FetchMetadataResult {
  title: string;
  iconUrl: string;
}

export function useLinkMetadata() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetadata = useCallback(async (rawUrl: string): Promise<FetchMetadataResult> => {
    if (!rawUrl.trim()) {
      return { title: '', iconUrl: '' };
    }

    const url = normalizeUrl(rawUrl);
    const domain = extractDomain(url);
    const fallbackTitle = domain.split('.')[0] ? domain.split('.')[0].toUpperCase() : domain;
    const fallbackIcon = getGoogleFaviconUrl(url, 128);

    setIsLoading(true);

    try {
      // 1. Try Supabase Edge Function
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setIsLoading(false);
        return {
          title: data.title || fallbackTitle,
          iconUrl: data.icon_url || fallbackIcon,
        };
      }
    } catch {
      // Fallback silently
    }

    setIsLoading(false);
    return {
      title: fallbackTitle,
      iconUrl: fallbackIcon,
    };
  }, []);

  return {
    isLoading,
    fetchMetadata,
  };
}
