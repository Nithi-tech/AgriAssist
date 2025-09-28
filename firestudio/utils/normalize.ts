import { decode } from 'html-entities';

/**
 * Normalizes scheme name to exact title from site
 * Rules: trim, collapse whitespace, decode entities, preserve official punctuation/casing
 */
export function normalizeSchemeName(rawText: string): string {
  if (!rawText) return '';
  
  // Decode HTML entities
  let normalized = decode(rawText);
  
  // Trim and collapse multiple whitespace to single space
  normalized = normalized.trim().replace(/\s+/g, ' ');
  
  // Remove control characters but preserve normal punctuation
  normalized = normalized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Remove leading/trailing punctuation ONLY if it's clearly an artifact
  // Be conservative - only remove stray : or - at very ends
  normalized = normalized.replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
  
  return normalized;
}

/**
 * Normalizes text content for descriptions/eligibility
 */
export function normalizeText(rawText: string): string {
  if (!rawText) return '';
  
  let normalized = decode(rawText);
  normalized = normalized.trim().replace(/\s+/g, ' ');
  normalized = normalized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  return normalized;
}

/**
 * Normalizes URL for comparison and deduplication
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Remove trailing slashes and normalize query params
    let normalized = urlObj.origin + urlObj.pathname.replace(/\/+$/, '');
    if (urlObj.search) {
      // Sort query params for consistent comparison
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams();
      [...params.entries()].sort().forEach(([key, value]) => {
        sortedParams.append(key, value);
      });
      normalized += '?' + sortedParams.toString();
    }
    return normalized;
  } catch {
    return url.trim();
  }
}

/**
 * Creates a stable record key for deduplication
 */
export function createRecordKey(schemeName: string, state: string, link: string): string {
  const slug = schemeName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}|${state.toLowerCase()}|${normalizeUrl(link)}`;
}

/**
 * Sanitizes HTML content for safe storage
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Basic XSS prevention - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Extracts clean text from HTML
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
