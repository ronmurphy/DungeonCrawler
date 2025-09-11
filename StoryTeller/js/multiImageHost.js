/**
 * Multi-Service Image Hosting with Fallbacks
 * Supports multiple image hosting services with automatic fallback
 */
class MultiImageHost {
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 2000,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            ...config
        };
        
        this.lastUploadTime = 0;
        this.rateLimitDelay = 3000; // 3 seconds between uploads
        
        // Service configurations - GitHub first, then CORS-friendly fallbacks
        this.services = [
            {
                name: 'github',
                enabled: true,
                upload: this.uploadToGitHub.bind(this),
                rateLimit: 1000 // 1 second
            },
            {
                name: 'postimage',
                enabled: true,
                upload: this.uploadToPostImage.bind(this),
                rateLimit: 2000 // 2 seconds
            },
            {
                name: 'imgbb',
                enabled: config.imgbbApiKey ? true : false,
                upload: this.uploadToImgBB.bind(this),
                rateLimit: 3000, // 3 seconds
                apiKey: config.imgbbApiKey || null
            },
            {
                name: 'freeimage',
                enabled: true,
                upload: this.uploadToFreeImage.bind(this),
                rateLimit: 3000 // 3 seconds
            },
            {
                name: 'imgur',
                enabled: true,
                upload: this.uploadToImgur.bind(this),
                rateLimit: 5000, // 5 seconds
                apiKey: config.imgurClientId || 'a0113671de8f93b'
            }
        ];
        
        // Initialize GitHub image host
        this.githubHost = new GitHubImageHost({
            owner: config.githubOwner || 'ronmurphy',
            repo: config.githubRepo || 'dcc-image-storage',
            apiToken: config.githubToken || null
        });
    }

    /**
     * Upload image with automatic fallback
     */
    async uploadImage(file, options = {}) {
        // Validate file
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Invalid file type. Please select an image.');
        }

        if (file.size > this.config.maxFileSize) {
            throw new Error(`File too large. Maximum size: ${this.config.maxFileSize / 1024 / 1024}MB`);
        }

        // Rate limiting
        await this.enforceRateLimit();

        // Try each service in order
        let lastError = null;
        for (const service of this.services) {
            if (!service.enabled) continue;

            try {
                console.log(`🔄 Trying ${service.name}...`);
                const result = await this.uploadWithRetry(service, file, options);
                
                if (result && result.url) {
                    console.log(`✅ Upload successful via ${service.name}`);
                    return {
                        url: result.url,
                        service: service.name,
                        deleteUrl: result.deleteUrl || null,
                        success: true
                    };
                }
            } catch (error) {
                console.warn(`❌ ${service.name} failed:`, error.message);
                lastError = error;
                
                // If rate limited, try next service immediately
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                    continue;
                }
                
                // Small delay before trying next service
                await this.sleep(500);
            }
        }

        // All services failed
        throw new Error(`All image hosting services failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Upload with retry logic
     */
    async uploadWithRetry(service, file, options) {
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await service.upload(file, options);
            } catch (error) {
                lastError = error;
                
                if (attempt < this.config.maxRetries) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    console.log(`⏳ Retry ${attempt + 1}/${this.config.maxRetries} for ${service.name} in ${delay}ms`);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    }

    /**
     * GitHub upload method (using GitHubImageHost)
     */
    async uploadToGitHub(file) {
        try {
            if (!this.githubHost) {
                throw new Error('GitHub host not initialized');
            }
            
            const result = await this.githubHost.uploadImage(file);
            return {
                success: true,
                url: result.url,
                service: 'github'
            };
        } catch (error) {
            console.error('GitHub upload failed:', error);
            throw error;
        }
    }

    /**
     * PostImage Upload (CORS-friendly, no API key needed)
     */
    async uploadToPostImage(file) {
        const formData = new FormData();
        formData.append('upload', file);
        formData.append('adult', 'false');
        formData.append('optsize', '0');
        formData.append('expire', '0');

        const response = await fetch('https://postimages.org/json/rr', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`PostImage error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === 'OK' && data.url) {
            return {
                url: data.url,
                service: 'postimage'
            };
        }

        throw new Error(data.error || 'Invalid PostImage response');
    }

    /**
     * FreeImage Upload (CORS-friendly alternative)
     */
    async uploadToFreeImage(file) {
        const formData = new FormData();
        formData.append('key', '6d207e02198a847aa98d0a2a901485a5'); // Free public key
        formData.append('action', 'upload');
        formData.append('source', file);
        formData.append('format', 'json');

        const response = await fetch('https://freeimage.host/api/1/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`FreeImage error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status_code === 200 && data.image && data.image.url) {
            return {
                url: data.image.url,
                service: 'freeimage'
            };
        }

        throw new Error(data.error?.message || 'Invalid FreeImage response');
    }

    /**
     * Telegraph Upload (Telegram's image hosting)
     */
    async uploadToTelegraph(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('https://telegra.ph/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Telegraph error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Telegraph error: ${data.error}`);
        }

        if (data && data[0] && data[0].src) {
            return {
                url: `https://telegra.ph${data[0].src}`,
                service: 'telegraph'
            };
        }

        throw new Error('Invalid Telegraph response');
    }

    /**
     * ImgBB Upload (requires API key)
     */
    async uploadToImgBB(file) {
        const service = this.services.find(s => s.name === 'imgbb');
        if (!service.apiKey) {
            throw new Error('ImgBB API key not configured');
        }

        // Convert file to base64
        const base64 = await this.fileToBase64(file);
        const base64Data = base64.split(',')[1]; // Remove data:image/... prefix

        const formData = new FormData();
        formData.append('image', base64Data);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${service.apiKey}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`ImgBB error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.url) {
            return {
                url: data.data.url,
                deleteUrl: data.data.delete_url || null,
                service: 'imgbb'
            };
        }

        throw new Error(data.error?.message || 'Invalid ImgBB response');
    }

    /**
     * Imgur Upload (fallback with enhanced rate limiting)
     */
    async uploadToImgur(file) {
        const service = this.services.find(s => s.name === 'imgur');
        
        // Convert file to base64
        const base64 = await this.fileToBase64(file);
        const base64Data = base64.split(',')[1]; // Remove data:image/... prefix

        const response = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${service.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: base64Data,
                type: 'base64'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('Imgur rate limit exceeded (429)');
            }
            throw new Error(`Imgur error: ${response.status} - ${data.data?.error || 'Unknown error'}`);
        }

        if (data.success && data.data && data.data.link) {
            return {
                url: data.data.link,
                deleteUrl: data.data.deletehash ? `https://imgur.com/delete/${data.data.deletehash}` : null,
                service: 'imgur'
            };
        }

        throw new Error('Invalid Imgur response');
    }

    /**
     * Rate limiting enforcement
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSinceLastUpload = now - this.lastUploadTime;
        
        if (timeSinceLastUpload < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastUpload;
            console.log(`⏳ Rate limiting: waiting ${waitTime}ms`);
            await this.sleep(waitTime);
        }
        
        this.lastUploadTime = Date.now();
    }

    /**
     * Utility: Convert file to base64
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
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Picker interface for easy file selection and upload
     */
    async pickAndUploadImage(options = {}) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                try {
                    // Show loading state
                    if (options.onProgress) {
                        options.onProgress('Uploading image...');
                    }

                    const result = await this.uploadImage(file, options);
                    
                    if (options.onProgress) {
                        options.onProgress(`Upload successful via ${result.service}!`);
                    }
                    
                    resolve(result);
                } catch (error) {
                    if (options.onProgress) {
                        options.onProgress(`Upload failed: ${error.message}`);
                    }
                    reject(error);
                }
            };
            
            input.click();
        });
    }

    /**
     * Generate chat button for image upload
     */
    generateChatButton(options = {}) {
        const button = document.createElement('button');
        button.className = 'chat-image-btn';
        button.innerHTML = '📷 Upload Image';
        button.title = 'Upload and share an image';
        
        button.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            margin: 2px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        button.addEventListener('click', async () => {
            try {
                button.disabled = true;
                button.innerHTML = '⏳ Uploading...';
                
                const result = await this.pickAndUploadImage({
                    onProgress: (message) => {
                        button.innerHTML = `⏳ ${message}`;
                    }
                });
                
                // Create image message
                const imageHtml = `<img src="${result.url}" alt="Shared image" style="max-width: 300px; max-height: 300px; border-radius: 8px; cursor: pointer;" onclick="window.open('${result.url}', '_blank')">`;
                
                if (options.onImageUploaded) {
                    options.onImageUploaded(result.url, imageHtml);
                }
                
                button.innerHTML = '✅ Uploaded!';
                setTimeout(() => {
                    button.innerHTML = '📷 Upload Image';
                    button.disabled = false;
                }, 2000);
                
            } catch (error) {
                console.error('Image upload error:', error);
                button.innerHTML = '❌ Failed';
                setTimeout(() => {
                    button.innerHTML = '📷 Upload Image';
                    button.disabled = false;
                }, 3000);
            }
        });
        
        return button;
    }

    /**
     * Get service status
     */
    getServiceStatus() {
        return this.services.map(service => ({
            name: service.name,
            enabled: service.enabled,
            hasApiKey: service.apiKey ? true : false,
            rateLimit: service.rateLimit
        }));
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiImageHost;
} else {
    window.MultiImageHost = MultiImageHost;
}
