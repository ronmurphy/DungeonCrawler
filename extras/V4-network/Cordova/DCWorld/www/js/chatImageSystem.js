/**
 * Chat Image System - Modular image handling for chat with buttons and viewer modal
 * Handles image uploads and displays them as clickable buttons in chat to prevent spam/stretching
 */
class ChatImageSystem {
    constructor(config = {}) {
        this.config = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            defaultAccentColor: '#667eea',
            modalZIndex: 10000,
            buttonStyles: {
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '2px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
            },
            ...config
        };
        
        // Initialize image hosting with fallbacks
        this.imageHost = new MultiImageHost({
            maxRetries: 3,
            retryDelay: 1500,
            maxFileSize: this.config.maxFileSize
        });
        
        this.createImageModal();
    }

    /**
     * Create image viewer modal
     */
    createImageModal() {
        // Check if modal already exists
        if (document.getElementById('chat-image-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'chat-image-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: ${this.config.modalZIndex};
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            max-width: 90%;
            max-height: 90%;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            border: none;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1;
            transition: background 0.2s;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(0,0,0,0.9)';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'rgba(0,0,0,0.7)';
        });

        const imageContainer = document.createElement('div');
        imageContainer.id = 'chat-modal-image-container';
        imageContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            background: #f8f9fa;
        `;

        // Create download button container
        const downloadContainer = document.createElement('div');
        downloadContainer.id = 'chat-modal-download-container';
        downloadContainer.style.cssText = `
            padding: 15px 20px;
            border-top: 1px solid #e5e7eb;
            background: white;
            display: flex;
            justify-content: center;
        `;

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(imageContainer);
        modalContent.appendChild(downloadContainer);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Close modal events
        closeBtn.addEventListener('click', () => this.closeImageModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeImageModal();
        });

        // Keyboard close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeImageModal();
            }
        });
    }

    /**
     * Open image viewer modal
     */
    openImageModal(imageUrl, playerName = 'Player') {
        const modal = document.getElementById('chat-image-modal');
        const container = document.getElementById('chat-modal-image-container');
        
        if (!modal || !container) return;

        // Clear previous content
        container.innerHTML = '';

        // Create loading state
        const loading = document.createElement('div');
        loading.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            padding: 40px;
        `;
        loading.innerHTML = `
            <div style="width: 40px; height: 40px; border: 4px solid #f3f4f6; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="margin: 0; color: #6b7280;">Loading image from ${playerName}...</p>
        `;

        container.appendChild(loading);
        modal.style.display = 'flex';

        // Add spin animation
        if (!document.getElementById('chat-image-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'chat-image-spinner-style';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Load actual image
        const img = new Image();
        img.onload = () => {
            container.innerHTML = '';
            img.style.cssText = `
                max-width: 100%;
                max-height: 70vh;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            `;
            container.appendChild(img);
            
            // Add download button
            this.addDownloadButton(imageUrl, playerName);
        };

        img.onerror = () => {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                    <h3 style="margin: 0 0 10px 0;">Failed to Load Image</h3>
                    <p style="margin: 0; color: #6b7280;">The image could not be loaded.</p>
                </div>
            `;
        };

        img.src = imageUrl;
    }

    /**
     * Close image viewer modal
     */
    closeImageModal() {
        const modal = document.getElementById('chat-image-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Add download button to modal
     */
    addDownloadButton(imageUrl, playerName = 'Player') {
        const downloadContainer = document.getElementById('chat-modal-download-container');
        if (!downloadContainer) return;

        // Clear previous download button
        downloadContainer.innerHTML = '';

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.style.cssText = `
            background: linear-gradient(135deg, #10b981, #047857);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        downloadBtn.innerHTML = `
            <span>💾</span>
            <span>Download Image</span>
        `;

        downloadBtn.addEventListener('mouseenter', () => {
            downloadBtn.style.transform = 'translateY(-1px)';
            downloadBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        downloadBtn.addEventListener('mouseleave', () => {
            downloadBtn.style.transform = 'translateY(0)';
            downloadBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        downloadBtn.onclick = async () => {
            try {
                // Fetch the image
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                
                // Create download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Generate filename from URL or use default
                const urlParts = imageUrl.split('/');
                const filename = urlParts[urlParts.length - 1] || `image-from-${playerName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
                a.download = filename;
                
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                // Visual feedback
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<span>✅</span><span>Downloaded!</span>';
                downloadBtn.style.background = 'linear-gradient(135deg, #059669, #065f46)';
                
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.style.background = 'linear-gradient(135deg, #10b981, #047857)';
                }, 2000);
                
            } catch (error) {
                console.error('Download failed:', error);
                
                // Error feedback
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '<span>❌</span><span>Download Failed</span>';
                downloadBtn.style.background = 'linear-gradient(135deg, #dc2626, #991b1b)';
                
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    downloadBtn.style.background = 'linear-gradient(135deg, #10b981, #047857)';
                }, 2000);
            }
        };

        downloadContainer.appendChild(downloadBtn);
    }

    /**
     * Create image button for chat messages
     */
    createImageButton(imageUrl, playerName = 'Player', accentColor = null) {
        const button = document.createElement('button');
        button.className = 'chat-image-button';
        
        const finalColor = accentColor || this.config.defaultAccentColor;
        
        // Apply styles
        Object.assign(button.style, this.config.buttonStyles);
        button.style.background = `linear-gradient(135deg, ${finalColor} 0%, ${this.adjustColor(finalColor, -20)} 100%)`;
        
        button.innerHTML = `
            <span>🖼️</span>
            <span>Image from ${playerName}</span>
        `;

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = `0 4px 12px ${finalColor}40`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        // Click to open modal
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.openImageModal(imageUrl, playerName);
        });

        return button;
    }

    /**
     * Upload image and return button element
     */
    async uploadAndCreateButton(file, playerName = 'Player', accentColor = null, onProgress = null) {
        try {
            if (onProgress) onProgress('Uploading image...');
            
            const result = await this.imageHost.uploadImage(file);
            
            if (onProgress) onProgress(`Upload successful via ${result.service}!`);
            
            return {
                success: true,
                button: this.createImageButton(result.url, playerName, accentColor),
                url: result.url,
                service: result.service
            };
            
        } catch (error) {
            if (onProgress) onProgress(`Upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create upload button for chat interface
     */
    createUploadButton(playerName = 'You', accentColor = null, onImageUploaded = null) {
        const button = document.createElement('button');
        button.className = 'chat-upload-button';
        
        const finalColor = accentColor || this.config.defaultAccentColor;
        
        Object.assign(button.style, this.config.buttonStyles);
        button.style.background = `linear-gradient(135deg, ${finalColor} 0%, ${this.adjustColor(finalColor, -20)} 100%)`;
        
        button.innerHTML = `
            <span>📷</span>
            <span>Share Image</span>
        `;

        button.addEventListener('click', async () => {
            try {
                button.disabled = true;
                button.innerHTML = `<span>⏳</span><span>Uploading...</span>`;
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                
                input.onchange = async (event) => {
                    const file = event.target.files[0];
                    if (!file) {
                        button.disabled = false;
                        button.innerHTML = `<span>📷</span><span>Share Image</span>`;
                        return;
                    }

                    try {
                        const result = await this.uploadAndCreateButton(
                            file, 
                            playerName, 
                            accentColor,
                            (message) => {
                                button.innerHTML = `<span>⏳</span><span>${message}</span>`;
                            }
                        );
                        
                        if (onImageUploaded) {
                            onImageUploaded(result);
                        }
                        
                        button.innerHTML = `<span>✅</span><span>Uploaded!</span>`;
                        setTimeout(() => {
                            button.innerHTML = `<span>📷</span><span>Share Image</span>`;
                            button.disabled = false;
                        }, 2000);
                        
                    } catch (error) {
                        console.error('Upload error:', error);
                        button.innerHTML = `<span>❌</span><span>Failed</span>`;
                        setTimeout(() => {
                            button.innerHTML = `<span>📷</span><span>Share Image</span>`;
                            button.disabled = false;
                        }, 3000);
                    }
                };
                
                input.click();
                
            } catch (error) {
                console.error('Upload button error:', error);
                button.disabled = false;
                button.innerHTML = `<span>📷</span><span>Share Image</span>`;
            }
        });

        return button;
    }

    /**
     * Utility: Adjust color brightness
     */
    adjustColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Get player accent color from various sources
     */
    getPlayerAccentColor(playerName, fallback = null) {
        // Try to get from V4-network character data
        if (typeof character !== 'undefined' && character.personal && character.personal.accentColor) {
            return character.personal.accentColor;
        }
        
        // Try to get from StoryTeller player data
        if (typeof getPlayerAccentColor === 'function') {
            return getPlayerAccentColor(playerName);
        }
        
        // Generate consistent color from player name
        if (playerName) {
            let hash = 0;
            for (let i = 0; i < playerName.length; i++) {
                hash = playerName.charCodeAt(i) + ((hash << 5) - hash);
            }
            const hue = Math.abs(hash) % 360;
            return `hsl(${hue}, 60%, 50%)`;
        }
        
        return fallback || this.config.defaultAccentColor;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatImageSystem;
} else {
    window.ChatImageSystem = ChatImageSystem;
}
