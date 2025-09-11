// Cache Management Utilities
console.log('🗄️ Cache management utilities loaded');

// Function to clear all caches AND unregister service workers
async function clearAllCaches() {
    try {
        console.log('🧹 Starting complete cache cleanup...');
        
        // Unregister all service workers first
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                console.log('🚫 Unregistering service worker:', registration.scope);
                await registration.unregister();
            }
        }
        
        // Get all cache names
        const cacheNames = await caches.keys();
        console.log('📋 Found caches:', cacheNames);
        
        // Delete all caches
        const deletePromises = cacheNames.map(cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
        });
        
        await Promise.all(deletePromises);
        
        // Show cache info
        const localStorageKeys = Object.keys(localStorage);
        console.log('💾 LocalStorage keys found:', localStorageKeys.length);
        
        // Show success message
        console.log('✅ All caches and service workers cleared successfully!');
        
        // Show user notification
        if (window.showNotification) {
            showNotification('success', 'Cache Cleared', 'All cached data and service workers cleared. The app will reload with fresh content.');
        } else {
            alert('✅ Cache and service workers cleared! The page will reload with fresh content.');
        }
        
        // Reload the page to get fresh content
        setTimeout(() => {
            window.location.reload(true);
        }, 1500);
        
        return true;
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
        alert('❌ Failed to clear cache: ' + error.message);
        return false;
    }
}

// Function to get cache status info
async function getCacheInfo() {
    try {
        const cacheNames = await caches.keys();
        const info = {
            cacheCount: cacheNames.length,
            cacheNames: cacheNames,
            serviceWorkerActive: 'serviceWorker' in navigator && navigator.serviceWorker.controller
        };
        
        console.log('📊 Cache Info:', info);
        return info;
    } catch (error) {
        console.error('❌ Failed to get cache info:', error);
        return null;
    }
}

// Function to force update service worker
async function updateServiceWorker() {
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                console.log('🔄 Updating service worker...');
                await registration.update();
                console.log('✅ Service worker updated');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('❌ Failed to update service worker:', error);
        return false;
    }
}

// Add cache management to window for global access
window.cacheManager = {
    clearAllCaches,
    getCacheInfo,
    updateServiceWorker
};

// Make functions globally available for onclick handlers
window.clearAllCaches = clearAllCaches;
window.getCacheInfo = getCacheInfo;
window.updateServiceWorker = updateServiceWorker;
