/**
 * GitHub Image Storage System - BACKUP COPY
 * Uploads images to GitHub repository with session-based folder organization
 * 
 * BACKUP CREATED: 2025-09-01 before implementing universal upload method
 * Original working code preserved here for safety
 */
class GitHubImageHostBackup {
    constructor(config = {}) {
        this.config = {
            owner: config.owner || 'ronmurphy', // Your GitHub username
            repo: config.repo || 'dcc-image-storage', // Repository name
            branch: config.branch || 'main',
            apiToken: config.apiToken || localStorage.getItem('github_api_token') || null,
            maxFileSize: 25 * 1024 * 1024, // 25MB (GitHub limit)
            baseUrl: 'https://api.github.com',
            rawUrl: 'https://raw.githubusercontent.com',
            ...config
        };
        
        this.sessionCode = null;
        this.initializeSession();
    }

    /**
     * Initialize session code from current URL or connection
     */
    initializeSession() {
        // Try to extract session from various sources
        this.sessionCode = this.extractSessionCode();
        
        // Log initialization status
        if (this.config.apiToken) {
            console.log(`✅ GitHub Image Host initialized for session: ${this.sessionCode || 'default'} with API token`);
        } else {
            console.log(`⚠️ GitHub Image Host initialized for session: ${this.sessionCode || 'default'} - no API token (will need /github: command)`);
        }
    }

    /**
     * Extract session code from URL or connection info
     */
    extractSessionCode() {
        // Method 1: From current URL hash/query
        const urlParams = new URLSearchParams(window.location.search);
        const hashMatch = window.location.hash.match(/s=([A-Z0-9]+)/);
        
        if (hashMatch) {
            return hashMatch[1];
        }
        
        // Method 2: From URL params
        if (urlParams.get('s')) {
            return urlParams.get('s');
        }
        
        // Method 3: From StoryTeller connection data (if available)
        const connectionData = localStorage.getItem('storyteller_connection');
        if (connectionData) {
            try {
                const parsed = JSON.parse(connectionData);
                if (parsed.sessionCode) {
                    return parsed.sessionCode;
                }
            } catch (e) {
                console.warn('Could not parse StoryTeller connection data');
            }
        }
        
        // Method 4: Generate or use default
        const stored = localStorage.getItem('github_session_code');
        if (stored) {
            return stored;
        }
        
        // Generate new session code if none found
        const newCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        localStorage.setItem('github_session_code', newCode);
        return newCode;
    }

    /**
     * Set API token (from StoryTeller or manual config)
     */
    setApiToken(token) {
        this.config.apiToken = token;
        localStorage.setItem('github_api_token', token);
        console.log('✅ GitHub API token configured');
    }

    /**
     * Check if repository exists, create if needed
     */
    async ensureRepository() {
        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured');
        }

        try {
            // Check if repository exists
            const response = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}`, {
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                console.log(`✅ Repository ${this.config.owner}/${this.config.repo} exists`);
                return true;
            }

            if (response.status === 404) {
                // Repository doesn't exist, create it
                console.log(`📁 Creating repository ${this.config.owner}/${this.config.repo}...`);
                
                const createResponse = await fetch(`${this.config.baseUrl}/user/repos`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.config.apiToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: this.config.repo,
                        description: 'DCC Character Image Storage - Auto-created',
                        private: false,
                        auto_init: true
                    })
                });

                if (!createResponse.ok) {
                    const error = await createResponse.json();
                    throw new Error(`Failed to create repository: ${error.message}`);
                }

                console.log(`✅ Repository ${this.config.owner}/${this.config.repo} created successfully`);
                return true;
            }

            throw new Error(`Repository check failed: ${response.status}`);

        } catch (error) {
            console.error('Repository setup error:', error);
            throw error;
        }
    }

    /**
     * Upload image to GitHub repository - ORIGINAL WORKING METHOD
     */
    async uploadImage(file, customSessionCode = null) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image.');
        }

        if (file.size > this.config.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.config.maxFileSize / 1024 / 1024}MB`);
        }

        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured. Please connect to StoryTeller first.');
        }

        const sessionCode = customSessionCode || this.sessionCode || 'default';
        
        try {
            // Ensure repository exists
            await this.ensureRepository();

            // Generate unique filename
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substr(2, 8);
            const extension = file.name.split('.').pop() || 'png';
            const filename = `${timestamp}_${randomId}.${extension}`;
            const path = `sessions/${sessionCode}/${filename}`;

            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            const base64Data = base64Content.split(',')[1]; // Remove data:image/... prefix

            // Upload to GitHub
            const uploadResponse = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Upload image for session ${sessionCode}`,
                    content: base64Data,
                    branch: this.config.branch
                })
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(`Upload failed: ${error.message}`);
            }

            const uploadData = await uploadResponse.json();
            
            // Generate raw URL for direct image access
            const rawUrl = `${this.config.rawUrl}/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;

            console.log(`✅ Image uploaded successfully to session ${sessionCode}`);

            return {
                url: rawUrl,
                downloadUrl: uploadData.content.download_url,
                htmlUrl: uploadData.content.html_url,
                path: path,
                sessionCode: sessionCode,
                service: 'github'
            };

        } catch (error) {
            console.error('GitHub upload error:', error);
            throw error;
        }
    }

    /**
     * Upload image for private note with smart naming convention - ORIGINAL WORKING METHOD
     * Filename format: originalname_YYYY-MM-DD_SENDER_RECIPIENT.ext
     */
    async uploadNoteImage(file, senderName, recipientName, customSessionCode = null) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image.');
        }

        if (file.size > this.config.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.config.maxFileSize / 1024 / 1024}MB`);
        }

        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured. Please connect to StoryTeller first.');
        }

        const sessionCode = customSessionCode || this.sessionCode || 'default';
        
        try {
            // Ensure repository exists
            await this.ensureRepository();

            // Generate filename with note metadata
            const timestamp = Date.now();
            const randomId = Math.random().toString(36).substr(2, 6);
            const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const extension = file.name.split('.').pop() || 'png';
            const originalName = file.name.split('.')[0] || 'note-image';
            
            // Clean names for filename safety
            const cleanSender = senderName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            const cleanRecipient = recipientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            
            const filename = `${originalName}_${dateStr}_${cleanSender}_${cleanRecipient}_${timestamp}_${randomId}.${extension}`;
            
            // Use session-based folder structure for private notes
            const path = `sessions/${sessionCode}/private-notes/${filename}`;

            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            const base64Data = base64Content.split(',')[1]; // Remove data:image/... prefix

            // Upload to GitHub
            const uploadResponse = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Private note image: ${senderName} to ${recipientName} (${sessionCode})`,
                    content: base64Data,
                    branch: this.config.branch
                })
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(`Upload failed: ${error.message}`);
            }

            const uploadData = await uploadResponse.json();
            
            // Generate raw URL for direct image access
            const rawUrl = `${this.config.rawUrl}/${this.config.owner}/${this.config.repo}/${this.config.branch}/${path}`;

            console.log(`✅ Private note image uploaded: ${senderName} → ${recipientName} (${sessionCode})`);

            return {
                url: rawUrl,
                downloadUrl: uploadData.content.download_url,
                htmlUrl: uploadData.content.html_url,
                path: path,
                sessionCode: sessionCode,
                service: 'github',
                noteMetadata: {
                    sender: senderName,
                    recipient: recipientName,
                    date: dateStr,
                    originalName: originalName
                }
            };

        } catch (error) {
            console.error('Private note upload error:', error);
            throw error;
        }
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Export for use - backup version
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubImageHostBackup;
} else {
    window.GitHubImageHostBackup = GitHubImageHostBackup;
}
