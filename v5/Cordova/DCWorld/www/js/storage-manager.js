// ========================================
// STORAGE MANAGER
// Handle local storage operations and data persistence
// ========================================

// ========================================
// STORAGE UTILITIES
// ========================================
class StorageManager {
    constructor() {
        this.storagePrefix = 'st-';
        this.currentSessionKey = 'st-current-session';
        this.sessionPrefix = 'st-session-';
    }

    // ========================================
    // SESSION STORAGE
    // ========================================
    saveSession(session) {
        try {
            const sessionKey = this.getSessionKey(session.name);
            const sessionData = {
                ...session,
                lastModified: new Date().toISOString()
            };
            
            localStorage.setItem(sessionKey, JSON.stringify(sessionData));
            localStorage.setItem(this.currentSessionKey, sessionKey);
            
            return { success: true, message: 'Session saved successfully' };
        } catch (error) {
            console.error('Save session error:', error);
            return { success: false, message: 'Failed to save session: ' + error.message };
        }
    }

    loadSession(sessionName) {
        try {
            const sessionKey = this.getSessionKey(sessionName);
            const sessionData = localStorage.getItem(sessionKey);
            
            if (sessionData) {
                return { success: true, data: JSON.parse(sessionData) };
            } else {
                return { success: false, message: 'Session not found' };
            }
        } catch (error) {
            console.error('Load session error:', error);
            return { success: false, message: 'Failed to load session: ' + error.message };
        }
    }

    deleteSession(sessionName) {
        try {
            const sessionKey = this.getSessionKey(sessionName);
            localStorage.removeItem(sessionKey);
            
            // If this was the current session, clear the reference
            const currentSession = localStorage.getItem(this.currentSessionKey);
            if (currentSession === sessionKey) {
                localStorage.removeItem(this.currentSessionKey);
            }
            
            return { success: true, message: 'Session deleted successfully' };
        } catch (error) {
            console.error('Delete session error:', error);
            return { success: false, message: 'Failed to delete session: ' + error.message };
        }
    }

    getAllSessions() {
        try {
            const sessions = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.sessionPrefix)) {
                    try {
                        const sessionData = JSON.parse(localStorage.getItem(key));
                        sessions.push(sessionData);
                    } catch (parseError) {
                        console.warn('Could not parse session:', key, parseError);
                    }
                }
            }
            
            // Sort by last modified
            sessions.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            
            return { success: true, data: sessions };
        } catch (error) {
            console.error('Get all sessions error:', error);
            return { success: false, message: 'Failed to retrieve sessions: ' + error.message };
        }
    }

    getLastSession() {
        try {
            const currentSessionKey = localStorage.getItem(this.currentSessionKey);
            if (currentSessionKey) {
                const sessionData = localStorage.getItem(currentSessionKey);
                if (sessionData) {
                    return { success: true, data: JSON.parse(sessionData) };
                }
            }
            return { success: false, message: 'No last session found' };
        } catch (error) {
            console.error('Get last session error:', error);
            return { success: false, message: 'Failed to get last session: ' + error.message };
        }
    }

    // ========================================
    // BACKUP & RESTORE
    // ========================================
    exportAllData() {
        try {
            const allData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                sessions: []
            };

            // Get all sessions
            const sessionsResult = this.getAllSessions();
            if (sessionsResult.success) {
                allData.sessions = sessionsResult.data;
            }

            return { success: true, data: allData };
        } catch (error) {
            console.error('Export all data error:', error);
            return { success: false, message: 'Failed to export data: ' + error.message };
        }
    }

    importAllData(importData) {
        try {
            // Validate import data
            if (!importData.sessions || !Array.isArray(importData.sessions)) {
                return { success: false, message: 'Invalid import format: missing sessions array' };
            }

            let importedCount = 0;
            const errors = [];

            // Import each session
            importData.sessions.forEach((session, index) => {
                try {
                    if (this.validateSessionData(session)) {
                        const saveResult = this.saveSession(session);
                        if (saveResult.success) {
                            importedCount++;
                        } else {
                            errors.push(`Session ${index + 1}: ${saveResult.message}`);
                        }
                    } else {
                        errors.push(`Session ${index + 1}: Invalid session format`);
                    }
                } catch (sessionError) {
                    errors.push(`Session ${index + 1}: ${sessionError.message}`);
                }
            });

            const message = `Imported ${importedCount} session(s)`;
            const fullMessage = errors.length > 0 ? 
                `${message}. Errors: ${errors.join(', ')}` : 
                message;

            return { 
                success: importedCount > 0, 
                message: fullMessage,
                imported: importedCount,
                errors: errors
            };
        } catch (error) {
            console.error('Import all data error:', error);
            return { success: false, message: 'Failed to import data: ' + error.message };
        }
    }

    // ========================================
    // DATA VALIDATION
    // ========================================
    validateSessionData(session) {
        // Check required fields
        if (!session.name || typeof session.name !== 'string') {
            return false;
        }

        // Ensure arrays exist
        if (!Array.isArray(session.npcs)) session.npcs = [];
        if (!Array.isArray(session.quests)) session.quests = [];
        if (!Array.isArray(session.items)) session.items = [];
        if (!Array.isArray(session.maps)) session.maps = [];

        // Ensure dates exist
        if (!session.created) session.created = new Date().toISOString();
        if (!session.lastModified) session.lastModified = new Date().toISOString();

        return true;
    }

    // ========================================
    // UTILITY METHODS
    // ========================================
    getSessionKey(sessionName) {
        return this.sessionPrefix + sessionName.replace(/[^a-zA-Z0-9]/g, '_');
    }

    getStorageUsage() {
        try {
            let totalSize = 0;
            let sessionCount = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    const value = localStorage.getItem(key);
                    totalSize += key.length + (value ? value.length : 0);
                    
                    if (key.startsWith(this.sessionPrefix)) {
                        sessionCount++;
                    }
                }
            }

            // Convert to KB
            const sizeKB = Math.round(totalSize / 1024 * 100) / 100;

            return {
                success: true,
                data: {
                    totalSize: sizeKB,
                    sessionCount: sessionCount,
                    unit: 'KB'
                }
            };
        } catch (error) {
            console.error('Get storage usage error:', error);
            return { success: false, message: 'Failed to calculate storage usage' };
        }
    }

    clearAllData() {
        try {
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            return { 
                success: true, 
                message: `Cleared ${keysToRemove.length} items from storage` 
            };
        } catch (error) {
            console.error('Clear all data error:', error);
            return { success: false, message: 'Failed to clear storage: ' + error.message };
        }
    }

    // ========================================
    // BROWSER COMPATIBILITY
    // ========================================
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    getStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve(null);
    }
}

// ========================================
// GLOBAL INSTANCE
// ========================================
const storageManager = new StorageManager();

// ========================================
// ENHANCED SESSION FUNCTIONS
// ========================================
function saveSessionEnhanced() {
    if (!currentSession) {
        showNotification('error', 'Save Failed', 'No active session', 'Create a session first');
        return false;
    }

    const result = storageManager.saveSession(currentSession);
    
    if (result.success) {
        showNotification('success', 'Session Saved', 
            `Saved: ${currentSession.name}`, 
            result.message);
        return true;
    } else {
        showNotification('error', 'Save Failed', 
            'Could not save session', 
            result.message);
        return false;
    }
}

function loadSessionEnhanced(sessionName) {
    const result = storageManager.loadSession(sessionName);
    
    if (result.success) {
        currentSession = result.data;
        updateSessionDisplay();
        refreshAllDisplays();
        
        showNotification('success', 'Session Loaded', 
            `Loaded: ${currentSession.name}`, 
            'Welcome back to your campaign!');
        return true;
    } else {
        showNotification('error', 'Load Failed', 
            'Could not load session', 
            result.message);
        return false;
    }
}

function deleteSessionEnhanced(sessionName) {
    const result = storageManager.deleteSession(sessionName);
    
    if (result.success) {
        // If this was the current session, create a new one
        if (currentSession && currentSession.name === sessionName) {
            currentSession = {
                name: 'New Session',
                npcs: [],
                quests: [],
                items: [],
                maps: [],
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            updateSessionDisplay();
            refreshAllDisplays();
        }
        
        showNotification('success', 'Session Deleted', 
            `Deleted: ${sessionName}`, 
            result.message);
        return true;
    } else {
        showNotification('error', 'Delete Failed', 
            'Could not delete session', 
            result.message);
        return false;
    }
}

// ========================================
// STORAGE INFO FUNCTIONS
// ========================================
function showStorageInfo() {
    const usageResult = storageManager.getStorageUsage();
    
    if (usageResult.success) {
        const { totalSize, sessionCount, unit } = usageResult.data;
        
        showNotification('info', 'Storage Information', 
            `${sessionCount} sessions using ${totalSize} ${unit}`, 
            'Local browser storage usage');
    } else {
        showNotification('error', 'Storage Error', 
            'Could not retrieve storage info', 
            usageResult.message);
    }
}

function checkStorageQuota() {
    storageManager.getStorageQuota().then(estimate => {
        if (estimate) {
            const usedMB = Math.round(estimate.usage / 1024 / 1024 * 100) / 100;
            const quotaMB = Math.round(estimate.quota / 1024 / 1024 * 100) / 100;
            const percentUsed = Math.round(estimate.usage / estimate.quota * 100);
            
            showNotification('info', 'Storage Quota', 
                `${usedMB} MB / ${quotaMB} MB (${percentUsed}%)`, 
                'Browser storage usage');
        } else {
            showNotification('info', 'Storage Quota', 
                'Quota information not available', 
                'Browser does not support storage estimation');
        }
    }).catch(error => {
        console.error('Storage quota error:', error);
        showNotification('error', 'Quota Error', 
            'Could not check storage quota', 
            error.message);
    });
}

// ========================================
// AUTO-SAVE FUNCTIONALITY
// ========================================
let autoSaveInterval = null;
let lastAutoSave = null;

function startAutoSave() {
    // Clear existing interval
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Auto-save every 60 seconds if there's content and changes
    autoSaveInterval = setInterval(() => {
        if (hasSessionContent() && hasUnsavedChanges()) {
            const result = storageManager.saveSession(currentSession);
            if (result.success) {
                lastAutoSave = new Date();
                console.log('Auto-saved session:', currentSession.name);
            }
        }
    }, 60000); // 60 seconds
}

function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
}

function hasUnsavedChanges() {
    // Simple check - could be more sophisticated
    return !lastAutoSave || 
           (new Date(currentSession.lastModified) > lastAutoSave);
}

// ========================================
// EMERGENCY BACKUP
// ========================================
function createEmergencyBackup() {
    try {
        const backup = {
            timestamp: new Date().toISOString(),
            currentSession: currentSession,
            allSessions: storageManager.getAllSessions().data || []
        };
        
        const backupStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([backupStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `story_teller_emergency_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        showNotification('success', 'Emergency Backup Created', 
            'Backup downloaded', 
            'All session data has been exported');
    } catch (error) {
        console.error('Emergency backup error:', error);
        showNotification('error', 'Backup Failed', 
            'Could not create backup', 
            error.message);
    }
}

// ========================================
// PAGE LIFECYCLE
// ========================================
window.addEventListener('beforeunload', () => {
    if (hasSessionContent() && hasUnsavedChanges()) {
        storageManager.saveSession(currentSession);
    }
});

window.addEventListener('visibilitychange', () => {
    if (document.hidden && hasSessionContent()) {
        storageManager.saveSession(currentSession);
    }
});

// ========================================
// GLOBAL EXPORTS
// ========================================
window.storageManager = storageManager;
window.saveSessionEnhanced = saveSessionEnhanced;
window.loadSessionEnhanced = loadSessionEnhanced;
window.deleteSessionEnhanced = deleteSessionEnhanced;
window.showStorageInfo = showStorageInfo;
window.checkStorageQuota = checkStorageQuota;
window.createEmergencyBackup = createEmergencyBackup;
window.startAutoSave = startAutoSave;
window.stopAutoSave = stopAutoSave;

// Start auto-save when the storage manager is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (storageManager.isStorageAvailable()) {
        startAutoSave();
        console.log('Storage manager initialized with auto-save');
    } else {
        console.warn('Local storage not available');
        showNotification('warning', 'Storage Warning', 
            'Local storage not available', 
            'Sessions will not be saved between browser sessions');
    }
});