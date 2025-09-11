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
     * Upload image to GitHub repository
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
