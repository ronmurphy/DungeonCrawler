/**
 * GitHub Image Storage System
 * Uploads images to GitHub repository with session-based folder organization
 */
class GitHubImageHost {
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
        
        // Method 3: From Supabase connection (if available)
        if (typeof window.supabaseUrl === 'string') {
            const match = window.supabaseUrl.match(/s=([A-Z0-9]+)/);
            if (match) return match[1];
        }
        
        // Method 4: Generate session based on timestamp (fallback)
        const fallback = 'SESSION_' + Date.now().toString(36).toUpperCase();
        console.log(`⚠️ No session code found, using fallback: ${fallback}`);
        return fallback;
    }

    /**
     * Set API token (from StoryTeller or manual config)
     */
    setApiToken(token) {
        this.config.apiToken = token;
        console.log('🔑 GitHub API token configured');
    }

    /**
     * Check if repository exists, create if needed
     */
    async ensureRepository() {
        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured');
        }

        try {
            // Check if repo exists
            const response = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}`, {
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                console.log('✅ Repository exists');
                return true;
            }

            if (response.status === 404) {
                // Create repository
                console.log('📁 Creating repository...');
                const createResponse = await fetch(`${this.config.baseUrl}/user/repos`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.config.apiToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: this.config.repo,
                        description: 'DCC Chat Image Storage',
                        private: false,
                        auto_init: true
                    })
                });

                if (!createResponse.ok) {
                    const error = await createResponse.json();
                    throw new Error(`Failed to create repository: ${error.message}`);
                }

                console.log('✅ Repository created successfully');
                return true;
            }

            throw new Error(`Repository check failed: ${response.status}`);
        } catch (error) {
            console.error('Repository error:', error);
            throw error;
        }
    }

    /**
     * Universal upload method to any folder in GitHub repository
     * @param {string} folderPath - Target folder path (e.g., 'avatars', 'sessions/ABC123', 'sessions/ABC123/private-notes')
     * @param {File|string} fileToSend - File object or filename string for avatars  
     * @param {Object} options - Additional options { customFilename, commitMessage }
     * @returns {Promise<Object>} Upload result with URL and metadata
     */
    async uploadToGithub(folderPath, fileToSend, options = {}) {
        // Handle different file input types
        let file, customFilename;
        
        if (typeof fileToSend === 'string') {
            // String input - likely for avatar uploads (character name)
            customFilename = fileToSend;
            file = null; // Will be handled differently for avatars
        } else if (fileToSend instanceof File) {
            // File object - standard upload
            file = fileToSend;
            customFilename = options.customFilename || null;
        } else {
            throw new Error('Invalid fileToSend: must be File object or string filename');
        }

        // Validate file for standard uploads
        if (file) {
            if (!file.type.startsWith('image/')) {
                throw new Error('Invalid file type. Please select an image.');
            }

            if (file.size > this.config.maxFileSize) {
                throw new Error(`File too large. Maximum size: ${this.config.maxFileSize / 1024 / 1024}MB`);
            }
        }

        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured. Please connect to StoryTeller first.');
        }

        try {
            // Ensure repository exists
            await this.ensureRepository();

            let filename, path, base64Data, commitMessage;

            if (file) {
                // Standard file upload
                if (customFilename) {
                    // Use custom filename (e.g., for character avatars)
                    const extension = file.name.split('.').pop() || 'png';
                    filename = customFilename.includes('.') ? customFilename : `${customFilename}.${extension}`;
                } else {
                    // Generate unique filename
                    const timestamp = Date.now();
                    const randomId = Math.random().toString(36).substr(2, 8);
                    const extension = file.name.split('.').pop() || 'png';
                    filename = `${timestamp}_${randomId}.${extension}`;
                }
                
                path = `${folderPath}/${filename}`;
                commitMessage = options.commitMessage || `Upload ${filename} to ${folderPath}`;

                // Convert file to base64
                const base64Content = await this.fileToBase64(file);
                base64Data = base64Content.split(',')[1]; // Remove data:image/... prefix
                
            } else {
                // Avatar upload case - fileToSend is character name
                throw new Error('Avatar upload from character name not yet implemented - use file upload');
            }

            // Upload to GitHub
            const uploadResponse = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
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

            console.log(`✅ Image uploaded successfully to ${folderPath}: ${filename}`);

            return {
                url: rawUrl,
                downloadUrl: uploadData.content.download_url,
                htmlUrl: uploadData.content.html_url,
                path: path,
                filename: filename,
                folderPath: folderPath,
                service: 'github'
            };

        } catch (error) {
            console.error('GitHub universal upload error:', error);
            throw error;
        }
    }

    /**
     * Upload image to GitHub repository - LEGACY METHOD (uses universal upload)
     */
    async uploadImage(file, customSessionCode = null) {
        const sessionCode = customSessionCode || this.sessionCode || 'default';
        const folderPath = `sessions/${sessionCode}`;
        
        return await this.uploadToGithub(folderPath, file, {
            commitMessage: `Upload image for session ${sessionCode}`
        });
    }

    /**
     * Upload image for private note with smart naming convention - LEGACY METHOD (uses universal upload)
     * Filename format: originalname_YYYY-MM-DD_SENDER_RECIPIENT.ext
     */
    async uploadNoteImage(file, senderName, recipientName, customSessionCode = null) {
        const sessionCode = customSessionCode || this.sessionCode || 'default';
        
        // Generate smart filename with date and sender/recipient info
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + 
                      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(today.getDate()).padStart(2, '0');
        
        // Add timestamp for uniqueness
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 8);
        
        // Clean up the original filename (remove extension and sanitize)
        const originalName = file.name.split('.')[0].replace(/[^a-zA-Z0-9\-_]/g, '');
        const extension = file.name.split('.').pop() || 'png';
        
        // Clean up sender and recipient names (sanitize for filename)
        const cleanSender = senderName.replace(/[^a-zA-Z0-9\-_]/g, '');
        const cleanRecipient = recipientName.replace(/[^a-zA-Z0-9\-_]/g, '');
        
        // Format: originalname_YYYY-MM-DD_SENDER_RECIPIENT_timestamp_randomId.ext
        const filename = `${originalName}_${dateStr}_${cleanSender}_${cleanRecipient}_${timestamp}_${randomId}.${extension}`;
        const folderPath = `sessions/${sessionCode}/private-notes`;
        
        const result = await this.uploadToGithub(folderPath, file, {
            customFilename: filename,
            commitMessage: `Private note image: ${senderName} to ${recipientName} (${sessionCode})`
        });
        
        // Add note-specific metadata
        result.sessionCode = sessionCode;
        result.noteMetadata = {
            sender: senderName,
            recipient: recipientName,
            originalFilename: file.name,
            date: dateStr,
            isPrivateNote: true
        };
        
        console.log(`✅ Private note image uploaded: ${senderName} → ${recipientName} (${sessionCode})`);
        return result;
    }

    /**
     * Upload custom character avatar to avatars folder
     * @param {File} file - Image file
     * @param {string} characterName - Character name for filename
     * @returns {Promise<Object>} Upload result with avatar URL
     */
    async uploadCharacterAvatar(file, characterName) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image.');
        }

        // Clean character name for filename safety
        const cleanName = characterName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const extension = file.name.split('.').pop() || 'png';
        const timestamp = Date.now();
        const filename = `custom_${cleanName}_${timestamp}.${extension}`;
        
        const result = await this.uploadToGithub('avatars', file, {
            customFilename: filename,
            commitMessage: `Upload custom avatar for character: ${characterName}`
        });
        
        console.log(`✅ Custom character avatar uploaded: ${characterName}`);
        return result;
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

    /**
     * List images in current session
     */
    async listSessionImages(sessionCode = null) {
        const session = sessionCode || this.sessionCode || 'default';
        
        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured');
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/sessions/${session}`, {
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                return []; // Session folder doesn't exist yet
            }

            if (!response.ok) {
                throw new Error(`Failed to list images: ${response.status}`);
            }

            const files = await response.json();
            return files
                .filter(file => file.type === 'file' && /\.(png|jpg|jpeg|gif|webp)$/i.test(file.name))
                .map(file => ({
                    name: file.name,
                    url: `${this.config.rawUrl}/${this.config.owner}/${this.config.repo}/${this.config.branch}/${file.path}`,
                    downloadUrl: file.download_url,
                    size: file.size
                }));

        } catch (error) {
            console.error('List images error:', error);
            return [];
        }
    }

    /**
     * Delete image from repository
     */
    async deleteImage(path) {
        if (!this.config.apiToken) {
            throw new Error('GitHub API token not configured');
        }

        try {
            // Get file info first to get SHA
            const fileResponse = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!fileResponse.ok) {
                throw new Error(`File not found: ${path}`);
            }

            const fileData = await fileResponse.json();

            // Delete file
            const deleteResponse = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Delete image ${path}`,
                    sha: fileData.sha,
                    branch: this.config.branch
                })
            });

            if (!deleteResponse.ok) {
                const error = await deleteResponse.json();
                throw new Error(`Delete failed: ${error.message}`);
            }

            console.log(`🗑️ Image deleted: ${path}`);
            return true;

        } catch (error) {
            console.error('Delete image error:', error);
            throw error;
        }
    }

    /**
     * Get repository statistics
     */
    async getStats() {
        if (!this.config.apiToken) {
            return { error: 'API token not configured' };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/repos/${this.config.owner}/${this.config.repo}`, {
                headers: {
                    'Authorization': `token ${this.config.apiToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                return { error: 'Repository not found' };
            }

            const repoData = await response.json();
            
            return {
                name: repoData.name,
                size: repoData.size,
                url: repoData.html_url,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                sessionCode: this.sessionCode
            };

        } catch (error) {
            return { error: error.message };
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubImageHost;
} else {
    window.GitHubImageHost = GitHubImageHost;
}
