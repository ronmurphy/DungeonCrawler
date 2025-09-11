/**
 * ImgurHost.js - Modular Imgur API integration
 * Handles image uploads and URL management for DCC Custom applications
 * Compatible with both StoryTeller and V4-network
 */

class ImgurHost {
    constructor(options = {}) {
        // Imgur API configuration
        this.clientId = options.clientId || '546c25a59c58ad7'; // Default anonymous client ID
        this.apiUrl = 'https://api.imgur.com/3/image';
        this.uploadEndpoint = 'https://api.imgur.com/3/upload';
        
        // Upload options
        this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        // Rate limiting
        this.lastUploadTime = 0;
        this.minUploadInterval = 5000; // 5 seconds between uploads
        this.maxRetries = 3;
        
        // Event handlers
        this.onUploadStart = options.onUploadStart || null;
        this.onUploadProgress = options.onUploadProgress || null;
        this.onUploadSuccess = options.onUploadSuccess || null;
        this.onUploadError = options.onUploadError || null;
        
        console.log('🖼️ ImgurHost initialized with rate limiting');
    }

    /**
     * Upload image file to Imgur with retry logic
     * @param {File} file - Image file from file picker
     * @param {Object} options - Upload options (title, description, etc.)
     * @returns {Promise<Object>} Upload result with URL and metadata
     */
    async uploadImage(file, options = {}) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Check rate limiting
            const timeSinceLastUpload = Date.now() - this.lastUploadTime;
            if (timeSinceLastUpload < this.minUploadInterval) {
                const waitTime = this.minUploadInterval - timeSinceLastUpload;
                console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s before upload...`);
                await this.sleep(waitTime);
            }

            if (this.onUploadStart) {
                this.onUploadStart(file.name);
            }

            // Try upload with retries
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    console.log(`📤 Upload attempt ${attempt}/${this.maxRetries}: ${file.name} (${this.formatFileSize(file.size)})`);
                    
                    const result = await this.attemptUpload(file, options);
                    this.lastUploadTime = Date.now();
                    
                    console.log('✅ Upload successful:', result.url);
                    if (this.onUploadSuccess) {
                        this.onUploadSuccess(result);
                    }
                    return result;

                } catch (error) {
                    if (error.message.includes('429') && attempt < this.maxRetries) {
                        const backoffTime = Math.pow(2, attempt) * 2000; // Exponential backoff: 4s, 8s, 16s
                        console.log(`⚠️ Rate limited (429), retrying in ${backoffTime/1000}s... (attempt ${attempt}/${this.maxRetries})`);
                        await this.sleep(backoffTime);
                        continue;
                    }
                    throw error;
                }
            }

        } catch (error) {
            console.error('❌ Upload failed after all retries:', error);
            
            if (this.onUploadError) {
                this.onUploadError(error);
            }
            
            // Provide user-friendly error messages
            if (error.message.includes('429')) {
                throw new Error('Upload rate limit exceeded. Please wait a moment and try again.');
            } else if (error.message.includes('413')) {
                throw new Error('Image file too large. Please choose a smaller image.');
            } else if (error.message.includes('400')) {
                throw new Error('Invalid image format. Please use JPEG, PNG, GIF, or WebP.');
            }
            
            throw error;
        }
    }

    /**
     * Attempt single upload to Imgur
     * @param {File} file - Image file
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async attemptUpload(file, options) {
        // Prepare form data
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', 'file');
        
        if (options.title) formData.append('title', options.title);
        if (options.description) formData.append('description', options.description);

        // Upload to Imgur
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${this.clientId}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Imgur API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.data?.error || 'Upload failed');
        }

        return {
            url: result.data.link,
            directUrl: result.data.link,
            deleteHash: result.data.deletehash,
            id: result.data.id,
            title: result.data.title || file.name,
            size: result.data.size,
            type: result.data.type,
            width: result.data.width,
            height: result.data.height,
            uploadedAt: new Date().toISOString()
        };
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create file picker and handle upload
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async pickAndUploadImage(options = {}) {
        return new Promise((resolve, reject) => {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = this.allowedTypes.join(',');
            input.style.display = 'none';

            // Handle file selection
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('No file selected'));
                    return;
                }

                try {
                    const result = await this.uploadImage(file, options);
                    resolve(result);
                } catch (error) {
                    reject(error);
                } finally {
                    // Cleanup
                    document.body.removeChild(input);
                }
            };

            // Handle cancel
            input.oncancel = () => {
                document.body.removeChild(input);
                reject(new Error('Upload cancelled'));
            };

            // Trigger file picker
            document.body.appendChild(input);
            input.click();
        });
    }

    /**
     * Validate image file
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'No file provided' };
        }

        if (!this.allowedTypes.includes(file.type)) {
            return { 
                valid: false, 
                error: `File type ${file.type} not allowed. Supported: ${this.allowedTypes.join(', ')}` 
            };
        }

        if (file.size > this.maxFileSize) {
            return { 
                valid: false, 
                error: `File size ${this.formatFileSize(file.size)} exceeds limit of ${this.formatFileSize(this.maxFileSize)}` 
            };
        }

        return { valid: true };
    }

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Generate chat button HTML for image
     * @param {string} imageUrl - Imgur URL
     * @param {string} playerColor - Player's accent color
     * @param {string} label - Button label
     * @returns {string} HTML for chat button
     */
    generateChatButton(imageUrl, playerColor = '#667eea', label = 'IMAGE') {
        return `<button class="chat-img-btn" 
            style="background: ${playerColor}; 
                   color: white; 
                   border: none; 
                   padding: 4px 8px; 
                   border-radius: 4px; 
                   cursor: pointer; 
                   font-size: 0.8em;
                   margin-left: 5px;"
            onclick="window.imgurHost.openImageModal('${imageUrl}')">
            🖼️ ${label}
        </button>`;
    }

    /**
     * Open image in modal viewer
     * @param {string} imageUrl - Image URL to display
     */
    openImageModal(imageUrl) {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'imgur-image-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: pointer;
        `;

        // Create image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.cssText = `
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;

        // Close modal on click
        modal.onclick = () => {
            document.body.removeChild(modal);
        };

        // Add to DOM
        modal.appendChild(img);
        document.body.appendChild(modal);

        console.log('🖼️ Opened image modal:', imageUrl);
    }

    /**
     * Create upload interface for chat
     * @param {Function} onImageUploaded - Callback when image is uploaded
     * @param {string} playerColor - Player's accent color
     */
    createChatUploadInterface(onImageUploaded, playerColor = '#667eea') {
        const button = document.createElement('button');
        button.innerHTML = '📷 Share Image';
        button.style.cssText = `
            background: ${playerColor};
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-left: 5px;
        `;

        button.onclick = async () => {
            try {
                button.disabled = true;
                button.innerHTML = '⏳ Uploading...';

                const result = await this.pickAndUploadImage({
                    title: 'Chat Image Share',
                    description: 'Shared via DCC Custom'
                });

                if (onImageUploaded) {
                    onImageUploaded(result);
                }

            } catch (error) {
                if (error.message !== 'Upload cancelled') {
                    alert(`Upload failed: ${error.message}`);
                }
            } finally {
                button.disabled = false;
                button.innerHTML = '📷 Share Image';
            }
        };

        return button;
    }
}

// Global instance for easy access
window.imgurHost = new ImgurHost({
    onUploadStart: (filename) => {
        console.log('📤 Starting upload:', filename);
    },
    onUploadSuccess: (data) => {
        console.log('✅ Upload completed:', data.url);
    },
    onUploadError: (error) => {
        console.error('❌ Upload error:', error.message);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImgurHost;
}
