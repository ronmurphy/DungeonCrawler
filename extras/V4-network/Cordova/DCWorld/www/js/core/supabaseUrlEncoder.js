// ⚠️⚠️⚠️ CRITICAL SUPABASE URL ENCODER - DO NOT TOUCH ⚠️⚠️⚠️
// For Brad, David, Manus, Claude, Copilot, and EVERYONE:
// This file handles URL shortening to prevent accidental clicking by users
// PLEASE DO NOT MODIFY - This prevents user confusion and accidental URL clicks
// ⚠️⚠️⚠️ DO NOT CHANGE WITHOUT BACKING UP FIRST ⚠️⚠️⚠️

/**
 * Supabase URL Encoder/Decoder - Enhanced Version
 * Converts full Supabase URLs to much shorter, non-clickable formats
 * Optimized to create the shortest possible URLs while maintaining functionality
 */
class SupabaseUrlEncoder {
    constructor() {
        this.supabaseDomain = '.supabase.co';
        this.shortDomain = '.s_co';
        // Enhanced optimization - simple string replacements (no regex needed)
        this.replacements = [
            ['https://', ''],      // Remove https entirely
            ['http://', ''],       // Remove http entirely  
            ['.supabase.co', '.sc'], // Shorten domain
            ['?session=', '?s='],  // Shorten session parameter
            ['&session=', '&s=']   // Shorten session parameter in URLs with other params
        ];
    }

    /**
     * Encode a full Supabase URL to a highly optimized shortened format
     * @param {string} fullUrl - Full Supabase URL like https://skddvbmxzeprvxfslhlk.supabase.co?session=ABC123
     * @returns {string} - Optimized URL like skddvbmxzeprvxfslhlk.sc?s=ABC123
     */
    encodeUrl(fullUrl) {
        try {
            if (!fullUrl || typeof fullUrl !== 'string') {
                console.warn('SupabaseUrlEncoder: Invalid URL provided for encoding');
                return fullUrl;
            }

            let shortened = fullUrl;
            
            // Apply all optimizations using simple string replacement
            for (const [searchStr, replaceStr] of this.replacements) {
                shortened = shortened.replace(new RegExp(this.escapeRegex(searchStr), 'g'), replaceStr);
            }
            
            console.log('URL Encoded (Optimized):', fullUrl, '→', shortened);
            return shortened;
        } catch (error) {
            console.error('SupabaseUrlEncoder: Error encoding URL:', error);
            return fullUrl; // Fallback to original
        }
    }

    /**
     * Escape regex special characters in a string
     * @param {string} string - String to escape
     * @returns {string} - Escaped string safe for regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Decode an optimized shortened URL back to full Supabase URL
     * @param {string} shortUrl - Shortened URL like skddvbmxzeprvxfslhlk.sc?s=ABC123
     * @returns {string} - Full URL like https://skddvbmxzeprvxfslhlk.supabase.co?session=ABC123
     */
    decodeUrl(shortUrl) {
        try {
            if (!shortUrl || typeof shortUrl !== 'string') {
                console.warn('SupabaseUrlEncoder: Invalid URL provided for decoding');
                return shortUrl;
            }

            let fullUrl = shortUrl;

            // Reverse the optimizations in reverse order
            fullUrl = fullUrl.replace(/&s=/g, '&session=');     // &s= back to &session=
            fullUrl = fullUrl.replace(/\?s=/g, '?session=');    // ?s= back to ?session=
            fullUrl = fullUrl.replace(/\.sc(\/|\?|$)/g, '.supabase.co$1'); // .sc back to .supabase.co
            
            // Add https:// if not present
            if (!fullUrl.startsWith('http')) {
                fullUrl = 'https://' + fullUrl;
            }
            
            console.log('URL Decoded (Optimized):', shortUrl, '→', fullUrl);
            return fullUrl;
        } catch (error) {
            console.error('SupabaseUrlEncoder: Error decoding URL:', error);
            return shortUrl; // Fallback to original
        }
    }

    /**
     * Check if a URL is in shortened format (enhanced detection for all formats)
     * @param {string} url - URL to check
     * @returns {boolean} - True if URL is shortened
     */
    isShortened(url) {
        return url && (
            url.includes('.sc?') ||      // New optimized format
            url.includes('.sc') ||       // New optimized format  
            url.includes('?s=') ||       // New session parameter
            url.includes('.s_co') ||     // Old format (backwards compatibility)
            (url.includes('.') && !url.includes('http') && !url.includes('.supabase.co'))
        );
    }

    /**
     * Check if a URL is in full format
     * @param {string} url - URL to check
     * @returns {boolean} - True if URL is full format
     */
    isFull(url) {
        return url && (url.includes('.supabase.co') || url.startsWith('http'));
    }

    /**
     * Smart decode - handles both shortened and full URLs
     * @param {string} url - Any URL format
     * @returns {string} - Always returns full URL format
     */
    ensureFullUrl(url) {
        if (this.isShortened(url)) {
            return this.decodeUrl(url);
        }
        return url; // Already full or different format
    }
}

// Create global instance
window.supabaseUrlEncoder = new SupabaseUrlEncoder();

// Also export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseUrlEncoder;
}
