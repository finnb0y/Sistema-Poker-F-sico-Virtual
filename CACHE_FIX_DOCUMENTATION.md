# Fix: Cache-Related Black Screen Issue

## Problem Description

Users were experiencing a black screen when accessing the site in browsers that had previously visited it. The issue did not occur in incognito/private browsing mode, indicating a browser caching problem.

### Symptoms
- Black screen on browsers with cached data
- Site works normally in incognito/private mode
- Issue affects returning users across multiple devices and browsers

### Root Cause

The issue was caused by aggressive browser caching of the main HTML file (`index.html`). When new versions of the application are deployed:

1. Vite generates new hashed filenames for JS and CSS assets (e.g., `index-ABC123.js`)
2. The browser may still serve the old cached `index.html`
3. The old HTML references assets that no longer exist on the server (e.g., `index-OLD456.js`)
4. The application fails to load, resulting in a black screen

This is a common issue with Single Page Applications (SPAs) where the entry HTML file must always be fresh to reference the correct versioned assets.

## Solution Implemented

### 1. Vercel Cache Headers (vercel.json)

Added HTTP cache-control headers configuration to control caching behavior at the CDN/server level:

```json
{
  "headers": [
    {
      "source": "/",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

**What this does:**
- **Root and index.html**: `no-cache, no-store, must-revalidate` ensures the HTML is never cached and always fetched fresh from the server
- **Assets folder**: `public, max-age=31536000, immutable` allows aggressive caching (1 year) for versioned assets since they have unique hashes

### 2. HTML Meta Tags (index.html)

Added cache-control meta tags as an additional layer of protection:

```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
<meta http-equiv="Pragma" content="no-cache" />
<meta http-equiv="Expires" content="0" />
```

**What this does:**
- Provides browser-level cache directives
- `Pragma: no-cache` supports older HTTP/1.0 proxies and browsers
- `Expires: 0` ensures the content is considered stale immediately

### 3. Vite Build Configuration

Vite's default configuration already includes:
- Content-based hashing for all assets (JS, CSS)
- Automatic asset fingerprinting
- Efficient code splitting

This ensures that each deployment generates unique filenames for changed files, allowing for safe long-term caching of versioned assets.

## How It Works

### Before the Fix
```
1. User visits site → Browser caches index.html
2. New version deployed → index-NEW.js created, index-OLD.js removed
3. User returns → Browser serves cached index.html (references index-OLD.js)
4. Browser tries to load index-OLD.js → 404 error → Black screen
```

### After the Fix
```
1. User visits site → Browser caches versioned assets but NOT index.html
2. New version deployed → index-NEW.js created, index-OLD.js removed
3. User returns → Browser fetches fresh index.html (references index-NEW.js)
4. Browser loads index-NEW.js successfully → Site works correctly
5. Browser uses cached assets that haven't changed (fast loading)
```

## Benefits

✅ **Eliminates black screen** caused by stale cached HTML  
✅ **Maintains performance** by allowing aggressive caching of versioned assets  
✅ **No user action required** - works automatically on next visit  
✅ **Compatible** with all browsers and CDNs  
✅ **Future-proof** - works with any build tool that uses content hashing  

## Testing the Fix

### Manual Testing
1. Visit the site in a normal browser window
2. Note the network tab shows fresh HTML but cached assets
3. Deploy a new version
4. Refresh the page (don't use hard refresh)
5. Verify new version loads without black screen

### Cache Verification
In browser DevTools Network tab:
- `index.html` should show `200` (from server) or `304` with `no-cache` headers
- `/assets/*` files should show `200` (from cache) or `304` with long max-age

### Expected Headers
```
index.html:
  Cache-Control: no-cache, no-store, must-revalidate

/assets/index-ABC123.js:
  Cache-Control: public, max-age=31536000, immutable
```

## Files Modified

1. **vercel.json** - Added HTTP cache headers configuration
2. **index.html** - Added cache-control meta tags

## Related Issues

- Black screen on browsers with previous visits
- Cached assets preventing new deployments from loading
- 404 errors for old asset filenames after deployment

## Prevention

This fix prevents future cache-related issues by:
1. Ensuring HTML is always fresh (never cached)
2. Allowing safe long-term caching of versioned assets
3. Following SPA best practices for cache management

## Additional Notes

### Why Both Server Headers and Meta Tags?

- **Server headers** (vercel.json): Primary and most reliable method
- **Meta tags** (index.html): Backup for cases where server headers aren't applied or are overridden by proxies

### Performance Impact

- **Minimal**: Only the HTML file (~2KB) is fetched on each visit
- **Optimal**: All versioned assets (JS, CSS) remain cached for 1 year
- **Result**: Fast load times with guaranteed correct version

### Compatibility

This solution works with:
- All modern browsers (Chrome, Firefox, Safari, Edge)
- All Vercel deployment configurations
- Other hosting platforms (Netlify, AWS, etc.) with similar header configurations
